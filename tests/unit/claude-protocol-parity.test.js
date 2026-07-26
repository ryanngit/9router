import { describe, expect, it } from "vitest";

import "../translator/registerAll.js";
import { DefaultExecutor } from "../../open-sse/executors/default.js";
import claude from "../../open-sse/providers/registry/claude.js";
import {
  CLAUDE_CLI_SPOOF_HEADERS,
  mapStainlessArch,
  mapStainlessOs,
} from "../../open-sse/providers/shared.js";
import { translateRequest } from "../../open-sse/translator/index.js";
import { FORMATS } from "../../open-sse/translator/formats.js";
import { applyCloaking } from "../../open-sse/utils/claudeCloaking.js";

describe("direct Claude protocol parity", () => {
  it("uses one shared Claude CLI header source in the registry", () => {
    expect(claude.transport.headers).toBe(CLAUDE_CLI_SPOOF_HEADERS);
  });

  it("matches the current CLI and SDK fingerprint on the host OS and architecture", () => {
    expect(CLAUDE_CLI_SPOOF_HEADERS).toMatchObject({
      "User-Agent": "claude-cli/2.1.220 (external, sdk-cli)",
      "X-Stainless-Package-Version": "0.94.0",
      "X-Stainless-Os": mapStainlessOs(),
      "X-Stainless-Arch": mapStainlessArch(),
    });
  });

  it("uses the beta query URL for direct messages", () => {
    expect(new DefaultExecutor("claude").buildUrl("claude-fable-5", true)).toBe(
      "https://api.anthropic.com/v1/messages?beta=true"
    );
  });

  it("uses the current CLI version in the billing header", () => {
    const body = applyCloaking(
      { messages: [{ role: "user", content: "hello" }] },
      "sk-ant-oat-test",
      "session-123"
    );

    expect(body.system[0].text).toMatch(/cc_version=2\.1\.220\.[0-9a-f]{3};/);
  });

  it("matches the session header to cloaked metadata", () => {
    const credentials = {
      accessToken: "sk-ant-oat-test",
      rawHeaders: { "x-session-id": "session-123" },
    };
    const body = translateRequest(
      FORMATS.OPENAI,
      FORMATS.CLAUDE,
      "claude-fable-5",
      { messages: [{ role: "user", content: "hello" }] },
      true,
      credentials,
      "claude",
      null,
      [],
      "connection-123"
    );
    const sessionId = JSON.parse(body.metadata.user_id).session_id;
    const headers = new DefaultExecutor("claude").buildHeaders(credentials, true);

    expect(credentials._clientSessionId).toBe("session-123");
    expect(headers["X-Claude-Code-Session-Id"]).toBe(sessionId);
  });

  it("keeps an incoming Claude metadata session aligned with the header", () => {
    const credentials = { accessToken: "sk-ant-oat-test" };
    const body = translateRequest(
      FORMATS.CLAUDE,
      FORMATS.CLAUDE,
      "claude-fable-5",
      {
        metadata: { user_id: JSON.stringify({ session_id: "session-456" }) },
        messages: [{ role: "user", content: "hello" }],
      },
      true,
      credentials,
      "claude"
    );
    const sessionId = JSON.parse(body.metadata.user_id).session_id;
    const headers = new DefaultExecutor("claude").buildHeaders(credentials, true);

    expect(credentials._clientSessionId).toBe("session-456");
    expect(headers["X-Claude-Code-Session-Id"]).toBe(sessionId);
  });
});
