import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}));

vi.mock("../../open-sse/executors/index.js", () => ({
  getExecutor: () => ({
    noAuth: true,
    execute: executeMock,
  }),
}));

vi.mock("../../open-sse/utils/requestLogger.js", () => ({
  createRequestLogger: async () => ({
    logRawRequest: vi.fn(),
    logTargetRequest: vi.fn(),
    logProviderResponse: vi.fn(),
    logConvertedResponse: vi.fn(),
    logError: vi.fn(),
  }),
}));

vi.mock("@/lib/usageDb.js", () => ({
  trackPendingRequest: vi.fn(),
  appendRequestLog: vi.fn(async () => {}),
  saveRequestDetail: vi.fn(async () => {}),
  saveRequestUsage: vi.fn(async () => {}),
}));

const { handleResponsesCore } = await import("../../open-sse/handlers/responsesHandler.js");
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.js");
const { DefaultExecutor } = await import("../../open-sse/executors/default.js");

describe("xAI native Responses routing", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("does not convert xAI /v1/responses requests to chat completions", async () => {
    executeMock.mockImplementation(async (args) => ({
      response: new Response(JSON.stringify({
        id: "resp_test",
        model: "grok-4.20-multi-agent-0309",
        status: "completed",
        output: [{
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "OK" }],
        }],
        usage: { input_tokens: 1, output_tokens: 1 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
      url: "https://api.x.ai/v1/responses",
      headers: {},
      transformedBody: args.body,
    }));

    const body = {
      model: "grok-4.20-multi-agent-0309",
      input: "Reply OK only.",
    };

    const result = await handleResponsesCore({
      body,
      modelInfo: { provider: "xai", model: "grok-4.20-multi-agent-0309" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "xai-test",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(result.success).toBe(true);
    expect(executeMock).toHaveBeenCalledTimes(1);

    const call = executeMock.mock.calls[0][0];
    expect(call.stream).toBe(false);
    expect(call.body).toMatchObject({ input: "Reply OK only.", stream: false });
    expect(call.body.messages).toBeUndefined();
    expect(call.credentials.runtimeTransport).toMatchObject({
      format: "openai-responses",
      baseUrl: "https://api.x.ai/v1/responses",
    });

    const json = await result.response.json();
    expect(json.object).toBeUndefined();
    expect(json.output[0].content[0].text).toBe("OK");
  });

  it("returns Chat Completion JSON for a non-stream Responses-only model", async () => {
    const executor = new DefaultExecutor("xai");
    let dispatched;
    executeMock.mockImplementation(async (args) => {
      const transformedBody = executor.transformRequest(args.model, args.body, args.stream, args.credentials);
      const url = executor.buildUrl(args.model, args.stream, 0, args.credentials);
      dispatched = { transformedBody, url };
      return {
        response: new Response(JSON.stringify({
          id: "resp_test",
          model: "grok-4.20-multi-agent-0309",
          status: "completed",
          output: [{
            type: "message",
            role: "assistant",
            content: [{ type: "output_text", text: "OK" }],
          }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }), { status: 200, headers: { "content-type": "application/json" } }),
        url,
        headers: {},
        transformedBody,
      };
    });

    const credentials = { accessToken: "test-token", providerSpecificData: {} };
    const result = await handleChatCore({
      body: {
        model: "grok-4.20-multi-agent-0309",
        stream: false,
        include: ["reasoning.encrypted_content"],
        messages: [
          {
            role: "assistant",
            content: "prior answer",
            reasoning_content: "private reasoning",
            encrypted_content: "ciphertext",
          },
          { role: "user", content: "Reply OK only." },
        ],
      },
      modelInfo: { provider: "xai", model: "grok-4.20-multi-agent-0309" },
      credentials,
      connectionId: "xai-chat-test",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(result.success).toBe(true);
    expect(credentials.runtimeTransport).toMatchObject({
      format: "openai-responses",
      baseUrl: "https://api.x.ai/v1/responses",
    });
    expect(dispatched.url).toBe("https://api.x.ai/v1/responses");
    expect(dispatched.transformedBody.input.some((item) => item.type === "reasoning")).toBe(false);
    expect(JSON.stringify(dispatched.transformedBody)).not.toContain("ciphertext");

    const json = await result.response.json();
    expect(json.object).toBe("chat.completion");
    expect(json.choices[0].message.content).toBe("OK");
    expect(json.output).toBeUndefined();
  });
});
