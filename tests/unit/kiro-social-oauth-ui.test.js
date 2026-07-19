import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ effects: [] }));

vi.mock("react", () => ({
  useEffect: (effect) => harness.effects.push(effect),
  useRef: (initialValue) => ({ current: initialValue }),
  useState: (initialValue) => [
    typeof initialValue === "function" ? initialValue() : initialValue,
    vi.fn(),
  ],
}));

vi.mock("@/shared/components", () => ({
  Button: function Button() {},
  Input: function Input() {},
  Modal: function Modal() {},
}));

vi.mock("@/shared/hooks/useCopyToClipboard", () => ({
  useCopyToClipboard: () => ({ copied: null, copy: vi.fn() }),
}));

import KiroSocialOAuthModal from "../../src/shared/components/KiroSocialOAuthModal.js";

const wrapperSource = readFileSync(fileURLToPath(new URL(
  "../../src/shared/components/KiroOAuthWrapper.js",
  import.meta.url,
)), "utf8");
const modalSource = readFileSync(fileURLToPath(new URL(
  "../../src/shared/components/KiroSocialOAuthModal.js",
  import.meta.url,
)), "utf8");

describe("Kiro social OAuth proxy UI wiring", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.fetch;
    harness.effects = [];
  });

  it("passes pool readiness into social modal without wrapping another modal", () => {
    const socialBranch = wrapperSource.slice(
      wrapperSource.indexOf("if (authMethod === \"social\""),
      wrapperSource.indexOf("return null"),
    );

    expect(socialBranch).toContain("proxyPools={proxyPools}");
    expect(socialBranch).toContain("proxyPoolsReady={proxyPoolsReady}");
    expect(socialBranch).not.toContain("<Modal");
  });

  it("reuses proxy selector and carries selected pool through both requests", () => {
    expect(modalSource).toContain("<OAuthProxyPoolSelector");
    expect(modalSource).toContain("if (!proxyPoolsReady) return");
    expect(modalSource).toContain('searchParams.set("proxyPoolId", selectedProxyPoolId)');
    expect(modalSource).toContain("proxyPoolId: selectedProxyPoolId");
  });

  it("fences authorize and exchange work by flow generation", () => {
    expect(modalSource).toContain("flowGenerationRef");
    expect(modalSource).toContain("generation !== flowGenerationRef.current");
  });

  it("starts social authorization with the active proxy pool", async () => {
    globalThis.window = {
      location: { origin: "http://localhost:20127" },
      open: vi.fn(),
    };
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ authUrl: "https://auth.example", codeVerifier: "verifier" }),
    });

    KiroSocialOAuthModal({
      isOpen: true,
      provider: "google",
      onClose: vi.fn(),
      proxyPools: [
        { id: "inactive", isActive: false },
        { id: "active", isActive: true },
      ],
      proxyPoolsReady: true,
    });
    await harness.effects[1]();
    await Promise.resolve();

    const authorizeUrl = new URL(globalThis.fetch.mock.calls[0][0]);
    expect(authorizeUrl.searchParams.get("proxyPoolId")).toBe("active");
  });

  it("rejects missing or mismatched callback state before exchange", () => {
    expect(modalSource).toContain("!state || state !== authData.state");
    expect(modalSource.indexOf("!state || state !== authData.state"))
      .toBeLessThan(modalSource.indexOf('fetch("/api/oauth/kiro/social-exchange"'));
  });
});
