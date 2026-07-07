import { describe, expect, it } from "vitest";
import { getModelInfoCore, parseModel, resolveProviderAlias } from "../../open-sse/services/model.js";
import { resolveTransport } from "../../open-sse/services/provider.js";
import { PROVIDER_MODELS } from "../../open-sse/config/providerModels.js";
import { getPricingForModel } from "../../open-sse/providers/pricing.js";

describe("Grok Build routing", () => {
  it("keeps Grok web cookie path separate from xAI OAuth", () => {
    expect(resolveProviderAlias("gw")).toBe("grok-web");
    expect(resolveProviderAlias("grok-web")).toBe("grok-web");
    expect(parseModel("grok-web/grok-4.1-fast")).toEqual({
      provider: "grok-web",
      model: "grok-4.1-fast",
      isAlias: false,
      providerAlias: "grok-web",
    });
  });

  it("routes bare Grok Build model names to xAI", async () => {
    await expect(getModelInfoCore("grok-build-0.1", {})).resolves.toEqual({
      provider: "xai",
      model: "grok-build-0.1",
    });
  });

  it("exposes Grok Build in the xAI model catalog", () => {
    expect(PROVIDER_MODELS.xai.map((model) => model.id)).toEqual(expect.arrayContaining([
      "grok-build-0.1",
      "grok-4.3",
      "grok-4.20-0309-reasoning",
      "grok-4.20-0309-non-reasoning",
      "grok-4.20-multi-agent-0309",
      "grok-imagine-image",
      "grok-imagine-image-quality",
      "grok-imagine-video",
      "grok-imagine-video-1.5",
    ]));
  });

  it("routes xAI Responses requests to the native Responses endpoint", () => {
    expect(resolveTransport("xai", "openai-responses")).toMatchObject({
      format: "openai-responses",
      baseUrl: "https://api.x.ai/v1/responses",
    });
  });

  it("uses explicit Grok Build pricing", () => {
    expect(getPricingForModel("xai", "grok-build-0.1")).toMatchObject({
      input: 0.50,
      output: 2.00,
      cached: 0.25,
      reasoning: 3.00,
    });
  });
});
