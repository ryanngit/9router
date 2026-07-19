#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_BUNDLE = "/home/home/.npm-global/lib/node_modules/9router/app";
const DEFAULT_DB = "/home/home/.9router/db/data.sqlite";
const DEFAULT_CODEX_CONFIG = "/home/home/.codex/config.toml";
const DEFAULT_MODEL_CATALOG = "/home/home/.openclaw/codex-9router-model-catalog.json";

const opts = {
  root: process.cwd(),
  bundle: DEFAULT_BUNDLE,
  db: DEFAULT_DB,
  codexConfig: DEFAULT_CODEX_CONFIG,
  modelCatalog: DEFAULT_MODEL_CATALOG,
  health: [],
  checkBundle: true,
  checkDb: true,
  checkExternal: true,
};

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--help" || arg === "-h") {
    console.log(`Usage: node scripts/verify-local-patches.mjs [options]

Options:
  --root PATH       Source tree to verify (default: cwd)
  --bundle PATH     Deployed bundle to scan (default: ${DEFAULT_BUNDLE})
  --db PATH         9Router sqlite DB to inspect (default: ${DEFAULT_DB})
  --codex-config PATH  Codex config to inspect (default: ${DEFAULT_CODEX_CONFIG})
  --model-catalog PATH Custom model catalog to inspect (default: ${DEFAULT_MODEL_CATALOG})
  --health URL      Health URL to fetch; may be repeated
  --no-bundle       Skip deployed bundle scan
  --no-db           Skip sqlite DB alias checks
  --no-external     Skip Codex config and model catalog checks`);
    process.exit(0);
  }
  if (arg === "--root") opts.root = process.argv[++i];
  else if (arg === "--bundle") opts.bundle = process.argv[++i];
  else if (arg === "--db") opts.db = process.argv[++i];
  else if (arg === "--codex-config") opts.codexConfig = process.argv[++i];
  else if (arg === "--model-catalog") opts.modelCatalog = process.argv[++i];
  else if (arg === "--health") opts.health.push(process.argv[++i]);
  else if (arg === "--no-bundle") opts.checkBundle = false;
  else if (arg === "--no-db") opts.checkDb = false;
  else if (arg === "--no-external") opts.checkExternal = false;
  else die(`Unknown argument: ${arg}`);
}

opts.root = path.resolve(opts.root);
opts.bundle = opts.bundle ? path.resolve(opts.bundle) : null;
opts.db = opts.db ? path.resolve(opts.db) : null;
opts.codexConfig = opts.codexConfig ? path.resolve(opts.codexConfig) : null;
opts.modelCatalog = opts.modelCatalog ? path.resolve(opts.modelCatalog) : null;

let failures = 0;
let warnings = 0;

function pass(message) {
  console.log(`[PASS] ${message}`);
}

function warn(message) {
  warnings += 1;
  console.warn(`[WARN] ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`[FAIL] ${message}`);
}

function die(message) {
  console.error(`[FAIL] ${message}`);
  process.exit(1);
}

function readFile(file) {
  return fs.readFileSync(file, "utf8");
}

function sourcePath(rel) {
  return path.join(opts.root, rel);
}

function checkFile(rel) {
  const file = sourcePath(rel);
  if (!fs.existsSync(file)) {
    fail(`missing source file: ${rel}`);
    return null;
  }
  return readFile(file);
}

function mustContain(rel, needle, label = needle) {
  const text = checkFile(rel);
  if (text == null) return;
  if (text.includes(needle)) pass(`${rel}: ${label}`);
  else fail(`${rel}: missing ${label}`);
}

function mustNotContain(rel, needle, label = needle) {
  const text = checkFile(rel);
  if (text == null) return;
  if (!text.includes(needle)) pass(`${rel}: absent ${label}`);
  else fail(`${rel}: still contains ${label}`);
}

function checkGitMetadata() {
  const gitPath = sourcePath(".git");
  if (!fs.existsSync(gitPath)) {
    warn("source tree has no .git metadata; upstream PR prep must use a clean clone");
    return;
  }
  const st = fs.statSync(gitPath);
  if (st.isDirectory()) {
    pass("source .git directory exists");
    return;
  }
  const text = readFile(gitPath).trim();
  const match = text.match(/^gitdir:\s*(.+)$/);
  if (!match) {
    warn(".git file is not a standard gitdir pointer");
    return;
  }
  const target = path.resolve(opts.root, match[1]);
  if (fs.existsSync(target)) pass(`source gitdir exists: ${target}`);
  else warn(`source gitdir is broken: ${target}`);
}

function parseTopLevelTomlString(text, key) {
  // ponytail: Local config uses top-level quoted strings; add a TOML parser if nested values become required.
  const line = text.split(/\r?\n/).find((value) => new RegExp(`^\\s*${key}\\s*=`).test(value));
  return line?.match(/^\s*[A-Za-z0-9_]+\s*=\s*(["'])(.*?)\1\s*(?:#.*)?$/)?.[2] ?? null;
}

function checkExternalConfig() {
  if (!opts.checkExternal) return;
  console.log(`\nCodex config/catalog checks: ${opts.codexConfig}`);
  if (!opts.codexConfig || !fs.existsSync(opts.codexConfig)) {
    fail(`Codex config missing: ${opts.codexConfig || "<unset>"}`);
    return;
  }
  if (!opts.modelCatalog || !fs.existsSync(opts.modelCatalog)) {
    fail(`Codex model catalog missing: ${opts.modelCatalog || "<unset>"}`);
    return;
  }

  const config = readFile(opts.codexConfig);
  const provider = parseTopLevelTomlString(config, "model_provider");
  const selectedModel = parseTopLevelTomlString(config, "model");
  const selectedEffort = parseTopLevelTomlString(config, "model_reasoning_effort");
  const configuredCatalog = parseTopLevelTomlString(config, "model_catalog_json");

  if (provider === "9router") pass("Codex model provider: 9router");
  else fail(`Codex model provider expected 9router, got ${provider ?? "<missing>"}`);
  if (configuredCatalog && path.resolve(configuredCatalog) === opts.modelCatalog) pass("Codex model catalog path");
  else fail(`Codex model catalog path mismatch: ${configuredCatalog ?? "<missing>"}`);

  let catalog;
  try {
    catalog = JSON.parse(readFile(opts.modelCatalog));
  } catch (error) {
    fail(`Codex model catalog JSON: ${error.message}`);
    return;
  }
  const models = Array.isArray(catalog?.models) ? catalog.models : [];
  const bySlug = new Map(models.map((model) => [model?.slug, model]));
  if (models.length === 12 && bySlug.size === models.length) pass("Codex catalog: 12 unique models");
  else fail(`Codex catalog expected 12 unique models, got ${models.length} rows/${bySlug.size} slugs`);

  for (const slug of ["claude-opus-4.8", "claude-fable-5", "grok-build-0.1", "grok-4.5"]) {
    if (bySlug.has(slug)) pass(`Codex catalog custom model: ${slug}`);
    else fail(`Codex catalog missing custom model: ${slug}`);
  }

  const expectedGpt = {
    "gpt-5.6-sol": { agent: "v2", ultra: true },
    "gpt-5.6-terra": { agent: "v2", ultra: true },
    "gpt-5.6-luna": { agent: "v1", ultra: false },
  };
  for (const [slug, expected] of Object.entries(expectedGpt)) {
    const model = bySlug.get(slug);
    const efforts = new Set(model?.supported_reasoning_levels?.map((level) => level.effort));
    const valid = model?.context_window === 372000
      && model?.max_context_window === 372000
      && model?.use_responses_lite === true
      && model?.multi_agent_version === expected.agent
      && efforts.has("max")
      && efforts.has("ultra") === expected.ultra;
    if (valid) pass(`Codex catalog GPT metadata: ${slug}`);
    else fail(`Codex catalog GPT metadata mismatch: ${slug}`);
  }

  const active = bySlug.get(selectedModel);
  if (active) pass(`Codex selected model exists in catalog: ${selectedModel}`);
  else fail(`Codex selected model missing from catalog: ${selectedModel ?? "<missing>"}`);
  const activeEfforts = new Set(active?.supported_reasoning_levels?.map((level) => level.effort));
  if (selectedEffort && activeEfforts.has(selectedEffort)) pass(`Codex selected effort supported: ${selectedEffort}`);
  else fail(`Codex selected effort unsupported: ${selectedEffort ?? "<missing>"}`);
}

function checkSource() {
  console.log(`\nSource checks: ${opts.root}`);
  if (!fs.existsSync(sourcePath("package.json"))) {
    die(`not a 9Router source tree: ${opts.root}`);
  }

  checkGitMetadata();

  mustContain("open-sse/providers/registry/codex.js", "https://auth.openai.com/api/accounts/oauth/token", "Codex account token endpoint");
  mustNotContain("open-sse/providers/registry/codex.js", "https://auth.openai.com/oauth/token", "stale Codex token endpoint");
  mustContain("cli/scripts/build-cli.js", "NINEROUTER_CLI_APP_DIR", "staged CLI app build destination");
  mustContain("cli/scripts/buildMitm.js", "NINEROUTER_CLI_APP_DIR", "staged MITM build destination");

  mustContain("open-sse/utils/proxyFetch.js", "disableEnvProxy", "env proxy bypass support");
  mustContain("open-sse/utils/proxyFetch.js", "ProxyAgent", "explicit proxy dispatcher support");
  mustContain("src/app/api/oauth/[provider]/[action]/route.js", "import \"open-sse/utils/proxyFetch.js\"", "OAuth route patches global fetch");
  mustContain("src/lib/oauth/proxyOptions.js", "return { disableEnvProxy: true }", "OAuth no-pool disables env proxy");
  mustContain("src/lib/oauth/proxyOptions.js", "Proxy pool ${proxyPoolId} is unavailable", "OAuth explicit proxy pool fail-closed");
  mustContain("src/app/api/oauth/[provider]/[action]/route.js", "proxyOptionsForPool", "OAuth actions share proxy resolution");
  mustContain("src/shared/components/OAuthModal.js", "proxyPoolsReady", "OAuth waits for proxy pool list");
  mustContain("src/shared/components/OAuthModal.js", "flowGenerationRef", "OAuth stale-flow generation fence");
  mustContain("src/shared/components/OAuthModal.js", "proxyStopPromiseRef.current = pending", "OAuth serialized fixed-port shutdown");
  mustContain("src/shared/components/OAuthModal.js", "state=${encodeURIComponent(state)}", "OAuth state-bound fixed-port shutdown");
  mustContain("src/shared/components/OAuthModal.js", "method: \"POST\"", "OAuth fixed-port sessions use POST bodies");
  mustContain("src/shared/components/OAuthModal.js", "proxyPools.find((pool) => pool.isActive === true)?.id", "OAuth active-pool default");
  mustContain("src/lib/oauth/utils/server.js", "publicSessionStatus", "OAuth status response redaction");
  mustContain("src/lib/oauth/utils/server.js", "hasPendingSessions", "OAuth shared callback server pending-session hold");
  mustContain("src/shared/components/KiroSocialOAuthModal.js", "proxyPools.find((pool) => pool.isActive === true)?.id", "Kiro social active-pool default");
  mustContain("src/shared/components/KiroSocialOAuthModal.js", "authGenerationRef", "Kiro social exchange generation fence");
  mustContain("src/app/api/providers/[id]/test/testUtils.js", "refreshOAuthToken(connection, effectiveProxy = null)", "manual OAuth refresh proxy parameter");
  mustContain("tests/unit/manual-oauth-refresh-proxy.test.js", "passes selected proxy to refreshProviderCredentials", "manual OAuth refresh runtime regression test");
  mustContain("src/lib/oauth/providers.js", "isCloudflareHtmlBadRequest", "Cloudflare HTML 400 detector");
  mustContain("src/lib/oauth/providers.js", "buildRequest({ disableEnvProxy: true })", "Codex exchange direct retry");
  mustContain("open-sse/services/tokenRefresh/providers.js", "oauthRefreshProxyOptions", "OAuth refresh proxy normalization");
  mustContain("open-sse/services/tokenRefresh/providers.js", "return hasConnectionProxy || proxyOptions?.vercelRelayUrl", "OAuth refresh explicit proxy preservation");
  mustContain("tests/unit/oauth-refresh-routing.test.js", "disableEnvProxy", "OAuth refresh no-proxy regression test");
  mustContain("tests/unit/oauth-modal-behavior.test.js", "serializes rapid pool changes", "OAuth modal concurrency regression test");

  mustContain("open-sse/executors/codex.js", "body.service_tier === \"fast\"", "Codex fast tier detection");
  mustContain("open-sse/executors/codex.js", "body.service_tier = \"priority\"", "Codex fast tier maps to priority");
  mustContain("open-sse/executors/codex.js", "supportsCodexFastTier", "Codex fast tier model gate");
  mustContain("open-sse/executors/codex.js", "CODEX_PRIORITY_ESTIMATED_INPUT_LIMIT = 256_000", "Codex priority long-context safety cutoff");
  mustContain("open-sse/executors/codex.js", "isEcmaWhitespace", "Codex priority estimator counts whitespace");
  mustContain("open-sse/executors/codex.js", "Math.ceil(asciiChars / 5)", "Codex priority estimator calibrates whole ASCII payload");
  mustContain("open-sse/executors/codex.js", "Math.floor(asciiWhitespaceRun / 20)", "Codex priority estimator protects long whitespace");
  mustContain("open-sse/executors/codex.js", "Priority disabled for long context", "Codex priority removal log");
  mustContain("open-sse/executors/codex.js", "value === \"xhigh\"", "GPT-5.6 upgrades legacy xhigh reasoning");
  mustContain("open-sse/executors/codex.js", "return \"max\"", "GPT-5.6 legacy effort upgrade target");
  mustNotContain("open-sse/executors/codex.js", "value === \"max\" ? \"xhigh\"", "stale Codex max-to-xhigh downgrade");
  mustContain("open-sse/executors/codex.js", "'xhigh', 'max'", "Codex max reasoning suffix");
  mustContain("open-sse/executors/codex.js", "? \"max\" : \"low\"", "GPT-5.6 defaults to max reasoning");
  mustContain("open-sse/providers/registry/codex.js", "\"max\",", "Codex reasoning metadata exposes max");
  mustContain("open-sse/translator/concerns/thinkingUnified.js", "provider === \"codex\" && /^gpt-5\\.6", "GPT-5.6 translator max capability");
  mustContain("open-sse/translator/concerns/thinkingUnified.js", "level === \"max\" && !supportsMax ? \"xhigh\" : level", "model-aware OpenAI max clamp");
  mustNotContain("open-sse/translator/concerns/thinkingUnified.js", "body.reasoning_effort = level === \"max\" ? \"xhigh\" : level", "stale unconditional translator max downgrade");
  mustContain("open-sse/providers/thinkingLevels.js", "{ pattern: \"*gpt-5.6-*\", levels:", "all GPT-5.6 models expose max");
  mustContain("open-sse/executors/codex.js", "CODEX_SSE_ACCOUNT_FALLBACK_PATTERNS", "Codex SSE account fallback patterns");
  mustContain("open-sse/executors/codex.js", "Selected model is at capacity. Please try a different model.", "Codex capacity message detection");
  mustContain("open-sse/executors/codex.js", "replacementBody", "Codex SSE body reassembly after peek");
  mustContain("open-sse/executors/codex.js", "invalid_encrypted_content", "Codex encrypted-content recovery detection");
  mustContain("open-sse/executors/codex.js", "removeInvalidEncryptedReasoning", "Codex encrypted reasoning sanitizer");
  mustContain("open-sse/executors/codex.js", "retrying same account without", "Codex same-account encrypted-content retry");
  mustContain("tests/unit/codex-encrypted-content-recovery.test.js", "preserves encrypted reasoning when upstream accepts it", "Codex encrypted continuity regression test");
  mustContain("src/sse/handlers/chat.js", "excludeConnectionIds.add(credentials.connectionId)", "account fallback excludes failed connection");

  mustContain("src/sse/services/bestGptRoute.js", "NINE_ROUTER_BEST_GPT_TARGET", "best-GPT runtime target knob");
  mustContain("src/sse/services/bestGptRoute.js", "DEFAULT_TARGET = \"cx/gpt-5.6-sol\"", "best-GPT Sol default");
  mustContain("src/sse/services/bestGptRoute.js", "DEFAULT_REASONING_EFFORT = \"max\"", "best-GPT max default");
  mustContain("src/sse/services/bestGptRoute.js", "DEFAULT_SERVICE_TIER = \"fast\"", "best-GPT fast default");
  mustContain("src/sse/handlers/chat.js", "applyBestGptRoute(body)", "chat handler best-GPT route layer");
  mustContain("src/sse/handlers/chat.js", "\"GPT-ROUTE\"", "best-GPT route log");

  mustContain("open-sse/executors/codex.js", "x-openai-internal-codex-responses-lite", "Codex Responses Lite header forwarding");
  mustContain("open-sse/executors/codex.js", "CODEX_LITE_METADATA_HEADERS", "Codex Responses Lite metadata allowlist");
  mustContain("open-sse/executors/codex.js", "COMPACT_API_ALLOWLIST", "Codex compact request contract");
  mustContain("open-sse/executors/codex.js", "CODEX_COMPACT_REQUEST", "Codex compact retry marker");
  mustContain("open-sse/executors/codex.js", "\"parallel_tool_calls\", \"reasoning\"", "Codex Lite reasoning context preservation");
  mustContain("open-sse/executors/codex.js", "body.reasoning.context = \"all_turns\"", "Codex Lite reasoning context normalization");
  mustContain("open-sse/executors/codex.js", "body.parallel_tool_calls = false", "Codex Lite parallel tool contract");
  mustContain("open-sse/executors/base.js", "const transformedBody = this.transformRequest", "request transformed before URL resolution");
  mustContain("open-sse/utils/clientDetector.js", "ua.includes(\"codex_exec\")", "Codex Desktop executor detection");
  mustContain("open-sse/rtk/systemInject.js", "m?.type !== \"additional_tools\"", "Responses Lite additional_tools protection");
  mustContain("open-sse/handlers/chatCore.js", "structuredClone(body)", "account fallback deep request clone");
  mustContain("src/sse/handlers/chat.js", "structuredClone(body)", "model fallback deep request clone");

  mustContain("open-sse/executors/codex.js", "\"ChatGPT-Account-ID\"", "Codex request account header");
  mustContain("open-sse/services/codexAccount.js", "providerSpecificData?.workspaceId", "Codex workspace binding");
  mustContain("open-sse/services/codexAccount.js", "providerSpecificData?.chatgptAccountId", "Codex account fallback binding");
  mustContain("open-sse/services/codexAccount.js", "chatgpt_account_id", "Codex ID-token account fallback");
  mustContain("open-sse/executors/codex.js", "resolveCodexAccountId(credentials?.providerSpecificData, credentials?.idToken)", "Codex request shared account resolver");
  mustContain("open-sse/handlers/imageProviders/codex.js", "resolveCodexAccountId(creds?.providerSpecificData, creds?.idToken)", "Codex image shared account resolver");
  mustContain("open-sse/services/usage/codex.js", "resolveCodexAccountId(providerSpecificData, idToken)", "Codex usage workspace/account binding");
  mustContain("open-sse/services/usage/codex.js", "? [providerSpecificData, providerSpecificData]", "Codex mixed proxy/account preservation");
  mustContain("open-sse/services/usage/codex.js", "A ChatGPT account ID is required to consume", "Codex reset consume fails closed");
  mustContain("src/shared/services/quotaAutoPing.js", "idToken: connection.idToken", "Codex auto-ping account fallback");
  mustContain("src/app/api/usage/[connectionId]/codex-reset-credits/route.js", "connection.idToken", "Codex reset route ID-token binding");
  mustContain("src/lib/oauth/providers.js", "chatgptAccountId: info.chatgptAccountId", "Codex OAuth stores account ID");
  mustContain("src/app/api/oauth/codex/bulk-import/route.js", "psd.chatgptAccountId = info.chatgptAccountId", "Codex bulk import backfills account ID");

  mustContain("open-sse/services/model.js", "\"claude-opus-4.8\": \"gh/claude-opus-4.8\"", "built-in Claude Opus 4.8 alias");
  mustContain("open-sse/services/model.js", "\"claude-fable-5\": \"gh/claude-fable-5\"", "built-in Claude Fable 5 alias");
  mustContain("open-sse/providers/registry/github.js", "{ id: \"claude-opus-4.8\"", "GitHub registry Claude Opus 4.8");
  mustContain("open-sse/providers/registry/github.js", "{ id: \"claude-fable-5\"", "GitHub registry Claude Fable 5");
  mustContain("open-sse/providers/capabilities.js", "*claude*fable*\",  caps: { vision: true, reasoning: true, search: true, thinkingFormat: \"claude-adaptive\"", "Claude Fable adaptive thinking");
  mustContain("open-sse/translator/formats/claude.js", "Unpaired tool result", "Claude orphan tool-result salvage");
  mustContain("open-sse/services/copilotModels.js", "api.githubcopilot.com/models", "Copilot live model catalog");
  mustContain("open-sse/services/copilotStatus.js", "free_limited_copilot", "Copilot free profile classification");
  mustContain("open-sse/services/provider.js", "supportsNativeResponses(provider, model)", "model-aware native Responses capability");
  mustContain("open-sse/services/provider.js", "if (provider !== \"github\") return true", "GitHub-specific native Responses guard");
  mustContain("open-sse/services/provider.js", "return !/(?:gemini|claude)/i.test(model || \"\")", "GitHub Claude/Gemini Chat bridge policy");
  mustContain("open-sse/handlers/responsesHandler.js", "supportsNativeResponses(modelInfo?.provider, modelInfo?.model)", "Responses bridge uses model-aware capability");
  mustContain("open-sse/handlers/chatCore.js", "resolveTransport(provider, modelTargetFormat || sourceFormat, model)", "transport resolution includes model");
  mustContain("open-sse/executors/github.js", "supportsNativeResponses(\"github\", model)", "GitHub executor shares Responses policy");
  mustContain("src/app/api/v1/responses/route.js", "createDeferredResponsesResponse(", "Responses route returns deferred SSE");
  mustContain("src/app/api/v1/responses/route.js", "body?.stream !== true", "Responses explicit-stream gate");
  mustContain("src/app/api/v1/responses/route.js", "{ signal: request.signal, model: body?.model }", "Responses failure model propagation");
  mustContain("open-sse/utils/responsesStreamBridge.js", "keepaliveMs = 25_000", "Responses tunnel heartbeat interval");
  mustContain("open-sse/utils/responsesStreamBridge.js", "buildResponsesFailureTerminalBytes", "Responses delayed error framing");
  mustContain("open-sse/utils/responsesStreamBridge.js", "const state = await ready", "Responses pull-based upstream bridge");
  mustContain("open-sse/utils/responsesStreamBridge.js", "cancelWork(parentSignal?.reason || \"client closed\", true)", "Responses parent abort closes downstream");
  mustContain("open-sse/utils/responsesStreamHelpers.js", "sequence_number: sequenceNumber", "Responses failure sequence number");
  mustContain("open-sse/utils/responsesStreamHelpers.js", "object: \"response\"", "Responses failure object shape");
  mustContain("open-sse/utils/responsesStreamHelpers.js", "\"response.incomplete\"", "Responses incomplete terminal state");
  mustContain("open-sse/utils/streamHandler.js", "getOpenAIResponsesTerminationState: () =>", "Responses terminal state survives pipe wrapper");
  mustContain("open-sse/handlers/chatCore/nonStreamingHandler.js", "responseBody?.status === \"failed\"", "Responses failed JSON classification");
  mustContain("open-sse/handlers/chatCore/sseToJsonHandler.js", "Responses stream closed before a terminal event", "Responses missing-terminal conversion failure");
  mustContain("open-sse/utils/stream.js", "formatIncompleteOpenAIResponsesStreamFailure", "Responses streaming missing-terminal formatter");
  mustContain("open-sse/utils/stream.js", "!openAIResponsesTerminalSeen", "Responses streaming EOF terminal guard");
  mustContain("open-sse/utils/usageTracking.js", "chunk.type === \"response.incomplete\"", "Responses incomplete usage extraction");
  mustContain("open-sse/transformer/streamToJsonConverter.js", "parsed.error || parsed.response?.error || parsed", "Responses top-level error preservation");
  mustContain("tests/unit/responses-abort-terminal.test.js", "preserves terminal state through the production pipe wrapper", "Responses pipe terminal regression test");
  mustContain("tests/unit/xai-native-responses-routing.test.js", "returns failed native Responses JSON as an upstream error", "Responses failed JSON regression test");
  mustContain("tests/unit/xai-native-responses-routing.test.js", "ends before a terminal event", "Responses missing-terminal regression test");
  mustContain("open-sse/utils/streamHandler.js", "externalSignal.addEventListener(\"abort\", externalAbort", "provider external abort propagation");
  mustContain("src/sse/handlers/chat.js", "if (externalSignal?.aborted) return result.response", "client abort skips account cooldown");
  mustContain("tests/unit/responses-early-stream.test.js", "sends an immediate comment and keepalives before provider headers", "Responses heartbeat regression test");
  mustContain("tests/unit/responses-early-stream.test.js", "preserves fragmented provider SSE bytes without inserting keepalives", "Responses fragmented SSE regression test");
  mustContain("tests/unit/responses-early-stream.test.js", "reads one provider chunk per downstream pull", "Responses backpressure regression test");
  mustContain("tests/unit/responses-early-stream.test.js", "does not start provider work for an already-aborted request", "Responses pre-abort regression test");
  mustContain("tests/unit/responses-route.test.js", "keeps omitted stream non-streaming", "Responses omitted-stream regression test");
  mustContain("tests/unit/headroom-chat-core.test.js", "detaches the client abort listener after an executor error", "failed-attempt abort-listener regression test");

  mustContain("src/lib/db/repos/usageRepo.js", "const cachedTokens = tokens.cached_tokens || tokens.cache_read_input_tokens || 0", "cached token stats");
  mustContain("src/lib/db/repos/usageRepo.js", "cacheCreationTokens", "cache-write stats");
  mustContain("open-sse/providers/pricing.js", "calculateCostFromTokens", "shared token cost calculator");
  mustContain("open-sse/providers/pricing.js", "calculateCostBreakdownFromTokens", "stored cost component calculator");
  mustContain("open-sse/providers/pricing.js", "\"gpt-5.5\"", "GPT-5.5 exact pricing");
  mustContain("open-sse/providers/pricing.js", "\"gpt-5.6-sol\"", "GPT-5.6 Sol pricing");
  mustContain("open-sse/providers/pricing.js", "\"gpt-5.6-terra\"", "GPT-5.6 Terra pricing");
  mustContain("open-sse/providers/pricing.js", "\"gpt-5.6-luna\"", "GPT-5.6 Luna pricing");
  mustContain("open-sse/providers/pricing.js", "\"grok-4.5\"", "Grok 4.5 pricing");
  mustContain("open-sse/providers/pricing.js", "\"claude-fable-5\"", "Claude Fable 5 pricing");
  mustContain("open-sse/providers/pricing.js", "\"claude-opus-4.8\"", "Claude Opus 4.8 pricing");
  mustContain("open-sse/providers/pricing.js", "resolvePricingForTokens", "tier/context pricing resolver");
  mustContain("open-sse/providers/pricing.js", "resolved.cache_creation ?? resolved.input", "cache-write pricing");
  mustContain("open-sse/providers/pricing.js", "resolved.reasoning_billed_separately === true", "reasoning avoids double billing");
  mustContain("open-sse/providers/pricing.js", "cost_tick_scale: 1e10", "xAI USD tick scale");
  mustContain("open-sse/utils/usageTracking.js", "input_tokens_details?.cache_write_tokens", "Responses cache writes preserved");
  mustContain("open-sse/utils/usageTracking.js", "usage.service_tier", "effective service tier preserved");
  mustContain("src/lib/db/repos/usageRepo.js", "byApiKey", "API-key usage grouping");
  mustContain("src/lib/db/repos/usageRepo.js", "cost_breakdown", "stored usage cost breakdown");
  mustContain("open-sse/handlers/chatCore/requestDetail.js", "cost_in_usd_ticks", "provider usage cost ticks preserved");
  mustContain("src/app/(dashboard)/dashboard/usage/components/RequestDetailsTab.js", "Cache Write", "request cache-write display");
  mustContain("src/app/(dashboard)/dashboard/usage/components/UsageTable.js", "value.toFixed(6)", "sub-cent cost display");
  mustContain("src/app/(dashboard)/dashboard/usage/components/UsageTable.js", "Cache Write Cost", "usage cache-write cost column");
  mustContain("src/app/(dashboard)/dashboard/usage/components/UsageTable.js", "Uncached Input Cost", "usage uncached-input cost column");

  mustContain("src/lib/db/schema.js", "dailyLimitTokens: \"INTEGER\"", "API-key daily token limit schema");
  mustContain("src/lib/db/repos/apiKeysRepo.js", "getApiKeyUsageLimitStatus", "API-key daily token limit query");
  mustContain("src/sse/handlers/chat.js", "API key daily token limit exceeded", "API-key daily token limit enforcement");
  mustContain("tests/unit/db-sqlite-vs-lowdb.test.js", "daily usage limit status uses today's API-key tokens", "API-key daily token limit regression test");

  mustContain("open-sse/services/usage/codex.js", "parseCodexResetCredits", "Codex reset credit parser");
  mustContain("open-sse/services/usage/codex.js", "RESET_CREDIT_EXPIRY_KEYS", "Codex reset credit expiry parser");
  mustContain("src/app/api/usage/[connectionId]/codex-reset-credits/route.js", "crypto.randomUUID()", "server-generated reset redeem ID");
  mustContain("src/app/(dashboard)/dashboard/usage/components/ProviderLimits/index.js", "setResetConfirmState", "Codex reset confirmation state");
  mustContain("src/app/(dashboard)/dashboard/usage/components/ProviderLimits/index.js", "ConfirmModal", "Codex reset confirmation modal");

  mustContain("open-sse/providers/registry/xai.js", "{ id: \"grok-4.5\"", "xAI registry Grok 4.5");
  mustContain("open-sse/providers/registry/xai.js", "format: \"openai-responses\"", "xAI Responses transport");
  mustContain("open-sse/providers/registry/xai.js", "https://api.x.ai/v1/responses", "xAI Responses endpoint");
  mustContain("open-sse/providers/registry/xai.js", "options: [\"auto\", \"low\", \"medium\", \"high\"]", "xAI reasoning effort options");
  mustContain("open-sse/providers/registry/xai.js", "usage: true", "xAI quota tracker enabled");
  mustContain("open-sse/services/model.js", "[/^grok-/, \"xai\"]", "bare Grok routes to xAI");
  mustContain("open-sse/executors/default.js", "normalizeXaiResponsesTools", "xAI Responses tool normalizer");
  mustContain("open-sse/executors/default.js", "delete next.tool_choice", "xAI stale tool choice removal");
  mustContain("open-sse/executors/default.js", "XAI_FREEFORM_TOOL_PARAMETERS", "xAI custom tool freeform wrapper");
  mustContain("open-sse/executors/default.js", "tool.type === \"local_shell\") return null", "xAI local_shell drop");
  mustContain("open-sse/executors/default.js", "external_web_access", "xAI hosted tool field strip");
  mustContain("open-sse/executors/default.js", "reasoning.encrypted_content", "xAI encrypted reasoning strip");
  mustContain("open-sse/executors/default.js", "credentials?.runtimeTransport?.format === \"openai-responses\"", "xAI sanitizer transport gate");
  mustContain("open-sse/executors/default.js", "? normalizeXaiResponsesPayload(transformed)", "xAI final Responses payload strip");
  mustContain("tests/unit/xai-tool-normalization.test.mjs", "preserves encrypted reasoning on Chat Completions transport", "xAI Chat history preservation test");
  mustContain("open-sse/executors/default.js", "item.type === \"reasoning\") return null", "xAI reasoning input drop");
  mustContain("open-sse/executors/default.js", "custom_tool_call", "xAI custom tool history conversion");
  mustContain("open-sse/executors/default.js", "stringifyXaiToolOutput(item.output)", "xAI tool output stringification");
  mustContain("open-sse/services/usage.js", "getXaiUsage", "xAI usage handler import");
  mustContain("open-sse/services/usage.js", "xai: (c) => getXaiUsage(c.connectionId)", "xAI usage handler");
  mustContain("open-sse/services/usage/xai.js", "usageHistory", "xAI local usage aggregation");
  mustContain("src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js", "case \"xai\"", "xAI usage UI parser");

  mustContain("open-sse/config/grokCli.js", "GROK_CLI_VERSION = \"0.2.99\"", "official Grok CLI fingerprint");
  mustContain("open-sse/providers/registry/grok-cli.js", "id: GROK_CLI_MODEL", "official Grok Build subscription model");
  mustContain("open-sse/providers/registry/grok-cli.js", "contextLength: 500000", "Grok Build context metadata");
  mustContain("open-sse/services/model.js", "\"grok-build\": \"gcli/grok-build\"", "bare Grok Build subscription route");
  mustContain("open-sse/config/grokCli.js", "https://cli-chat-proxy.grok.com/v1", "Grok CLI subscription endpoint");
  mustContain("open-sse/services/grokCliModels.js", "resolveGrokCliModels", "Grok CLI live model resolver");
  mustContain("open-sse/services/grokCliModels.js", "refreshProviderCredentials", "Grok CLI model refresh retry");
  mustContain("open-sse/executors/grok-cli-compat.js", "normalizeToolChoice", "Grok CLI stale tool choice removal");
  mustContain("open-sse/executors/grok-cli-compat.js", "if (effort === \"max\") return \"xhigh\"", "Grok CLI max effort translation");
  mustContain("open-sse/executors/grok-cli.js", "supportsGrokCliReasoningEffort", "model-aware Grok CLI reasoning effort");
  mustContain("open-sse/executors/grok-cli-compat.js", "if (options.supportsReasoningEffort)", "unsupported Grok CLI effort removal");
  mustContain("open-sse/executors/grok-cli.js", "GROK_CLI_TURN_STORE_MAX", "bounded Grok CLI turn state");
  mustContain("open-sse/executors/grok-cli-compat.js", "normalizeInput", "Grok CLI cross-provider input normalization");
  mustContain("open-sse/executors/grok-cli-compat.js", "custom_tool_call_output", "Grok CLI custom tool history conversion");
  mustContain("open-sse/executors/grok-cli-compat.js", "normalizeToolOutput", "Grok CLI array tool output normalization");
  mustContain("open-sse/executors/grok-cli-compat.js", "NATIVE_REASONING_ID", "Grok CLI native encrypted reasoning preservation");
  mustContain("open-sse/executors/grok-cli-compat.js", "item.encrypted_content.startsWith(`${item.id}_`)", "Grok CLI native tco reasoning preservation");
  mustContain("open-sse/executors/grok-cli-compat.js", "item.call_id.startsWith(\"xs_call-\")", "Grok CLI native x-search history preservation");
  mustContain("open-sse/executors/grok-cli-compat.js", "HOSTED_TOOL_TYPES", "Grok CLI hosted tool allowlist");
  mustNotContain("open-sse/executors/grok-cli-compat.js", "external_web_access", "unsupported Grok CLI web-search field");
  mustContain("open-sse/executors/grok-cli.js", "X-XAI-Token-Auth", "official Grok CLI proxy auth header");
  mustContain("open-sse/executors/grok-cli.js", "x-authenticateresponse", "official Grok CLI authenticate-response header");
  mustContain("open-sse/executors/grok-cli.js", "x-grok-user-id", "official Grok CLI inference user header");
  mustContain("open-sse/services/accountFallback.js", "status === 400 || status === 422", "deterministic client errors avoid account fallback");
  mustContain("open-sse/services/grokCliModels.js", "compactionAtTokens", "Grok CLI capability metadata normalization");
  mustNotContain("open-sse/executors/grok-cli.js", "x-compaction-at", "invented Grok CLI compaction header");
  mustContain("src/lib/oauth/providers.js", "requestDeviceCode: async (config, _codeChallenge, _options, proxyOptions)", "Grok CLI device request proxy propagation");
  mustContain("src/lib/oauth/providers.js", "pollToken: async (config, deviceCode, _codeVerifier, _extraData, proxyOptions)", "Grok CLI poll proxy propagation");
  mustContain("src/app/api/oauth/[provider]/[action]/route.js", "\"codebuddy-cn\", \"grok-cli\"", "Grok CLI no-PKCE polling");
  mustContain("open-sse/services/oauthCredentialManager.js", "effectiveProxyOptions", "OAuth refresh proxy propagation");
  mustContain("open-sse/services/usage/grok-cli.js", "monthlyLimit", "current Grok Build quota fields");
  mustContain("open-sse/services/usage/grok-cli.js", "subscriptionAccess", "paid Grok subscription zero-cap handling");

  mustContain("src/app/(dashboard)/dashboard/console-log/ConsoleLogClient.js", "startConsoleLogTransport", "console tunnel fallback transport");
  mustContain("src/app/(dashboard)/dashboard/console-log/transport.js", "If-None-Match", "console conditional polling");
  mustContain("src/app/api/translator/console-logs/route.js", "getConsoleLogSnapshot", "console revision snapshots");
  mustContain("src/app/api/translator/console-logs/stream/route.js", 'type: "init", logs: buffered', "console empty SSE init");
  mustContain("src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js", "createAutoRefreshScheduler", "single quota refresh scheduler");
  mustContain("src/app/api/usage/stream/route.js", "request.signal.addEventListener", "usage SSE abort cleanup");
  mustContain("src/app/api/usage/stream/route.js", "state.queued = true", "usage SSE update coalescing");
  mustNotContain("src/app/api/usage/stream/route.js", "getUsageStats", "full usage aggregation in SSE");
  mustContain("src/lib/db/repos/usageRepo.js", "errorProvider, pending: pendingRequests", "usage SSE pending snapshot");

  mustContain("cli/scripts/build-cli.js", "client-ip.js", "trusted client-IP helper bundle copy");
  mustContain("custom-server.js", "resolveTrustedClientIp", "trusted client-IP server wrapper");
  mustContain("client-ip.js", "CLOUDFLARE_CROSS_ZONE_WORKER_IP", "short-tunnel IP validation");
  mustContain("src/lib/db/schema.js", "apiKeyClients", "API-key client activity schema");
  mustContain("src/sse/handlers/chat.js", "getApiKeyClientIdentity", "API-key client observation");
  mustContain("open-sse/handlers/chatCore/requestDetail.js", "apiKeyClientFingerprint", "API-key client usage attribution");
  mustContain("src/shared/components/UsageStats.js", "API Key Clients", "API-key clients usage view");
  mustContain("src/app/api/usage/clients/route.js", "getApiKeyClientActivity", "API-key client activity endpoint");

  mustContain("src/sse/handlers/chat.js", "const correlationId = globalThis.crypto.randomUUID()", "request-wide correlation ID generation");
  mustContain("src/sse/handlers/chat.js", "const attemptId = globalThis.crypto.randomUUID()", "provider-attempt request ID generation");
  mustContain("open-sse/handlers/chatCore.js", "const requestId = attemptId || globalThis.crypto.randomUUID()", "provider-attempt request ID fallback");
  mustContain("open-sse/handlers/chatCore.js", "proxyOptions, requestId }))", "provider request ID dispatch");
  mustContain("open-sse/executors/base.js", "headers[\"x-request-id\"] = requestId", "request ID propagation across executor retries");
  mustContain("open-sse/executors/github.js", "this.buildHeaders(credentials, stream, requestId)", "GitHub native transport request ID propagation");
  mustContain("open-sse/handlers/chatCore/requestDetail.js", "id: base.id || undefined", "request-detail ID preservation");
  mustContain("open-sse/handlers/chatCore/requestDetail.js", "correlationId: base.correlationId || undefined", "request-detail correlation ID preservation");
  mustContain("open-sse/utils/requestTiming.js", "request_before_dispatch_total_ms", "request phase timing contract");

  mustContain("open-sse/utils/requestLogger.js", "SENSITIVE_HEADER_NAMES", "request-log sensitive header allowlist");
  mustContain("open-sse/utils/requestLogger.js", "sensitive ? \"[REDACTED]\" : value", "request-log credential redaction");
  mustContain("open-sse/utils/requestLogger.js", "mode: 0o700", "request-log private directory mode");
  mustContain("open-sse/utils/requestLogger.js", "mode: 0o600", "request-log private file mode");
}

function collectBundleText(bundleRoot) {
  const roots = [
    path.join(bundleRoot, ".next", "server"),
    path.join(bundleRoot, ".next-cli-build", "server"),
    path.join(bundleRoot, "custom-server.js"),
    path.join(bundleRoot, "client-ip.js"),
    path.join(bundleRoot, "server.js"),
    path.join(bundleRoot, "package.json"),
  ].filter((p) => fs.existsSync(p));

  const chunks = [];
  const allowed = new Set([".js", ".json", ".html", ".rsc"]);
  const visit = (file) => {
    const st = fs.statSync(file);
    if (st.isDirectory()) {
      const base = path.basename(file);
      if (base === "node_modules" || base === "cache" || base === "static") return;
      for (const child of fs.readdirSync(file)) visit(path.join(file, child));
      return;
    }
    if (!allowed.has(path.extname(file)) && !file.endsWith("BUILD_ID")) return;
    try {
      chunks.push(readFile(file));
    } catch {
      warn(`could not read bundle file: ${file}`);
    }
  };

  for (const root of roots) visit(root);
  return chunks.join("\n");
}

function checkBundle() {
  if (!opts.checkBundle) return;
  console.log(`\nBundle checks: ${opts.bundle}`);
  if (!opts.bundle || !fs.existsSync(opts.bundle)) {
    warn("live bundle path missing; skipped bundle scan");
    return;
  }

  const text = collectBundleText(opts.bundle);
  const contains = (needle, label) => {
    if (text.includes(needle)) pass(`bundle: ${label}`);
    else fail(`bundle: missing ${label}`);
  };
  const notContains = (needle, label) => {
    if (!text.includes(needle)) pass(`bundle: absent ${label}`);
    else fail(`bundle: still contains ${label}`);
  };
  const matches = (pattern, label) => {
    if (pattern.test(text)) pass(`bundle: ${label}`);
    else fail(`bundle: missing ${label}`);
  };

  contains("https://auth.openai.com/api/accounts/oauth/token", "Codex account token endpoint");
  notContains("https://auth.openai.com/oauth/token", "stale Codex token endpoint");
  contains("disableEnvProxy", "env proxy bypass support");
  contains("Proxy pool ", "OAuth selected-pool fail-closed error");
  contains("Authorization flow changed; restart sign-in", "Kiro social stale-flow fence");
  contains("Selected model is at capacity. Please try a different model.", "Codex capacity message");
  contains("invalid_encrypted_content", "Codex encrypted-content recovery");
  contains("retrying same account without", "Codex same-account encrypted-content retry");
  contains("claude-opus-4.8", "Claude Opus 4.8");
  contains("claude-fable-5", "Claude Fable 5");
  matches(/claude.{0,24}fable.{0,180}claude-adaptive/i, "Claude Fable adaptive thinking");
  contains("Unpaired tool result", "Claude orphan tool-result salvage");
  contains(": connected", "Responses immediate SSE comment");
  contains(": keepalive", "Responses tunnel keepalive");
  contains("upstream_error", "Responses delayed error framing");
  contains("sequence_number", "Responses failure sequence number");
  contains("stream_disconnected", "Responses structured disconnect error");
  contains("Responses stream closed before a terminal event", "Responses missing-terminal conversion");
  contains("stream closed before response.completed", "Responses streaming EOF failure");
  contains("response.incomplete", "Responses incomplete terminal handling");
  contains("grok-4.5", "Grok 4.5");
  contains("gpt-5.5", "GPT-5.5 exact pricing/model");
  contains("gpt-5.6-sol", "GPT-5.6 Sol pricing/model");
  contains("gpt-5.6-terra", "GPT-5.6 Terra pricing/model");
  contains("gpt-5.6-luna", "GPT-5.6 Luna pricing/model");
  contains("cache_write_tokens", "Responses cache-write usage");
  contains("Cache Write Cost", "usage cache-write cost column");
  contains("Uncached Input Cost", "usage uncached-input cost column");
  contains("cost_breakdown", "stored usage cost breakdown");
  contains("cost_in_usd_ticks", "provider-reported cost");
  contains("dailyLimitTokens", "API-key daily token limit storage");
  contains("API key daily token limit exceeded", "API-key daily token limit enforcement");
  contains("https://api.x.ai/v1/responses", "xAI Responses endpoint");
  contains("tool_choice===void 0", "xAI stale tool choice guard");
  contains("Freeform tool input.", "xAI custom tool freeform wrapper");
  contains("local_shell", "xAI local_shell drop");
  contains("external_web_access", "xAI hosted tool field strip");
  contains("encrypted_content", "xAI encrypted content strip");
  contains("custom_tool_call", "xAI custom tool history conversion");
  contains("function_call_output", "xAI function output normalization");
  contains("Local usage", "xAI local usage handler");
  contains("0.2.99", "official Grok CLI fingerprint");
  contains("cli-chat-proxy.grok.com/v1", "Grok CLI subscription endpoint");
  contains("grok-build", "official Grok Build subscription model");
  contains("/^grok-4\\.5(?:$|-)/", "model-aware Grok CLI reasoning effort");
  contains("grok_cli_compatibility_error", "Grok CLI local compatibility error");
  contains("X-XAI-Token-Auth", "official Grok CLI proxy auth header");
  contains("x-authenticateresponse", "official Grok CLI authenticate-response header");
  contains("x-grok-user-id", "official Grok CLI inference user header");
  contains("xs_call-", "native Grok x-search history");
  contains("Tool execution was cancelled by the user", "Grok CLI dangling call repair");
  contains("Monthly included", "current Grok Build quota fields");
  contains("Subscription access is active; Grok does not expose a numeric included quota.", "paid Grok subscription zero-cap handling");
  contains("service_tier", "Codex service tier handling");
  contains("priority", "priority service tier string");
  contains("Priority disabled for long context", "Codex long-context priority removal");
  contains("NINE_ROUTER_BEST_GPT_TARGET", "best-GPT runtime target knob");
  contains("GPT-ROUTE", "best-GPT route log");
  contains("x-openai-internal-codex-responses-lite", "Codex Responses Lite header");
  contains("codex_exec", "Codex Desktop executor detection");
  contains("responses/compact", "Codex compact endpoint");
  contains("additional_tools", "Responses Lite additional_tools handling");
  matches(/parallel_tool_calls\s*=\s*!1.{0,120}reasoning\.context\s*=\s*["']all_turns["']/, "Responses Lite parallel tool contract");
  contains("If-None-Match", "console conditional polling");
  contains("CLOUDFLARE_CROSS_ZONE_WORKER_IP", "short-tunnel IP validation");
  contains("apiKeyClients", "API-key client activity storage");
  contains("API Key Clients", "API-key clients usage view");
  contains("globalThis.crypto.randomUUID()", "provider-attempt request ID generation");
  contains("x-request-id", "provider request ID propagation");
  contains("[REDACTED]", "request-log credential redaction");
  contains("proxy-authorization", "request-log proxy credential classification");
}

function runSqlite(query) {
  const sqlite = spawnSync("sqlite3", ["-json", opts.db, query], { encoding: "utf8" });
  if (sqlite.error) {
    warn(`sqlite3 unavailable; skipped DB checks (${sqlite.error.message})`);
    return null;
  }
  if (sqlite.status !== 0) {
    fail(`sqlite3 query failed: ${sqlite.stderr.trim() || sqlite.stdout.trim()}`);
    return null;
  }
  try {
    return JSON.parse(sqlite.stdout || "[]");
  } catch (error) {
    fail(`sqlite3 JSON parse failed: ${error.message}`);
    return null;
  }
}

function parseSqliteJsonValue(value) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function checkDb() {
  if (!opts.checkDb) return;
  console.log(`\nDB checks: ${opts.db}`);
  if (!opts.db || !fs.existsSync(opts.db)) {
    warn("sqlite DB path missing; skipped DB checks");
    return;
  }

  const rows = runSqlite(`
    select key,value from kv
    where scope='modelAliases'
      and key in ('gpt-5.5','gpt-5.6-sol','gpt-5.6-terra','gpt-5.6-luna','claude-opus-4.8','claude-fable-5')
    order by key;
  `);
  if (!rows) return;

  const aliases = Object.fromEntries(rows.map((r) => [r.key, parseSqliteJsonValue(r.value)]));
  const expected = {
    "gpt-5.5": "cx/gpt-5.6-sol",
    "gpt-5.6-sol": "cx/gpt-5.6-sol",
    "gpt-5.6-terra": "cx/gpt-5.6-terra",
    "gpt-5.6-luna": "cx/gpt-5.6-luna",
    "claude-opus-4.8": "gh/claude-opus-4.8",
    "claude-fable-5": "gh/claude-fable-5",
  };

  for (const [key, value] of Object.entries(expected)) {
    if (aliases[key] === value) pass(`db alias: ${key} -> ${value}`);
    else fail(`db alias mismatch: ${key} expected ${value}, got ${aliases[key] ?? "<missing>"}`);
  }

  const clientTable = runSqlite(`
    select name from sqlite_master
    where type='table' and name='apiKeyClients';
  `);
  if (clientTable?.length === 1) pass("db table: apiKeyClients");
  else fail("db table missing: apiKeyClients");

  const apiKeyColumns = runSqlite("pragma table_info(apiKeys);");
  if (apiKeyColumns?.some((column) => column.name === "dailyLimitTokens")) pass("db column: apiKeys.dailyLimitTokens");
  else fail("db column missing: apiKeys.dailyLimitTokens");

  const invalidLimits = runSqlite(`
    select count(*) as count from apiKeys
    where dailyLimitTokens is not null
      and (typeof(dailyLimitTokens) != 'integer' or dailyLimitTokens < 0);
  `);
  if (invalidLimits?.[0]?.count === 0) pass("db API-key daily token limits are valid");
  else fail(`db invalid API-key daily token limits: ${invalidLimits?.[0]?.count ?? "query failed"}`);
}

async function checkHealth() {
  if (!opts.health.length) return;
  console.log("\nHealth checks:");
  for (const url of opts.health) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        fail(`health ${url}: HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (/ok|healthy|success|true/i.test(text)) pass(`health ${url}`);
      else warn(`health ${url}: response did not contain an obvious ok marker`);
    } catch (error) {
      fail(`health ${url}: ${error.message}`);
    }
  }
}

checkSource();
checkExternalConfig();
checkBundle();
checkDb();
await checkHealth();

console.log(`\nResult: ${failures} failure(s), ${warnings} warning(s)`);
if (failures > 0) process.exit(1);
