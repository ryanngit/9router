import { describe, expect, it } from "vitest";
import "../translator/registerAll.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { prepareClaudeRequest } from "../../open-sse/translator/formats/claude.js";

const translate = (body) =>
  translateRequest(FORMATS.OPENAI, FORMATS.CLAUDE, "claude-fable-5", body, true, null, "github");

describe("Claude tool result pairing", () => {
  it("salvages orphaned results and fills missing parallel results", () => {
    const out = translate({
      messages: [
        { role: "user", content: "run" },
        {
          role: "assistant",
          content: null,
          tool_calls: [{
            id: "call-valid",
            type: "function",
            function: { name: "exec", arguments: "{}" },
          }, {
            id: "call-missing",
            type: "function",
            function: { name: "read", arguments: "{}" },
          }],
        },
        { role: "tool", tool_call_id: "call-valid", content: "valid output" },
        { role: "tool", tool_call_id: "call-orphan", content: "orphan output" },
        { role: "user", content: "continue" },
      ],
    });

    const assistantIndex = out.messages.findIndex((message) =>
      message.role === "assistant" &&
      message.content.some((block) => block.type === "tool_use" && block.id === "call-valid")
    );
    const resultMessage = out.messages[assistantIndex + 1];
    const structuredResults = resultMessage.content.filter((block) => block.type === "tool_result");

    expect(structuredResults.map((block) => block.tool_use_id)).toEqual(["call-valid", "call-missing"]);
    expect(structuredResults[1].content).toBe("");
    expect(JSON.stringify(resultMessage.content)).toContain("valid output");
    expect(JSON.stringify(resultMessage.content)).toContain("orphan output");
  });

  it("salvages an orphaned result when it is the only message", () => {
    const out = prepareClaudeRequest({
      model: "claude-fable-5",
      messages: [{
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "call-orphan", content: "only output" }],
      }],
    }, "github");

    expect(out.messages[0].content.some((block) => block.type === "tool_result")).toBe(false);
    expect(JSON.stringify(out.messages[0].content)).toContain("only output");
  });
});
