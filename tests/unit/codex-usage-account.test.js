import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  proxyAwareFetch: vi.fn(),
}));

vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  proxyAwareFetch: mocks.proxyAwareFetch,
}));

describe("Codex usage account binding", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.proxyAwareFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ rate_limit: {}, rate_limit_reset_credits: {} }),
    });
  });

  it("sends ChatGPT-Account-ID from workspaceId first", async () => {
    const { getCodexUsage } = await import("../../open-sse/services/usage/codex.js");
    await getCodexUsage("token", { workspaceId: "team_ws", chatgptAccountId: "free_ws" }, { strictProxy: false });

    expect(mocks.proxyAwareFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "ChatGPT-Account-ID": "team_ws" }),
      }),
      { strictProxy: false },
    );
  });

  it("falls back to chatgptAccountId when workspaceId is missing", async () => {
    const { getCodexUsage } = await import("../../open-sse/services/usage/codex.js");
    await getCodexUsage("token", { chatgptAccountId: "free_ws" }, null);

    expect(mocks.proxyAwareFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ "ChatGPT-Account-ID": "free_ws" }),
      }),
      null,
    );
  });
});
