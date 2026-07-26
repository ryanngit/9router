import { describe, expect, it } from "vitest";

import claude from "../../open-sse/providers/registry/claude.js";
import { getCapabilitiesForModel } from "../../open-sse/providers/capabilities.js";
import { getModelInfoCore } from "../../open-sse/services/model.js";

const models = [
  ["claude-fable-5", "Claude Fable 5", 1000000, 128000, "claude-adaptive"],
  ["claude-opus-5", "Claude Opus 5", 1000000, 128000, "claude-adaptive"],
  ["claude-sonnet-5", "Claude Sonnet 5", 1000000, 128000, "claude-adaptive"],
  ["claude-opus-4-8", "Claude Opus 4.8", 1000000, 128000, "claude-adaptive"],
  ["claude-opus-4-7", "Claude Opus 4.7", 1000000, 128000, "claude-adaptive"],
  ["claude-opus-4-6", "Claude Opus 4.6", 1000000, 128000, "claude-adaptive"],
  ["claude-sonnet-4-6", "Claude Sonnet 4.6", 1000000, 128000, "claude-adaptive"],
  ["claude-sonnet-4-5-20250929", "Claude Sonnet 4.5", 200000, 64000, "claude-budget"],
  ["claude-haiku-4-5-20251001", "Claude Haiku 4.5", 200000, 64000, "claude-budget"],
];

describe("direct Claude Code model metadata", () => {
  it.each(models)("publishes %s with verified limits", (id, name, contextWindow, maxOutput, thinkingFormat) => {
    expect(claude.models.find((model) => model.id === id)).toMatchObject({ id, name });
    expect(getCapabilitiesForModel("claude", id)).toMatchObject({
      contextWindow,
      maxOutput,
      thinkingFormat,
      reasoning: true,
      vision: true,
      search: true,
    });
  });

  it("contains exactly one entry for every verified direct model", () => {
    const ids = claude.models.map((model) => model.id);
    expect(ids).toEqual(models.map(([id]) => id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("describes subscription entitlement without a obsolete 1M beta requirement", () => {
    const sonnet46 = claude.models.find((model) => model.id === "claude-sonnet-4-6");
    expect(sonnet46.description).toMatch(/usage credits/i);
    expect(claude.models.map((model) => model.description || "").join(" ")).not.toMatch(/context-1m-2025-08-07/);
  });

  it("preserves private bare GitHub aliases", async () => {
    await expect(getModelInfoCore("claude-fable-5", {})).resolves.toMatchObject({ provider: "github" });
    await expect(getModelInfoCore("claude-opus-4.8", {})).resolves.toMatchObject({ provider: "github" });
  });

  it("exposes direct context metadata through models info", async () => {
    const { GET } = await import("../../src/app/api/v1/models/info/route.js");
    const response = await GET(new Request("http://localhost/v1/models/info?id=cc/claude-opus-5"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "cc/claude-opus-5",
      contextWindow: 1000000,
      capabilities: {
        contextWindow: 1000000,
        maxOutput: 128000,
        thinkingFormat: "claude-adaptive",
      },
    });
  });
});
