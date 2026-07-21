import { describe, expect, it } from "vitest";

import { detectClientTool, isNativePassthrough } from "../../open-sse/utils/clientDetector.js";

describe("Codex client detection", () => {
  it.each([
    "codex-cli/0.144.1",
    "codex_cli_rs/0.144.1",
    "codex_exec/0.144.1 (Windows 11; x86_64)",
  ])("recognizes %s as native Codex", (userAgent) => {
    const client = detectClientTool({ "user-agent": userAgent });

    expect(client).toBe("codex");
    expect(isNativePassthrough(client, "codex")).toBe(true);
  });

  it("keeps Codex app heartbeat detection route-local", () => {
    const client = detectClientTool({ "user-agent": "Codex/0.1.0" });

    expect(client).toBeNull();
    expect(isNativePassthrough(client, "codex")).toBe(false);
  });
});
