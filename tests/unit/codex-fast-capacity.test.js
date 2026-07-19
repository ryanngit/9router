import { describe, expect, it } from "vitest";
import { CodexExecutor } from "../../open-sse/executors/codex.js";

function streamFromText(text) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function idTokenFor(accountId) {
  const payload = Buffer.from(JSON.stringify({
    "https://api.openai.com/auth": { chatgpt_account_id: accountId },
  })).toString("base64url");
  return `header.${payload}.signature`;
}

describe("Codex fast tier and capacity handling", () => {
  it("maps Codex fast tier to priority and preserves max reasoning", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "hi",
      reasoning: { effort: "max" },
      service_tier: "fast",
    }, true, {});

    expect(body.service_tier).toBe("priority");
    expect(body.reasoning.effort).toBe("max");
  });

  it("keeps fast tier below the short-context limit", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "word ".repeat(220_000),
      service_tier: "fast",
    }, true, {});

    expect(body.service_tier).toBe("priority");
  });

  it("does not round every JSON punctuation mark up to one token", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "key:value,".repeat(110_000),
      service_tier: "fast",
    }, true, {});

    expect(body.service_tier).toBe("priority");
  });

  it("removes direct priority tier from long GPT requests", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "word ".repeat(260_000),
      service_tier: "priority",
    }, true, {});

    expect(body.service_tier).toBeUndefined();
  });

  it("counts whitespace-heavy long input conservatively", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: `x${" ".repeat(1_024_000)}`,
      service_tier: "fast",
    }, true, {});

    expect(body.service_tier).toBeUndefined();
  });

  it("drops unsupported fast and priority tiers for GPT-5.6", () => {
    const executor = new CodexExecutor();
    const fast = executor.transformRequest("gpt-5.6-sol", {
      model: "gpt-5.6-sol",
      input: "hi",
      service_tier: "fast",
    }, true, {});
    const priority = executor.transformRequest("gpt-5.6-sol", {
      model: "gpt-5.6-sol",
      input: "hi",
      service_tier: "priority",
    }, true, {});

    expect(fast.service_tier).toBeUndefined();
    expect(priority.service_tier).toBeUndefined();
  });

  it("counts non-ASCII input conservatively", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "é".repeat(256_000),
      service_tier: "fast",
    }, true, {});

    expect(body.service_tier).toBeUndefined();
  });

  it("leaves non-GPT priority requests unchanged", () => {
    const executor = new CodexExecutor();
    const body = executor.transformRequest("claude-opus-4.8", {
      model: "claude-opus-4.8",
      input: "word ".repeat(220_000),
      service_tier: "priority",
    }, true, {});

    expect(body.service_tier).toBe("priority");
  });

  it("normalizes GPT-5.6 reasoning to max without changing GPT-5.5 xhigh", () => {
    const executor = new CodexExecutor();
    const defaulted = executor.transformRequest("gpt-5.6-sol", {
      model: "gpt-5.6-sol",
      input: "hi",
    }, true, {});
    const legacy = executor.transformRequest("gpt-5.6-terra", {
      model: "gpt-5.6-terra",
      input: "hi",
      reasoning: { effort: "xhigh" },
    }, true, {});
    const suffix = executor.transformRequest("gpt-5.6-luna-max", {
      model: "gpt-5.6-luna-max",
      input: "hi",
    }, true, {});
    const previousModel = executor.transformRequest("gpt-5.5", {
      model: "gpt-5.5",
      input: "hi",
      reasoning: { effort: "xhigh" },
    }, true, {});

    expect(defaulted.reasoning.effort).toBe("max");
    expect(legacy.reasoning.effort).toBe("max");
    expect(suffix).toMatchObject({ model: "gpt-5.6-luna", reasoning: { effort: "max" } });
    expect(previousModel.reasoning.effort).toBe("xhigh");
  });

  it("uses the id token account when provider data is missing", () => {
    const executor = new CodexExecutor();
    const headers = executor.buildHeaders({
      accessToken: "token",
      connectionId: "conn_1",
      providerSpecificData: {},
      idToken: idTokenFor("legacy_ws"),
    });

    expect(headers["ChatGPT-Account-ID"]).toBe("legacy_ws");
  });

  it("classifies 200-SSE model capacity as account fallback", async () => {
    const executor = new CodexExecutor();
    const response = new Response(streamFromText([
      "event: error",
      'data: {"error":{"message":"Selected model is at capacity. Please try a different model."}}',
      "",
    ].join("\n")), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

    const peek = await executor._peekSseTransientError(response);
    expect(peek.accountFallback).toBe(true);
    expect(peek.message).toBe("Selected model is at capacity. Please try a different model.");
  });

  it("reassembles normal SSE after peeking", async () => {
    const executor = new CodexExecutor();
    const text = [
      "event: response.output_text.delta",
      'data: {"type":"response.output_text.delta","delta":"OK"}',
      "",
    ].join("\n");
    const response = new Response(streamFromText(text), {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });

    const peek = await executor._peekSseTransientError(response);
    expect(peek.matched).toBeNull();
    await expect(new Response(peek.replacementBody).text()).resolves.toBe(text);
  });
});
