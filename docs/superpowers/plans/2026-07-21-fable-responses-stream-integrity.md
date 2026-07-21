# Fable Responses Stream Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit protocol-correct Responses output indexes for GitHub Fable reasoning and tool calls.

**Architecture:** Keep existing GitHub Claude transport and both translation stages. Add item-index allocation inside `createResponsesApiTransformStream`, keyed by source message/tool indexes, so separate Responses items never share an output index.

**Tech Stack:** JavaScript, Web Streams API, Vitest, Next.js/Node.js 9Router bundle

## Global Constraints

- Keep `/v1/messages` routing and prompt-cache usage intact.
- Do not change live API-key limits, account state, proxy routing, or heartbeat behavior.
- Use a candidate build and one-restart promotion through the existing update runbook.

---

### Task 1: Reproduce Output-Index Collision

**Files:**
- Create: `tests/unit/responses-transformer-item-index.test.js`
- Test: `tests/unit/responses-transformer-item-index.test.js`

**Interfaces:**
- Consumes: `createResponsesApiTransformStream(logger)`
- Produces: regression contract for unique and stable `output_index` values

- [ ] **Step 1: Write failing reasoning-plus-tool test**

Feed Chat SSE containing `reasoning_content`, one indexed `tool_call`, a
`finish_reason`, and `[DONE]` through the real transformer. Parse emitted events
and assert reasoning uses index `0`, function call uses index `1`, each item's
added/delta/done events retain its index, and terminal events occur once.

- [ ] **Step 2: Verify RED**

Run:

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/responses-transformer-item-index.test.js
```

Expected: FAIL because reasoning and function call both currently use index `0`.

- [ ] **Step 3: Add failing multiple-tool assertion**

Feed two tool calls after reasoning and assert item indexes are `[0, 1, 2]` in
first-seen order.

### Task 2: Allocate Responses Item Indexes

**Files:**
- Modify: `open-sse/transformer/responsesTransformer.js`
- Test: `tests/unit/responses-transformer-item-index.test.js`

**Interfaces:**
- Consumes: source choice index and source tool-call index
- Produces: stable integer output indexes via transformer-local state

- [ ] **Step 1: Implement minimal allocator**

Add `nextOutputIndex`, `msgOutputIndexes`, and `funcOutputIndexes` to state.
Allocate reasoning once in `startReasoning`, message once before its first added
event, and function call once before its first added event. Use allocated values
for every related event and ID.

- [ ] **Step 2: Verify GREEN**

Run the focused Vitest command from Task 1. Expected: PASS.

- [ ] **Step 3: Run related regressions**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/github-responses-routing.test.js tests/translator/golden-response-stream.test.js tests/unit/openai-responses-terminal-event.test.js tests/unit/responses-early-stream.test.js
```

Expected: all tests PASS with no unhandled errors.

- [ ] **Step 4: Commit code and tests**

```bash
git add open-sse/transformer/responsesTransformer.js tests/unit/responses-transformer-item-index.test.js
git commit -m "fix(responses): keep translated output indexes unique"
```

### Task 3: Candidate QA and Promotion

**Files:**
- Modify: `docs/PATCH_LEDGER.md`
- Modify: `docs/UPDATE_RUNBOOK.md` only if deployment steps changed

**Interfaces:**
- Consumes: tested source commit and existing candidate deployment scripts
- Produces: verified live Fable tool-call continuation

- [ ] **Step 1: Run full patch verifier and stream suite**

```bash
node scripts/verify-local-patches.mjs
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit tests/translator
```

- [ ] **Step 2: Build candidate and run local Fable canaries**

Require one function call, unique indexes, successful function output
continuation, one `response.completed`, clean EOF, and no 4xx/5xx provider error.

- [ ] **Step 3: Back up and promote**

Follow `docs/UPDATE_RUNBOOK.md`; preserve `/home/home/.9router`, ports `20128`,
`18888`, and `18889`, then restart only PM2 `9router` once.

- [ ] **Step 4: Verify all public paths**

Require HTTP 200 for local, raw tunnel, and `https://rkeyra9.abc-tunnel.us`, then
repeat Fable tool-call continuation through short URL.

- [ ] **Step 5: Track and upstream**

Record backup paths, commit, tests, canary timestamps, rollback, and upstream PR
in `docs/PATCH_LEDGER.md`. Create a clean branch from `upstream/master` containing
only transformer code and regression tests.
