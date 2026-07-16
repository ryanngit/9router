# Grok CLI Responses Compatibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace incremental Grok request patches with one source-pinned, end-to-end OpenAI Responses compatibility codec and deploy it without interrupting the existing tunnel.

**Architecture:** A pure `grok-cli-compat.js` module rebuilds strict provider requests and returns diagnostics. `grok-cli.js` keeps transport/session/auth duties, same-format provider SSE remains passthrough, model discovery normalizes official capability metadata, and deterministic HTTP 400/422 errors stop without account fallback.

**Tech Stack:** Node.js ESM, native `structuredClone`/JSON APIs, Vitest 4, Next.js 16 standalone build, PM2, SQLite, Cloudflare quick tunnel.

## Global Constraints

- Pin behavior to `xai-org/grok-build` commit `b189869b7755d2b482969acf6c92da3ecfeffd36`.
- Add no dependency, DB migration, sidecar process, or provider-format pivot.
- Never mutate caller request bodies.
- Preserve successful Grok Responses SSE byte-for-byte.
- Keep private alias, residential pool, API keys, OAuth state, and personal routing out of upstream.
- Do not replace `cli/cli.js` or restart cloudflared.
- Build and test candidate on `127.0.0.1:20129`; promote only after two zero-active gates.
- Use TDD for every behavior change and commit each independently reviewable unit.

## File Structure

- Create `open-sse/executors/grok-cli-compat.js`: pure request codec, compatibility error, diagnostics, effort normalization.
- Modify `open-sse/executors/grok-cli.js`: orchestration, official headers, local compatibility response, codec integration.
- Modify `open-sse/services/grokCliModels.js`: official model-capability normalization.
- Modify `open-sse/services/accountFallback.js`: deterministic HTTP 400/422 no-fallback classification.
- Create `tests/unit/grok-cli-responses-compat.test.js`: exhaustive pure codec matrix.
- Modify `tests/unit/grok-cli-executor.test.js`: integration, headers, local errors, retry/session behavior.
- Modify `tests/unit/grok-cli-models.test.js`: complete metadata matrix.
- Create `tests/unit/account-fallback.test.js`: client-error and capacity precedence.
- Modify `scripts/verify-local-patches.mjs`: local repatch invariants only.
- Modify `docs/PATCH_LEDGER.md` and `docs/UPDATE_RUNBOOK.md`: deployment evidence and future update checks.

---

### Task 1: Pure Top-Level And Message Codec

**Files:**
- Create: `open-sse/executors/grok-cli-compat.js`
- Create: `tests/unit/grok-cli-responses-compat.test.js`

**Interfaces:**
- Produces: `GrokCliCompatibilityError`, `normalizeGrokCliEffort(value)`, and `translateGrokCliResponsesRequest(body, options)`.
- `options`: `{ model: string, supportsReasoningEffort: boolean }`.
- Return: `{ body: object, diagnostics: { droppedTopLevel: string[], droppedInputTypes: string[], droppedToolTypes: string[], convertedCustomTools: number, repairedHistory: number } }`.

- [ ] **Step 1: Write failing immutability/top-level/message tests**

```js
import { describe, expect, it } from "vitest";
import { translateGrokCliResponsesRequest } from "../../open-sse/executors/grok-cli-compat.js";

const translate = (body, options = {}) => translateGrokCliResponsesRequest(body, {
  model: "grok-4.5",
  supportsReasoningEffort: true,
  ...options,
});

it("rebuilds top-level wire without mutating client body", () => {
  const input = {
    model: "grok-4.5",
    instructions: "system",
    input: [{ type: "message", role: "developer", content: "hello", id: "msg_foreign" }],
    service_tier: "fast",
    prompt_cache_key: "thread",
    parallel_tool_calls: false,
  };
  const snapshot = structuredClone(input);
  const out = translate(input).body;
  expect(input).toEqual(snapshot);
  expect(out).toMatchObject({ model: "grok-4.5", stream: true, store: false, parallel_tool_calls: false });
  expect(out.service_tier).toBeUndefined();
  expect(out.prompt_cache_key).toBeUndefined();
  expect(out.input[0]).toEqual({ type: "message", role: "system", content: "system" });
  expect(out.input[1]).toEqual({ type: "message", role: "system", content: "hello" });
});
```

- [ ] **Step 2: Run focused test and confirm missing-module failure**

Run: `./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/grok-cli-responses-compat.test.js`

Expected: FAIL because `grok-cli-compat.js` does not exist.

- [ ] **Step 3: Implement pure body/message normalization**

```js
export class GrokCliCompatibilityError extends Error {
  constructor(message, path = null) {
    super(message);
    this.name = "GrokCliCompatibilityError";
    this.status = 400;
    this.path = path;
  }
}

export function translateGrokCliResponsesRequest(source, options) {
  const diagnostics = {
    droppedTopLevel: [], droppedInputTypes: [], droppedToolTypes: [],
    convertedCustomTools: 0, repairedHistory: 0,
  };
  const body = normalizeTopLevel(source, options, diagnostics);
  return { body, diagnostics };
}
```

Implement `normalizeTopLevel`, `normalizeInput`, `normalizeMessage`, and content helpers using fresh objects. Convert instructions to one leading system message, map developer to system, preserve supported text/image blocks, remove output-only fields, preserve validated scalar controls, and inject a user `"..."` placeholder only when no valid input remains.

- [ ] **Step 4: Run focused tests**

Expected: all Task 1 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add open-sse/executors/grok-cli-compat.js tests/unit/grok-cli-responses-compat.test.js
git commit -m "feat(grok-cli): add strict Responses compatibility codec"
```

### Task 2: Reasoning, Function History, And Backend History

**Files:**
- Modify: `open-sse/executors/grok-cli-compat.js`
- Modify: `tests/unit/grok-cli-responses-compat.test.js`

**Interfaces:**
- Extends `translateGrokCliResponsesRequest` without changing its signature.
- Adds internal native classifiers for `rs_<UUID>`, self-identifying `tco_*`, and `ctc_*` plus `xs_call-*`.

- [ ] **Step 1: Add failing history tests**

```js
it("preserves native x-search and tco history but removes foreign reasoning", () => {
  const tco = "tco_123_call-1";
  const out = translate({ input: [
    { type: "reasoning", id: "rs_foreignhex", encrypted_content: "openai" },
    { type: "custom_tool_call", id: "ctc_native", call_id: "xs_call-1", name: "x_user_search", input: "{}", status: "completed" },
    { type: "reasoning", id: tco, encrypted_content: `${tco}_cipher`, status: "completed", summary: [] },
  ] }).body;
  expect(out.input).toEqual([
    { type: "custom_tool_call", id: "ctc_native", call_id: "xs_call-1", name: "x_user_search", input: "{}", status: "completed" },
    { type: "reasoning", id: tco, encrypted_content: `${tco}_cipher`, summary: [] },
  ]);
});
```

Add cases for native `rs_<UUID>`, duplicate reasoning siblings, malformed JSON arguments, custom-to-function conversion, typed image output, scalar JSON output, orphan output removal, last-result deduplication, dangling-call repair, native `web_search_call`, and native `code_interpreter_call`.

- [ ] **Step 2: Run focused tests and confirm behavioral failures**

Expected: new assertions FAIL against Task 1 codec.

- [ ] **Step 3: Implement official history codecs and repair pass**

```js
function normalizeArguments(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? {});
  try { JSON.parse(text); return text; } catch { return "{}"; }
}

function isNativeXSearch(item) {
  return item?.type === "custom_tool_call"
    && /^ctc_/.test(item.id || "")
    && /^xs_call-/.test(item.call_id || "");
}
```

Build each item from accepted fields. Strip reasoning/function output-only status as defined by official source, preserve native x-search status, retain typed function output content, pair call IDs, keep last duplicate output, remove orphans, and insert one cancelled output for historical dangling calls.

- [ ] **Step 4: Run focused tests**

Expected: all codec history tests PASS.

- [ ] **Step 5: Commit**

```bash
git add open-sse/executors/grok-cli-compat.js tests/unit/grok-cli-responses-compat.test.js
git commit -m "fix(grok-cli): preserve native Grok response history"
```

### Task 3: Tools, Tool Choice, Reasoning, And Structured Output

**Files:**
- Modify: `open-sse/executors/grok-cli-compat.js`
- Modify: `tests/unit/grok-cli-responses-compat.test.js`

**Interfaces:**
- Keeps codec signature stable.
- `normalizeGrokCliEffort(value)` returns `low|medium|high|xhigh`; `max` maps to `xhigh`; invalid values return `high` only for proven reasoning models.

- [ ] **Step 1: Add failing contract tests**

Cover exact `web_search` filter rebuilding, exact `x_search`, unsupported hosted removal, hosted deduplication, hosted/function collision, custom schemas, stale/forced-hosted tool choice removal, function choice conversion, no-tools choice removal, reasoning field rebuilding, encrypted include, `max -> xhigh`, unsupported-model effort omission, plain text format, JSON schema, idempotence, and deterministic output.

- [ ] **Step 2: Run focused tests and confirm failures**

Expected: new tool/reasoning assertions FAIL.

- [ ] **Step 3: Implement tool and output configuration normalization**

```js
const HOSTED_TOOLS = new Set(["web_search", "x_search"]);

export function normalizeGrokCliEffort(value) {
  const effort = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (effort === "max") return "xhigh";
  return ["low", "medium", "high", "xhigh"].includes(effort) ? effort : "high";
}
```

Rebuild hosted/function tools, filter domains, resolve collisions, then normalize tool choice against final names/types. Rebuild reasoning and `text.format` from accepted fields. Do not forward `external_web_access`, verbosity, custom type, or unknown hosted fields.

- [ ] **Step 4: Run focused tests**

Expected: codec suite PASS with no mutation or idempotence regressions.

- [ ] **Step 5: Commit**

```bash
git add open-sse/executors/grok-cli-compat.js tests/unit/grok-cli-responses-compat.test.js
git commit -m "fix(grok-cli): complete Responses tool translation"
```

### Task 4: Executor Integration And Official Headers

**Files:**
- Modify: `open-sse/executors/grok-cli.js`
- Modify: `tests/unit/grok-cli-executor.test.js`

**Interfaces:**
- `GrokCliExecutor.transformRequest` delegates body construction to codec.
- `GrokCliExecutor.execute` converts `GrokCliCompatibilityError` to local HTTP 400 response.
- Existing exports re-export `normalizeGrokCliEffort` for compatibility.

- [ ] **Step 1: Rewrite executor tests first**

Expect inference headers to include `x-grok-user-id` and omit `x-userid`/`x-email`; resource endpoint tests remain unchanged. Replace stale expectations that preserve message/function IDs or stringify typed outputs. Add local compatibility-error test proving `proxyAwareFetch` is not called.

- [ ] **Step 2: Run executor suite and confirm failures**

Run: `./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/grok-cli-executor.test.js tests/unit/grok-cli-responses-compat.test.js`

Expected: header/integration tests FAIL before executor refactor.

- [ ] **Step 3: Integrate codec with minimal executor surface**

```js
const { body: providerBody, diagnostics } = translateGrokCliResponsesRequest(body, {
  model: resolvedModel,
  supportsReasoningEffort: supportsGrokCliReasoningEffort(resolvedModel),
});
dbg("GROK_COMPAT", JSON.stringify(diagnostics));
```

Resolve session and model before translation, calculate turn index from final input, preserve retry-stable request identity, use official inference headers, and catch codec errors around `super.execute(args)`.

- [ ] **Step 4: Run executor and codec suites**

Expected: both suites PASS.

- [ ] **Step 5: Commit**

```bash
git add open-sse/executors/grok-cli.js tests/unit/grok-cli-executor.test.js
git commit -m "refactor(grok-cli): route inference through compatibility codec"
```

### Task 5: Capability Metadata And Deterministic Error Classification

**Files:**
- Modify: `open-sse/services/grokCliModels.js`
- Modify: `open-sse/services/accountFallback.js`
- Modify: `tests/unit/grok-cli-models.test.js`
- Create: `tests/unit/account-fallback.test.js`

**Interfaces:**
- `parseGrokCliModels` returns normalized official camelCase fields while preserving raw source fields.
- `checkFallbackError(400|422, unmatchedText)` returns `{ shouldFallback:false, cooldownMs:0 }`.
- Capacity/rate text rules remain higher priority.

- [ ] **Step 1: Add failing metadata and fallback tests**

```js
expect(checkFallbackError(400, "Argument not supported")).toEqual({ shouldFallback: false, cooldownMs: 0 });
expect(checkFallbackError(422, "Failed to deserialize")).toEqual({ shouldFallback: false, cooldownMs: 0 });
expect(checkFallbackError(400, "Selected model is at capacity").shouldFallback).toBe(true);
```

Model fixture must include nested `_meta` and top-level forms for every field listed in Global Constraints.

- [ ] **Step 2: Run tests and confirm failures**

Expected: 400/422 currently return transient fallback; incomplete normalized metadata fails.

- [ ] **Step 3: Implement minimal classification and metadata mapping**

After text rules and status rules, return no-fallback for status 400 or 422 before generic transient fallback. Normalize official metadata with top-level precedence and nested `_meta` fallback; do not invent defaults beyond current static model defaults.

- [ ] **Step 4: Run focused tests**

Expected: model and fallback suites PASS; capacity test still passes.

- [ ] **Step 5: Commit**

```bash
git add open-sse/services/grokCliModels.js open-sse/services/accountFallback.js tests/unit/grok-cli-models.test.js tests/unit/account-fallback.test.js
git commit -m "fix(router): avoid fallback on deterministic client errors"
```

### Task 6: Regression, Review, And Source Verification

**Files:**
- Modify only when a failing relevant test exposes a real regression.

**Interfaces:**
- Consumes completed codec/executor/model/error contracts.

- [ ] **Step 1: Run focused Grok and fallback matrix**

Run all `grok-cli-*.test.js`, codec, xAI native Responses, Responses multiturn, base retry, and account fallback tests with 20-second timeout.

- [ ] **Step 2: Run ESLint and syntax checks**

Run focused ESLint on changed runtime/test files, `node --check` on local scripts, and `git diff --check`.

- [ ] **Step 3: Run broader unit suite**

Record failures. Compare any failure against known clean-upstream Cursor and Codex image baseline; fix only regressions caused by this branch.

- [ ] **Step 4: Perform code review against spec**

Review trust-boundary validation, ciphertext classification, history ordering, mutation, retry/fallback behavior, concurrency, logging, and private-data boundaries. Add a red test before any review fix.

- [ ] **Step 5: Commit review fixes**

Use one narrow commit per discovered defect; skip commit when review finds none.

### Task 7: Build And Isolated Candidate QA

**Files:**
- Build output only; no live file changes.

**Interfaces:**
- Candidate listens on `127.0.0.1:20129` with copied temporary home/DB and tunnel disabled.

- [ ] **Step 1: Build production standalone candidate**

Verify CLI build dependencies, run production build/pack path, and check candidate contains codec and official header strings.

- [ ] **Step 2: Create temporary candidate DB safely**

Copy live DB, run SQLite integrity check, remove every refresh token from candidate copy, and preserve only current unexpired access token needed for canaries. Never let candidate rotate live OAuth state.

- [ ] **Step 3: Start candidate and run health/source verifier**

Use port `20129`, local host only, tunnel disabled, existing CA, and same private model alias/proxy pool from copied DB.

- [ ] **Step 4: Run live contract canaries**

Run minimal text, strict web search, x-search two-turn replay, forced function plus typed output, custom history, structured output, malformed/duplicate/orphan/dangling history, approximately 1 MB mixed history, concurrent session headers, and deterministic-error no-lock checks.

- [ ] **Step 5: Inspect provider wire and clean candidate data**

Query candidate `requestDetails` for field counts/order/model/effort/status. Stop candidate and delete credential-bearing temporary home after evidence is recorded.

### Task 8: Safe Promotion, Ledger, And Upstream PR

**Files:**
- Modify: `scripts/verify-local-patches.mjs`
- Modify: `docs/PATCH_LEDGER.md`
- Modify: `docs/UPDATE_RUNBOOK.md`
- Upstream branch: existing PR #2590 branch in clean upstream prep clone.

**Interfaces:**
- Live app remains `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app`.
- Live DB remains `/home/home/.9router/db/data.sqlite`.
- Tunnel PID and short URL must remain valid.

- [ ] **Step 1: Add verifier and runbook invariants**

Check codec presence/source pin, native x-search/tco handling, strict hosted tools, official inference header, 400/422 no-fallback, and no private alias/pool in public patch.

- [ ] **Step 2: Back up and gate promotion**

Record PM2/tunnel PIDs and URLs, back up app and DB, verify both DB integrity checks, then require two consecutive zero-active snapshots immediately before atomic exchange.

- [ ] **Step 3: Promote once with rollback armed**

Exchange same-filesystem app directories, restart only PM2 `9router` through `custom-server.js`, poll local health, and atomically restore backup on failure. Never invoke tunnel enable/disable while existing cloudflared remains healthy.

- [ ] **Step 4: Verify production end to end**

Check local/raw/short health, cloudflared PID, PM2 entrypoint/env, bare private `grok-4.5`, x-search continuity, web-search sanitization, usage attribution, console output, SQLite integrity, and existing bare GPT routing.

- [ ] **Step 5: Update ledger and commit local operations evidence**

Record source/live commits, test counts, canaries, backup paths, PIDs, URLs, verifier result, skipped ceilings, and exact repatch checks.

- [ ] **Step 6: Recut and update PR #2590**

Cherry-pick public runtime/tests only onto PR branch based on current upstream. Exclude spec/plan, ledger/runbook/verifier, aliases, proxy pools, DB, and deployment files. Run public focused tests, ESLint, `git diff --check`, push branch, then verify GitHub PR head and mergeability.

- [ ] **Step 7: Final verification**

Run source/live bundle/DB verifier, local/raw/short health, PM2/tunnel checks, and one final routed canary. Report exact evidence and any residual cryptographic/unsupported-tool ceiling.
