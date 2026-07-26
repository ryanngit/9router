import { describe, expect, it } from "vitest";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { initState, translateResponse } from "../../open-sse/translator/index.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";

function chatChunk(delta, finishReason = null) {
  return {
    id: "chatcmpl-fable-index",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  };
}

function translateChatStream(chunks) {
  const state = initState(FORMATS.OPENAI_RESPONSES);
  return chunks.flatMap((chunk) => translateResponse(
    FORMATS.OPENAI,
    FORMATS.OPENAI_RESPONSES,
    chunk,
    state,
  ));
}

async function translateProductionStream(chunks) {
  const wire = chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") + "data: [DONE]\n\n";
  const source = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      for (let offset = 0; offset < wire.length; offset += 37) {
        controller.enqueue(encoder.encode(wire.slice(offset, offset + 37)));
      }
      controller.close();
    },
  });
  const output = source.pipeThrough(createSSETransformStreamWithLogger(
    FORMATS.OPENAI,
    FORMATS.OPENAI_RESPONSES,
    "github",
  ));
  return new Response(output).text();
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

describe("Chat-to-Responses output item indexes", () => {
  it("keeps reasoning, text, and fragmented function calls on distinct stable indexes", () => {
    const events = translateChatStream([
      chatChunk({ reasoning_content: "planning" }),
      chatChunk({ content: "Working" }),
      chatChunk({
        tool_calls: [
          {
            index: 0,
            id: "call_first",
            type: "function",
            function: { name: "first_tool", arguments: '{"value":' },
          },
          {
            index: 1,
            id: "call_second",
            type: "function",
            function: { name: "second_tool", arguments: '{"value":' },
          },
        ],
      }),
      chatChunk({
        tool_calls: [
          { index: 0, function: { arguments: "1}" } },
          { index: 1, function: { arguments: "2}" } },
        ],
      }),
      {
        id: "chatcmpl-fable-index",
        model: "claude-fable-5",
        choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 1,
          total_tokens: 13,
          prompt_tokens_details: { cached_tokens: 2 },
        },
      },
    ]);
    const added = events
      .filter(({ event }) => event === "response.output_item.added")
      .map(({ data }) => ({ type: data.item.type, index: data.output_index }));

    expect(added).toEqual([
      { type: "reasoning", index: 0 },
      { type: "message", index: 1 },
      { type: "function_call", index: 2 },
      { type: "function_call", index: 3 },
    ]);

    const expectedIndexes = new Map(events
      .filter(({ event }) => event === "response.output_item.added")
      .map(({ data }) => [data.item.id, data.output_index]));
    for (const [itemId, expectedIndex] of expectedIndexes) {
      const indexes = events
        .filter(({ data }) => data.item_id === itemId || data.item?.id === itemId)
        .map(({ data }) => data.output_index);
      expect(new Set(indexes)).toEqual(new Set([expectedIndex]));
    }

    expect(events.map(({ data }) => data.sequence_number)).toEqual(
      events.map((_, index) => index + 1),
    );
    expect(events.filter(({ event }) => event === "response.completed")).toHaveLength(1);

    const completed = events.find(({ event }) => event === "response.completed")?.data.response;
    expect(completed.model).toBe("claude-fable-5");
    expect(completed.output.map((item) => item.type)).toEqual([
      "reasoning",
      "message",
      "function_call",
      "function_call",
    ]);
    expect(completed.usage).toEqual({
      input_tokens: 12,
      input_tokens_details: { cached_tokens: 2 },
      output_tokens: 1,
      total_tokens: 13,
    });
  });

  it("carries Claude model, output, and cache-aware usage into the terminal", () => {
    const state = initState(FORMATS.OPENAI_RESPONSES);
    state.created = 1;
    const chunks = [
      {
        type: "message_start",
        message: {
          id: "msg_terminal",
          model: "claude-fable-5",
          usage: { input_tokens: 10, output_tokens: 0, cache_read_input_tokens: 2 },
        },
      },
      { type: "content_block_start", index: 0, content_block: { type: "text" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "OK" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 1 } },
      { type: "message_stop" },
    ];
    const events = chunks.flatMap((chunk) => translateResponse(
      FORMATS.CLAUDE,
      FORMATS.OPENAI_RESPONSES,
      chunk,
      state,
    ));
    const response = events.find(({ event }) => event === "response.completed")?.data.response;

    expect(response.model).toBe("claude-fable-5");
    expect(response.output).toMatchObject([{
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "OK" }],
    }]);
    expect(response.usage).toEqual({
      input_tokens: 12,
      input_tokens_details: { cached_tokens: 2 },
      output_tokens: 1,
      total_tokens: 13,
    });
  });

  it("emits Codex-compatible cache details when Claude only creates cache", () => {
    const state = initState(FORMATS.OPENAI_RESPONSES);
    const events = [
      chatChunk({ content: "OK" }),
      {
        id: "chatcmpl-fable-index",
        model: "claude-fable-5",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 20,
          completion_tokens: 1,
          total_tokens: 21,
          prompt_tokens_details: { cache_creation_tokens: 18 },
        },
      },
    ].flatMap((chunk) => translateResponse(
      FORMATS.OPENAI,
      FORMATS.OPENAI_RESPONSES,
      chunk,
      state,
    ));

    const completed = events.find(({ event }) => event === "response.completed")?.data.response;
    expect(completed.usage.input_tokens_details).toEqual({
      cached_tokens: 0,
      cache_creation_tokens: 18,
      cache_write_tokens: 18,
    });
  });

  it("preserves unique indexes through the production SSE pipeline", async () => {
    const text = await translateProductionStream([
      chatChunk({ reasoning_content: "planning" }),
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_probe",
          type: "function",
          function: { name: "echo_probe", arguments: '{"text":"probe"}' },
        }],
      }),
      chatChunk({}, "tool_calls"),
    ]);
    const added = parseWireEvents(text)
      .filter(({ event }) => event === "response.output_item.added")
      .map(({ data }) => ({ type: data.item.type, index: data.output_index }));

    expect(added).toEqual([
      { type: "reasoning", index: 0 },
      { type: "function_call", index: 1 },
    ]);
    expect(text.match(/^data: \[DONE\]$/gm)).toHaveLength(1);
  });
});
