import assert from "node:assert/strict";
import { test } from "node:test";

import { DefaultExecutor, normalizeXaiResponsesPayload, normalizeXaiResponsesTools } from "../../open-sse/executors/default.js";

test("xAI Responses tool normalization converts unsupported Codex tools", () => {
  const body = normalizeXaiResponsesTools({
    tools: [
      { type: "function", name: "shell_command", parameters: { type: "object" } },
      { type: "custom", name: "apply_patch", description: "patch", format: { type: "grammar" } },
      { type: "local_shell" },
      { type: "web_search", external_web_access: true },
      { type: "computer", display_width: 1024 },
    ],
  });

  assert.deepEqual(body.tools, [
    { type: "function", name: "shell_command", description: "", parameters: { type: "object", properties: {} } },
    {
      type: "function",
      name: "apply_patch",
      description: "patch",
      parameters: {
        type: "object",
        properties: { input: { type: "string", description: "Freeform tool input." } },
        required: ["input"],
      },
    },
    { type: "web_search" },
  ]);
});

test("xAI Responses payload normalization strips unsupported reasoning blobs", () => {
  const body = normalizeXaiResponsesPayload({
    include: ["reasoning.encrypted_content"],
    input: [
      { type: "reasoning", encrypted_content: "blob" },
      {
        type: "reasoning",
        encrypted_content: "blob",
        summary: [{ type: "summary_text", text: "kept" }],
      },
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "hi", encrypted_content: "nested" }],
      },
    ],
  });

  assert.deepEqual(body, {
    input: [
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "hi" }],
      },
    ],
  });
});

test("xAI executor strips encrypted content from final Responses payload", () => {
  const executor = new DefaultExecutor("xai");
  const body = executor.transformRequest(
    "grok-4.5",
    {
      model: "grok-4.5",
      input: [
        { type: "reasoning", encrypted_content: "blob" },
        {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "hi", encrypted_content: "nested" }],
        },
      ],
      include: ["reasoning.encrypted_content"],
      tools: [{ type: "web_search", external_web_access: true }],
    },
    false,
    { runtimeTransport: { format: "openai-responses" } },
  );

  assert.deepEqual(body, {
    model: "grok-4.5",
    input: [
      {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "hi" }],
      },
    ],
    tools: [{ type: "web_search" }],
  });
});

test("xAI Responses payload normalization converts Codex custom tool history", () => {
  const body = normalizeXaiResponsesPayload({
    input: [
      { type: "custom_tool_call", call_id: "call_1", name: "apply_patch", input: "*** Begin Patch" },
      { type: "custom_tool_call_output", call_id: "call_1", output: [{ type: "text", text: "ok" }] },
      { type: "function_call_output", call_id: "call_2", output: [{ type: "text", text: "done" }] },
    ],
  });

  assert.deepEqual(body, {
    input: [
      { type: "function_call", call_id: "call_1", name: "apply_patch", arguments: JSON.stringify({ input: "*** Begin Patch" }) },
      { type: "function_call_output", call_id: "call_1", output: "ok" },
      { type: "function_call_output", call_id: "call_2", output: "done" },
    ],
  });
});
