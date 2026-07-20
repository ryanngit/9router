/**
 * Regression test for #1062:
 * GitHub Copilot's /responses endpoint rejects Gemini/Claude models. They
 * must never be routed/escalated there, otherwise they
 * fail with a misleading 400 "does not support Responses API".
 */

import { beforeEach, describe, it, expect, vi } from "vitest";
import { GithubExecutor } from "../../open-sse/executors/github.js";
import { resolveTransport, supportsNativeResponses } from "../../open-sse/services/provider.js";

const { executeMock, proxyFetchMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  proxyFetchMock: vi.fn(),
}));

vi.mock("../../open-sse/utils/proxyFetch.js", () => ({
  normalizeExplicitProxyOptions: vi.fn((options) => options),
  proxyAwareFetch: proxyFetchMock,
  redactProxyUrlForLog: vi.fn(() => "[proxy]"),
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
  saveRequestDetail: vi.fn(async () => {}),
  saveRequestUsage: vi.fn(async () => {}),
}));

const { handleResponsesCore } = await import("../../open-sse/handlers/responsesHandler.js");

beforeEach(() => {
  vi.restoreAllMocks();
  executeMock.mockReset();
  proxyFetchMock.mockReset();
});

describe("GithubExecutor.supportsResponsesEndpoint", () => {
  const exec = new GithubExecutor();

  it("excludes Gemini models from the /responses endpoint", () => {
    expect(exec.supportsResponsesEndpoint("gemini-3.1-pro-preview")).toBe(false);
    expect(exec.supportsResponsesEndpoint("gemini-3.1-pro-low")).toBe(false);
  });

  it("excludes Claude models from the /responses endpoint", () => {
    expect(exec.supportsResponsesEndpoint("claude-sonnet-4.6")).toBe(false);
    expect(exec.supportsResponsesEndpoint("claude-opus-4.7")).toBe(false);
    expect(exec.supportsResponsesEndpoint("claude-fable-5")).toBe(false);
  });

  it("allows OpenAI/codex models on the /responses endpoint", () => {
    expect(exec.supportsResponsesEndpoint("gpt-5.5-codex")).toBe(true);
    expect(exec.supportsResponsesEndpoint("o4-mini")).toBe(true);
    expect(exec.supportsResponsesEndpoint("gpt-4.1")).toBe(true);
  });

  it("preserves Responses support for other Copilot models", () => {
    expect(exec.supportsResponsesEndpoint("grok-code-fast-1")).toBe(true);
    expect(exec.supportsResponsesEndpoint("oswe-vscode-prime")).toBe(true);
    expect(exec.supportsResponsesEndpoint("future-model")).toBe(true);
  });
});

describe("GitHub native Responses capability", () => {
  it("uses model-aware transport selection", () => {
    expect(supportsNativeResponses("github", "gpt-5.4")).toBe(true);
    expect(supportsNativeResponses("github", "claude-fable-5")).toBe(false);
    expect(resolveTransport("github", "openai-responses", "gpt-5.4")?.baseUrl).toContain("/responses");
    expect(resolveTransport("github", "openai-responses", "claude-fable-5")).toBeNull();
  });
});

describe("GithubExecutor.execute cached-route guard (#1062)", () => {
  it("does NOT use /responses for a Gemini model even if it was wrongly cached as codex", async () => {
    const exec = new GithubExecutor();
    // Simulate a prior misclassification that cached the Gemini model.
    exec.knownCodexModels.add("gemini-3.1-pro-preview");

    const respSpy = vi
      .spyOn(exec, "executeWithResponsesEndpoint")
      .mockResolvedValue({ via: "responses" });
    // Short-circuit the /chat/completions path (BaseExecutor.execute).
    const baseSpy = vi
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(exec)), "execute")
      .mockResolvedValue({ response: { status: 200 }, via: "chat" });

    const result = await exec.execute({ model: "gemini-3.1-pro-preview", body: { messages: [] }, log: null });

    expect(respSpy).not.toHaveBeenCalled();
    expect(baseSpy).toHaveBeenCalled();
    expect(result.via).toBe("chat");
  });
});

describe("GithubExecutor native Responses transport", () => {
  it("posts Responses input directly to /responses and preserves non-stream JSON", async () => {
    proxyFetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      id: "resp_github",
      object: "response",
      model: "gpt-5.4",
      status: "completed",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "OK" }],
      }],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const exec = new GithubExecutor();
    const result = await exec.execute({
      model: "gpt-5.4",
      body: { input: "Reply OK only.", stream: false },
      stream: false,
      credentials: {
        copilotToken: "test-token",
        runtimeTransport: {
          format: "openai-responses",
          baseUrl: "https://api.githubcopilot.com/responses",
        },
      },
      requestId: "019f7fa1-0d8d-7000-8000-000000000001",
      log: { debug: vi.fn() },
    });

    expect(proxyFetchMock).toHaveBeenCalledTimes(1);
    expect(proxyFetchMock.mock.calls[0][0]).toBe("https://api.githubcopilot.com/responses");
    expect(proxyFetchMock.mock.calls[0][1].headers["x-request-id"])
      .toBe("019f7fa1-0d8d-7000-8000-000000000001");
    expect(JSON.parse(proxyFetchMock.mock.calls[0][1].body)).toMatchObject({
      model: "gpt-5.4",
      input: "Reply OK only.",
      stream: false,
    });
    expect(await result.response.json()).toMatchObject({
      object: "response",
      output: [{ content: [{ text: "OK" }] }],
    });
  });
});

describe("GitHub request correlation", () => {
  it("adds request id to regular chat requests", async () => {
    proxyFetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }));
    const exec = new GithubExecutor();

    await exec.execute({
      model: "future-model",
      body: { messages: [{ role: "user", content: "hello" }] },
      stream: true,
      credentials: { copilotToken: "test-token" },
      requestId: "019f7fa1-0d8d-7000-8000-000000000001",
    });

    expect(proxyFetchMock).toHaveBeenCalledTimes(1);
    expect(proxyFetchMock.mock.calls[0][1].headers["x-request-id"])
      .toBe("019f7fa1-0d8d-7000-8000-000000000001");
  });

  it.each([
    ["Claude messages", "executeWithMessagesEndpoint", "claude-fable-5"],
    ["native Responses", "executeWithResponsesEndpoint", "gpt-5.4"],
  ])("forwards request id through %s", async (_label, method, model) => {
    proxyFetchMock.mockResolvedValueOnce(new Response("bad request", { status: 400 }));
    const exec = new GithubExecutor();

    await exec[method]({
      model,
      body: { messages: [{ role: "user", content: "hello" }] },
      stream: true,
      credentials: { copilotToken: "test-token" },
      requestId: "019f7fa1-0d8d-7000-8000-000000000001",
    });

    expect(proxyFetchMock).toHaveBeenCalledTimes(1);
    expect(proxyFetchMock.mock.calls[0][1].headers["x-request-id"])
      .toBe("019f7fa1-0d8d-7000-8000-000000000001");
  });
});

describe("GitHub Claude Responses bridge", () => {
  it("uses Chat upstream and returns Responses JSON to the caller", async () => {
    executeMock.mockImplementationOnce(async (args) => ({
      response: new Response(JSON.stringify({
        id: "chatcmpl_test",
        object: "chat.completion",
        created: 1,
        model: "claude-fable-5",
        choices: [{ index: 0, message: { role: "assistant", content: "OK" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }), { status: 200, headers: { "content-type": "application/json" } }),
      url: "https://api.githubcopilot.com/chat/completions",
      headers: {},
      transformedBody: args.body,
    }));

    const result = await handleResponsesCore({
      body: {
        model: "claude-fable-5",
        input: [{
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Reply OK only." }],
        }],
      },
      modelInfo: { provider: "github", model: "claude-fable-5" },
      credentials: { accessToken: "test-token", providerSpecificData: {} },
      connectionId: "github-fable-test",
      log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(result.success).toBe(true);
    expect(executeMock).toHaveBeenCalledTimes(1);
    const call = executeMock.mock.calls[0][0];
    expect(call.body.input).toBeUndefined();
    expect(call.body.messages).toHaveLength(1);
    expect(call.body.messages[0]).toMatchObject({ role: "user" });
    expect(call.credentials.runtimeTransport).toBeUndefined();

    const json = await result.response.json();
    expect(json).toMatchObject({
      object: "response",
      status: "completed",
      model: "claude-fable-5",
      output: [{
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "OK" }],
      }],
      usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 },
    });
    expect(json.choices).toBeUndefined();
    expect(json.created).toBeUndefined();
  });
});
