import { describe, expect, it, vi } from "vitest";

import { backfillClaudeProfiles } from "../../scripts/backfill-claude-profiles.mjs";

describe("Claude profile backfill", () => {
  it("uses selected proxy, replaces placeholder label, and preserves custom name", async () => {
    const proxy = { connectionProxyEnabled: true, connectionProxyUrl: "http://proxy.test:18888" };
    const resolveProxy = vi.fn().mockResolvedValue(proxy);
    const postExchange = vi.fn().mockResolvedValue({ profile: { account: {}, organization: {} } });
    const mapTokens = vi.fn().mockReturnValue({
      email: "user@example.test",
      displayName: "User",
      providerSpecificData: { accountId: "12345678-abcd", organizationId: "org-1" },
    });
    const updateConnection = vi.fn();
    const connections = [
      { id: "one", provider: "claude", authType: "oauth", name: "Account 1", accessToken: "token-1" },
      { id: "two", provider: "claude", authType: "oauth", name: "Custom", accessToken: "token-2" },
    ];

    const result = await backfillClaudeProfiles({
      connections,
      resolveProxy,
      postExchange,
      mapTokens,
      updateConnection,
      apply: true,
    });

    expect(result).toEqual({ scanned: 2, eligible: 2, updated: 2, skipped: 0, failed: 0 });
    expect(postExchange).toHaveBeenNthCalledWith(1, { access_token: "token-1" }, proxy);
    expect(updateConnection).toHaveBeenNthCalledWith(1, "one", expect.objectContaining({
      name: "user@example.test",
      email: "user@example.test",
      displayName: "User",
      providerSpecificData: { accountId: "12345678-abcd", organizationId: "org-1" },
    }));
    expect(updateConnection.mock.calls[1][1]).not.toHaveProperty("name");
  });

  it("defaults to dry-run and fails closed when selected proxy is unavailable", async () => {
    const updateConnection = vi.fn();
    const postExchange = vi.fn();
    const base = {
      connections: [{ id: "one", provider: "claude", authType: "oauth", name: "Account 1", accessToken: "token" }],
      postExchange,
      mapTokens: vi.fn(),
      updateConnection,
    };

    const dryRun = await backfillClaudeProfiles({
      ...base,
      resolveProxy: vi.fn().mockResolvedValue({}),
      postExchange: vi.fn().mockResolvedValue({ profile: {} }),
      mapTokens: vi.fn().mockReturnValue({ email: "user@example.test", providerSpecificData: {} }),
    });
    expect(dryRun.updated).toBe(1);
    expect(updateConnection).not.toHaveBeenCalled();

    const unavailable = await backfillClaudeProfiles({
      ...base,
      resolveProxy: vi.fn().mockResolvedValue({ proxyUnavailable: true }),
      apply: true,
    });
    expect(unavailable.failed).toBe(1);
    expect(postExchange).not.toHaveBeenCalled();
  });
});
