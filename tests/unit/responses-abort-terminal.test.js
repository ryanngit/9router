import { describe, expect, it } from "vitest";

import { FORMATS } from "../../open-sse/translator/formats.js";
import { createSSETransformStreamWithLogger } from "../../open-sse/utils/stream.js";
import { createDisconnectAwareStream, pipeWithDisconnect } from "../../open-sse/utils/streamHandler.js";
import { buildAbortedResponsesTerminalBytes } from "../../open-sse/utils/responsesStreamHelpers.js";

// Minimal stream controller stub
function makeController() {
  let connected = true;
  return {
    signal: new AbortController().signal,
    startTime: Date.now(),
    isConnected: () => connected,
    handleComplete: () => { connected = false; },
    handleError: () => { connected = false; },
    handleDisconnect: () => { connected = false; },
    abort: () => { connected = false; },
  };
}

async function readAll(stream) {
  const reader = stream.getReader();
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

describe("Responses abort terminal synthesis", () => {
  it("emits response.failed + [DONE] when upstream errors (abort/stall)", async () => {
    // Upstream readable that errors mid-stream (simulates fetch abort on stall)
    const upstream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("event: response.created\ndata: {}\n\n"));
        controller.error(new Error("stream stall timeout"));
      },
    });

    const out = createDisconnectAwareStream(
      { readable: upstream, writable: { getWriter: () => ({ abort: () => Promise.resolve() }) } },
      makeController(),
      buildAbortedResponsesTerminalBytes
    );

    const text = await readAll(out);
    expect(text).toContain("event: response.failed");
    expect(text).toContain("data: [DONE]");
  });

  it("does not synthesize terminal for non-Responses streams (callback null)", async () => {
    const upstream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: hi\n\n"));
        controller.error(new Error("socket hang up"));
      },
    });

    const out = createDisconnectAwareStream(
      { readable: upstream, writable: { getWriter: () => ({ abort: () => Promise.resolve() }) } },
      makeController(),
      null
    );

    const text = await readAll(out);
    expect(text).not.toContain("response.failed");
    expect(text).not.toContain("[DONE]");
  });

  it("does not emit response.failed after a valid terminal event", async () => {
    let sentTerminal = false;
    const upstream = new ReadableStream({
      pull(controller) {
        if (!sentTerminal) {
          sentTerminal = true;
          controller.enqueue(new TextEncoder().encode(
            'event: response.completed\ndata: {"type":"response.completed"}\n\n'
          ));
          return;
        }
        controller.error(new Error("ECONNRESET"));
      },
    });
    const transform = {
      readable: upstream,
      writable: { getWriter: () => ({ abort: () => Promise.resolve() }) },
      getOpenAIResponsesTerminationState: () => ({ terminalSeen: true, doneSeen: false }),
    };

    const out = createDisconnectAwareStream(
      transform,
      makeController(),
      buildAbortedResponsesTerminalBytes
    );

    const text = await readAll(out);
    expect(text).toContain("event: response.completed");
    expect(text).not.toContain("event: response.failed");
    expect(text.match(/data: \[DONE\]/g)).toHaveLength(1);
  });

  it("preserves terminal state through the production pipe wrapper", async () => {
    let sentTerminal = false;
    const upstream = new ReadableStream({
      pull(controller) {
        if (!sentTerminal) {
          sentTerminal = true;
          controller.enqueue(new TextEncoder().encode(
            'event: response.completed\ndata: {"type":"response.completed","response":{"status":"completed"}}\n\n'
          ));
          return;
        }
        controller.error(new Error("ECONNRESET"));
      },
    });
    const transform = createSSETransformStreamWithLogger(
      FORMATS.OPENAI_RESPONSES,
      FORMATS.OPENAI_RESPONSES,
      "xai",
    );

    const out = pipeWithDisconnect(
      new Response(upstream, { headers: { "content-type": "text/event-stream" } }),
      transform,
      makeController(),
      buildAbortedResponsesTerminalBytes,
      60_000,
    );
    const text = await readAll(out);

    expect(text).toContain("event: response.completed");
    expect(text).not.toContain("event: response.failed");
    expect(text.match(/data: \[DONE\]/g)).toHaveLength(1);
  });
});
