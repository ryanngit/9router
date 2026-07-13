#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_BUNDLE = "/home/home/.npm-global/lib/node_modules/9router/app";
const DEFAULT_DB = "/home/home/.9router/db/data.sqlite";

const opts = {
  root: process.cwd(),
  bundle: DEFAULT_BUNDLE,
  db: DEFAULT_DB,
  health: [],
  checkBundle: true,
  checkDb: true,
};

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--help" || arg === "-h") {
    console.log(`Usage: node scripts/verify-local-patches.mjs [options]

Options:
  --root PATH       Source tree to verify (default: cwd)
  --bundle PATH     Deployed bundle to scan (default: ${DEFAULT_BUNDLE})
  --db PATH         9Router sqlite DB to inspect (default: ${DEFAULT_DB})
  --health URL      Health URL to fetch; may be repeated
  --no-bundle       Skip deployed bundle scan
  --no-db           Skip sqlite DB alias checks`);
    process.exit(0);
  }
  if (arg === "--root") opts.root = process.argv[++i];
  else if (arg === "--bundle") opts.bundle = process.argv[++i];
  else if (arg === "--db") opts.db = process.argv[++i];
  else if (arg === "--health") opts.health.push(process.argv[++i]);
  else if (arg === "--no-bundle") opts.checkBundle = false;
  else if (arg === "--no-db") opts.checkDb = false;
  else die(`Unknown argument: ${arg}`);
}

opts.root = path.resolve(opts.root);
opts.bundle = opts.bundle ? path.resolve(opts.bundle) : null;
opts.db = opts.db ? path.resolve(opts.db) : null;

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
  mustContain("src/app/api/oauth/[provider]/[action]/route.js", "return { disableEnvProxy: true }", "OAuth no-pool disables env proxy");
  mustContain("src/app/api/oauth/[provider]/[action]/route.js", "Proxy pool ${proxyPoolId} is unavailable", "OAuth explicit proxy pool fail-closed");
  mustContain("src/shared/components/OAuthModal.js", "proxyPoolsReady", "OAuth waits for proxy pool list");
  mustContain("src/lib/oauth/providers.js", "isCloudflareHtmlBadRequest", "Cloudflare HTML 400 detector");
  mustContain("src/lib/oauth/providers.js", "buildRequest({ disableEnvProxy: true })", "Codex exchange direct retry");
  mustContain("open-sse/services/tokenRefresh/providers.js", "proxyOptions: { disableEnvProxy: true }", "Codex refresh env proxy bypass");

  mustContain("open-sse/executors/codex.js", "body.service_tier === \"fast\"", "Codex fast tier detection");
  mustContain("open-sse/executors/codex.js", "body.service_tier = \"priority\"", "Codex fast tier maps to priority");
  mustContain("open-sse/executors/codex.js", "CODEX_PRIORITY_ESTIMATED_INPUT_LIMIT = 256_000", "Codex priority long-context safety cutoff");
  mustContain("open-sse/executors/codex.js", "|\\s+|", "Codex priority estimator counts whitespace");
  mustContain("open-sse/executors/codex.js", "Math.ceil(asciiChars / 5)", "Codex priority estimator calibrates whole ASCII payload");
  mustContain("open-sse/executors/codex.js", "Math.floor(asciiWhitespace / 20)", "Codex priority estimator protects long whitespace");
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
  mustContain("open-sse/executors/base.js", "const transformedBody = this.transformRequest", "request transformed before URL resolution");
  mustContain("open-sse/utils/clientDetector.js", "ua.includes(\"codex_exec\")", "Codex Desktop executor detection");
  mustContain("open-sse/rtk/systemInject.js", "m?.type !== \"additional_tools\"", "Responses Lite additional_tools protection");
  mustContain("open-sse/handlers/chatCore.js", "structuredClone(body)", "account fallback deep request clone");
  mustContain("src/sse/handlers/chat.js", "structuredClone(body)", "model fallback deep request clone");

  mustContain("open-sse/executors/codex.js", "\"ChatGPT-Account-ID\"", "Codex request account header");
  mustContain("open-sse/executors/codex.js", "credentials?.providerSpecificData?.workspaceId ||", "Codex workspace binding");
  mustContain("open-sse/executors/codex.js", "credentials?.providerSpecificData?.chatgptAccountId ||", "Codex account fallback binding");
  mustContain("open-sse/services/usage/codex.js", "providerSpecificData?.workspaceId || providerSpecificData?.chatgptAccountId", "Codex usage workspace/account binding");
  mustContain("src/lib/oauth/providers.js", "chatgptAccountId: info.chatgptAccountId", "Codex OAuth stores account ID");
  mustContain("src/app/api/oauth/codex/bulk-import/route.js", "psd.chatgptAccountId = info.chatgptAccountId", "Codex bulk import backfills account ID");

  mustContain("open-sse/services/model.js", "\"claude-opus-4.8\": \"gh/claude-opus-4.8\"", "built-in Claude Opus 4.8 alias");
  mustContain("open-sse/services/model.js", "\"claude-fable-5\": \"gh/claude-fable-5\"", "built-in Claude Fable 5 alias");
  mustContain("open-sse/providers/registry/github.js", "{ id: \"claude-opus-4.8\"", "GitHub registry Claude Opus 4.8");
  mustContain("open-sse/providers/registry/github.js", "{ id: \"claude-fable-5\"", "GitHub registry Claude Fable 5");
  mustContain("open-sse/services/copilotModels.js", "api.githubcopilot.com/models", "Copilot live model catalog");
  mustContain("open-sse/services/copilotStatus.js", "free_limited_copilot", "Copilot free profile classification");
  mustContain("open-sse/services/provider.js", "supportsNativeResponses(provider, model)", "model-aware native Responses capability");
  mustContain("open-sse/services/provider.js", "if (provider !== \"github\") return true", "GitHub-specific native Responses guard");
  mustContain("open-sse/handlers/responsesHandler.js", "supportsNativeResponses(modelInfo?.provider, modelInfo?.model)", "Responses bridge uses model-aware capability");
  mustContain("open-sse/handlers/chatCore.js", "resolveTransport(provider, sourceFormat, model)", "transport resolution includes model");
  mustContain("open-sse/executors/github.js", "supportsNativeResponses(\"github\", model)", "GitHub executor shares Responses policy");

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
  mustContain("open-sse/executors/default.js", "XAI_FREEFORM_TOOL_PARAMETERS", "xAI custom tool freeform wrapper");
  mustContain("open-sse/executors/default.js", "tool.type === \"local_shell\") return null", "xAI local_shell drop");
  mustContain("open-sse/executors/default.js", "external_web_access", "xAI hosted tool field strip");
  mustContain("open-sse/executors/default.js", "reasoning.encrypted_content", "xAI encrypted reasoning strip");
  mustContain("open-sse/executors/default.js", "normalizeXaiResponsesPayload(transformed) : transformed", "xAI final payload strip");
  mustContain("open-sse/executors/default.js", "item.type === \"reasoning\") return null", "xAI reasoning input drop");
  mustContain("open-sse/executors/default.js", "custom_tool_call", "xAI custom tool history conversion");
  mustContain("open-sse/executors/default.js", "stringifyXaiToolOutput(item.output)", "xAI tool output stringification");
  mustContain("open-sse/services/usage.js", "getXaiUsage", "xAI usage handler import");
  mustContain("open-sse/services/usage.js", "xai: (c) => getXaiUsage(c.connectionId)", "xAI usage handler");
  mustContain("open-sse/services/usage/xai.js", "usageHistory", "xAI local usage aggregation");
  mustContain("src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js", "case \"xai\"", "xAI usage UI parser");

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

  contains("https://auth.openai.com/api/accounts/oauth/token", "Codex account token endpoint");
  notContains("https://auth.openai.com/oauth/token", "stale Codex token endpoint");
  contains("disableEnvProxy", "env proxy bypass support");
  contains("Selected model is at capacity. Please try a different model.", "Codex capacity message");
  contains("claude-opus-4.8", "Claude Opus 4.8");
  contains("claude-fable-5", "Claude Fable 5");
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
  contains("https://api.x.ai/v1/responses", "xAI Responses endpoint");
  contains("Freeform tool input.", "xAI custom tool freeform wrapper");
  contains("local_shell", "xAI local_shell drop");
  contains("external_web_access", "xAI hosted tool field strip");
  contains("encrypted_content", "xAI encrypted content strip");
  contains("custom_tool_call", "xAI custom tool history conversion");
  contains("function_call_output", "xAI function output normalization");
  contains("Local usage", "xAI local usage handler");
  contains("service_tier", "Codex service tier handling");
  contains("priority", "priority service tier string");
  contains("Priority disabled for long context", "Codex long-context priority removal");
  contains("NINE_ROUTER_BEST_GPT_TARGET", "best-GPT runtime target knob");
  contains("GPT-ROUTE", "best-GPT route log");
  contains("x-openai-internal-codex-responses-lite", "Codex Responses Lite header");
  contains("codex_exec", "Codex Desktop executor detection");
  contains("responses/compact", "Codex compact endpoint");
  contains("additional_tools", "Responses Lite additional_tools handling");
  contains("If-None-Match", "console conditional polling");
  contains("CLOUDFLARE_CROSS_ZONE_WORKER_IP", "short-tunnel IP validation");
  contains("apiKeyClients", "API-key client activity storage");
  contains("API Key Clients", "API-key clients usage view");
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
checkBundle();
checkDb();
await checkHealth();

console.log(`\nResult: ${failures} failure(s), ${warnings} warning(s)`);
if (failures > 0) process.exit(1);
