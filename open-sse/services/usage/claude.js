/**
 * Claude usage handler
 */

import { createHash } from "node:crypto";
import { proxyAwareFetch } from "../../utils/proxyFetch.js";
import { ANTHROPIC_API_VERSION } from "../../providers/shared.js";
import { U, parseResetTime } from "./shared.js";
import { sanitizeOAuthError } from "../../utils/oauthError.js";

// Claude API config (urls from registry, apiVersion is header logic kept here)
const CLAUDE_CONFIG = {
  oauthUsageUrl: U("claude").oauthUrl,
  usageUrl: U("claude").orgUrl,
  settingsUrl: U("claude").settingsUrl,
  apiVersion: ANTHROPIC_API_VERSION,
};

const SUCCESS_TTL_MS = 65_000;
const RETRY_MIN_MS = 3 * 60_000;
const RETRY_MAX_MS = 30 * 60_000;
const CACHE_MAX = 128;
const CLAUDE_USAGE_USER_AGENT = "claude-cli/2.1.220 (external, sdk-cli)";

const usageCache = new Map();
const inFlight = new Map();

function credentialKey(accessToken) {
  return createHash("sha256").update(accessToken).digest("hex");
}

function setCache(key, entry) {
  usageCache.delete(key);
  usageCache.set(key, entry);
  while (usageCache.size > CACHE_MAX) usageCache.delete(usageCache.keys().next().value);
}

function createQuota(used, resetsAt) {
  const normalizedUsed = Math.min(100, Math.max(0, used));
  const remaining = Math.max(0, 100 - normalizedUsed);
  return {
    used: normalizedUsed,
    total: 100,
    remaining,
    remainingPercentage: remaining,
    resetAt: parseResetTime(resetsAt),
    unlimited: false,
  };
}

function addQuota(quotas, name, used, resetsAt) {
  if (typeof used !== "number" || !Number.isFinite(used)) return;
  const duplicate = Object.keys(quotas).some((key) => key.toLowerCase() === name.toLowerCase());
  if (!duplicate) quotas[name] = createQuota(used, resetsAt);
}

export function normalizeClaudeUsage(data) {
  const quotas = {};

  addQuota(quotas, "session (5h)", data?.five_hour?.utilization, data?.five_hour?.resets_at);
  addQuota(quotas, "weekly (7d)", data?.seven_day?.utilization, data?.seven_day?.resets_at);

  for (const [key, value] of Object.entries(data || {})) {
    if (key.startsWith("seven_day_") && value && typeof value === "object") {
      addQuota(
        quotas,
        `weekly ${key.slice("seven_day_".length)} (7d)`,
        value.utilization,
        value.resets_at,
      );
    }
  }

  const limits = [
    ...(Array.isArray(data?.limits) ? data.limits : []),
    ...(Array.isArray(data?.rate_limits) ? data.rate_limits : []),
  ];
  for (const limit of limits) {
    const group = String(limit?.group || "").toLowerCase();
    const kind = String(limit?.kind || "").toLowerCase();
    if (kind === "session" || group === "session") {
      addQuota(quotas, "session (5h)", limit.percent, limit.resets_at);
      continue;
    }
    if (kind === "weekly_scoped" || group === "weekly") {
      const scopeName = limit?.scope?.model?.display_name || limit?.scope?.surface?.display_name;
      addQuota(
        quotas,
        scopeName ? `weekly ${scopeName} (7d)` : "weekly (7d)",
        limit.percent,
        limit.resets_at,
      );
    }
  }

  return {
    plan: "Claude Code",
    extraUsage: data?.extra_usage ?? null,
    quotas,
  };
}

function retryAfterMs(response, now = Date.now()) {
  const value = response.headers.get("retry-after");
  if (!value) return RETRY_MIN_MS;
  const seconds = Number(value);
  const parsed = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - now;
  return Math.min(RETRY_MAX_MS, Math.max(RETRY_MIN_MS, Number.isFinite(parsed) ? parsed : RETRY_MIN_MS));
}

async function fetchClaudeUsage(accessToken, proxyOptions, key) {
  try {
    const oauthResponse = await proxyAwareFetch(CLAUDE_CONFIG.oauthUsageUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "anthropic-beta": "oauth-2025-04-20",
        "anthropic-version": CLAUDE_CONFIG.apiVersion,
        "Content-Type": "application/json",
        "User-Agent": CLAUDE_USAGE_USER_AGENT,
      },
      signal: AbortSignal.timeout(5_000),
    }, proxyOptions);

    if (oauthResponse.ok) {
      const value = normalizeClaudeUsage(await oauthResponse.json());
      setCache(key, { value, expiresAt: Date.now() + SUCCESS_TTL_MS, retryAt: 0 });
      return value;
    }

    if (oauthResponse.status === 429) {
      const now = Date.now();
      const cached = usageCache.get(key);
      const value = cached?.value || { message: "Claude usage is rate limited. Retry later." };
      setCache(key, {
        value,
        expiresAt: cached?.expiresAt || 0,
        retryAt: now + retryAfterMs(oauthResponse, now),
      });
      return value;
    }

    if (oauthResponse.status === 401) {
      return { message: "Claude authentication expired (401). Re-authorize or refresh the connection." };
    }

    if (oauthResponse.status === 404 || oauthResponse.status === 405) {
      const value = await getClaudeUsageLegacy(accessToken, proxyOptions);
      setCache(key, { value, expiresAt: Date.now() + SUCCESS_TTL_MS, retryAt: 0 });
      return value;
    }

    return { message: `Claude connected. Usage endpoint returned HTTP ${oauthResponse.status}.` };
  } catch (error) {
    return { message: `Claude connected. Unable to fetch usage: ${sanitizeOAuthError(error)}`.slice(0, 240) };
  }
}

export function getClaudeUsage(accessToken, proxyOptions = null) {
  const key = credentialKey(accessToken);
  const now = Date.now();
  const cached = usageCache.get(key);
  if (cached && (now < cached.expiresAt || now < cached.retryAt)) return Promise.resolve(cached.value);
  if (inFlight.has(key)) return inFlight.get(key);
  if (inFlight.size >= CACHE_MAX) {
    // ponytail: 128 active usage polls match current profile ceiling; add a
    // bounded wait queue before increasing that ceiling.
    return Promise.resolve({ message: "Claude usage refresh is busy. Retry shortly." });
  }

  let request;
  request = fetchClaudeUsage(accessToken, proxyOptions, key)
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key);
    });
  inFlight.set(key, request);
  return request;
}

/**
 * Legacy Claude usage for API key / org admin users
 */
async function getClaudeUsageLegacy(accessToken, proxyOptions = null) {
  try {
    const settingsResponse = await proxyAwareFetch(CLAUDE_CONFIG.settingsUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "anthropic-version": CLAUDE_CONFIG.apiVersion,
      },
    }, proxyOptions);

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();

      if (settings.organization_id) {
        const usageResponse = await proxyAwareFetch(
          CLAUDE_CONFIG.usageUrl.replace("{org_id}", settings.organization_id),
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "anthropic-version": CLAUDE_CONFIG.apiVersion,
            },
          },
          proxyOptions
        );

        if (usageResponse.ok) {
          const usage = await usageResponse.json();
          return {
            plan: settings.plan || "Unknown",
            organization: settings.organization_name,
            quotas: usage,
          };
        }
      }

      return {
        plan: settings.plan || "Unknown",
        organization: settings.organization_name,
        message: "Claude connected. Usage details require admin access.",
      };
    }

    return { message: "Claude connected. Usage API requires admin permissions." };
  } catch (error) {
    return { message: `Claude connected. Unable to fetch usage: ${sanitizeOAuthError(error)}`.slice(0, 240) };
  }
}
