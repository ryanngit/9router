import { describe, expect, it, vi } from "vitest";

import { FORMATS } from "../../open-sse/translator/formats.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";

async function runTransform(input, sourceFormat = FORMATS.OPENAI_RESPONSES, onStreamComplete = null) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(input));
      controller.close();
    },
  });

  const output = stream.pipeThrough(
    createSSETransformStreamWithLogger(
      FORMATS.OPENAI_RESPONSES,
      sourceFormat,
      "codex",
      null,
      null,
      "gpt-5.5",
      null,
      null,
      onStreamComplete,
    ),
  );

  const reader = output.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

describe("OpenAI Responses streaming termination", () => {
  it("emits a response.failed event when a Responses stream closes before a terminal event", async () => {
    const output = await runTransform([
      `event: response.created`,
      `data: ${JSON.stringify({ type: "response.created", response: { id: "resp_test", status: "in_progress" } })}`,
      "",
      `event: response.output_text.delta`,
      `data: ${JSON.stringify({ type: "response.output_text.delta", delta: "partial" })}`,
      "",
    ].join("\n"));

    expect(output).toContain("event: response.failed");
    expect(output).toContain('"type":"response.failed"');
    expect(output).not.toContain("data: null");
    expect(output).toContain("data: [DONE]");
  });

  it("does not add response.failed when a Responses stream already completed", async () => {
    const output = await runTransform([
      `event: response.completed`,
      `data: ${JSON.stringify({ type: "response.completed", response: { id: "resp_test", status: "completed" } })}`,
      "",
    ].join("\n"));

    expect(output).toContain("event: response.completed");
    expect(output).not.toContain("event: response.failed");
    expect(output).not.toContain("data: null");
    expect(output).toContain("data: [DONE]");
  });

  it("does not add response.failed when a Responses stream sends response.done", async () => {
    const output = await runTransform([
      `event: response.done`,
      `data: ${JSON.stringify({ type: "response.done", response: { id: "resp_test" } })}`,
      "",
    ].join("\n"));

    expect(output).toContain("event: response.done");
    expect(output).not.toContain("event: response.failed");
    expect(output).not.toContain("data: null");
    expect(output).toContain("data: [DONE]");
  });

  it("treats response.incomplete as a valid terminal event", async () => {
    const output = await runTransform([
      `event: response.incomplete`,
      `data: ${JSON.stringify({
        type: "response.incomplete",
        response: {
          id: "resp_test",
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
        },
      })}`,
      "",
    ].join("\n"));

    expect(output).toContain("event: response.incomplete");
    expect(output).not.toContain("event: response.failed");
    expect(output.match(/data: \[DONE\]/g)).toHaveLength(1);
  });

  it("tracks usage from a same-wire response.incomplete terminal", async () => {
    const onStreamComplete = vi.fn();
    const usage = {
      input_tokens: 120,
      output_tokens: 30,
      input_tokens_details: { cached_tokens: 80 },
      output_tokens_details: { reasoning_tokens: 7 },
    };

    await runTransform([
      "event: response.incomplete",
      `data: ${JSON.stringify({
        type: "response.incomplete",
        response: {
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
          usage,
        },
      })}`,
      "",
    ].join("\n"), FORMATS.OPENAI_RESPONSES, onStreamComplete);

    expect(onStreamComplete).toHaveBeenCalledOnce();
    expect(onStreamComplete.mock.calls[0][1]).toMatchObject({
      prompt_tokens: 120,
      completion_tokens: 30,
      cached_tokens: 80,
      reasoning_tokens: 7,
      prompt_tokens_details: { cached_tokens: 80 },
    });
  });

  it("maps response.incomplete to a Chat length finish reason", async () => {
    const output = await runTransform([
      `event: response.incomplete`,
      `data: ${JSON.stringify({
        type: "response.incomplete",
        response: {
          id: "resp_test",
          status: "incomplete",
          incomplete_details: { reason: "max_output_tokens" },
        },
      })}`,
      "",
    ].join("\n"), FORMATS.OPENAI);

    expect(output).toContain('"finish_reason":"length"');
  });

  it("emits response.failed before DONE when a Responses stream sends DONE without a terminal event", async () => {
    const output = await runTransform([
      `event: response.created`,
      `data: ${JSON.stringify({ type: "response.created", response: { id: "resp_test", status: "in_progress" } })}`,
      "",
      "data: [DONE]",
      "",
    ].join("\n"));

    expect(output.indexOf("event: response.failed")).toBeLessThan(output.indexOf("data: [DONE]"));
    expect(output.match(/data: \[DONE\]/g)).toHaveLength(1);
    expect(output).not.toContain("data: null");
  });
});
