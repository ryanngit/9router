import { describe, expect, it } from "vitest";
import { applyBestGptRoute, isBestGptRouteCandidate } from "../../src/sse/services/bestGptRoute.js";

describe("best GPT route", () => {
  it("routes GPT-5.4 Mini to GPT-5.6 Sol with max reasoning and fast tier", () => {
    const result = applyBestGptRoute(
      { model: "gpt-5.4-mini", reasoning_effort: "low", service_tier: "standard" },
      {}
    );

    expect(result.applied).toBe(true);
    expect(result.body).toMatchObject({
      model: "cx/gpt-5.6-sol",
      reasoning_effort: "max",
      reasoning: { effort: "max", summary: "auto" },
      service_tier: "fast",
    });
  });

  it("routes prefixed GPT models and preserves the reasoning summary", () => {
    const result = applyBestGptRoute(
      { model: "cx/gpt-5.6-terra", reasoning: { effort: "xhigh", summary: "detailed" } },
      { NINE_ROUTER_BEST_GPT_TARGET: "gpt-5.6-sol", NINE_ROUTER_BEST_GPT_SERVICE_TIER: "priority" }
    );

    expect(result.body.model).toBe("cx/gpt-5.6-sol");
    expect(result.body.reasoning).toEqual({ effort: "max", summary: "detailed" });
    expect(result.body.service_tier).toBe("priority");
  });

  it("ignores non-GPT models and can be disabled", () => {
    expect(isBestGptRouteCandidate("claude-opus-4.8")).toBe(false);
    expect(applyBestGptRoute({ model: "gpt-5.4" }, { NINE_ROUTER_BEST_GPT_ENABLED: "false" }).applied).toBe(false);
  });
});
