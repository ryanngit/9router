import { beforeEach, describe, expect, it, vi } from "vitest";
import { openaiResponsesToOpenAIRequest } from "../../open-sse/translator/request/openai-responses.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { initState, translateResponse } from "../../open-sse/translator/index.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";
import { createRequestTiming } from "../../open-sse/utils/requestTiming.js";

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

const { handleChatCore } = await import("../../open-sse/handlers/chatCore.js");
const { handleForcedSSEToJson, openAIJsonToResponsesResponse } = await import("../../open-sse/handlers/chatCore/sseToJsonHandler.js");

const translate = (body) => openaiResponsesToOpenAIRequest("claude-fable-5", body, true, null);

function chatChunk(delta, finishReason = null, id = "chatcmpl-fable-custom") {
  return {
    id,
    model: "claude-fable-5",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

function translateChatStream(chunks, customToolNames = new Set()) {
  const state = initState(FORMATS.OPENAI_RESPONSES, customToolNames);
  state.created = 1;
  const events = chunks.flatMap((chunk) => translateResponse(
    FORMATS.OPENAI,
    FORMATS.OPENAI_RESPONSES,
    chunk,
    state,
  ));
  return { events, state };
}

function parseWireEvents(text) {
  return text
    .split("\n\n")
    .map((block) => {
      const event = block.match(/^event:\s*(.+)$/m)?.[1];
      const data = block.match(/^data:\s*(.+)$/m)?.[1];
      if (!event || !data || data === "[DONE]") return null;
      return { event, data: JSON.parse(data) };
    })
    .filter(Boolean);
}

async function translateProductionStream(chunks, customToolNames) {
  const wire = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n";
  const source = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (let offset = 0; offset < wire.length; offset += 29) {
        controller.enqueue(encoder.encode(wire.slice(offset, offset + 29)));
      }
      controller.close();
    },
  });
  const output = source.pipeThrough(createSSETransformStreamWithLogger(
    FORMATS.OPENAI,
    FORMATS.OPENAI_RESPONSES,
    "github",
    null,
    null,
    "claude-fable-5",
    null,
    null,
    null,
    null,
    customToolNames,
  ));
  return new Response(output).text();
}

beforeEach(() => {
  executeMock.mockReset();
  saveRequestDetailMock.mockClear();
});

describe("Responses custom tool request translation", () => {
  it("wraps custom declarations and records their names", () => {
    const out = translate({
      input: "Apply the patch.",
      tools: [{
        type: "custom",
        name: "apply_patch",
        description: "Apply a patch",
        format: { type: "text" },
      }],
    });

    expect(out.tools).toEqual([{
      type: "function",
      function: {
        name: "apply_patch",
        description: "Apply a patch",
        parameters: {
          type: "object",
          properties: { input: { type: "string" } },
          required: ["input"],
        },
      },
    }]);
    expect(out._customToolNames).toEqual(new Set(["apply_patch"]));
  });

  it("converts custom call and output history to Chat tool messages", () => {
    const out = translate({
      input: [
        {
          type: "custom_tool_call",
          call_id: "call_patch",
          name: "apply_patch",
          input: "*** Begin Patch",
        },
        {
          type: "custom_tool_call_output",
          call_id: "call_patch",
          output: "Done!",
        },
      ],
    });

    expect(out.messages).toEqual([
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "call_patch",
          type: "function",
          function: {
            name: "apply_patch",
            arguments: "{\"input\":\"*** Begin Patch\"}",
          },
        }],
      },
      { role: "tool", tool_call_id: "call_patch", content: "Done!" },
    ]);
  });

  it("leaves ordinary function declarations and history unchanged", () => {
    const parameters = {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    };
    const out = translate({
      input: [
        {
          type: "function_call",
          call_id: "call_read",
          name: "read_file",
          arguments: "{\"path\":\"README.md\"}",
        },
        {
          type: "function_call_output",
          call_id: "call_read",
          output: "contents",
        },
        {
          type: "function_call_output",
          call_id: "call_missing",
        },
      ],
      tools: [{
        type: "function",
        name: "read_file",
        description: "Read a file",
        parameters,
        strict: true,
      }],
    });

    expect(out.tools).toEqual([{
      type: "function",
      function: {
        name: "read_file",
        description: "Read a file",
        parameters,
        strict: true,
      },
    }]);
    expect(out.messages).toEqual([
      {
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "call_read",
          type: "function",
          function: { name: "read_file", arguments: "{\"path\":\"README.md\"}" },
        }],
      },
      { role: "tool", tool_call_id: "call_read", content: "contents" },
      { role: "tool", tool_call_id: "call_missing", content: undefined },
    ]);
    expect(out._customToolNames).toEqual(new Set());
  });

  it("stringifies malformed custom input and non-string outputs", () => {
    const out = translate({
      input: [
        {
          type: "custom_tool_call",
          call_id: "call_object",
          name: "apply_patch",
          input: { patch: "text" },
        },
        {
          type: "custom_tool_call_output",
          call_id: "call_object",
          output: { ok: true },
        },
        {
          type: "custom_tool_call_output",
          call_id: "call_missing",
        },
      ],
    });

    expect(out.messages[0].tool_calls[0].function.arguments)
      .toBe("{\"input\":\"{\\\"patch\\\":\\\"text\\\"}\"}");
    expect(out.messages.slice(1)).toEqual([
      { role: "tool", tool_call_id: "call_object", content: "{\"ok\":true}" },
      { role: "tool", tool_call_id: "call_missing", content: "null" },
    ]);
  });

  it("falls back to null strings when custom values cannot be serialized", () => {
    const out = translate({
      input: [
        {
          type: "custom_tool_call",
          call_id: "call_bigint",
          name: "apply_patch",
          input: 1n,
        },
        {
          type: "custom_tool_call_output",
          call_id: "call_bigint",
          output: 2n,
        },
      ],
    });

    expect(out.messages[0].tool_calls[0].function.arguments).toBe("{\"input\":\"null\"}");
    expect(out.messages[1]).toEqual({
      role: "tool",
      tool_call_id: "call_bigint",
      content: "null",
    });
  });
});

describe("Responses custom tool response translation", () => {
  it("restores fragmented custom input while preserving mixed function calls", () => {
    const customToolNames = new Set(["apply_patch"]);
    const { events, state } = translateChatStream([
      chatChunk({
        tool_calls: [{ index: 0, id: "call_patch", type: "function", function: { arguments: '{"in' } }],
      }),
      chatChunk({
        tool_calls: [{ index: 0, function: { name: "apply_patch", arguments: 'put":"*** Begin\\n' } }],
      }),
      chatChunk({
        tool_calls: [{ index: 0, function: { arguments: 'Patch"}' } }],
      }),
      chatChunk({
        tool_calls: [{
          index: 1,
          id: "call_read",
          type: "function",
          function: { name: "read_file", arguments: '{"path":"README.md"}' },
        }],
      }),
      chatChunk({}, "tool_calls"),
    ], customToolNames);

    const customEvents = events.filter(({ data }) =>
      data.item_id === "ctc_call_patch" || data.item?.id === "ctc_call_patch");
    expect(customEvents.map(({ event }) => event)).toEqual([
      "response.output_item.added",
      "response.custom_tool_call_input.delta",
      "response.custom_tool_call_input.done",
      "response.output_item.done",
    ]);
    expect(customEvents[0].data.item).toEqual({
      id: "ctc_call_patch",
      type: "custom_tool_call",
      input: "",
      call_id: "call_patch",
      name: "apply_patch",
    });
    expect(customEvents[1].data.delta).toBe("*** Begin\nPatch");
    expect(customEvents[2].data.input).toBe("*** Begin\nPatch");
    expect(customEvents[3].data.item.input).toBe("*** Begin\nPatch");

    const functionEvents = events.filter(({ data }) =>
      data.item_id === "fc_call_read" || data.item?.id === "fc_call_read");
    expect(functionEvents.map(({ event }) => event)).toEqual([
      "response.output_item.added",
      "response.function_call_arguments.delta",
      "response.function_call_arguments.done",
      "response.output_item.done",
    ]);
    expect(functionEvents[1].data.delta).toBe('{"path":"README.md"}');
    expect(functionEvents[2].data.arguments).toBe('{"path":"README.md"}');
    expect(state.customToolNames).toBe(customToolNames);
    expect(state.funcIsCustom).toEqual({ 0: true, 1: false });
  });

  it("falls back to raw custom arguments when the wrapper is malformed", () => {
    const { events } = translateChatStream([
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_patch",
          type: "function",
          function: { name: "apply_patch", arguments: "not-json" },
        }],
      }),
      chatChunk({}, "tool_calls"),
    ], new Set(["apply_patch"]));

    expect(events.find(({ event }) => event === "response.custom_tool_call_input.delta")?.data.delta)
      .toBe("not-json");
    expect(events.find(({ event }) => event === "response.custom_tool_call_input.done")?.data.input)
      .toBe("not-json");
  });

  it("does not change ordinary function stream events when custom metadata exists", () => {
    const chunks = [
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_read",
          type: "function",
          function: { name: "read_file", arguments: '{"path":' },
        }],
      }, null, "chatcmpl-normal-control"),
      chatChunk({
        tool_calls: [{ index: 0, function: { arguments: '"README.md"}' } }],
      }, null, "chatcmpl-normal-control"),
      chatChunk({}, "tool_calls", "chatcmpl-normal-control"),
    ];

    expect(translateChatStream(chunks, new Set(["apply_patch"])).events)
      .toEqual(translateChatStream(chunks).events);
  });

  it("preserves ordinary non-stream fallback call IDs", () => {
    const response = openAIJsonToResponsesResponse({
      id: "chatcmpl-normal-json",
      choices: [{
        message: {
          tool_calls: [{
            type: "function",
            function: { name: "read_file", arguments: '{"path":"README.md"}' },
          }],
        },
        finish_reason: "tool_calls",
      }],
    }, "claude-fable-5", new Set(["apply_patch"]));

    expect(response.output).toEqual([{
      id: "fc_read_file",
      type: "function_call",
      call_id: "call_read_file",
      name: "read_file",
      arguments: '{"path":"README.md"}',
    }]);
  });

  it("threads custom metadata through the production SSE transform and sends one DONE", async () => {
    const text = await translateProductionStream([
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_patch",
          type: "function",
          function: { name: "apply_patch", arguments: '{"input":"*** ' },
        }],
      }),
      chatChunk({
        tool_calls: [{ index: 0, function: { arguments: 'Begin Patch"}' } }],
      }),
      chatChunk({}, "tool_calls"),
    ], new Set(["apply_patch"]));
    const events = parseWireEvents(text);

    expect(events.some(({ data }) => data.item?.type === "function_call")).toBe(false);
    expect(events.find(({ event }) => event === "response.custom_tool_call_input.done")?.data.input)
      .toBe("*** Begin Patch");
    expect(text.match(/^data: \[DONE\]$/gm)).toHaveLength(1);
  });

  it("strips request metadata before dispatch and restores non-stream custom calls", async () => {
    executeMock.mockImplementationOnce(async (args) => ({
      response: new Response(JSON.stringify({
        id: "chatcmpl_custom_json",
        object: "chat.completion",
        created: 1,
        model: "claude-fable-5",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: null,
            tool_calls: [
              {
                id: "call_patch",
                type: "function",
                function: { name: "apply_patch", arguments: '{"input":"*** Begin Patch"}' },
              },
              {
                id: "call_read",
                type: "function",
                function: { name: "read_file", arguments: '{"path":"README.md"}' },
              },
            ],
          },
          finish_reason: "tool_calls",
        }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
      url: "https://api.githubcopilot.com/chat/completions",
      headers: {},
      transformedBody: args.body,
    }));

    const result = await handleChatCore({
      body: {
        model: "claude-fable-5",
        stream: false,
        input: "Use a tool.",
        tools: [
          { type: "custom", name: "apply_patch", description: "Apply a patch" },
          {
            type: "function",
            name: "read_file",
            parameters: { type: "object", properties: { path: { type: "string" } } },
          },
        ],
      },
      modelInfo: { provider: "github", model: "claude-fable-5" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "github-fable-custom-test",
      sourceFormatOverride: FORMATS.OPENAI_RESPONSES,
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(result.success).toBe(true);
    const dispatched = executeMock.mock.calls[0][0].body;
    expect(dispatched._customToolNames).toBeUndefined();
    expect(dispatched.tools[0].function.parameters.required).toEqual(["input"]);
    expect(saveRequestDetailMock).toHaveBeenCalled();
    for (const [detail] of saveRequestDetailMock.mock.calls) {
      expect(detail.providerRequest?._customToolNames).toBeUndefined();
    }

    const json = await result.response.json();
    expect(json.output).toEqual([
      {
        id: "ctc_call_patch",
        type: "custom_tool_call",
        call_id: "call_patch",
        name: "apply_patch",
        input: "*** Begin Patch",
      },
      {
        id: "fc_call_read",
        type: "function_call",
        call_id: "call_read",
        name: "read_file",
        arguments: '{"path":"README.md"}',
      },
    ]);
  });

  it("restores custom calls when a Chat provider forces SSE for a JSON client", async () => {
    const chunks = [
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_patch",
          type: "function",
          function: { name: "apply_patch", arguments: '{"inp' },
        }],
      }),
      chatChunk({
        tool_calls: [{ index: 0, function: { arguments: 'ut":"forced"}' } }],
      }),
      chatChunk({}, "tool_calls"),
    ];
    const providerResponse = new Response(
      chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n",
      { status: 200, headers: { "content-type": "text/event-stream" } },
    );

    const result = await handleForcedSSEToJson({
      requestId: "forced-custom",
      correlationId: "forced-custom-correlation",
      providerResponse,
      sourceFormat: FORMATS.OPENAI_RESPONSES,
      targetFormat: FORMATS.OPENAI,
      customToolNames: new Set(["apply_patch"]),
      provider: "openai",
      model: "claude-fable-5",
      body: { model: "claude-fable-5", input: "Use a tool." },
      stream: true,
      translatedBody: {},
      finalBody: {},
      requestTiming: createRequestTiming(),
      connectionId: "forced-custom",
      trackDone: vi.fn(),
      appendLog: vi.fn(),
    });

    expect(result.success).toBe(true);
    const json = await result.response.json();
    expect(json.output).toEqual([{
      id: "ctc_call_patch",
      type: "custom_tool_call",
      call_id: "call_patch",
      name: "apply_patch",
      input: "forced",
    }]);
  });
});
