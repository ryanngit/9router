import { BaseExecutor } from "./base.js";
import { PROVIDERS, PROVIDER_OAUTH } from "../config/providers.js";
import { ANTHROPIC_API_VERSION, OPENAI_COMPAT_BASE, ANTHROPIC_COMPAT_BASE } from "../providers/shared.js";
import { OAUTH_ENDPOINTS, buildKimiHeaders } from "../config/appConstants.js";
import { buildClineHeaders } from "../shared/clineAuth.js";
import { getCachedClaudeHeaders } from "../utils/claudeHeaderCache.js";
import { proxyAwareFetch } from "../utils/proxyFetch.js";
import { injectReasoningContent } from "../utils/reasoningContentInjector.js";
import { stripUnsupportedParams } from "../translator/concerns/paramSupport.js";

// Auth header descriptors — derived from registry transport.auth, fallback to hardcoded defaults.
const BEARER = { combined: true, header: "Authorization", scheme: "bearer" };
const XAPIKEY = { combined: true, header: "x-api-key", scheme: "raw" };
const AUTH_DESCRIPTORS = Object.fromEntries(
  Object.entries(PROVIDERS)
    .filter(([, t]) => t.auth)
    .map(([id, t]) => [id, t.auth])
);

// Apply a token to a header per scheme (matches legacy: combined always sets, even when undefined).
function setAuth(headers, spec, token) {
  headers[spec.header] = spec.scheme === "bearer" ? `Bearer ${token}` : token;
}

// Resolve auth onto headers from a descriptor.
function applyAuth(headers, desc, credentials) {
  if (desc.combined) {
    // combined providers always set the header (legacy behavior, incl. noAuth → "Bearer undefined")
    setAuth(headers, desc, credentials.apiKey || credentials.accessToken);
    if (desc.anthropicVersion && !headers["anthropic-version"]) headers["anthropic-version"] = ANTHROPIC_API_VERSION;
    return;
  }
  // split apiKey/oauth: set only the matching branch (legacy: anthropic-compatible skips when both absent)
  if (credentials.apiKey) setAuth(headers, desc.apiKey, credentials.apiKey);
  else if (credentials.accessToken) setAuth(headers, desc.oauth, credentials.accessToken);
  if (desc.anthropicVersion && !headers["anthropic-version"]) headers["anthropic-version"] = ANTHROPIC_API_VERSION;
}

// Provider-specific header quirks kept as small hooks (not pure auth).
const HEADER_HOOKS = {
  // Stable device_id from OAuth connection (CLIProxyAPI KimiTokenStorage.DeviceID)
  kimiHeaders: (h, c) => Object.assign(h, buildKimiHeaders(c?.providerSpecificData?.deviceId)),
  clineHeaders: (h, c) => Object.assign(h, buildClineHeaders(c.apiKey || c.accessToken)),
  kilocodeOrg: (h, c) => { if (c.providerSpecificData?.orgId) h["X-Kilocode-OrganizationID"] = c.providerSpecificData.orgId; },
  claudeOverlay: (h) => {
    const cached = getCachedClaudeHeaders();
    if (!cached) return;
    for (const lcKey of Object.keys(cached)) {
      const titleKey = lcKey.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
      if (lcKey === "anthropic-beta") {
        const staticBetaStr = h[titleKey] || h[lcKey] || "";
        const flags = new Set(staticBetaStr.split(",").map(f => f.trim()).filter(Boolean));
        for (const f of cached[lcKey].split(",").map(f => f.trim()).filter(Boolean)) flags.add(f);
        cached[lcKey] = Array.from(flags).join(",");
      }
      if (titleKey !== lcKey && h[titleKey] !== undefined) delete h[titleKey];
    }
    Object.assign(h, cached);
  },
};

// Config-driven OAuth refresh grants — derived from registry oauth.refresh.
const REFRESH_GRANTS = Object.fromEntries(
  Object.entries(PROVIDER_OAUTH)
    .filter(([, o]) => o.refresh)
    .map(([id, o]) => {
      const tokenUrl = o.tokenUrl;
      const encoding = o.refresh.encoding;
      const extraParams = o.refresh.scope ? { scope: o.refresh.scope } : {};
      return [id, {
        encoding,
        url: () => tokenUrl,
        params: (ex) => id === "gemini"
          ? { client_id: ex.config.clientId, client_secret: ex.config.clientSecret, ...extraParams }
          : { client_id: o.clientId, ...extraParams },
      }];
    })
);

const XAI_RESPONSES_TOOL_TYPES = new Set([
  "function",
  "web_search",
  "x_search",
  "collections_search",
  "file_search",
  "code_execution",
  "code_interpreter",
  "mcp",
  "shell",
]);
const XAI_RESPONSES_TOOL_CHOICE_STRINGS = new Set(["auto", "none", "required"]);

const XAI_FREEFORM_TOOL_PARAMETERS = {
  type: "object",
  properties: {
    input: { type: "string", description: "Freeform tool input." },
  },
  required: ["input"],
};

function getToolName(tool) {
  const name = tool?.name || tool?.function?.name;
  return typeof name === "string" && name.trim() ? name.trim() : null;
}

function normalizeFunctionParameters(parameters) {
  if (!parameters) return { type: "object", properties: {} };
  if (parameters.type === "object" && !parameters.properties) return { ...parameters, properties: {} };
  return parameters;
}

function toXaiFunctionTool(tool, parameters = null) {
  const name = getToolName(tool);
  if (!name) return null;
  return {
    type: "function",
    name,
    description: String(tool.description || tool.function?.description || ""),
    parameters: normalizeFunctionParameters(parameters || tool.parameters || tool.function?.parameters),
  };
}

function normalizeXaiHostedTool(tool) {
  if (tool.external_web_access === undefined) return tool;
  const { external_web_access, ...next } = tool;
  return next;
}

function normalizeXaiResponsesTool(tool) {
  if (!tool || typeof tool !== "object") return null;
  if (tool.type === "local_shell") return null;
  // ponytail: xAI rejects Responses custom tools; wrap as freeform function until xAI supports custom_tool_call.
  if (tool.type === "custom") return toXaiFunctionTool(tool, XAI_FREEFORM_TOOL_PARAMETERS);
  if (!XAI_RESPONSES_TOOL_TYPES.has(tool.type)) return toXaiFunctionTool(tool);
  if (tool.type === "function") return toXaiFunctionTool(tool);
  return normalizeXaiHostedTool(tool);
}

function normalizeXaiResponsesToolChoice(choice, tools) {
  if (typeof choice === "string") return XAI_RESPONSES_TOOL_CHOICE_STRINGS.has(choice) ? choice : undefined;
  if (!choice || typeof choice !== "object" || Array.isArray(choice)) return undefined;
  const type = typeof choice.type === "string" ? choice.type : "";
  if (type === "function" || type === "custom") {
    const name = getToolName(choice);
    const valid = name && tools.some((tool) => tool.type === "function" && tool.name === name);
    if (!valid) return undefined;
    return type === "function" && choice.name === name ? choice : { type: "function", name };
  }
  return tools.some((tool) => tool.type === type) ? choice : undefined;
}

export function normalizeXaiResponsesTools(body) {
  if (!Array.isArray(body?.tools)) {
    if (body?.tool_choice === undefined) return body;
    const next = { ...body };
    delete next.tool_choice;
    return next;
  }

  let changed = false;
  const tools = [];
  for (const tool of body.tools) {
    const normalized = normalizeXaiResponsesTool(tool);
    if (!normalized) {
      changed = true;
      continue;
    }
    if (normalized !== tool) changed = true;
    tools.push(normalized);
  }

  const toolChoice = normalizeXaiResponsesToolChoice(body.tool_choice, tools);
  const choiceChanged = toolChoice !== body.tool_choice;
  if (!changed && !choiceChanged && tools.length > 0) return body;
  const next = { ...body };
  if (tools.length > 0) {
    next.tools = tools;
    if (toolChoice === undefined) delete next.tool_choice;
    else next.tool_choice = toolChoice;
  }
  else {
    delete next.tools;
    delete next.tool_choice;
  }
  return next;
}

function stripEncryptedContent(value) {
  if (!value || typeof value !== "object" || !("encrypted_content" in value)) return value;
  const next = { ...value };
  delete next.encrypted_content;
  return next;
}

function stripEncryptedHistoryMetadata(item) {
  const next = stripEncryptedContent(item);
  if (!Array.isArray(item?.content)) return next;
  const content = item.content.map(stripEncryptedContent);
  return content.some((part, index) => part !== item.content[index]) ? { ...next, content } : next;
}

function stringifyXaiToolOutput(output) {
  if (typeof output === "string") return output;
  if (output == null) return "";
  if (Array.isArray(output)) {
    return output.map((item) => {
      if (typeof item === "string") return item;
      if (typeof item?.text === "string") return item.text;
      if (typeof item?.content === "string") return item.content;
      return JSON.stringify(item);
    }).join("");
  }
  return JSON.stringify(output);
}

function normalizeXaiResponsesInputItem(item) {
  if (!item || typeof item !== "object") return item;
  if (item.type === "reasoning") return null;
  const normalizedItem = stripEncryptedHistoryMetadata(item);

  if (item.type === "function_call_output") {
    return { ...normalizedItem, output: stringifyXaiToolOutput(item.output) };
  }

  if (item.type === "custom_tool_call") {
    const callId = item.call_id || item.id;
    const name = getToolName(item);
    if (!callId || !name) return null;
    return {
      type: "function_call",
      call_id: callId,
      name,
      arguments: JSON.stringify({ input: stringifyXaiToolOutput(item.input ?? item.arguments) }),
    };
  }

  if (item.type === "custom_tool_call_output") {
    const callId = item.call_id || item.id;
    if (!callId) return null;
    return {
      type: "function_call_output",
      call_id: callId,
      output: stringifyXaiToolOutput(item.output),
    };
  }

  return normalizedItem;
}

export function normalizeXaiResponsesPayload(body) {
  let transformed = body;

  if (Array.isArray(transformed?.include) && transformed.include.includes("reasoning.encrypted_content")) {
    transformed = {
      ...transformed,
      include: transformed.include.filter((item) => item !== "reasoning.encrypted_content"),
    };
    if (transformed.include.length === 0) delete transformed.include;
  }

  if (Array.isArray(transformed?.input)) {
    const input = [];
    let changed = false;
    for (const item of transformed.input) {
      const normalized = normalizeXaiResponsesInputItem(item);
      if (!normalized) {
        changed = true;
        continue;
      }
      if (normalized !== item) changed = true;
      input.push(normalized);
    }
    if (changed) transformed = { ...transformed, input };
  }

  return transformed;
}

export class DefaultExecutor extends BaseExecutor {
  constructor(provider) {
    super(provider, PROVIDERS[provider] || PROVIDERS.openai);
  }

  transformRequest(model, body, stream, credentials) {
    let transformed = this.applyJsonSchemaFallback(body);

    if (this.provider === "xai" && credentials?.runtimeTransport?.format === "openai-responses") {
      transformed = normalizeXaiResponsesTools(transformed);
      transformed = normalizeXaiResponsesPayload(transformed);
    }

    if (transformed && typeof transformed === "object") {
      // quirk: some openai-compatible providers reject Anthropic's client_metadata field
      if (this.config.quirks?.dropClientMetadata) {
        delete transformed.client_metadata;
      }
      stripUnsupportedParams(this.provider, model, transformed);
    }

    transformed = injectReasoningContent({ provider: this.provider, model, body: transformed });
    return this.provider === "xai" && credentials?.runtimeTransport?.format === "openai-responses"
      ? normalizeXaiResponsesPayload(transformed)
      : transformed;
  }

  // Fallback json_schema → json_object for openai-compatible providers without native Structured Output.
  applyJsonSchemaFallback(body) {
    if (!this.provider?.startsWith?.("openai-compatible-")) return body;
    const rf = body?.response_format;
    if (rf?.type !== "json_schema" || !rf.json_schema?.schema) return body;

    const schemaJson = JSON.stringify(rf.json_schema.schema, null, 2);
    const prompt = `You must respond with valid JSON that strictly follows this JSON schema:\n\`\`\`json\n${schemaJson}\n\`\`\`\nRespond ONLY with the JSON object, no other text.`;

    const messages = Array.isArray(body.messages) ? body.messages.map(m => ({ ...m })) : [];
    const sys = messages.find(m => m.role === "system");
    if (sys) {
      if (typeof sys.content === "string") sys.content = `${sys.content}\n\n${prompt}`;
      else if (Array.isArray(sys.content)) sys.content.push({ type: "text", text: `\n\n${prompt}` });
    } else {
      messages.unshift({ role: "system", content: prompt });
    }
    return { ...body, messages, response_format: { type: "json_object" } };
  }

  buildUrl(model, stream, urlIndex = 0, credentials = null) {
    // Runtime transport (multi-endpoint providers): use the sourceFormat-matched endpoint
    const rt = credentials?.runtimeTransport;
    if (rt?.baseUrl) {
      return rt.urlSuffix ? `${rt.baseUrl}${rt.urlSuffix}` : rt.baseUrl;
    }
    if (this.provider?.startsWith?.("openai-compatible-")) {
      const baseUrl = credentials?.providerSpecificData?.baseUrl || OPENAI_COMPAT_BASE;
      const normalized = baseUrl.replace(/\/$/, "");
      const path = this.provider.includes("responses") ? "/responses" : "/chat/completions";
      return `${normalized}${path}`;
    }
    if (this.provider?.startsWith?.("anthropic-compatible-")) {
      const baseUrl = credentials?.providerSpecificData?.baseUrl || ANTHROPIC_COMPAT_BASE;
      const normalized = baseUrl.replace(/\/$/, "");
      return `${normalized}/messages`;
    }
    // gemini-format: build :streamGenerateContent / :generateContent path
    if (this.config.format === "gemini") {
      return `${this.config.baseUrl}/${model}:${stream ? "streamGenerateContent?alt=sse" : "generateContent"}`;
    }
    // urlSuffix (e.g. ?beta=true) declared per-provider in registry
    if (this.config.urlSuffix) {
      return `${this.config.baseUrl}${this.config.urlSuffix}`;
    }
    const url = this.config.baseUrl;
    if (url?.includes("{accountId}")) {
      const accountId = credentials?.providerSpecificData?.accountId;
      if (!accountId) throw new Error(`${this.provider} requires accountId in providerSpecificData`);
      return url.replace("{accountId}", accountId);
    }
    return url;
  }

  // Fallback descriptor for providers without an explicit entry in AUTH_DESCRIPTORS.
  resolveAuthDescriptor() {
    if (this.provider?.startsWith?.("anthropic-compatible-")) {
      return { apiKey: { header: "x-api-key", scheme: "raw" }, oauth: { header: "Authorization", scheme: "bearer" }, anthropicVersion: true };
    }
    if (this.config?.format === "claude") {
      return { ...XAPIKEY, anthropicVersion: true };
    }
    return BEARER;
  }

  buildHeaders(credentials, stream = true) {
    const rt = credentials?.runtimeTransport;
    const headers = { "Content-Type": "application/json", ...(rt ? rt.headers : this.config.headers) };
    const desc = rt?.auth || AUTH_DESCRIPTORS[this.provider] || this.resolveAuthDescriptor();
    // Hooks run BEFORE auth so dynamic overlays (claude cached headers) can't clobber the token.
    for (const hook of desc.hooks || []) HEADER_HOOKS[hook]?.(headers, credentials);
    applyAuth(headers, desc, credentials);

    // Strip first-party Claude Code identity headers for non-Anthropic anthropic-compatible upstreams
    if (this.provider?.startsWith?.("anthropic-compatible-")) {
      const baseUrl = credentials?.providerSpecificData?.baseUrl || "";
      const isOfficialAnthropic = baseUrl === "" || baseUrl.includes("api.anthropic.com");
      if (!isOfficialAnthropic) {
        // Some third-party Anthropic-compatible gateways require Bearer auth in
        // addition to x-api-key. Send both (x-api-key already set above) so
        // gateways that read either header succeed.
        if (credentials.apiKey && !headers["Authorization"]) {
          headers["Authorization"] = `Bearer ${credentials.apiKey}`;
        }
        delete headers["anthropic-dangerous-direct-browser-access"];
        delete headers["Anthropic-Dangerous-Direct-Browser-Access"];
        delete headers["x-app"];
        delete headers["X-App"];
        // Strip claude-code-20250219 from Anthropic-Beta / anthropic-beta
        for (const betaKey of ["anthropic-beta", "Anthropic-Beta"]) {
          if (headers[betaKey]) {
            const filtered = headers[betaKey]
              .split(",")
              .map(s => s.trim())
              .filter(f => f && f !== "claude-code-20250219")
              .join(",");
            if (filtered) {
              headers[betaKey] = filtered;
            } else {
              delete headers[betaKey];
            }
          }
        }
      }
    }

    if (stream) headers["Accept"] = "text/event-stream";
    return headers;
  }

  // Generic OAuth refresh for the common {grant_type, refresh_token, client_id[, ...]} shape.
  // grant = REFRESH_GRANTS[provider]; client creds resolved from PROVIDERS or this.config.
  refreshFromGrant(credentials, proxyOptions) {
    const grant = REFRESH_GRANTS[this.provider];
    const params = { grant_type: "refresh_token", refresh_token: credentials.refreshToken, ...grant.params(this) };
    return grant.encoding === "json"
      ? this.refreshWithJSON(grant.url(), params, proxyOptions)
      : this.refreshWithForm(grant.url(), params, proxyOptions);
  }

  async refreshCredentials(credentials, log, proxyOptions = null) {
    if (!credentials.refreshToken) return null;

    const refreshers = {
      claude: () => this.refreshFromGrant(credentials, proxyOptions),
      codex: () => this.refreshFromGrant(credentials, proxyOptions),
      qwen: () => this.refreshWithForm(OAUTH_ENDPOINTS.qwen.token, { grant_type: "refresh_token", refresh_token: credentials.refreshToken, client_id: PROVIDERS.qwen.clientId }, proxyOptions),
      iflow: () => this.refreshIflow(credentials.refreshToken, proxyOptions),
      gemini: () => this.refreshFromGrant(credentials, proxyOptions),
      kiro: () => this.refreshKiro(credentials.refreshToken, proxyOptions),
      cline: () => this.refreshCline(credentials.refreshToken, proxyOptions),
      clinepass: () => this.refreshCline(credentials.refreshToken, proxyOptions),
      kimi: () => this.refreshKimi(credentials, proxyOptions),
      "kimi-coding": () => this.refreshKimi(credentials, proxyOptions),
      kilocode: () => this.refreshKilocode(credentials.refreshToken, proxyOptions)
    };

    const refresher = refreshers[this.provider];
    if (!refresher) return null;

    try {
      const result = await refresher();
      if (result) log?.info?.("TOKEN", `${this.provider} refreshed`);
      return result;
    } catch (error) {
      log?.error?.("TOKEN", `${this.provider} refresh error: ${error.message}`);
      return null;
    }
  }

  async refreshWithJSON(url, body, proxyOptions = null) {
    const response = await proxyAwareFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    }, proxyOptions);
    if (!response.ok) return null;
    const tokens = await response.json();
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || body.refresh_token, expiresIn: tokens.expires_in };
  }

  async refreshWithForm(url, params, proxyOptions = null) {
    const response = await proxyAwareFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams(params)
    }, proxyOptions);
    if (!response.ok) return null;
    const tokens = await response.json();
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || params.refresh_token, expiresIn: tokens.expires_in };
  }

  async refreshIflow(refreshToken, proxyOptions = null) {
    const basicAuth = btoa(`${PROVIDERS.iflow.clientId}:${PROVIDERS.iflow.clientSecret}`);
    const response = await proxyAwareFetch(OAUTH_ENDPOINTS.iflow.token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "Authorization": `Basic ${basicAuth}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: PROVIDERS.iflow.clientId, client_secret: PROVIDERS.iflow.clientSecret })
    }, proxyOptions);
    if (!response.ok) return null;
    const tokens = await response.json();
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || refreshToken, expiresIn: tokens.expires_in };
  }

  async refreshKiro(refreshToken, proxyOptions = null) {
    const response = await proxyAwareFetch(PROVIDERS.kiro.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": "kiro-cli/1.0.0" },
      body: JSON.stringify({ refreshToken })
    }, proxyOptions);
    if (!response.ok) return null;
    const tokens = await response.json();
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken || refreshToken, expiresIn: tokens.expiresIn };
  }

  async refreshCline(refreshToken, proxyOptions = null) {
    const response = await proxyAwareFetch(PROVIDERS.cline.refreshUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ refreshToken, grantType: "refresh_token", clientType: "extension" })
    }, proxyOptions);
    if (!response.ok) return null;
    const payload = await response.json();
    const data = payload?.data || payload;
    const expiresAtIso = data?.expiresAt;
    const expiresIn = expiresAtIso ? Math.max(1, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000)) : undefined;
    let accessToken = data?.accessToken;
    if (accessToken && !accessToken.startsWith("workos:")) {
      accessToken = `workos:${accessToken}`;
    }
    return { accessToken, refreshToken: data?.refreshToken || refreshToken, expiresIn };
  }

  // CLIProxyAPI DeviceFlowClient.RefreshToken — form body + X-Msh-* headers + stable device_id
  async refreshKimi(credentials, proxyOptions = null) {
    const refreshToken = credentials.refreshToken;
    const cfg = PROVIDERS.kimi || PROVIDERS["kimi-coding"];
    if (!cfg?.refreshUrl || !cfg?.clientId) return null;
    const kimiHeaders = buildKimiHeaders(credentials?.providerSpecificData?.deviceId);
    const response = await proxyAwareFetch(cfg.refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        ...kimiHeaders
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: cfg.clientId })
    }, proxyOptions);
    if (!response.ok) return null;
    const tokens = await response.json();
    return { accessToken: tokens.access_token, refreshToken: tokens.refresh_token || refreshToken, expiresIn: tokens.expires_in };
  }

  async refreshKilocode(refreshToken, proxyOptions = null) {
    // Kilocode uses device code flow, no refresh token support
    return null;
  }
}

export default DefaultExecutor;
