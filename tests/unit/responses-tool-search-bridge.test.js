import { describe, expect, it } from "vitest";
import { openaiResponsesToOpenAIRequest } from "../../open-sse/translator/request/openai-responses.js";
import { openAIJsonToResponsesResponse } from "../../open-sse/handlers/chatCore/sseToJsonHandler.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { initState, translateRequest, translateResponse } from "../../open-sse/translator/index.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";

const namespaceTool = {
  type: "namespace",
  name: "codex_app",
  description: "Codex app tools.",
  tools: [{
    type: "function",
    name: "read_thread",
    description: "Read one Codex task.",
    strict: false,
    defer_loading: true,
    parameters: {
      type: "object",
      properties: { thread_id: { type: "string" } },
      required: ["thread_id"],
      additionalProperties: false,
    },
  }],
};

const translate = (body) => openaiResponsesToOpenAIRequest("claude-fable-5", body, true, null);

function chatChunk(delta, finishReason = null, id = "chatcmpl-tool-search") {
  return {
    id,
    model: "claude-fable-5",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

function metadata() {
  return {
    toolSearchNames: new Set(["tool_search"]),
    namespaceTools: new Map([
      ["codex_app__read_thread", { namespace: "codex_app", name: "read_thread" }],
    ]),
  };
}

function translateChatStream(chunks, responsesToolMetadata = metadata()) {
  const state = initState(FORMATS.OPENAI_RESPONSES, new Set(), responsesToolMetadata);
  state.created = 1;
  return chunks.flatMap((chunk) => translateResponse(
    FORMATS.OPENAI,
    FORMATS.OPENAI_RESPONSES,
    chunk,
    state,
  ));
}

function parseWireEvents(text) {
  return text
    .split("\n\n")
    .map((block) => {
      const event = block.match(/^event:\s*(.+)$/m)?.[1];
      const data = block.match(/^data:\s*(.+)$/m)?.[1];
      return event && data && data !== "[DONE]" ? { event, data: JSON.parse(data) } : null;
    })
    .filter(Boolean);
}

describe("Responses tool_search request bridge", () => {
  it("converts native search plus hydrated namespace history to Chat tools", () => {
    const out = translate({
      input: [
        {
          type: "tool_search_call",
          call_id: "search-1",
          execution: "client",
          arguments: { query: "read Codex task", limit: 8 },
        },
        {
          type: "tool_search_output",
          call_id: "search-1",
          execution: "client",
          status: "completed",
          tools: [namespaceTool],
        },
        {
          type: "function_call",
          call_id: "call-read-1",
          namespace: "codex_app",
          name: "read_thread",
          arguments: "{\"thread_id\":\"thread-1\"}",
        },
        {
          type: "function_call_output",
          call_id: "call-read-1",
          output: "task output",
        },
      ],
      tools: [{
        type: "tool_search",
        execution: "client",
        description: "Search deferred tools.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
          additionalProperties: false,
        },
      }],
    });

    expect(out.tools.map((tool) => tool.function.name)).toEqual([
      "tool_search",
      "codex_app__read_thread",
    ]);
    expect(out.tools[0].function.parameters.required).toEqual(["query"]);
    expect(out.tools[1].function).toMatchObject({
      name: "codex_app__read_thread",
      description: "Read one Codex task.",
      strict: false,
    });
    expect(out.messages[0].tool_calls[0].function).toEqual({
      name: "tool_search",
      arguments: "{\"query\":\"read Codex task\",\"limit\":8}",
    });
    expect(JSON.parse(out.messages[1].content)).toEqual({ tools: [namespaceTool] });
    expect(out.messages[2].tool_calls[0].function.name).toBe("codex_app__read_thread");
    expect(out.messages[3]).toEqual({
      role: "tool",
      tool_call_id: "call-read-1",
      content: "task output",
    });
    expect(out._responsesToolMetadata.toolSearchNames).toEqual(new Set(["tool_search"]));
    expect(out._responsesToolMetadata.namespaceTools.get("codex_app__read_thread")).toEqual({
      namespace: "codex_app",
      name: "read_thread",
    });
  });

  it("ignores malformed namespace children without dropping valid tools", () => {
    const out = translate({
      input: [{
        type: "tool_search_output",
        call_id: "search-2",
        execution: "client",
        status: "completed",
        tools: [{ ...namespaceTool, tools: [{ type: "function" }, namespaceTool.tools[0]] }],
      }],
      tools: [{ type: "function", name: "shell_command", parameters: { type: "object" } }],
    });

    expect(out.tools.map((tool) => tool.function.name)).toEqual([
      "shell_command",
      "codex_app__read_thread",
    ]);
  });

  it("flattens directly visible namespace tools instead of exposing the container as a function", () => {
    const out = translate({ input: "Read the task.", tools: [namespaceTool] });

    expect(out.tools.map((tool) => tool.function.name)).toEqual(["codex_app__read_thread"]);
    expect(out._responsesToolMetadata.namespaceTools.get("codex_app__read_thread")).toEqual({
      namespace: "codex_app",
      name: "read_thread",
    });
  });

  it("exposes flat functions returned by tool_search_output", () => {
    const deferredTool = {
      type: "function",
      name: "mcp__calendar__create_event",
      description: "Create a calendar event.",
      defer_loading: true,
      parameters: {
        type: "object",
        properties: { title: { type: "string" } },
        required: ["title"],
        additionalProperties: false,
      },
    };
    const out = translate({
      input: [{
        type: "tool_search_output",
        call_id: "search-flat-1",
        execution: "client",
        status: "completed",
        tools: [deferredTool],
      }],
      tools: [{ type: "tool_search", execution: "client", parameters: { type: "object" } }],
    });

    expect(out.tools.map((tool) => tool.function.name)).toEqual([
      "tool_search",
      "mcp__calendar__create_event",
    ]);
  });
});

describe("Responses tool_search response bridge", () => {
  it("round-trips tool_search through the GitHub Claude translation shape", () => {
    const chat = translate({
      input: "Find read_thread.",
      tools: [{
        type: "tool_search",
        execution: "client",
        description: "Search deferred tools.",
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
      }],
    });
    const responsesToolMetadata = chat._responsesToolMetadata;
    delete chat._responsesToolMetadata;
    delete chat._customToolNames;
    const claude = translateRequest(
      FORMATS.OPENAI,
      FORMATS.CLAUDE,
      "claude-fable-5",
      chat,
      true,
      {},
      "github",
    );
    expect(claude.tools[0]).toMatchObject({
      name: "tool_search",
      description: "Search deferred tools.",
    });

    const claudeState = initState(FORMATS.CLAUDE);
    const outerState = initState(FORMATS.OPENAI_RESPONSES, new Set(), responsesToolMetadata);
    const claudeEvents = [
      { type: "message_start", message: { id: "msg-search", model: "claude-fable-5" } },
      {
        type: "content_block_start",
        index: 0,
        content_block: { type: "tool_use", id: "search-claude", name: "tool_search", input: {} },
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "input_json_delta", partial_json: "{\"query\":\"read_thread\"}" },
      },
      { type: "message_delta", delta: { stop_reason: "tool_use" } },
      { type: "message_stop" },
    ];
    const responsesEvents = claudeEvents.flatMap((event) =>
      translateResponse(FORMATS.CLAUDE, FORMATS.OPENAI, event, claudeState)
        .flatMap((chunk) => translateResponse(
          FORMATS.OPENAI,
          FORMATS.OPENAI_RESPONSES,
          chunk,
          outerState,
        )));

    expect(responsesEvents.find(({ event, data }) =>
      event === "response.output_item.done" && data.item?.call_id === "search-claude")?.data.item)
      .toMatchObject({
        type: "tool_search_call",
        execution: "client",
        arguments: { query: "read_thread" },
      });
  });

  it("restores a fragmented Chat function as native tool_search_call", () => {
    const events = translateChatStream([
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "search-3",
          type: "function",
          function: { name: "tool_search", arguments: "{\"query\":\"read" },
        }],
      }),
      chatChunk({
        tool_calls: [{ index: 0, function: { arguments: " task\",\"limit\":1}" } }],
      }),
      chatChunk({}, "tool_calls"),
    ]);

    const done = events.find(({ event, data }) =>
      event === "response.output_item.done" && data.item?.call_id === "search-3");
    expect(done.data.item).toEqual({
      id: "tsc_search-3",
      type: "tool_search_call",
      call_id: "search-3",
      execution: "client",
      status: "completed",
      arguments: { query: "read task", limit: 1 },
    });
    expect(events.some(({ event }) => event.startsWith("response.function_call_arguments"))).toBe(false);
  });

  it("restores exact namespace and child name", () => {
    const events = translateChatStream([
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call-read-2",
          type: "function",
          function: {
            name: "codex_app__read_thread",
            arguments: "{\"thread_id\":\"thread-2\"}",
          },
        }],
      }),
      chatChunk({}, "tool_calls"),
    ]);

    const done = events.find(({ event, data }) =>
      event === "response.output_item.done" && data.item?.call_id === "call-read-2");
    expect(done.data.item).toMatchObject({
      type: "function_call",
      call_id: "call-read-2",
      namespace: "codex_app",
      name: "read_thread",
      arguments: "{\"thread_id\":\"thread-2\"}",
    });
  });

  it("threads metadata through production streaming conversion", async () => {
    const chunks = [
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "search-4",
          type: "function",
          function: { name: "tool_search", arguments: "{\"query\":\"thread\"}" },
        }],
      }),
      chatChunk({}, "tool_calls"),
    ];
    const wire = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n";
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(wire));
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
      new Set(),
      metadata(),
    ));
    const events = parseWireEvents(await new Response(output).text());

    expect(events.find(({ event }) => event === "response.output_item.done")?.data.item.type)
      .toBe("tool_search_call");
  });

  it("restores tool search and namespace calls in JSON mode", () => {
    const response = openAIJsonToResponsesResponse({
      id: "chatcmpl-tool-search-json",
      choices: [{
        message: {
          tool_calls: [
            {
              id: "search-5",
              type: "function",
              function: { name: "tool_search", arguments: "{\"query\":\"thread\"}" },
            },
            {
              id: "call-read-3",
              type: "function",
              function: { name: "codex_app__read_thread", arguments: "{}" },
            },
          ],
        },
        finish_reason: "tool_calls",
      }],
    }, "claude-fable-5", new Set(), metadata());

    expect(response.output).toEqual([
      {
        id: "tsc_search-5",
        type: "tool_search_call",
        call_id: "search-5",
        execution: "client",
        status: "completed",
        arguments: { query: "thread" },
      },
      {
        id: "fc_call-read-3",
        type: "function_call",
        call_id: "call-read-3",
        namespace: "codex_app",
        name: "read_thread",
        arguments: "{}",
      },
    ]);
  });
});
