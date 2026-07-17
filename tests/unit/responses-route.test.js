import { beforeEach, describe, expect, it, vi } from "vitest";

const { handleChatMock, initTranslatorsMock } = vi.hoisted(() => ({
  handleChatMock: vi.fn(),
  initTranslatorsMock: vi.fn(),
}));

vi.mock("@/sse/handlers/chat.js", () => ({ handleChat: handleChatMock }));
vi.mock("open-sse/translator/index.js", () => ({ initTranslators: initTranslatorsMock }));

import { POST } from "../../src/app/api/v1/responses/route.js";

describe("Responses route streaming selection", () => {
  beforeEach(() => {
    handleChatMock.mockReset();
    handleChatMock.mockResolvedValue(new Response(JSON.stringify({ id: "resp_test" }), {
      headers: { "Content-Type": "application/json" },
    }));
  });

  it("keeps omitted stream non-streaming", async () => {
    const body = { model: "gpt-5.6-sol", input: "hello" };
    const request = new Request("http://localhost/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const response = await POST(request);

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ id: "resp_test" });
    expect(handleChatMock).toHaveBeenCalledWith(request, null, { body });
  });
});
