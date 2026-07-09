import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeXaiResponsesTools } from "../../open-sse/executors/default.js";

test("xAI Responses tool normalization converts unsupported Codex tools", () => {
  const body = normalizeXaiResponsesTools({
    tools: [
      { type: "function", name: "shell_command", parameters: { type: "object" } },
      { type: "custom", name: "apply_patch", description: "patch", format: { type: "grammar" } },
      { type: "local_shell" },
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
  ]);
});
