import fs from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Toggle from "../../src/shared/components/Toggle.js";
import { updateProviderStrategy } from "../../src/shared/utils/providerStrategies.js";

const source = fs.readFileSync(
  new URL("../../src/app/(dashboard)/dashboard/providers/[id]/page.js", import.meta.url),
  "utf8",
);

describe("provider cache affinity control", () => {
  it("loads, preserves, and saves the per-provider setting", () => {
    expect(source).toContain("setProviderCacheAffinity(override.cacheAffinityEnabled === true)");
    expect(source).toContain("updateProviderStrategy(current, providerId");
    expect(source).toContain("saveProviderStrategy(providerStrategy, providerStickyLimit, enabled)");
  });

  it("preserves unrelated fields when updating a provider strategy", () => {
    const current = {
      codex: {
        proxyPoolId: "pool-us",
        rotateStrategy: "sticky",
        futureSetting: true,
        fallbackStrategy: "fallback",
      },
      github: { proxyPoolId: "pool-eu" },
    };
    const updated = updateProviderStrategy(current, "codex", {
      strategy: "round-robin",
      stickyLimit: "2",
      cacheAffinityEnabled: true,
    });

    expect(updated).toEqual({
      codex: {
        proxyPoolId: "pool-us",
        rotateStrategy: "sticky",
        futureSetting: true,
        fallbackStrategy: "round-robin",
        stickyRoundRobinLimit: 2,
        cacheAffinityEnabled: true,
      },
      github: { proxyPoolId: "pool-eu" },
    });
    expect(updated).not.toBe(current);
    expect(updated.codex).not.toBe(current.codex);
  });

  it("renders a dedicated toggle", () => {
    expect(source).toContain("Cache affinity");
    expect(source).toContain("checked={providerCacheAffinity}");
    expect(source).toContain("onChange={handleCacheAffinityToggle}");
  });

  it("gives the cache-affinity switch an accessible name", () => {
    const html = renderToStaticMarkup(createElement(Toggle, {
      "aria-label": "Cache affinity",
      checked: false,
      onChange: () => {},
    }));

    expect(html).toContain('aria-label="Cache affinity"');
  });
});
