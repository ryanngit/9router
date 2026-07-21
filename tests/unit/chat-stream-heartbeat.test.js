import { afterEach, describe, expect, it, vi } from "vitest";

const { saveRequestDetailMock } = vi.hoisted(() => ({
  saveRequestDetailMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/usageDb.js", () => ({
  appendRequestLog: vi.fn(() => Promise.resolve()),
  saveRequestDetail: saveRequestDetailMock,
  saveRequestUsage: vi.fn(() => Promise.resolve()),
  trackPendingRequest: vi.fn(),
}));

import { handleStreamingResponse } from "../../open-sse/handlers/chatCore/streamingHandler.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { withOpenAIChatKeepalive } from "../../open-sse/utils/streamHandler.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function readAll(reader) {
  let output = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) return output + decoder.decode();
    output += decoder.decode(value, { stream: true });
  }
}

async function readSseEvent(reader) {
  let output = "";
  while (!output.includes("\n\n")) {
    const { value, done } = await reader.read();
    if (done) return output;
    output += decoder.decode(value, { stream: true });
  }
  return output;
}

afterEach(() => vi.useRealTimers());

describe("OpenAI Chat SSE keepalive", () => {
  it("emits a valid empty Chat chunk while provider output is idle", async () => {
    let upstream;
    const source = new ReadableStream({
      start(controller) {
        upstream = controller;
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"a"}}]}\n\n'));
      },
    });
    const reader = withOpenAIChatKeepalive(source, {
      keepaliveMs: 20,
      model: "gpt-5.6-sol",
    }).getReader();

    expect(decoder.decode((await reader.read()).value)).toContain('"content":"a"');
    const keepalive = decoder.decode((await reader.read()).value);
    const payload = JSON.parse(keepalive.slice("data: ".length));
    expect(Object.keys(payload)).toEqual(["id", "object", "created", "model", "choices"]);
    expect(payload).toMatchObject({
      id: "chatcmpl-9router-keepalive",
      object: "chat.completion.chunk",
      model: "gpt-5.6-sol",
      choices: [{ index: 0, delta: {}, finish_reason: null }],
    });

    upstream.close();
    await reader.cancel();
  });

  it("does not insert a keepalive inside a fragmented SSE event", async () => {
    const first = 'data: {"choices":[{"delta":{"content":"hel';
    const second = 'lo"}}]}\n\n';
    const source = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(first));
        setTimeout(() => {
          controller.enqueue(encoder.encode(second));
          controller.close();
        }, 30);
      },
    });

    const output = await readAll(withOpenAIChatKeepalive(source, {
      keepaliveMs: 10,
      model: "gpt-5.6-sol",
    }).getReader());

    expect(output).toBe(first + second);
  });

  it("clears its timer when downstream cancels", async () => {
    vi.useFakeTimers();
    const source = new ReadableStream({ start() {} });
    const reader = withOpenAIChatKeepalive(source, { keepaliveMs: 20 }).getReader();

    expect(vi.getTimerCount()).toBe(1);
    await reader.cancel("done");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("emits keepalives through the production Chat streaming handler", async () => {
    vi.useFakeTimers();
    let upstream;
    const providerResponse = new Response(new ReadableStream({
      start(controller) {
        upstream = controller;
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"a"}}]}\n\n'));
      },
    }), { headers: { "content-type": "text/event-stream" } });
    const streamController = {
      signal: undefined,
      isConnected: () => true,
      handleComplete: vi.fn(),
      handleError: vi.fn(),
      handleDisconnect: vi.fn(),
    };

    const result = await handleStreamingResponse({
      providerResponse,
      provider: "github",
      model: "claude-fable-5",
      sourceFormat: FORMATS.OPENAI,
      targetFormat: FORMATS.OPENAI,
      body: { model: "claude-fable-5", messages: [] },
      stream: true,
      requestTiming: { requestStartedAt: performance.now(), attemptStartedAt: performance.now(), phases: {} },
      connectionId: "test-connection",
      clientRawRequest: { body: { model: "claude-fable-5" } },
      reqLogger: {},
      streamController,
    });
    const reader = result.response.body.getReader();

    expect(await readSseEvent(reader)).toContain('"content":"a"');
    const keepaliveRead = reader.read();
    await vi.advanceTimersByTimeAsync(25_000);
    const firstKeepaliveChunk = await keepaliveRead;
    const keepalive = decoder.decode(firstKeepaliveChunk.value);
    expect(keepalive).toContain('"id":"chatcmpl-9router-keepalive"');
    expect(keepalive).toContain('"model":"claude-fable-5"');

    upstream.close();
    await reader.cancel("done");
  });
});
