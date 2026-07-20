import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  new URL("../../src/app/(dashboard)/dashboard/providers/[id]/page.js", import.meta.url),
  "utf8",
);

describe("provider cache affinity control", () => {
  it("loads, preserves, and saves the per-provider setting", () => {
    expect(source).toContain("setProviderCacheAffinity(override.cacheAffinityEnabled === true)");
    expect(source).toContain("if (cacheAffinityEnabled) override.cacheAffinityEnabled = true");
    expect(source).toContain("saveProviderStrategy(providerStrategy, providerStickyLimit, enabled)");
  });

  it("renders a dedicated toggle", () => {
    expect(source).toContain("Cache affinity");
    expect(source).toContain("checked={providerCacheAffinity}");
    expect(source).toContain("onChange={handleCacheAffinityToggle}");
  });
});

