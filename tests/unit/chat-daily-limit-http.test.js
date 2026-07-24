import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  clearAccountError: vi.fn(),
  getProviderCredentials: vi.fn(),
  markAccountUnavailable: vi.fn(),
}));
const modelMocks = vi.hoisted(() => ({
  getComboModels: vi.fn(),
  getModelInfo: vi.fn(),
}));
const dispatchMocks = vi.hoisted(() => ({
  handleChatCore: vi.fn(),
}));
const executorMocks = vi.hoisted(() => ({ execute: vi.fn() }));
const reservationReleaseMocks = vi.hoisted(() => ({ call: vi.fn() }));
const affinityMocks = vi.hoisted(() => ({ remember: vi.fn() }));
const requestLoggerMocks = vi.hoisted(() => ({ create: vi.fn() }));
const tokenMocks = vi.hoisted(() => ({
  checkAndRefreshToken: vi.fn(),
  resolveRefreshProxyOptions: vi.fn(() => ({})),
  updateProviderCredentials: vi.fn(),
}));

vi.mock("@/sse/services/auth.js", async (importOriginal) => ({
  ...await importOriginal(),
  clearAccountError: authMocks.clearAccountError,
  getProviderCredentials: authMocks.getProviderCredentials,
  markAccountUnavailable: authMocks.markAccountUnavailable,
}));
vi.mock("@/sse/services/model.js", () => modelMocks);
vi.mock("open-sse/handlers/chatCore.js", () => dispatchMocks);
vi.mock("@/sse/services/tokenRefresh.js", () => tokenMocks);
vi.mock("@/lib/db/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    releaseApiKeyUsageReservation: (...args) => {
      reservationReleaseMocks.call(...args);
      return actual.releaseApiKeyUsageReservation(...args);
    },
  };
});
vi.mock("../../open-sse/executors/index.js", () => ({
  getExecutor: () => ({
    noAuth: true,
    execute: executorMocks.execute,
  }),
}));
vi.mock("../../open-sse/utils/requestLogger.js", () => ({
  createRequestLogger: requestLoggerMocks.create,
}));
vi.mock("@/sse/services/cacheAffinity.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    rememberCacheAffinity: affinityMocks.remember,
  };
});

const originalDataDir = process.env.DATA_DIR;
const originalBestGptEnabled = process.env.NINE_ROUTER_BEST_GPT_ENABLED;
let tempDir;
let apiKey;
let db;
let limitedApiKey;
let rawDb;
let unlimitedApiKey;
let postChat;
let actualHandleChatCore;
let postResponses;
let FORMATS;
let handleForcedSSEToJson;
let translateRequest;

function credentials(id = "connection-test") {
  return {
    connectionId: id,
    connectionName: id,
    authType: "apikey",
    apiKey: "provider-key",
    providerSpecificData: {},
  };
}

function successResult(content = "ok") {
  return {
    success: true,
    response: new Response(JSON.stringify({
      id: "chat-test",
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

function failureResult(status = 400, error = "upstream failed") {
  return {
    success: false,
    status,
    error,
    response: new Response(JSON.stringify({ error: { message: error } }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  };
}

function forcedResponsesFailure(kind) {
  if (kind === "conversion throw") {
    return new Response(new ReadableStream({
      pull() {
        throw new Error("forced conversion failure");
      },
    }), { headers: { "content-type": "text/event-stream" } });
  }

  if (kind === "done as failed" || kind === "done as incomplete") {
    const status = kind === "done as failed" ? "failed" : "incomplete";
    return new Response([
      "event: response.done",
      `data: ${JSON.stringify({
        response: {
          id: `resp-${status}`,
          status,
          usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        },
      })}`,
      "",
    ].join("\n"), { headers: { "content-type": "text/event-stream" } });
  }

  const events = kind === "response.failed"
    ? [
        "event: response.failed",
        `data: ${JSON.stringify({ response: { id: "resp-failed", status: "failed" } })}`,
        "",
      ]
    : kind === "completed as incomplete"
      ? [
          "event: response.completed",
          `data: ${JSON.stringify({
            response: {
              id: "resp-incomplete",
              status: "incomplete",
              usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
            },
          })}`,
          "",
        ]
    : [
        "event: response.created",
        `data: ${JSON.stringify({ response: { id: "resp-incomplete", status: "in_progress" } })}`,
        "",
      ];
  return new Response(events.join("\n"), { headers: { "content-type": "text/event-stream" } });
}

const streamEncoder = new TextEncoder();
const streamDecoder = new TextDecoder();

function controlledSseResponse(payload) {
  let controllerRef;
  const cancel = vi.fn();
  const response = new Response(new ReadableStream({
    start(controller) {
      controllerRef = controller;
      controller.enqueue(streamEncoder.encode(payload));
    },
    cancel,
  }), { headers: { "content-type": "text/event-stream" } });
  return {
    response,
    cancel,
    fail(error = new Error("ECONNRESET")) {
      controllerRef.error(error);
    },
  };
}

function installActualStreamingDispatch({ payload, responseFormat }) {
  const upstream = controlledSseResponse(payload);
  let providerSignal;
  executorMocks.execute.mockImplementation(async (options) => {
    providerSignal = options.signal;
    return {
      response: upstream.response,
      url: "https://provider.invalid/v1/stream",
      headers: {},
      transformedBody: options.body,
      responseFormat,
    };
  });
  dispatchMocks.handleChatCore.mockImplementation((options) => (
    actualHandleChatCore(options)
  ));
  return {
    ...upstream,
    get providerSignal() {
      return providerSignal;
    },
  };
}

function directPartialSse() {
  return `data: ${JSON.stringify({
    id: "chatcmpl-cancel-partial",
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta: { content: "partial" }, finish_reason: null }],
  })}\n\n`;
}

function directTerminalSse() {
  return `data: ${JSON.stringify({
    id: "chatcmpl-cancel-terminal",
    object: "chat.completion.chunk",
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
  })}\n\n`;
}

function responsesPartialSse() {
  return [
    "event: response.output_text.delta",
    `data: ${JSON.stringify({
      type: "response.output_text.delta",
      output_index: 0,
      content_index: 0,
      delta: "partial",
    })}`,
    "",
    "",
  ].join("\n");
}

function responsesTerminalSse({
  usage = { input_tokens: 2, output_tokens: 1, total_tokens: 3 },
  omitUsage = false,
} = {}) {
  const response = {
    id: "resp-cancel-terminal",
    object: "response",
    created_at: 1,
    status: "completed",
    model: "gpt-5.6-sol",
    output: [],
  };
  if (!omitUsage) response.usage = usage;
  return [
    "event: response.completed",
    `data: ${JSON.stringify({ type: "response.completed", response })}`,
    "",
    "",
  ].join("\n");
}

async function createLimitedKey(name) {
  return db.createApiKey(name, "machine-test", 1_000_000);
}

function reservationCountFor(keyId) {
  return rawDb.get(
    "SELECT COUNT(*) AS count FROM apiKeyUsageReservations WHERE apiKeyId = ?",
    [keyId],
  ).count;
}

function usageCountFor(key) {
  return rawDb.get(
    "SELECT COUNT(*) AS count FROM usageHistory WHERE apiKey = ?",
    [key],
  ).count;
}

async function readChunk(reader) {
  const { value, done } = await reader.read();
  expect(done).toBe(false);
  return streamDecoder.decode(value);
}

beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "9router-chat-limit-"));
  process.env.DATA_DIR = tempDir;
  process.env.NINE_ROUTER_BEST_GPT_ENABLED = "false";
  vi.resetModules();

  db = await import("@/lib/db/index.js");
  await db.initDb();
  ({ instance: rawDb } = global._dbAdapter);
  apiKey = await db.createApiKey("exhausted-key", "machine-test", 100);
  limitedApiKey = await db.createApiKey("limited-key", "machine-test", 1_000_000);
  unlimitedApiKey = await db.createApiKey("unlimited-key", "machine-test");
  await db.saveRequestUsage({
    provider: "openai",
    model: "gpt-4o",
    apiKey: apiKey.key,
    tokens: { prompt_tokens: 60, completion_tokens: 30, reasoning_tokens: 20 },
  });
  rawDb.exec(`
    CREATE TABLE reservationAudit(action TEXT NOT NULL, reservationId TEXT NOT NULL);
    CREATE TRIGGER audit_reservation_insert AFTER INSERT ON apiKeyUsageReservations
      BEGIN INSERT INTO reservationAudit(action, reservationId) VALUES('insert', NEW.id); END;
    CREATE TRIGGER audit_reservation_delete AFTER DELETE ON apiKeyUsageReservations
      BEGIN INSERT INTO reservationAudit(action, reservationId) VALUES('delete', OLD.id); END;
  `);

  ({ FORMATS } = await import("../../open-sse/translator/formats.js"));
  ({ translateRequest } = await import("../../open-sse/translator/index.js"));
  ({ handleForcedSSEToJson } = await import("../../open-sse/handlers/chatCore/sseToJsonHandler.js"));
  ({ handleChatCore: actualHandleChatCore } = await vi.importActual(
    "../../open-sse/handlers/chatCore.js"
  ));
  ({ POST: postResponses } = await import("@/app/api/v1/responses/route.js"));
  ({ POST: postChat } = await import("@/app/api/v1/chat/completions/route.js"));
}, 60_000);

afterAll(() => {
  try { rawDb?.close?.(); } catch {}
  delete global._dbAdapter;
  fs.rmSync(tempDir, { recursive: true, force: true });
  if (originalDataDir === undefined) delete process.env.DATA_DIR;
  else process.env.DATA_DIR = originalDataDir;
  if (originalBestGptEnabled === undefined) delete process.env.NINE_ROUTER_BEST_GPT_ENABLED;
  else process.env.NINE_ROUTER_BEST_GPT_ENABLED = originalBestGptEnabled;
});

beforeEach(async () => {
  vi.clearAllMocks();
  executorMocks.execute.mockReset();
  reservationReleaseMocks.call.mockClear();
  affinityMocks.remember.mockClear();
  requestLoggerMocks.create.mockReset().mockImplementation(async () => ({
    logClientRawRequest: vi.fn(),
    logRawRequest: vi.fn(),
    logTargetRequest: vi.fn(),
    logProviderResponse: vi.fn(),
    logConvertedResponse: vi.fn(),
    logError: vi.fn(),
    appendProviderChunk: vi.fn(),
    appendConvertedChunk: vi.fn(),
    appendOpenAIChunk: vi.fn(),
  }));
  authMocks.clearAccountError.mockReset().mockResolvedValue(undefined);
  authMocks.getProviderCredentials.mockReset().mockResolvedValue(credentials());
  authMocks.markAccountUnavailable.mockReset().mockResolvedValue({ shouldFallback: false, cooldownMs: 0 });
  modelMocks.getComboModels.mockReset().mockResolvedValue(null);
  modelMocks.getModelInfo.mockReset().mockImplementation(async (modelStr) => {
    const [provider, ...modelParts] = modelStr.split("/");
    return { provider, model: modelParts.join("/") };
  });
  dispatchMocks.handleChatCore.mockReset().mockResolvedValue(successResult());
  tokenMocks.checkAndRefreshToken.mockReset().mockImplementation(async (_provider, value) => value);
  tokenMocks.updateProviderCredentials.mockReset().mockResolvedValue(undefined);
  rawDb.run("DELETE FROM apiKeyUsageReservations");
  rawDb.run("DELETE FROM reservationAudit");
  await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: 1_000_000 });
  await db.updateSettings({
    comboStrategy: "fallback",
    comboStrategies: {},
    providerThinking: {},
    cavemanEnabled: false,
    ponytailEnabled: false,
    providerStrategies: {},
  });
});

describe("POST /v1/chat/completions daily token admission", () => {
  it("returns 429 after model resolution but before account selection or upstream dispatch", async () => {
    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: {
        message: "API key daily token limit exceeded (90/100 tokens)",
        type: "rate_limit_error",
        code: "rate_limit_exceeded",
      },
    });
    expect(modelMocks.getComboModels).toHaveBeenCalledWith("openai/gpt-4o");
    expect(modelMocks.getModelInfo).toHaveBeenCalledWith("openai/gpt-4o");
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
    expect(rawDb.get("SELECT COUNT(*) AS count FROM reservationAudit").count).toBe(0);
  });

  it("rejects a low-token tool request using its effective 32000-token output budget", async () => {
    const body = {
      model: "openai/gpt-4o",
      messages: [],
      max_tokens: 1,
      tools: [{ type: "function", function: { name: "lookup", parameters: { type: "object" } } }],
    };
    const effectiveEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 32_000;
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: effectiveEstimate - 1 });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
    expect(rawDb.get("SELECT COUNT(*) AS count FROM reservationAudit").count).toBe(0);
  });

  it("rejects Cursor low-token candidates using the translated 32000 ceiling", async () => {
    const body = {
      model: "cursor/cursor-model",
      messages: [],
      max_tokens: 1,
      max_completion_tokens: 2,
    };
    const effectiveEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 32_000;
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: effectiveEstimate - 1 });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it("rejects Claude low alternate candidates using the translated 64000 default", async () => {
    const body = {
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [],
      max_completion_tokens: 1,
      max_output_tokens: 2,
    };
    const effectiveEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 64_000;
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: effectiveEstimate - 1 });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it("rejects a dynamic Anthropic-compatible provider using the translated 64000 default", async () => {
    const body = {
      model: "anthropic-compatible-team/claude-custom",
      messages: [],
      max_completion_tokens: 1,
    };
    const effectiveEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 64_000;
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: effectiveEstimate - 1 });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it.each([
    ["Kiro", "kiro/claude-sonnet-4.6", { max_tokens: 1, max_completion_tokens: 2 }, 32_000],
    ["CommandCode", "commandcode/deepseek/deepseek-v4-pro", { max_completion_tokens: 1 }, 64_000],
  ])("rejects %s low-token candidates using its translated ceiling", async (_name, model, fields, outputTokens) => {
    const body = { model, messages: [], ...fields };
    const effectiveEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + outputTokens;
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: effectiveEstimate - 1 });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it("measures alias input bytes from the exact resolved dispatch body", async () => {
    const body = { model: "a", messages: [], max_tokens: 1 };
    const resolvedModel = "provider-with-long-name/model-with-long-name";
    const originalEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 1;
    const resolvedEstimate = Buffer.byteLength(JSON.stringify({ ...body, model: resolvedModel }), "utf8") + 1;
    expect(resolvedEstimate).toBeGreaterThan(originalEstimate);
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: originalEstimate });
    modelMocks.getModelInfo.mockResolvedValue({
      provider: "provider-with-long-name",
      model: "model-with-long-name",
    });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it("measures combo-member input bytes from the exact resolved dispatch body", async () => {
    const body = { model: "c", messages: [], max_tokens: 1 };
    const member = "provider-with-long-name/model-with-long-name";
    const originalEstimate = Buffer.byteLength(JSON.stringify(body), "utf8") + 1;
    const resolvedEstimate = Buffer.byteLength(JSON.stringify({ ...body, model: member }), "utf8") + 1;
    expect(resolvedEstimate).toBeGreaterThan(originalEstimate);
    await db.updateApiKey(limitedApiKey.id, { dailyLimitTokens: originalEstimate });
    modelMocks.getComboModels.mockImplementation(async (modelStr) => (modelStr === "c" ? [member] : null));

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(429);
    expect(authMocks.getProviderCredentials).not.toHaveBeenCalled();
    expect(dispatchMocks.handleChatCore).not.toHaveBeenCalled();
  });

  it("allows an unlimited active key to reach account selection and dispatch", async () => {
    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${unlimitedApiKey.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    expect(modelMocks.getComboModels).toHaveBeenCalledWith("openai/gpt-4o");
    expect(modelMocks.getModelInfo).toHaveBeenCalledWith("openai/gpt-4o");
    expect(authMocks.getProviderCredentials).toHaveBeenCalledWith("openai", expect.any(Set), "gpt-4o");
    expect(dispatchMocks.handleChatCore).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: unlimitedApiKey.key,
      credentials: expect.objectContaining({ connectionId: "connection-test" }),
      usageReservationId: null,
    }));
    expect(rawDb.get("SELECT COUNT(*) AS count FROM reservationAudit").count).toBe(0);
  });

  it("reserves a limited request and forwards its ID to chat core", async () => {
    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${limitedApiKey.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    const usageReservationId = dispatchMocks.handleChatCore.mock.calls[0][0].usageReservationId;
    expect(usageReservationId).toEqual(expect.any(String));
    expect(rawDb.all("SELECT id FROM apiKeyUsageReservations")).toEqual([{ id: usageReservationId }]);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([{ action: "insert" }]);
  });

  it.each([
    {
      name: "provider thinking",
      settings: { providerThinking: { anthropic: { mode: "on" } } },
      model: "anthropic/claude-sonnet-4-20250514",
      outputTokens: 11_024,
      assertMutation: (body) => expect(body.thinking).toEqual({ type: "enabled", budget_tokens: 10_000 }),
    },
    {
      name: "Caveman",
      settings: { cavemanEnabled: true, cavemanLevel: "full" },
      model: "openai/gpt-4o",
      outputTokens: 1,
      assertMutation: (body) => expect(body.messages[0]).toMatchObject({
        role: "system",
        content: expect.stringContaining("Respond like terse caveman."),
      }),
    },
    {
      name: "Ponytail",
      settings: { ponytailEnabled: true, ponytailLevel: "full" },
      model: "openai/gpt-4o",
      outputTokens: 1,
      assertMutation: (body) => expect(body.messages[0]).toMatchObject({
        role: "system",
        content: expect.stringContaining("You are a lazy senior developer."),
      }),
    },
  ])("reserves the exact post-$name body before account selection", async ({ settings, model, outputTokens, assertMutation }) => {
    await db.updateSettings(settings);
    authMocks.getProviderCredentials.mockImplementation(async () => {
      expect(rawDb.get("SELECT id FROM apiKeyUsageReservations")).toBeDefined();
      return credentials();
    });
    const body = { model, messages: [{ role: "user", content: "hello" }], max_tokens: 1 };

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(200);
    const dispatchedBody = dispatchMocks.handleChatCore.mock.calls[0][0].body;
    assertMutation(dispatchedBody);
    expect(rawDb.get("SELECT reservedTokens FROM apiKeyUsageReservations").reservedTokens)
      .toBe(Buffer.byteLength(JSON.stringify(dispatchedBody), "utf8") + outputTokens);
  });

  it("reserves one Caveman injection for Responses string input through translation", async () => {
    await db.updateSettings({ cavemanEnabled: true, cavemanLevel: "full" });
    const body = { model: "openai/gpt-4o", input: "hello", max_output_tokens: 1 };

    const response = await postChat(new Request("http://localhost/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(200);
    const reservedBody = dispatchMocks.handleChatCore.mock.calls[0][0].body;
    const translatedBody = translateRequest(
      FORMATS.OPENAI_RESPONSES,
      FORMATS.OPENAI,
      "gpt-4o",
      structuredClone(reservedBody),
      true,
      credentials(),
      "openai",
    );
    const marker = "Respond like terse caveman.";
    expect(translatedBody.messages[0]).toMatchObject({ role: "system", content: expect.stringContaining(marker) });
    expect(JSON.stringify(translatedBody).split(marker)).toHaveLength(2);
    expect(rawDb.get("SELECT reservedTokens FROM apiKeyUsageReservations").reservedTokens)
      .toBe(Buffer.byteLength(JSON.stringify(reservedBody), "utf8") + 1);
  });

  it("reserves one Ponytail injection with developer authority through Claude translation", async () => {
    await db.updateSettings({ ponytailEnabled: true, ponytailLevel: "full" });
    const body = {
      model: "anthropic/claude-sonnet-4-20250514",
      messages: [
        { role: "developer", content: "Follow deployment policy." },
        { role: "user", content: "hello" },
      ],
      max_tokens: 1,
    };

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));

    expect(response.status).toBe(200);
    const reservedBody = dispatchMocks.handleChatCore.mock.calls[0][0].body;
    const translatedBody = translateRequest(
      FORMATS.OPENAI,
      FORMATS.CLAUDE,
      "claude-sonnet-4-20250514",
      structuredClone(reservedBody),
      true,
      credentials(),
      "anthropic",
    );
    const marker = "You are a lazy senior developer.";
    const systemText = translatedBody.system.map((part) => part.text).join("\n");
    expect(systemText).toContain("Follow deployment policy.");
    expect(systemText).toContain(marker);
    expect(JSON.stringify(translatedBody).split(marker)).toHaveLength(2);
    expect(rawDb.get("SELECT reservedTokens FROM apiKeyUsageReservations").reservedTokens)
      .toBe(Buffer.byteLength(JSON.stringify(reservedBody), "utf8") + 1);
  });

  it("reuses one reservation across account fallback", async () => {
    authMocks.getProviderCredentials
      .mockResolvedValueOnce(credentials("connection-one"))
      .mockResolvedValueOnce(credentials("connection-two"));
    authMocks.markAccountUnavailable.mockResolvedValueOnce({ shouldFallback: true, cooldownMs: 1_000 });
    dispatchMocks.handleChatCore
      .mockResolvedValueOnce(failureResult(429, "rate limited"))
      .mockResolvedValueOnce(successResult());

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    expect(dispatchMocks.handleChatCore).toHaveBeenCalledTimes(2);
    const reservationIds = dispatchMocks.handleChatCore.mock.calls.map(([options]) => options.usageReservationId);
    expect(reservationIds[0]).toEqual(expect.any(String));
    expect(reservationIds[1]).toBe(reservationIds[0]);
    expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(1);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([{ action: "insert" }]);
  });

  it("uses a fresh reservation for each fallback-combo model", async () => {
    modelMocks.getComboModels.mockImplementation(async (modelStr) => (
      modelStr === "fallback-combo" ? ["openai/model-one", "openai/model-two"] : null
    ));
    dispatchMocks.handleChatCore.mockImplementation(async ({ modelInfo }) => (
      modelInfo.model === "model-one" ? failureResult(429, "rate limited") : successResult()
    ));

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "fallback-combo", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    const reservationIds = dispatchMocks.handleChatCore.mock.calls.map(([options]) => options.usageReservationId);
    expect(reservationIds).toHaveLength(2);
    expect(new Set(reservationIds).size).toBe(2);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "delete" },
      { action: "insert" },
    ]);
  });

  it("reserves fusion panels and judge independently", async () => {
    await db.updateSettings({ comboStrategy: "fusion" });
    modelMocks.getComboModels.mockImplementation(async (modelStr) => (
      modelStr === "fusion-combo" ? ["openai/panel-one", "openai/panel-two"] : null
    ));
    dispatchMocks.handleChatCore.mockImplementation(async ({ modelInfo }) => successResult(`answer from ${modelInfo.model}`));

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "fusion-combo", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    const reservationIds = dispatchMocks.handleChatCore.mock.calls.map(([options]) => options.usageReservationId);
    expect(reservationIds).toHaveLength(3);
    expect(new Set(reservationIds).size).toBe(3);
    expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(3);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "insert" },
      { action: "insert" },
    ]);
  });

  it("releases a reservation on terminal pre-upstream failure", async () => {
    authMocks.getProviderCredentials.mockResolvedValue(null);

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(404);
    expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(0);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "delete" },
    ]);
  });

  it("releases a reservation on terminal upstream failure", async () => {
    dispatchMocks.handleChatCore.mockResolvedValue(failureResult());

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(400);
    expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(0);
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "delete" },
    ]);
  });

  it("releases only the owning reservation on direct Chat reader cancellation", async () => {
    const key = await createLimitedKey("direct-preterminal-cancel");
    await db.updateSettings({
      providerStrategies: { openai: { cacheAffinityEnabled: true } },
    });
    const upstream = installActualStreamingDispatch({
      payload: directPartialSse(),
      responseFormat: FORMATS.OPENAI,
    });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    expect(await readChunk(reader)).toContain('"content":"partial"');
    expect(reservationCountFor(key.id)).toBe(1);

    await reader.cancel("client_closed");
    await vi.waitFor(() => expect(reservationReleaseMocks.call).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(reservationCountFor(key.id)).toBe(0));
    await vi.waitFor(() => expect(upstream.cancel).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(upstream.providerSignal.aborted).toBe(true), {
      timeout: 1_500,
    });

    expect(usageCountFor(key.key)).toBe(0);
    expect(authMocks.markAccountUnavailable).not.toHaveBeenCalled();
    expect(authMocks.clearAccountError).not.toHaveBeenCalled();
    expect(affinityMocks.remember).not.toHaveBeenCalled();
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "delete" },
    ]);
  });

  it("releases only the owning reservation on Responses bridge cancellation", async () => {
    const key = await createLimitedKey("responses-preterminal-cancel");
    await db.updateSettings({
      providerStrategies: { codex: { cacheAffinityEnabled: true } },
    });
    const upstream = installActualStreamingDispatch({
      payload: responsesPartialSse(),
      responseFormat: FORMATS.OPENAI_RESPONSES,
    });

    const response = await postResponses(new Request("http://localhost/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "codex/gpt-5.6-sol",
        input: [{ role: "user", content: "hello" }],
        max_output_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    expect(await readChunk(reader)).toBe(": connected\n\n");
    expect(await readChunk(reader)).toContain("response.output_text.delta");
    expect(reservationCountFor(key.id)).toBe(1);

    await reader.cancel("client_closed");
    await vi.waitFor(() => expect(upstream.providerSignal.aborted).toBe(true));
    await vi.waitFor(() => expect(upstream.cancel).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(reservationReleaseMocks.call).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(reservationCountFor(key.id)).toBe(0));

    expect(usageCountFor(key.key)).toBe(0);
    expect(authMocks.markAccountUnavailable).not.toHaveBeenCalled();
    expect(authMocks.clearAccountError).not.toHaveBeenCalled();
    expect(affinityMocks.remember).not.toHaveBeenCalled();
  });

  it("starts standalone disconnect release once when owner callback repeats", async () => {
    let onDisconnect;
    dispatchMocks.handleChatCore.mockImplementation(async (options) => {
      onDisconnect = options.onDisconnect;
      return successResult();
    });

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${limitedApiKey.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "openai/gpt-4o", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    expect(onDisconnect).toBeTypeOf("function");
    onDisconnect({ reason: "client_closed" });
    onDisconnect({ reason: "client_closed" });
    await vi.waitFor(() => expect(reservationReleaseMocks.call).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => {
      expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(0);
    });
    expect(usageCountFor(limitedApiKey.key)).toBe(0);
  });

  it("keeps fusion disconnect callbacks scoped to their owning reservations", async () => {
    await db.updateSettings({ comboStrategy: "fusion" });
    modelMocks.getComboModels.mockImplementation(async (modelStr) => (
      modelStr === "fusion-cancel" ? ["openai/panel-one", "openai/panel-two"] : null
    ));
    dispatchMocks.handleChatCore.mockImplementation(async ({ modelInfo }) => (
      successResult(`answer from ${modelInfo.model}`)
    ));

    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${limitedApiKey.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "fusion-cancel", messages: [], max_tokens: 1 }),
    }));

    expect(response.status).toBe(200);
    const options = dispatchMocks.handleChatCore.mock.calls.map(([value]) => value);
    const reservationIds = options.map((value) => value.usageReservationId);
    expect(reservationIds).toHaveLength(3);
    expect(new Set(reservationIds).size).toBe(3);
    expect(options.every((value) => typeof value.onDisconnect === "function")).toBe(true);

    options[0].onDisconnect({ reason: "client_closed" });
    await vi.waitFor(() => expect(reservationReleaseMocks.call).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => {
      expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(2);
    });
    expect(rawDb.all("SELECT id FROM apiKeyUsageReservations ORDER BY id")
      .map(({ id }) => id)).toEqual(reservationIds.slice(1).sort());
  });

  it("keeps direct Chat terminal authority ahead of standalone release", async () => {
    const key = await createLimitedKey("direct-terminal-cancel");
    const upstream = installActualStreamingDispatch({
      payload: directTerminalSse(),
      responseFormat: FORMATS.OPENAI,
    });
    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    const wire = await readChunk(reader);
    expect(wire).toContain('"finish_reason":"stop"');
    expect(wire).not.toContain("event: response.completed");
    expect(reservationCountFor(key.id)).toBe(1);

    await reader.cancel("client_closed");
    await vi.waitFor(() => expect(usageCountFor(key.key)).toBe(1));
    await vi.waitFor(() => expect(reservationCountFor(key.id)).toBe(0));

    expect(reservationReleaseMocks.call).not.toHaveBeenCalled();
    expect(upstream.providerSignal.aborted).toBe(false);
    expect(rawDb.get(
      "SELECT promptTokens, completionTokens FROM usageHistory WHERE apiKey = ?",
      [key.key],
    )).toEqual({ promptTokens: 2, completionTokens: 1 });
  });

  it("keeps Responses terminal authority when bridge abort happens first", async () => {
    const key = await createLimitedKey("responses-terminal-cancel");
    const upstream = installActualStreamingDispatch({
      payload: responsesTerminalSse(),
      responseFormat: FORMATS.OPENAI_RESPONSES,
    });
    const response = await postResponses(new Request("http://localhost/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "codex/gpt-5.6-sol",
        input: [{ role: "user", content: "hello" }],
        max_output_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    expect(await readChunk(reader)).toBe(": connected\n\n");
    expect(await readChunk(reader)).toContain("event: response.completed");
    expect(reservationCountFor(key.id)).toBe(1);

    await reader.cancel("client_closed");
    await vi.waitFor(() => expect(upstream.providerSignal.aborted).toBe(true));
    await vi.waitFor(() => expect(usageCountFor(key.key)).toBe(1));
    await vi.waitFor(() => expect(reservationCountFor(key.id)).toBe(0));

    expect(reservationReleaseMocks.call).not.toHaveBeenCalled();
    expect(rawDb.get(
      "SELECT promptTokens, completionTokens FROM usageHistory WHERE apiKey = ?",
      [key.key],
    )).toEqual({ promptTokens: 2, completionTokens: 1 });
    expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
      { action: "insert" },
      { action: "delete" },
    ]);
  });

  it("retains terminal reservation when authoritative Responses usage is absent", async () => {
    const key = await createLimitedKey("responses-terminal-no-usage");
    installActualStreamingDispatch({
      payload: responsesTerminalSse({ omitUsage: true }),
      responseFormat: FORMATS.OPENAI_RESPONSES,
    });
    const response = await postResponses(new Request("http://localhost/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "codex/gpt-5.6-sol",
        input: [{ role: "user", content: "hello" }],
        max_output_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    await readChunk(reader);
    await readChunk(reader);
    await reader.cancel("client_closed");
    await vi.waitFor(() => expect(authMocks.clearAccountError).toHaveBeenCalledTimes(1));

    expect(reservationReleaseMocks.call).not.toHaveBeenCalled();
    expect(reservationCountFor(key.id)).toBe(1);
    expect(usageCountFor(key.key)).toBe(0);
  });

  it("retains reservation on upstream reset without downstream cancellation", async () => {
    const key = await createLimitedKey("direct-upstream-reset");
    const upstream = installActualStreamingDispatch({
      payload: directPartialSse(),
      responseFormat: FORMATS.OPENAI,
    });
    const response = await postChat(new Request("http://localhost/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: "hello" }],
        max_tokens: 1,
        stream: true,
      }),
    }));
    const reader = response.body.getReader();
    expect(await readChunk(reader)).toContain('"content":"partial"');
    upstream.fail();
    while (!(await reader.read()).done) {}
    await Promise.resolve();

    expect(reservationReleaseMocks.call).not.toHaveBeenCalled();
    expect(reservationCountFor(key.id)).toBe(1);
    expect(usageCountFor(key.key)).toBe(0);
    expect(authMocks.markAccountUnavailable).not.toHaveBeenCalled();
  });

  it.each([
    "response.failed",
    "incomplete close",
    "completed as incomplete",
    "done as failed",
    "done as incomplete",
    "conversion throw",
  ])(
    "releases a forced Responses reservation for $0",
    async (failureKind) => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      dispatchMocks.handleChatCore.mockImplementation(async (options) => handleForcedSSEToJson({
        providerResponse: forcedResponsesFailure(failureKind),
        sourceFormat: FORMATS.OPENAI_RESPONSES,
        provider: options.modelInfo.provider,
        model: options.modelInfo.model,
        body: options.body,
        stream: false,
        translatedBody: null,
        finalBody: null,
        requestId: options.attemptId,
        correlationId: options.correlationId,
        requestTiming: options.requestTiming,
        responseStartTime: performance.now(),
        connectionId: options.connectionId,
        apiKey: options.apiKey,
        usageReservationId: options.usageReservationId,
        clientRawRequest: options.clientRawRequest,
        onRequestSuccess: options.onRequestSuccess,
        trackDone: () => {},
        appendLog: () => {},
        reqTag: "request-test",
        log: null,
      }));

      try {
        const response = await postChat(new Request("http://localhost/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${limitedApiKey.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "codex/gpt-5-codex", messages: [], max_tokens: 1 }),
        }));

        expect(response.status).toBe(502);
        expect(authMocks.clearAccountError).not.toHaveBeenCalled();
        expect(authMocks.markAccountUnavailable).toHaveBeenCalledTimes(1);
        expect(rawDb.get("SELECT COUNT(*) AS count FROM apiKeyUsageReservations").count).toBe(0);
        expect(rawDb.all("SELECT action FROM reservationAudit")).toEqual([
          { action: "insert" },
          { action: "delete" },
        ]);
      } finally {
        errorSpy.mockRestore();
      }
    },
  );
});
