import { describe, expect, it } from "vitest";
import { createResponsesApiTransformStream } from "../../open-sse/transformer/responsesTransformer.js";

const encoder = new TextEncoder();

function chatChunk(delta, finishReason = null) {
  return `data: ${JSON.stringify({
    id: "chatcmpl-fable-index",
    choices: [{ index: 0, delta, finish_reason: finishReason }],
  })}\n\n`;
}

async function translateChatStream(chunks) {
  const source = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });

  return new Response(source.pipeThrough(createResponsesApiTransformStream())).text();
}

function parseEvents(text) {
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
  it("keeps reasoning and a function call on distinct stable indexes", async () => {
    const text = await translateChatStream([
      chatChunk({ reasoning_content: "considering" }),
      chatChunk({
        tool_calls: [{
          index: 0,
          id: "call_probe",
          type: "function",
          function: { name: "echo_probe", arguments: '{"text":"probe"}' },
        }],
      }),
      chatChunk({}, "tool_calls"),
      "data: [DONE]\n\n",
    ]);
    const events = parseEvents(text);
    const added = events
      .filter(({ event }) => event === "response.output_item.added")
      .map(({ data }) => ({ type: data.item.type, index: data.output_index }));
    const functionIndexes = events
      .filter(({ data }) => data.item_id === "fc_call_probe" || data.item?.call_id === "call_probe")
      .map(({ data }) => data.output_index);

    expect(added).toEqual([
      { type: "reasoning", index: 0 },
      { type: "function_call", index: 1 },
    ]);
    expect(new Set(functionIndexes)).toEqual(new Set([1]));
    expect(events.filter(({ event }) => event === "response.completed")).toHaveLength(1);
    expect(text.match(/^data: \[DONE\]$/gm)).toHaveLength(1);
  });

  it("allocates one output index per function call after reasoning", async () => {
    const text = await translateChatStream([
      chatChunk({ reasoning_content: "planning" }),
      chatChunk({
        tool_calls: [
          {
            index: 0,
            id: "call_first",
            type: "function",
            function: { name: "first_tool", arguments: "{}" },
          },
          {
            index: 1,
            id: "call_second",
            type: "function",
            function: { name: "second_tool", arguments: "{}" },
          },
        ],
      }),
      chatChunk({}, "tool_calls"),
      "data: [DONE]\n\n",
    ]);
    const added = parseEvents(text)
      .filter(({ event }) => event === "response.output_item.added")
      .map(({ data }) => ({ type: data.item.type, index: data.output_index }));

    expect(added).toEqual([
      { type: "reasoning", index: 0 },
      { type: "function_call", index: 1 },
      { type: "function_call", index: 2 },
    ]);
  });
});
