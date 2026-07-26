import { CLAUDE_CLI_SPOOF_HEADERS } from "../shared.js";

export default {
  id: "claude",
  priority: 10,
  alias: "cc",
  uiAlias: "cc",
  display: {
    name: "Claude Code",
    icon: "smart_toy",
    color: "#D97757",
    website: "https://claude.ai",
    notice: {
      signupUrl: "https://claude.ai",
    },
    deprecated: true,
    deprecationNotice: "RISK_NOTICE",
  },
  category: "oauth",
  transport: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    format: "claude",
    urlSuffix: "?beta=true",
    headers: CLAUDE_CLI_SPOOF_HEADERS,
    quirks: {
      cloakToolsOnOAuth: true,
    },
    auth: {
      apiKey: {
        header: "x-api-key",
        scheme: "raw",
      },
      oauth: {
        header: "Authorization",
        scheme: "bearer",
      },
      hooks: [
        "claudeOverlay",
      ],
    },
    usage: {
      oauthUrl: "https://api.anthropic.com/api/oauth/usage",
      orgUrl: "https://api.anthropic.com/v1/organizations/{org_id}/usage",
      settingsUrl: "https://api.anthropic.com/v1/settings",
    },
  },
  models: [
    { id: "claude-fable-5", name: "Claude Fable 5" },
    { id: "claude-opus-5", name: "Claude Opus 5", description: "1M context included for Max, Team, and Enterprise subscriptions" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8", description: "1M context included for Max, Team, and Enterprise subscriptions" },
    { id: "claude-opus-4-7", name: "Claude Opus 4.7", description: "1M context included for Max, Team, and Enterprise subscriptions" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6", description: "200K default context in 9Router; optional upstream 1M requires explicit beta/mode and eligible Max, Team, or Enterprise entitlement" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", description: "200K default context in 9Router; optional upstream 1M requires explicit beta/mode and may require usage credits" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
  ],
  oauth: {
    clientId: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
    authorizeUrl: "https://claude.com/cai/oauth/authorize",
    tokenUrl: "https://platform.claude.com/v1/oauth/token",
    scopes: [
      "org:create_api_key",
      "user:profile",
      "user:inference",
      "user:sessions:claude_code",
      "user:mcp_servers",
      "user:file_upload",
    ],
    codeChallengeMethod: "S256",
    refreshLeadMs: 14400000,
    refresh: {
      encoding: "json",
    },
  },
  features: {
    usage: true,
  },
};
