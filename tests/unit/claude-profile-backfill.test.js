import { afterEach, describe, expect, it, vi } from "vitest";

import {
  backfillClaudeProfiles,
  parseClaudeProfileBackfillArgs,
} from "../../scripts/backfill-claude-profiles.mjs";

describe("Claude profile backfill", () => {
  afterEach(() => vi.restoreAllMocks());

  it("requires an explicit copied data directory for CLI dry-run", () => {
    expect(() => parseClaudeProfileBackfillArgs([], "/workspace"))
      .toThrow(/dry-run.*--data-dir/i);
    expect(parseClaudeProfileBackfillArgs(["--data-dir", "copied-db"], "/workspace"))
      .toEqual({ apply: false, dataDir: "/workspace/copied-db" });
    expect(parseClaudeProfileBackfillArgs(["--apply"], "/workspace"))
      .toEqual({ apply: true, dataDir: null });
  });

  it("rejects process-scoped apply before any backfill work", async () => {
    const resolveProxy = vi.fn();
    const postExchange = vi.fn();
    const updateConnection = vi.fn();

    await expect(backfillClaudeProfiles({
      connections: [{ id: "one", provider: "claude", authType: "oauth", name: "Account 1", accessToken: "token" }],
      resolveProxy,
      postExchange,
      mapTokens: vi.fn(),
      updateConnection,
      adapter: { transactionScope: "process" },
      apply: true,
    })).rejects.toThrow(/process-safe|native|sql\.js/i);

    expect(resolveProxy).not.toHaveBeenCalled();
    expect(postExchange).not.toHaveBeenCalled();
    expect(updateConnection).not.toHaveBeenCalled();
  });

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

    expect(result).toEqual({
      scanned: 2,
      eligible: 2,
      updated: 2,
      skipped: 0,
      failed: 0,
      failureReasons: {},
    });
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
    expect(unavailable.failureReasons).toEqual({ proxy_unavailable: 1 });
    expect(postExchange).not.toHaveBeenCalled();

    const unauthorized = await backfillClaudeProfiles({
      ...base,
      resolveProxy: vi.fn().mockResolvedValue({}),
      postExchange: vi.fn().mockResolvedValue({ profile: null, profileStatus: 401 }),
      apply: true,
    });
    expect(unauthorized.failureReasons).toEqual({ profile_http_401: 1 });
  });

  it("refreshes a 401 only in apply mode and persists rotated credentials before retry", async () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-07-26T12:00:00Z"));
    const proxy = { source: "pool", strictProxy: true, connectionProxyUrl: "http://proxy.test:18888" };
    const profile = { account: {}, organization: {} };
    const order = [];
    const postExchange = vi.fn()
      .mockImplementationOnce(async () => { order.push("profile-old"); return { profile: null, profileStatus: 401 }; })
      .mockImplementationOnce(async () => { order.push("profile-new"); return { profile }; });
    const refreshCredentials = vi.fn(async () => {
      order.push("refresh");
      return {
        accessToken: "rotated-access",
        refreshToken: "rotated-refresh",
        expiresIn: 3600,
      };
    });
    const updateConnection = vi.fn(async (_id, update) => {
      order.push(update.accessToken ? "credentials" : "identity");
    });

    const result = await backfillClaudeProfiles({
      connections: [{
        id: "one",
        provider: "claude",
        authType: "oauth",
        name: "Account 1",
        accessToken: "expired-access",
        refreshToken: "old-refresh",
      }],
      resolveProxy: vi.fn().mockResolvedValue(proxy),
      postExchange,
      refreshCredentials,
      mapTokens: vi.fn().mockReturnValue({
        email: "user@example.test",
        providerSpecificData: { accountId: "account-1" },
      }),
      updateConnection,
      adapter: { transactionScope: "database" },
      apply: true,
    });

    expect(result.updated).toBe(1);
    expect(order).toEqual(["profile-old", "refresh", "credentials", "profile-new", "identity"]);
    expect(refreshCredentials).toHaveBeenCalledWith("old-refresh", null, proxy);
    expect(postExchange).toHaveBeenNthCalledWith(1, { access_token: "expired-access" }, proxy);
    expect(postExchange).toHaveBeenNthCalledWith(2, { access_token: "rotated-access" }, proxy);
    expect(updateConnection).toHaveBeenNthCalledWith(1, "one", {
      accessToken: "rotated-access",
      refreshToken: "rotated-refresh",
      expiresIn: 3600,
      expiresAt: "2026-07-26T13:00:00.000Z",
    });
  });

  it("does not refresh a 401 during dry-run", async () => {
    const refreshCredentials = vi.fn();
    const updateConnection = vi.fn();
    const result = await backfillClaudeProfiles({
      connections: [{
        id: "one",
        provider: "claude",
        authType: "oauth",
        name: "Account 1",
        accessToken: "expired-access",
        refreshToken: "refresh-token",
      }],
      resolveProxy: vi.fn().mockResolvedValue({ source: "pool" }),
      postExchange: vi.fn().mockResolvedValue({ profile: null, profileStatus: 401 }),
      refreshCredentials,
      mapTokens: vi.fn(),
      updateConnection,
    });

    expect(result.failureReasons).toEqual({ profile_http_401: 1 });
    expect(refreshCredentials).not.toHaveBeenCalled();
    expect(updateConnection).not.toHaveBeenCalled();
  });

  it("classifies refresh failure without retrying or updating", async () => {
    const postExchange = vi.fn().mockResolvedValue({ profile: null, profileStatus: 401 });
    const refreshCredentials = vi.fn().mockResolvedValue(null);
    const updateConnection = vi.fn();
    const result = await backfillClaudeProfiles({
      connections: [{
        id: "one",
        provider: "claude",
        authType: "oauth",
        name: "Account 1",
        accessToken: "expired-access",
        refreshToken: "refresh-token",
      }],
      resolveProxy: vi.fn().mockResolvedValue({ source: "pool" }),
      postExchange,
      refreshCredentials,
      mapTokens: vi.fn(),
      updateConnection,
      adapter: { transactionScope: "database" },
      apply: true,
    });

    expect(result.failureReasons).toEqual({ profile_refresh_failed: 1 });
    expect(postExchange).toHaveBeenCalledTimes(1);
    expect(updateConnection).not.toHaveBeenCalled();
  });

  it("keeps rotated credentials when the single profile retry fails", async () => {
    const postExchange = vi.fn()
      .mockResolvedValueOnce({ profile: null, profileStatus: 401 })
      .mockResolvedValueOnce({ profile: null, profileStatus: 503 });
    const updateConnection = vi.fn();
    const result = await backfillClaudeProfiles({
      connections: [{
        id: "one",
        provider: "claude",
        authType: "oauth",
        name: "Account 1",
        accessToken: "expired-access",
        refreshToken: "old-refresh",
      }],
      resolveProxy: vi.fn().mockResolvedValue({ source: "pool" }),
      postExchange,
      refreshCredentials: vi.fn().mockResolvedValue({
        accessToken: "rotated-access",
        refreshToken: "rotated-refresh",
        expiresIn: 3600,
      }),
      mapTokens: vi.fn(),
      updateConnection,
      adapter: { transactionScope: "database" },
      apply: true,
    });

    expect(result.failureReasons).toEqual({ profile_retry_http_503: 1 });
    expect(postExchange).toHaveBeenCalledTimes(2);
    expect(updateConnection).toHaveBeenCalledTimes(1);
    expect(updateConnection.mock.calls[0][1]).toMatchObject({
      accessToken: "rotated-access",
      refreshToken: "rotated-refresh",
    });
  });

  it("does not print refresh failures or credential values", async () => {
    const secret = "refresh-secret-value";
    const output = [];
    vi.spyOn(console, "log").mockImplementation((...args) => output.push(...args));
    vi.spyOn(console, "warn").mockImplementation((...args) => output.push(...args));
    vi.spyOn(console, "error").mockImplementation((...args) => output.push(...args));

    const result = await backfillClaudeProfiles({
      connections: [{
        id: "one",
        provider: "claude",
        authType: "oauth",
        name: "Account 1",
        accessToken: "access-secret-value",
        refreshToken: secret,
      }],
      resolveProxy: vi.fn().mockResolvedValue({ source: "pool" }),
      postExchange: vi.fn().mockResolvedValue({ profile: null, profileStatus: 401 }),
      refreshCredentials: vi.fn().mockRejectedValue(new Error(secret)),
      mapTokens: vi.fn(),
      updateConnection: vi.fn(),
      adapter: { transactionScope: "database" },
      apply: true,
    });

    expect(result.failureReasons).toEqual({ profile_refresh_failed: 1 });
    expect(output.map(String).join(" ")).not.toContain(secret);
    expect(output.map(String).join(" ")).not.toContain("access-secret-value");
  });
});
