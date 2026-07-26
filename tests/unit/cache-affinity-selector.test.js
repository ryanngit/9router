import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getActiveApiKeyId: vi.fn(),
  getProviderConnections: vi.fn(),
  getProxyPools: vi.fn(),
  getSettings: vi.fn(),
  updateProviderConnection: vi.fn(),
}));

vi.mock("@/lib/localDb", () => dbMocks);
vi.mock("@/lib/network/connectionProxy", () => ({
  pickProxyPoolId: vi.fn(),
  resolveConnectionProxyConfig: vi.fn(async () => ({
    connectionProxyEnabled: false,
    connectionProxyUrl: "",
    connectionNoProxy: "",
    proxyPoolId: null,
    vercelRelayUrl: "",
  })),
}));
vi.mock("@/shared/constants/providers.js", () => ({
  FREE_PROVIDERS: {},
  resolveProviderId: (provider) => provider,
}));
vi.mock("@/sse/utils/logger.js", () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn() }));

const { getProviderCredentials } = await import("../../src/sse/services/auth.js");

function connection(id, locked = false) {
  return {
    id,
    provider: "codex",
    authType: "oauth",
    accessToken: `${id}-token`,
    name: id,
    priority: id === "account-a" ? 1 : 2,
    providerSpecificData: {},
    ...(locked ? { "modelLock_gpt-5.6-sol": new Date(Date.now() + 60_000).toISOString() } : {}),
  };
}

function claudeConnection(id, providerSpecificData, priority) {
  return {
    id,
    provider: "claude",
    authType: "oauth",
    accessToken: `${id}-token`,
    name: id,
    priority,
    providerSpecificData,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSettings.mockResolvedValue({ fallbackStrategy: "fill-first", providerStrategies: {} });
});

describe("cache affinity selector fallback", () => {
  it("ignores an excluded preferred account", async () => {
    dbMocks.getProviderConnections.mockResolvedValue([connection("account-a"), connection("account-b")]);

    const result = await getProviderCredentials(
      "codex",
      new Set(["account-a"]),
      "gpt-5.6-sol",
      { preferredConnectionId: "account-a" },
    );

    expect(result.connectionId).toBe("account-b");
  });

  it("ignores a model-locked preferred account", async () => {
    dbMocks.getProviderConnections.mockResolvedValue([
      connection("account-a", true),
      connection("account-b"),
    ]);

    const result = await getProviderCredentials(
      "codex",
      new Set(),
      "gpt-5.6-sol",
      { preferredConnectionId: "account-a" },
    );

    expect(result.connectionId).toBe("account-b");
  });
});

describe("Claude subscription model eligibility", () => {
  it("skips a known Pro-only profile for Fable 5", async () => {
    dbMocks.getProviderConnections.mockResolvedValue([
      claudeConnection("pro", { hasClaudePro: true, hasClaudeMax: false }, 1),
      claudeConnection("max", { hasClaudePro: false, hasClaudeMax: true }, 2),
    ]);

    const result = await getProviderCredentials("claude", null, "claude-fable-5");

    expect(result.connectionId).toBe("max");
  });

  it("keeps a known Pro-only profile eligible for Opus 5", async () => {
    dbMocks.getProviderConnections.mockResolvedValue([
      claudeConnection("pro", { hasClaudePro: true, hasClaudeMax: false }, 1),
      claudeConnection("max", { hasClaudePro: false, hasClaudeMax: true }, 2),
    ]);

    const result = await getProviderCredentials("claude", null, "claude-opus-5");

    expect(result.connectionId).toBe("pro");
  });

  it("keeps unclassified profiles eligible for Fable fallback discovery", async () => {
    dbMocks.getProviderConnections.mockResolvedValue([
      claudeConnection("unknown", {}, 1),
      claudeConnection("max", { hasClaudePro: false, hasClaudeMax: true }, 2),
    ]);

    const result = await getProviderCredentials("claude", null, "claude-fable-5");

    expect(result.connectionId).toBe("unknown");
  });
});
