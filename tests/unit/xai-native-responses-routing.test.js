import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeMock, saveRequestDetailMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  saveRequestDetailMock: vi.fn(async () => {}),
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
  saveRequestDetail: saveRequestDetailMock,
  saveRequestUsage: vi.fn(async () => {}),
}));

const { handleResponsesCore } = await import("../../open-sse/handlers/responsesHandler.js");
const { handleChatCore } = await import("../../open-sse/handlers/chatCore.js");
const { DefaultExecutor } = await import("../../open-sse/executors/default.js");
const { handleNonStreamingResponse } = await import("../../open-sse/handlers/chatCore/nonStreamingHandler.js");
const { handleForcedSSEToJson, responsesJsonToOpenAIResponse } = await import("../../open-sse/handlers/chatCore/sseToJsonHandler.js");
const { extractUsageFromResponse } = await import("../../open-sse/handlers/chatCore/requestDetail.js");
const { FORMATS } = await import("../../open-sse/translator/formats.js");
const { createRequestTiming } = await import("../../open-sse/utils/requestTiming.js");

describe("xAI native Responses routing", () => {
  beforeEach(() => {
    executeMock.mockReset();
    saveRequestDetailMock.mockClear();
  });

  it("preserves native Responses requests and non-stream JSON", async () => {
    const upstreamJson = {
      id: "resp_test",
      object: "response",
      model: "grok-4.20-multi-agent-0309",
      status: "completed",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "OK" }],
      }],
      usage: {
        input_tokens: 1,
        output_tokens: 1,
        total_tokens: 2,
        input_tokens_details: { cached_tokens: 0 },
      },
    };
    executeMock.mockImplementation(async (args) => ({
      response: new Response(JSON.stringify(upstreamJson), { status: 200, headers: { "content-type": "application/json" } }),
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
    expect(json).toEqual(upstreamJson);
  });

  it.each([FORMATS.OPENAI_RESPONSES, FORMATS.OPENAI])(
    "returns failed native Responses JSON as an upstream error for %s target",
    async (targetFormat) => {
    const onRequestSuccess = vi.fn();
    const appendLog = vi.fn();
    const result = await handleNonStreamingResponse({
      providerResponse: new Response(JSON.stringify({
        id: "resp_failed",
        object: "response",
        status: "failed",
        error: { code: "model_at_capacity", message: "Selected model is at capacity." },
      }), { status: 200, headers: { "content-type": "application/json" } }),
      provider: "xai",
      model: "grok-4.5",
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      targetFormat,
      body: { model: "grok-4.5", input: "hi" },
      stream: false,
      requestTiming: createRequestTiming(),
      connectionId: "xai-failed-json",
      onRequestSuccess,
      reqLogger: { logProviderResponse: vi.fn(), logConvertedResponse: vi.fn() },
      trackDone: vi.fn(),
      appendLog,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("Selected model is at capacity.");
    expect(onRequestSuccess).not.toHaveBeenCalled();
    expect(appendLog).toHaveBeenCalledWith({ status: "FAILED 502" });
    },
  );

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
    expect(executeMock.mock.calls[0][0].body).toEqual(expect.objectContaining({
      input: expect.any(Array),
    }));
    expect(executeMock.mock.calls[0][0].body.messages).toBeUndefined();
    expect(dispatched.url).toBe("https://api.x.ai/v1/responses");
    expect(dispatched.transformedBody.input.some((item) => item.type === "reasoning")).toBe(false);
    expect(JSON.stringify(dispatched.transformedBody)).not.toContain("ciphertext");

    const json = await result.response.json();
    expect(json.object).toBe("chat.completion");
    expect(json.choices[0].message.content).toBe("OK");
    expect(json.output).toBeUndefined();
  });

  it("passes one DONE after a completed native Responses stream", async () => {
    const upstream = [
      "event: response.completed",
      `data: ${JSON.stringify({ type: "response.completed", response: { id: "resp_test", status: "completed" } })}`,
      "",
      "data: [DONE]",
      "",
    ].join("\n");
    executeMock.mockImplementationOnce(async (args) => ({
      response: new Response(upstream, { status: 200, headers: { "content-type": "text/event-stream" } }),
      url: "https://api.x.ai/v1/responses",
      headers: {},
      transformedBody: args.body,
    }));

    const result = await handleResponsesCore({
      body: { model: "grok-4.5", input: "hi", stream: true },
      modelInfo: { provider: "xai", model: "grok-4.5" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "xai-stream-complete",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
    const output = await result.response.text();

    expect(output).toContain("event: response.completed");
    expect(output).not.toContain("event: response.failed");
    expect(output.match(/data: \[DONE\]/g)).toHaveLength(1);
  });

  it("fails a native Responses stream that reaches EOF without a terminal event", async () => {
    const upstream = [
      "event: response.created",
      `data: ${JSON.stringify({ type: "response.created", response: { id: "resp_test", status: "in_progress" } })}`,
      "",
      "event: response.output_text.delta",
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: "partial" })}`,
      "",
    ].join("\n");
    executeMock.mockImplementationOnce(async (args) => ({
      response: new Response(upstream, { status: 200, headers: { "content-type": "text/event-stream" } }),
      url: "https://api.x.ai/v1/responses",
      headers: {},
      transformedBody: args.body,
    }));

    const result = await handleResponsesCore({
      body: { model: "grok-4.5", input: "hi", stream: true },
      modelInfo: { provider: "xai", model: "grok-4.5" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "xai-stream-incomplete",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
    const output = await result.response.text();

    expect(output).toContain("event: response.failed");
    expect(output.indexOf("event: response.failed")).toBeLessThan(output.indexOf("data: [DONE]"));
    expect(output.match(/data: \[DONE\]/g)).toHaveLength(1);
  });

  it("returns a failed Responses event as an upstream error", async () => {
    const upstream = [
      "event: response.failed",
      `data: ${JSON.stringify({
        type: "response.failed",
        response: {
          id: "resp_failed",
          status: "failed",
          error: { type: "server_error", code: "model_at_capacity", message: "Selected model is at capacity." },
        },
      })}`,
      "",
    ].join("\n");
    const onRequestSuccess = vi.fn();

    const result = await handleForcedSSEToJson({
      providerResponse: new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      provider: "xai",
      model: "grok-4.5",
      body: { model: "grok-4.5", messages: [{ role: "user", content: "hi" }] },
      stream: true,
      requestTiming: createRequestTiming(),
      connectionId: "xai-failed-stream",
      onRequestSuccess,
      trackDone: vi.fn(),
      appendLog: vi.fn(),
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("Selected model is at capacity.");
    expect(onRequestSuccess).not.toHaveBeenCalled();
  });

  it("preserves a top-level Responses error message", async () => {
    const upstream = [
      "event: error",
      `data: ${JSON.stringify({ code: "invalid_argument", message: "Argument not supported: external_web_access" })}`,
      "",
    ].join("\n");

    const result = await handleForcedSSEToJson({
      providerResponse: new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      provider: "xai",
      model: "grok-4.5",
      body: { model: "grok-4.5", input: "hi" },
      stream: false,
      requestTiming: createRequestTiming(),
      connectionId: "xai-top-level-error",
      onRequestSuccess: vi.fn(),
      trackDone: vi.fn(),
      appendLog: vi.fn(),
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("Argument not supported: external_web_access");
  });

  it("fails a forced non-stream conversion that ends before a terminal event", async () => {
    const upstream = [
      "event: response.created",
      `data: ${JSON.stringify({ type: "response.created", response: { id: "resp_partial", status: "in_progress" } })}`,
      "",
      "event: response.output_text.delta",
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: "partial" })}`,
      "",
    ].join("\n");
    const onRequestSuccess = vi.fn();

    const result = await handleForcedSSEToJson({
      providerResponse: new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      provider: "xai",
      model: "grok-4.5",
      body: { model: "grok-4.5", input: "hi" },
      stream: false,
      requestTiming: createRequestTiming(),
      connectionId: "xai-truncated-stream",
      onRequestSuccess,
      trackDone: vi.fn(),
      appendLog: vi.fn(),
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(502);
    expect(result.error).toContain("closed before a terminal event");
    expect(onRequestSuccess).not.toHaveBeenCalled();
  });

  it("keeps Responses usage details in forced-conversion request detail", async () => {
    const upstream = [
      "event: response.completed",
      `data: ${JSON.stringify({
        type: "response.completed",
        response: {
          id: "resp_usage",
          status: "completed",
          service_tier: "priority",
          usage: {
            input_tokens: 100,
            output_tokens: 20,
            total_tokens: 120,
            input_tokens_details: { cached_tokens: 80, cache_creation_tokens: 5 },
            output_tokens_details: { reasoning_tokens: 7 },
            cost_in_usd_ticks: 123,
          },
        },
      })}`,
      "",
    ].join("\n");

    const result = await handleForcedSSEToJson({
      providerResponse: new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      provider: "xai",
      model: "grok-4.5",
      body: { model: "grok-4.5", input: "hi" },
      stream: false,
      requestTiming: createRequestTiming(),
      connectionId: "xai-usage-detail",
      trackDone: vi.fn(),
      appendLog: vi.fn(),
    });

    expect(result.success).toBe(true);
    expect(saveRequestDetailMock).toHaveBeenCalledOnce();
    expect(saveRequestDetailMock.mock.calls[0][0].tokens).toMatchObject({
      prompt_tokens: 100,
      completion_tokens: 20,
      cached_tokens: 80,
      cache_creation_input_tokens: 5,
      reasoning_tokens: 7,
      service_tier: "priority",
      cost_in_usd_ticks: 123,
    });
  });
});

describe("Responses-to-Chat non-stream mapping", () => {
  it.each([
    ["max_output_tokens", "length"],
    ["content_filter", "content_filter"],
    ["unknown_reason", "stop"],
  ])("maps incomplete reason %s to Chat finish reason %s", (reason, finishReason) => {
    const result = responsesJsonToOpenAIResponse({
      id: "resp_incomplete",
      status: "incomplete",
      incomplete_details: { reason },
      output: [],
    }, "grok-4.5");

    expect(result.choices[0].finish_reason).toBe(finishReason);
  });

  it("preserves Responses reasoning on the Chat assistant message", () => {
    const result = responsesJsonToOpenAIResponse({
      id: "resp_reasoning",
      status: "completed",
      output: [
        {
          type: "reasoning",
          summary: [{ type: "summary_text", text: "private reasoning" }],
          encrypted_content: "ciphertext",
        },
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "answer" }],
        },
      ],
    }, "grok-4.5");

    expect(result.choices[0].message).toMatchObject({
      content: "answer",
      reasoning_content: "private reasoning",
      encrypted_content: "ciphertext",
    });
  });

  it("uses incomplete details instead of a partial tool-call finish", () => {
    const result = responsesJsonToOpenAIResponse({
      id: "resp_partial_tool",
      status: "incomplete",
      incomplete_details: { reason: "max_output_tokens" },
      output: [{ type: "function_call", call_id: "call_1", name: "shell_command", arguments: "{" }],
    }, "grok-4.5");

    expect(result.choices[0].message.tool_calls).toHaveLength(1);
    expect(result.choices[0].finish_reason).toBe("length");
  });

  it("preserves Responses usage detail fields in Chat format", () => {
    const result = responsesJsonToOpenAIResponse({
      id: "resp_usage",
      status: "completed",
      output: [],
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        total_tokens: 120,
        input_tokens_details: { cached_tokens: 80 },
        output_tokens_details: { reasoning_tokens: 7 },
      },
    }, "grok-4.5");

    expect(result.usage.prompt_tokens_details).toEqual({ cached_tokens: 80 });
    expect(result.usage.completion_tokens_details).toEqual({ reasoning_tokens: 7 });
  });

  it("preserves incomplete and reasoning semantics through the full Chat handler", async () => {
    executeMock.mockImplementationOnce(async (args) => ({
      response: new Response(JSON.stringify({
        id: "resp_partial_tool",
        object: "response",
        model: "grok-4.20-multi-agent-0309",
        status: "incomplete",
        incomplete_details: { reason: "max_output_tokens" },
        output: [
          { type: "reasoning", summary: [{ type: "summary_text", text: "private reasoning" }] },
          { type: "message", role: "assistant", content: [{ type: "output_text", text: "answer" }] },
          { type: "function_call", call_id: "call_1", name: "shell_command", arguments: "{" },
        ],
        usage: { input_tokens: 100, output_tokens: 20, total_tokens: 120 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
      url: "https://api.x.ai/v1/responses",
      headers: {},
      transformedBody: args.body,
    }));

    const result = await handleChatCore({
      body: { model: "grok-4.20-multi-agent-0309", stream: false, messages: [{ role: "user", content: "hi" }] },
      modelInfo: { provider: "xai", model: "grok-4.20-multi-agent-0309" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "xai-chat-incomplete",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
    const json = await result.response.json();

    expect(json.choices[0].finish_reason).toBe("length");
    expect(json.choices[0].message.reasoning_content).toBe("private reasoning");
  });

  it("extracts cached and reasoning tokens from Responses usage", () => {
    expect(extractUsageFromResponse({
      object: "response",
      output: [],
      usage: {
        input_tokens: 100,
        output_tokens: 20,
        input_tokens_details: { cached_tokens: 80 },
        output_tokens_details: { reasoning_tokens: 7 },
      },
    })).toMatchObject({
      prompt_tokens: 100,
      completion_tokens: 20,
      cached_tokens: 80,
      reasoning_tokens: 7,
    });
  });
});
