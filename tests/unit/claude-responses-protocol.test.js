import { describe, expect, it } from "vitest";

import { translateNonStreamingResponse } from "../../open-sse/handlers/chatCore/nonStreamingHandler.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";

async function translateClaudeStream(events) {
  const encoder = new TextEncoder();
  const input = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("")));
      controller.close();
    },
  });
  const output = input.pipeThrough(createSSETransformStreamWithLogger(
    FORMATS.CLAUDE,
    FORMATS.OPENAI,
    "claude",
    null,
    null,
    "claude-fable-5",
  ));

  return new Response(output).text();
}

describe("Claude Responses protocol", () => {
  it("returns Responses JSON for a non-streaming Responses request", () => {
    const result = translateNonStreamingResponse({
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "claude-fable-5",
      content: [{ type: "text", text: "OK" }],
      stop_reason: "end_turn",
      usage: { input_tokens: 12, output_tokens: 2 },
    }, FORMATS.CLAUDE, FORMATS.OPENAI_RESPONSES);

    expect(result).toMatchObject({
      id: "resp_chatcmpl-msg_test",
      object: "response",
      status: "completed",
      model: "claude-fable-5",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "OK" }],
      }],
      usage: { input_tokens: 12, output_tokens: 2, total_tokens: 14 },
    });
  });

  it("terminates translated OpenAI Chat streams with one DONE sentinel", async () => {
    const output = await translateClaudeStream([
      {
        type: "message_start",
        message: {
          id: "msg_test",
          model: "claude-fable-5",
          usage: { input_tokens: 12, output_tokens: 0 },
        },
      },
      { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "OK" } },
      { type: "content_block_stop", index: 0 },
      { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 2 } },
      { type: "message_stop" },
    ]);

    expect(output).toContain('"finish_reason":"stop"');
    expect(output.match(/data: \[DONE\]/g)).toHaveLength(1);
  });
});
