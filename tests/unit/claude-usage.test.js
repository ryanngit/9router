import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch: vi.fn(),
}));

import { proxyAwareFetch } from "../../open-sse/utils/proxyFetch.js";
import { getClaudeUsage } from "../../open-sse/services/usage/claude.js";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const inactiveUsage = {
  five_hour: { utilization: 0, resets_at: null },
  seven_day: null,
  limits: [
    {
      kind: "session",
      group: "session",
      percent: 0,
      resets_at: null,
      is_active: true,
    },
    {
      kind: "weekly_scoped",
      group: "weekly",
      percent: 12,
      resets_at: "2026-08-01T00:00:00Z",
      is_active: true,
      scope: { model: { display_name: "Fable" } },
    },
  ],
};

describe("Claude OAuth usage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    proxyAwareFetch.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps inactive session and scoped weekly limits", async () => {
    const timeoutSignal = new AbortController().signal;
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutSignal);
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse(inactiveUsage));

    const result = await getClaudeUsage("shape-token", { connectionProxyEnabled: true });

    expect(result.quotas["session (5h)"]).toMatchObject({
      used: 0,
      total: 100,
      remaining: 100,
      remainingPercentage: 100,
      resetAt: null,
    });
    expect(result.quotas["weekly Fable (7d)"]).toMatchObject({
      used: 12,
      total: 100,
      remaining: 88,
      remainingPercentage: 88,
      resetAt: "2026-08-01T00:00:00.000Z",
    });
    expect(Object.keys(result.quotas)).toEqual([
      "session (5h)",
      "weekly Fable (7d)",
    ]);

    const [, options, proxyOptions] = proxyAwareFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer shape-token");
    expect(options.headers["anthropic-beta"]).toBe("oauth-2025-04-20");
    expect(options.headers["Content-Type"]).toBe("application/json");
    expect(options.headers["User-Agent"]).toContain("2.1.220");
    expect(options.signal).toBe(timeoutSignal);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(5_000);
    expect(proxyOptions).toEqual({ connectionProxyEnabled: true });
  });

  it("merges compatibility rate_limits without duplicate quota names", async () => {
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({
      five_hour: { utilization: 4, resets_at: null },
      seven_day_opus: { utilization: 9, resets_at: null },
      rate_limits: [
        { kind: "session", group: "session", percent: 4, resets_at: null },
        {
          kind: "weekly_scoped",
          group: "weekly",
          percent: 9,
          resets_at: null,
          scope: { model: { display_name: "opus" } },
        },
      ],
    }));

    const result = await getClaudeUsage("dedupe-token");

    expect(Object.keys(result.quotas)).toEqual([
      "session (5h)",
      "weekly opus (7d)",
    ]);
  });

  it("coalesces concurrent reads for one credential", async () => {
    let resolveFetch;
    proxyAwareFetch.mockReturnValueOnce(new Promise((resolve) => { resolveFetch = resolve; }));

    const first = getClaudeUsage("coalesce-token");
    const second = getClaudeUsage("coalesce-token");
    resolveFetch(jsonResponse(inactiveUsage));

    const [a, b] = await Promise.all([first, second]);
    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it("starts success TTL when upstream response completes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T00:00:00Z"));
    let resolveFetch;
    proxyAwareFetch.mockReturnValueOnce(new Promise((resolve) => { resolveFetch = resolve; }));

    const pending = getClaudeUsage("slow-success-token");
    vi.advanceTimersByTime(60_000);
    resolveFetch(jsonResponse(inactiveUsage));
    await pending;
    vi.advanceTimersByTime(10_000);
    await getClaudeUsage("slow-success-token");

    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
  });

  it("bounds in-flight credential entries", async () => {
    const resolvers = [];
    proxyAwareFetch.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));

    const requests = Array.from(
      { length: 129 },
      (_, index) => getClaudeUsage(`bounded-token-${index}`),
    );
    const coalescedWithReplacement = getClaudeUsage("bounded-token-0");
    expect(proxyAwareFetch).toHaveBeenCalledTimes(128);
    await expect(requests[128]).resolves.toMatchObject({ message: expect.stringMatching(/busy|retry/i) });
    for (const resolve of resolvers) resolve(jsonResponse(inactiveUsage));
    await Promise.all([...requests, coalescedWithReplacement]);
  });

  it("returns stale success and honors Retry-After without legacy fallback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T00:00:00Z"));
    proxyAwareFetch
      .mockResolvedValueOnce(jsonResponse(inactiveUsage))
      .mockResolvedValueOnce(jsonResponse(
        { error: "rate limited" },
        429,
        { "Retry-After": "600" },
      ));

    const fresh = await getClaudeUsage("rate-token");
    vi.advanceTimersByTime(66_000);
    const stale = await getClaudeUsage("rate-token");
    vi.advanceTimersByTime(60_000);
    const cooled = await getClaudeUsage("rate-token");

    expect(stale).toEqual(fresh);
    expect(cooled).toEqual(fresh);
    expect(proxyAwareFetch).toHaveBeenCalledTimes(2);
    expect(proxyAwareFetch.mock.calls.map(([url]) => url)).toEqual([
      "https://api.anthropic.com/api/oauth/usage",
      "https://api.anthropic.com/api/oauth/usage",
    ]);
  });

  it("surfaces 401 for route-level refresh without legacy fallback", async () => {
    proxyAwareFetch.mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401));

    const result = await getClaudeUsage("expired-token");

    expect(result.message).toMatch(/authentication|401/i);
    expect(proxyAwareFetch).toHaveBeenCalledTimes(1);
  });

  it("uses legacy usage only when OAuth endpoint is unsupported", async () => {
    proxyAwareFetch
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse({ plan: "Max" }));

    const result = await getClaudeUsage("legacy-token");
    const cached = await getClaudeUsage("legacy-token");

    expect(result).toMatchObject({ plan: "Max" });
    expect(cached).toEqual(result);
    expect(proxyAwareFetch).toHaveBeenCalledTimes(2);
    expect(proxyAwareFetch.mock.calls[1][0]).toBe("https://api.anthropic.com/v1/settings");
  });
});
