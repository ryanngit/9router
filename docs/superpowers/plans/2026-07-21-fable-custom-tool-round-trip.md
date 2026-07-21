# Fable Custom Tool Round Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Codex Responses custom tools end to end through GitHub Claude/Fable Chat translation.

**Architecture:** Wrap custom freeform input in one Chat function string field, carry request-local custom tool names into response state, and restore official Responses custom-tool events. Keep ordinary functions and provider behavior unchanged.

**Tech Stack:** Node.js ESM, Web Streams, Vitest, Next.js CLI build, SQLite, PM2.

## Global Constraints

- No new dependency.
- No routing, proxy pool, credential, API-key, quota, or tunnel configuration change.
- Candidate binds only `127.0.0.1:20129`, starts no tunnel, and contains no refresh tokens.
- Promotion uses existing atomic helper, rollback app/DB backups, and one PM2 restart.

---

### Task 1: Request Round Trip

**Files:**
- Modify: `open-sse/translator/request/openai-responses.js`
- Modify: `open-sse/translator/schema/blocks.js`
- Create: `tests/unit/responses-custom-tool-roundtrip.test.js`

**Interfaces:**
- Produces: translated body property `_customToolNames: Set<string>` for internal extraction.
- Produces: Chat function schema `{ input: string }` and Chat call arguments `{"input":"..."}`.

- [ ] Write tests for custom declarations, custom call/output history, normal function controls, and malformed/non-string outputs.
- [ ] Run the focused test and confirm failures show missing custom conversion.
- [ ] Implement the minimum request conversion and internal metadata.
- [ ] Run the focused test and confirm request assertions pass.

### Task 2: Response Round Trip

**Files:**
- Modify: `open-sse/translator/index.js`
- Modify: `open-sse/translator/response/openai-responses.js`
- Modify: `open-sse/utils/stream.js`
- Modify: `open-sse/handlers/chatCore.js`
- Modify: `open-sse/handlers/chatCore/streamingHandler.js`
- Modify: `open-sse/handlers/chatCore/nonStreamingHandler.js`
- Modify: `tests/unit/responses-custom-tool-roundtrip.test.js`

**Interfaces:**
- Consumes: `_customToolNames: Set<string>`.
- Produces: response state `customToolNames`, `funcIsCustom`, and official custom-tool SSE events.

- [ ] Add stream tests with fragmented wrapped arguments and mixed custom/function calls.
- [ ] Confirm current output is `function_call`, proving red state.
- [ ] Thread request-local metadata after stripping it from provider payload.
- [ ] Buffer and unwrap custom arguments; emit official delta/done/item events.
- [ ] Preserve normal function streaming byte behavior.
- [ ] Run focused tests until green.

### Task 3: Permanent Update Gate

**Files:**
- Modify: `scripts/verify-local-patches.mjs`
- Modify: `docs/PATCH_LEDGER.md`
- Modify: `docs/UPDATE_RUNBOOK.md`

**Interfaces:**
- Produces: update verification requirement for Fable custom call plus continuation.

- [ ] Add source verifier checks for custom metadata extraction and event restoration.
- [ ] Record root cause, old-patch audit, tests, deployment, rollback, and upstream status.
- [ ] Add custom-tool call/continuation to every future Copilot Fable update gate.

### Task 4: QA and Deployment

**Files:**
- Modify: deployed `cli/app` only through existing build/promotion tooling.

**Interfaces:**
- Consumes: verified source commit and copied DB.
- Produces: rollback-backed live `0.5.40` runtime.

- [ ] Run focused translator, Fable routing, pairing, terminal, heartbeat, affinity, and reservation tests.
- [ ] Run changed-file ESLint, `git diff --check`, patch verifier, and build.
- [ ] Run independent code review and resolve findings.
- [ ] Start isolated candidate and verify custom call plus `custom_tool_call_output` continuation through both GitHub profiles.
- [ ] Promote atomically with current tunnel guarded, then verify local/raw/short health.
- [ ] Repeat live short-domain custom call plus continuation and inspect request details/logs.
- [ ] Create or update one clean public upstream PR containing no private configuration.
