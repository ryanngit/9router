import "open-sse/index.js";

import {
  getProviderCredentials,
  markAccountUnavailable,
  clearAccountError,
  extractApiKey,
  resolveApiKeyId,
} from "../services/auth.js";
import { cacheClaudeHeaders } from "open-sse/utils/claudeHeaderCache.js";
import { getSettings } from "@/lib/localDb";
import { releaseApiKeyUsageReservation, reserveApiKeyUsage } from "@/lib/db/index.js";
import { getSafeRequestHeaders } from "@/lib/requestOrigin";
import { trackApiKeyClientActivity } from "../services/apiKeyClientActivity.js";
import { getModelInfo, getComboModels } from "../services/model.js";
import { estimateChatUsageReservation } from "../services/usageReservation.js";
import { handleChatCore } from "open-sse/handlers/chatCore.js";
import { DEFAULT_HEADROOM_URL } from "@/lib/headroom/detect";
import { getTransform as getPxpipeTransform } from "@/lib/pxpipe/loader.js";
import { appendPxpipeEvent } from "@/lib/pxpipe/events.js";
import { errorResponse, unavailableResponse } from "open-sse/utils/error.js";
import { handleComboChat, handleFusionChat } from "open-sse/services/combo.js";
import { handleBypassRequest } from "open-sse/utils/bypassHandler.js";
import { HTTP_STATUS, TOKEN_SAVER_HEADER } from "open-sse/config/runtimeConfig.js";
import { detectFormatByEndpoint } from "open-sse/translator/formats.js";
import { applyProviderThinking, detectFormat } from "open-sse/services/provider.js";
import { injectCaveman } from "open-sse/rtk/caveman.js";
import { injectPonytail } from "open-sse/rtk/ponytail.js";
import * as log from "../utils/logger.js";
import {
  updateProviderCredentials,
  checkAndRefreshToken,
  resolveRefreshProxyOptions,
} from "../services/tokenRefresh.js";
import { getProjectIdForConnection } from "open-sse/services/projectId.js";
import { applyBestGptRoute } from "../services/bestGptRoute.js";
import {
  createCacheAffinityScope,
  getCacheAffinityPreference,
  rememberCacheAffinity,
} from "../services/cacheAffinity.js";
import { extractClientSessionId } from "open-sse/utils/sessionManager.js";
import {
  cloneRequestTiming,
  createAttemptTiming,
  createRequestTiming,
  elapsedRequestMilliseconds,
  measureRequestPhase,
  requestNow,
  snapshotRequestTiming,
} from "open-sse/utils/requestTiming.js";

/**
 * Handle chat completion request
 * Supports: OpenAI, Claude, Gemini, OpenAI Responses API formats
 * Format detection and translation handled by translator
 */
export async function handleChat(request, clientRawRequest = null, options = {}) {
  const requestTiming = createRequestTiming();
  const correlationId = globalThis.crypto.randomUUID();
  let body = options.body;
  const externalSignal = options.signal || request?.signal;
  if (body === undefined) {
    try {
      body = await measureRequestPhase(requestTiming.phases, "ingress_ms", () => request.json());
    } catch {
      log.warn("CHAT", "Invalid JSON body");
      return errorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid JSON body");
    }
  }

  // Build clientRawRequest for logging (if not provided)
  if (!clientRawRequest) {
    const url = new URL(request.url);
    clientRawRequest = {
      endpoint: url.pathname,
      body,
      headers: getSafeRequestHeaders(request),
    };
  } else {
    clientRawRequest = { ...clientRawRequest, headers: getSafeRequestHeaders(request) };
  }
  cacheClaudeHeaders(clientRawRequest.headers);

  let modelStr = body.model;

  // Request summary is emitted as the unified "▶" line in chatCore (has fmt/thinking/account)

  // Log API key (masked)
  const authHeader = request.headers.get("Authorization");
  const apiKey = extractApiKey(request);
  if (authHeader && apiKey) {
    const masked = log.maskKey(apiKey);
    log.debug("AUTH", `API Key: ${masked}`);
  } else {
    log.debug("AUTH", "No API key provided (local mode)");
  }

  // Enforce API key if enabled in settings
  // db_overlap_ms is diagnostic; auth/routing totals already include the same DB wait.
  const settings = await measureRequestPhase(requestTiming.phases, "auth_total_ms", () =>
    measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getSettings()));
  let apiKeyId = null;
  if (settings.requireApiKey) {
    if (!apiKey) {
      log.warn("AUTH", "Missing API key (requireApiKey=true)");
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, "Missing API key");
    }
    apiKeyId = await measureRequestPhase(requestTiming.phases, "auth_total_ms", () =>
      measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => resolveApiKeyId(apiKey)));
    if (!apiKeyId) {
      log.warn("AUTH", "Invalid API key (requireApiKey=true)");
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, "Invalid API key");
    }
  }

  if (!modelStr) {
    log.warn("CHAT", "Missing model");
    return errorResponse(HTTP_STATUS.BAD_REQUEST, "Missing model");
  }

  let admitted = false;
  let admittedClient = null;
  const admitRequest = async () => {
    if (admitted || !apiKey) return admittedClient;
    admitted = true;
    const trackedClient = await trackApiKeyClientActivity({
      request,
      body,
      apiKey,
      apiKeyId,
      endpoint: clientRawRequest?.endpoint,
    });
    admittedClient = trackedClient;
    if (trackedClient && clientRawRequest) clientRawRequest.apiKeyClient = trackedClient;
    return admittedClient;
  };

  // Bypass naming/warmup requests before combo rotation to avoid wasting rotation slots
  const userAgent = request?.headers?.get("user-agent") || "";
  const bypassResponse = handleBypassRequest(body, modelStr, userAgent, !!settings.ccFilterNaming);
  if (bypassResponse) {
    await admitRequest();
    return bypassResponse.response || bypassResponse;
  }

  const bestGptRoute = applyBestGptRoute(body);
  if (bestGptRoute.applied) {
    body = bestGptRoute.body;
    modelStr = bestGptRoute.model;
    log.info(
      "GPT-ROUTE",
      `${bestGptRoute.from} → ${modelStr} | effort=${bestGptRoute.config.reasoningEffort} | tier=${bestGptRoute.config.serviceTier}`
    );
  }

  // Check if model is a combo (has multiple models with fallback)
  const comboModels = await measureRequestPhase(requestTiming.phases, "routing_total_ms", () =>
    measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getComboModels(modelStr)));
  if (comboModels) {
    await admitRequest();
    // Check for combo-specific strategy first, fallback to global
    const comboStrategies = settings.comboStrategies || {};
    const comboSpecificStrategy = comboStrategies[modelStr]?.fallbackStrategy;
    const comboStrategy = comboSpecificStrategy || settings.comboStrategy || "fallback";

    if (comboStrategy === "fusion") {
      log.info("CHAT", `Combo "${modelStr}" with ${comboModels.length} models (strategy: fusion)`);
      return handleFusionChat({
        body,
        models: comboModels,
        handleSingleModel: (b, m, isPanel) => {
          let cleanRawReq = clientRawRequest;
          if (isPanel && clientRawRequest) {
            const { tools, tool_choice, ...cleanBody } = clientRawRequest.body || {};
            cleanRawReq = { ...clientRawRequest, body: cleanBody };
          }
          return handleSingleModelChat(b, m, cleanRawReq, request, apiKey, externalSignal, cloneRequestTiming(requestTiming), correlationId, admitRequest);
        },
        log,
        comboName: modelStr,
        judgeModel: comboStrategies[modelStr]?.judgeModel,
        tuning: comboStrategies[modelStr]?.fusionTuning,
      });
    }

    const comboStickyLimit = settings.comboStickyRoundRobinLimit;
    log.info("CHAT", `Combo "${modelStr}" with ${comboModels.length} models (strategy: ${comboStrategy}, sticky: ${comboStickyLimit})`);
    return handleComboChat({
      body,
      models: comboModels,
      handleSingleModel: (b, m) => handleSingleModelChat(b, m, clientRawRequest, request, apiKey, externalSignal, cloneRequestTiming(requestTiming), correlationId, admitRequest),
      log,
      comboName: modelStr,
      comboStrategy,
      comboStickyLimit
    });
  }

  // Single model request
  return handleSingleModelChat(
    body,
    modelStr,
    clientRawRequest,
    request,
    apiKey,
    externalSignal,
    requestTiming,
    correlationId,
    admitRequest,
  );
}

/**
 * Handle single model chat request
 */
async function handleSingleModelChat(
  body,
  modelStr,
  clientRawRequest = null,
  request = null,
  apiKey = null,
  externalSignal = null,
  requestTiming = createRequestTiming(),
  correlationId = globalThis.crypto.randomUUID(),
  admitRequest = null,
) {
  const modelInfo = await measureRequestPhase(requestTiming.phases, "routing_total_ms", () =>
    measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getModelInfo(modelStr)));

  // If provider is null, this might be a combo name - check and handle
  if (!modelInfo.provider) {
    const comboModels = await measureRequestPhase(requestTiming.phases, "routing_total_ms", () =>
      measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getComboModels(modelStr)));
    if (comboModels) {
      await admitRequest?.();
      const chatSettings = await measureRequestPhase(requestTiming.phases, "routing_total_ms", () =>
        measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getSettings()));
      // Check for combo-specific strategy first, fallback to global
      const comboStrategies = chatSettings.comboStrategies || {};
      const comboSpecificStrategy = comboStrategies[modelStr]?.fallbackStrategy;
      const comboStrategy = comboSpecificStrategy || chatSettings.comboStrategy || "fallback";

      if (comboStrategy === "fusion") {
        log.info("CHAT", `Combo "${modelStr}" with ${comboModels.length} models (strategy: fusion)`);
        return handleFusionChat({
          body,
          models: comboModels,
          handleSingleModel: (b, m, isPanel) => {
            let cleanRawReq = clientRawRequest;
            if (isPanel && clientRawRequest) {
              const { tools, tool_choice, ...cleanBody } = clientRawRequest.body || {};
              cleanRawReq = { ...clientRawRequest, body: cleanBody };
            }
            return handleSingleModelChat(b, m, cleanRawReq, request, apiKey, externalSignal, cloneRequestTiming(requestTiming), correlationId, admitRequest);
          },
          log,
          comboName: modelStr,
          judgeModel: comboStrategies[modelStr]?.judgeModel,
          tuning: comboStrategies[modelStr]?.fusionTuning,
        });
      }

      const comboStickyLimit = chatSettings.comboStickyRoundRobinLimit;
      log.info("CHAT", `Combo "${modelStr}" with ${comboModels.length} models (strategy: ${comboStrategy}, sticky: ${comboStickyLimit})`);
      return handleComboChat({
        body,
        models: comboModels,
        handleSingleModel: (b, m) => handleSingleModelChat(b, m, clientRawRequest, request, apiKey, externalSignal, cloneRequestTiming(requestTiming), correlationId, admitRequest),
        log,
        comboName: modelStr,
        comboStrategy,
        comboStickyLimit
      });
    }
    log.warn("CHAT", "Invalid model format", { model: modelStr });
    return errorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid model format");
  }

  const { provider, model } = modelInfo;
  const resolvedBody = { ...body, model: `${provider}/${model}` };
  const chatSettings = await measureRequestPhase(requestTiming.phases, "db_overlap_ms", () => getSettings());
  const providerThinking = (chatSettings.providerThinking || {})[provider] || null;
  const sourceFormatOverride = request?.url ? detectFormatByEndpoint(new URL(request.url).pathname, body) : null;
  const sourceFormat = sourceFormatOverride || detectFormat(resolvedBody);
  const tokenSaverEnabled = clientRawRequest?.headers?.[TOKEN_SAVER_HEADER]?.toLowerCase() !== "off";
  const cavemanLevel = chatSettings.cavemanLevel || "full";
  const ponytailLevel = chatSettings.ponytailLevel || "full";
  const preparedBody = applyProviderThinking(structuredClone(resolvedBody), providerThinking);
  if (tokenSaverEnabled && chatSettings.cavemanEnabled && cavemanLevel) {
    injectCaveman(preparedBody, sourceFormat, cavemanLevel);
  }
  if (tokenSaverEnabled && chatSettings.ponytailEnabled && ponytailLevel) {
    injectPonytail(preparedBody, sourceFormat, ponytailLevel);
  }
  let usageReservationId = null;
  if (apiKey) {
    let requestedTokens;
    try {
      requestedTokens = estimateChatUsageReservation(preparedBody, { provider, model });
    } catch (error) {
      log.warn("AUTH", error.message);
      return errorResponse(HTTP_STATUS.BAD_REQUEST, error.message);
    }

    const limitStatus = await reserveApiKeyUsage(apiKey, requestedTokens);
    if (!limitStatus.accepted) {
      const consumed = Math.min(Number.MAX_SAFE_INTEGER, limitStatus.usedTokens + limitStatus.reservedTokens);
      const used = Math.round(consumed);
      const limit = Math.round(limitStatus.limitTokens);
      log.warn("AUTH", `API key daily token limit exceeded (${used}/${limit})`);
      return errorResponse(HTTP_STATUS.RATE_LIMITED, `API key daily token limit exceeded (${used}/${limit} tokens)`);
    }
    usageReservationId = limitStatus.reservationId;
  }
  const apiKeyClient = await admitRequest?.();
  const providerStrategy = (chatSettings.providerStrategies || {})[provider] || {};
  const affinityScope = providerStrategy.cacheAffinityEnabled === true
    ? createCacheAffinityScope({
        provider,
        model,
        apiKey,
        fingerprint: apiKeyClient?.fingerprint,
        sessionId: extractClientSessionId(
          clientRawRequest?.headers || {},
          body,
          provider,
          { includeRequestId: false },
        ),
      })
    : null;
  const preferredConnectionId = getCacheAffinityPreference(affinityScope);

  // Routing shown in the unified "▶" line (client model → provider/model)

  // Extract userAgent from request
  const userAgent = request?.headers?.get("user-agent") || "";

  // Try with available accounts (fallback on errors)
  const excludeConnectionIds = new Set();
  let lastError = null;
  let lastStatus = null;
  let fallbackTotalMs = 0;
  const admissionTiming = snapshotRequestTiming(requestTiming);

  let preserveUsageReservation = false;
  let disconnectReleaseStarted = false;
  const onDisconnect = usageReservationId
    ? () => {
        if (disconnectReleaseStarted) return;
        disconnectReleaseStarted = true;
        releaseApiKeyUsageReservation(usageReservationId).catch(() => {
          log.warn("AUTH", "Failed to release API key usage reservation after client disconnect");
        });
      }
    : undefined;
  try {
    while (true) {
      if (externalSignal?.aborted) return errorResponse(499, "Request aborted");
      const attemptTiming = createAttemptTiming(
        admissionTiming,
        fallbackTotalMs > 0 ? { fallback_total_ms: fallbackTotalMs } : undefined
      );
      const attemptId = globalThis.crypto.randomUUID();
      const credentials = await measureRequestPhase(attemptTiming.phases, "routing_total_ms", () =>
        measureRequestPhase(attemptTiming.phases, "db_overlap_ms", () =>
          preferredConnectionId
            ? getProviderCredentials(provider, excludeConnectionIds, model, { preferredConnectionId })
            : getProviderCredentials(provider, excludeConnectionIds, model)));

      // All accounts unavailable
      if (!credentials || credentials.allRateLimited) {
        if (credentials?.allRateLimited) {
          const errorMsg = lastError || credentials.lastError || "Unavailable";
          const status = lastStatus || Number(credentials.lastErrorCode) || HTTP_STATUS.SERVICE_UNAVAILABLE;
          log.warn("CHAT", `[${provider}/${model}] ${errorMsg} (${credentials.retryAfterHuman})`);
          return unavailableResponse(status, `[${provider}/${model}] ${errorMsg}`, credentials.retryAfter, credentials.retryAfterHuman);
        }
        if (excludeConnectionIds.size === 0) {
          log.warn("AUTH", `No active credentials for provider: ${provider}`);
          return errorResponse(HTTP_STATUS.NOT_FOUND, `No active credentials for provider: ${provider}`);
        }
        log.warn("CHAT", "No more accounts available", { provider });
        return errorResponse(lastStatus || HTTP_STATUS.SERVICE_UNAVAILABLE, lastError || "All accounts unavailable");
      }

      // Account selection shown in the unified "▶" line (acc:...)
      const proxyOptions = resolveRefreshProxyOptions(credentials);
      const refreshedCredentials = await measureRequestPhase(attemptTiming.phases, "auth_total_ms", () =>
        checkAndRefreshToken(provider, credentials, proxyOptions));

      // Ensure real project ID is available for providers that need it (P0 fix: cold miss)
      if ((provider === "antigravity" || provider === "gemini-cli") && !refreshedCredentials.projectId) {
        const pid = await measureRequestPhase(attemptTiming.phases, "auth_total_ms", () =>
          getProjectIdForConnection(
            credentials.connectionId,
            refreshedCredentials.accessToken,
            proxyOptions,
          ));
        if (pid) {
          refreshedCredentials.projectId = pid;
          // Persist to DB in background so subsequent requests have it immediately
          updateProviderCredentials(credentials.connectionId, { projectId: pid }).catch(() => { });
        }
      }

      // Use shared chatCore
      const result = await handleChatCore({
        body: structuredClone(preparedBody),
        modelInfo: { provider, model },
        credentials: refreshedCredentials,
        log,
        clientRawRequest,
        connectionId: credentials.connectionId,
        userAgent,
        apiKey,
        usageReservationId,
        ccFilterNaming: !!chatSettings.ccFilterNaming,
        rtkEnabled: !!chatSettings.rtkEnabled,
        headroomEnabled: !!chatSettings.headroomEnabled,
        headroomUrl: chatSettings.headroomUrl || DEFAULT_HEADROOM_URL,
        headroomCompressUserMessages: !!chatSettings.headroomCompressUserMessages,
        cavemanEnabled: !!chatSettings.cavemanEnabled,
        cavemanLevel,
        ponytailEnabled: !!chatSettings.ponytailEnabled,
        ponytailLevel,
        pxpipeEnabled: !!chatSettings.pxpipeEnabled,
        pxpipeMinChars: chatSettings.pxpipeMinChars,
        pxpipeTimeoutMs: chatSettings.pxpipeTimeoutMs,
        // Lazily warms the in-process module on first use; null when not installed (fail-open)
        pxpipeTransform: chatSettings.pxpipeEnabled ? await getPxpipeTransform() : null,
        onPxpipeEvent: appendPxpipeEvent,
        externalSignal,
        onDisconnect,
        providerThinking,
        requestTiming: cloneRequestTiming(attemptTiming),
        correlationId,
        attemptId,
        serverMutationsApplied: true,
        // Detect source format by endpoint + body
        sourceFormatOverride,
        onCredentialsRefreshed: async (newCreds) => {
          await updateProviderCredentials(credentials.connectionId, {
            ...newCreds,
            existingProviderSpecificData: credentials.providerSpecificData,
            testStatus: "active"
          });
        },
        onRequestSuccess: async () => {
          if (affinityScope) {
            const outcome = !preferredConnectionId
              ? "miss"
              : preferredConnectionId === credentials.connectionId ? "hit" : "repin";
            rememberCacheAffinity(affinityScope, credentials.connectionId);
            log.debug("CACHE_AFFINITY", `${provider}/${model} | ${affinityScope.level} | ${outcome}`);
          }
          await clearAccountError(credentials.connectionId, credentials, model);
        }
      });

      if (result.success) {
        preserveUsageReservation = true;
        return result.response;
      }
      if (externalSignal?.aborted) return result.response;

      // Mark account unavailable (auto-calculates cooldown with exponential backoff, or precise resetsAtMs)
      const fallbackStartedAt = requestNow();
      const { shouldFallback } = await markAccountUnavailable(
        credentials.connectionId,
        result.status,
        result.error,
        provider,
        model,
        result.resetsAtMs
      );
      fallbackTotalMs += elapsedRequestMilliseconds(fallbackStartedAt);

      if (shouldFallback) {
        log.warn("FALLBACK", `⇄ ACC:${credentials.connectionName} UNAVAILABLE (${result.status}) → NEXT ACCOUNT`);
        excludeConnectionIds.add(credentials.connectionId);
        lastError = result.error;
        lastStatus = result.status;
        continue;
      }

      return result.response;
    }
  } finally {
    if (usageReservationId && !preserveUsageReservation) {
      await releaseApiKeyUsageReservation(usageReservationId);
    }
  }
}
