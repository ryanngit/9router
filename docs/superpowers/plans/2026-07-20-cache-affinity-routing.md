# Cache-Affinity Account Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prefer a previously successful provider account for matching request scopes while preserving first-request round-robin and all existing fallback behavior.

**Architecture:** A bounded in-memory service stores hashed scope-to-connection mappings. Chat routing supplies a preferred connection to the existing selector, which remains responsible for locks, exclusions, fallback, and strategy selection. Existing per-provider settings enable the feature; provider-native cache fields remain unchanged.

**Tech Stack:** JavaScript, Next.js route runtime, Web `Request`, Node `crypto`, Vitest, existing SQLite settings and account selector.

## Global Constraints

- Disabled by default and enabled per provider with `cacheAffinityEnabled: true`.
- No dependency, DB migration, persistent identity data, cleanup timer, or raw identity logging.
- Capacity is 5,000 entries; TTLs are 6 hours for session, 30 minutes for client, and 5 minutes for API-key scope.
- First request follows existing provider strategy.
- Locked, excluded, inactive, or deleted preferred accounts use existing fallback.
- Store affinity only after provider success; successful fallback repins.
- Keep live `/home/home/.9router` and PM2 unchanged until zero-OOM deployment gate passes.

---

### Task 1: Bounded Affinity State

**Files:**
- Create: `src/sse/services/cacheAffinity.js`
- Modify: `open-sse/utils/sessionManager.js`
- Create: `tests/unit/cache-affinity.test.js`

**Interfaces:**
- Produces: `extractClientSessionId(headers, body, scope, options)` where `options.includeRequestId` defaults to `true`.
- Produces: `createCacheAffinityScope({ provider, model, apiKey, fingerprint, sessionId })` returning `{ key, level, ttlMs } | null`.
- Produces: `getCacheAffinityPreference(scope, now?)`, `rememberCacheAffinity(scope, connectionId, now?)`, and `clearCacheAffinity()`.

- [ ] **Step 1: Write failing scope and state tests**

Cover session/client/API priority, `includeRequestId: false`, SHA-256 keys that contain no input values, fixed TTL expiry, recency refresh without expiry extension, 5,000-entry LRU eviction, and null handling.

```js
const scope = createCacheAffinityScope({
  provider: "codex",
  model: "gpt-5.6-sol",
  apiKey: "sk-secret",
  fingerprint: "client-secret",
  sessionId: "session-secret",
});
expect(scope.level).toBe("session");
expect(JSON.stringify(scope)).not.toMatch(/sk-secret|client-secret|session-secret/);
```

- [ ] **Step 2: Run RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/cache-affinity.test.js
```

Expected: FAIL because `cacheAffinity.js` and exported session extraction do not exist.

- [ ] **Step 3: Implement minimum state service**

Use one `Map`. Hash length-prefixed scope components with `crypto.createHash("sha256")`. Store `{ connectionId, expiresAt }`; move hits to Map tail without changing `expiresAt`. On insertion at capacity, remove expired entries, then oldest entries. Do not start an interval.

- [ ] **Step 4: Run GREEN and lint**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/cache-affinity.test.js tests/unit/session-manager.test.js
./node_modules/.bin/eslint src/sse/services/cacheAffinity.js open-sse/utils/sessionManager.js tests/unit/cache-affinity.test.js
```

Expected: all tests pass; ESLint emits nothing.

- [ ] **Step 5: Commit**

```bash
git add src/sse/services/cacheAffinity.js open-sse/utils/sessionManager.js tests/unit/cache-affinity.test.js
git commit -m "feat(routing): add bounded cache affinity state"
```

### Task 2: Chat Selection And Fallback

**Files:**
- Modify: `src/sse/handlers/chat.js`
- Create: `tests/unit/chat-cache-affinity.test.js`

**Interfaces:**
- Consumes Task 1 state API.
- Existing selector call becomes `getProviderCredentials(provider, excludeConnectionIds, model, { preferredConnectionId })`.

- [ ] **Step 1: Write failing routing tests**

Use mocked settings, client tracking, selector, and `handleChatCore` to prove:

```js
expect(getProviderCredentials).toHaveBeenNthCalledWith(
  2,
  "codex",
  expect.any(Set),
  "gpt-5.6-sol",
  { preferredConnectionId: "account-a" },
);
```

Cases: disabled provider passes no preference; first success records account;
second matching request prefers it; capacity fallback excludes it and repins
successful account B; failed/cancelled requests do not pin; different model,
session, client, or API key does not share scope.

- [ ] **Step 2: Run RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/chat-cache-affinity.test.js
```

Expected: FAIL because chat selection does not consult affinity.

- [ ] **Step 3: Integrate without changing fallback**

Make `admitRequest()` return its cached API-key client result and pass it through
single/combo callbacks. Build affinity only after admission and only when the
provider override is exactly enabled. Pass preferred ID on every selection;
existing exclusion and lock filters remain authoritative. Call
`rememberCacheAffinity` only in `result.success` before returning response.

- [ ] **Step 4: Run GREEN and fallback regression matrix**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js \
  tests/unit/chat-cache-affinity.test.js \
  tests/unit/chat-daily-limit-http.test.js \
  tests/unit/chat-stream-reservation-authority.test.js \
  tests/unit/codex-fast-capacity.test.js \
  tests/unit/account-fallback.test.js
```

Expected: all five files pass.

- [ ] **Step 5: Commit**

```bash
git add src/sse/handlers/chat.js tests/unit/chat-cache-affinity.test.js
git commit -m "feat(routing): prefer successful cache-affinity accounts"
```

### Task 3: Provider Toggle And Diagnostics

**Files:**
- Modify: `src/app/(dashboard)/dashboard/providers/[id]/page.js`
- Modify: `src/sse/services/cacheAffinity.js`
- Modify: `tests/unit/cache-affinity.test.js`

**Interfaces:**
- Provider setting: `providerStrategies[providerId].cacheAffinityEnabled`.
- Produces debug outcome values `miss`, `hit`, and `repin`; no scope key is returned to logger.

- [ ] **Step 1: Write failing enablement and diagnostic tests**

```js
expect(isCacheAffinityEnabled({ providerStrategies: { codex: { cacheAffinityEnabled: true } } }, "codex")).toBe(true);
expect(isCacheAffinityEnabled({ providerStrategies: { codex: { cacheAffinityEnabled: false } } }, "codex")).toBe(false);
```

Assert outcome objects contain provider/model/level/outcome only and never contain
scope hash or identity input.

- [ ] **Step 2: Run RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/cache-affinity.test.js
```

Expected: FAIL because enablement helper and diagnostic result do not exist.

- [ ] **Step 3: Add actual provider control**

Load `cacheAffinityEnabled` with existing provider strategy state. Preserve it
when round-robin settings change. Add one `Toggle` labeled `Cache affinity` next
to `Round Robin`; changing it PATCHes the same `providerStrategies` object.
Backend debug logs may include provider, model, scope level, and outcome only.

- [ ] **Step 4: Verify UI source and production build**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/cache-affinity.test.js tests/unit/chat-cache-affinity.test.js
./node_modules/.bin/eslint src/app/'(dashboard)'/dashboard/providers/'[id]'/page.js src/sse/services/cacheAffinity.js src/sse/handlers/chat.js
env HTTPS_PROXY=http://127.0.0.1:18888 HTTP_PROXY=http://127.0.0.1:18888 NO_PROXY=localhost,127.0.0.1 NODE_USE_ENV_PROXY=1 npm run build
```

Expected: tests/lint pass and Next generates 130 routes.

- [ ] **Step 5: Commit**

```bash
git add src/app/'(dashboard)'/dashboard/providers/'[id]'/page.js src/sse/services/cacheAffinity.js tests/unit/cache-affinity.test.js
git commit -m "feat(routing): configure provider cache affinity"
```

### Task 4: Review, Upstream, And Candidate Rollout

**Files:**
- Modify: `docs/PATCH_LEDGER.md`
- Modify: `docs/UPDATE_RUNBOOK.md`
- Modify: `/home/home/.openclaw/workspace-keyra/references/CHECKLIST.md`

**Interfaces:**
- Public branch contains generic source/UI/tests only.
- Private settings enable `codex`, `github`, and `grok-cli` only in copied candidate DB first.

- [ ] **Step 1: Run final verification**

```bash
git diff --check
gitleaks git --redact --no-banner --log-opts='upstream/master..HEAD'
./node_modules/.bin/vitest run --config tests/vitest.config.js tests/unit/cache-affinity.test.js tests/unit/chat-cache-affinity.test.js
```

Expected: no diff errors, no PR-range leaks, all focused tests pass.

- [ ] **Step 2: Independent review**

Review privacy, absolute TTL, LRU bound, first-request strategy, locked/excluded
fallback, successful repin, combo isolation, and no provider wire mutation. Fix
every Critical/High finding with a new RED/GREEN cycle.

- [ ] **Step 3: Build isolated candidate**

Use a new candidate HOME and loopback port `20129`. Never point candidate at
live tunnel. Verify first request follows round-robin, second matching request
hits same account, forced account lock falls back and repins, and different
session starts from strategy.

- [ ] **Step 4: Prepare public PR and update trackers**

Rebase a clean public branch on `upstream/master`, cherry-pick the three feature
commits, rerun focused tests/lint/build/Gitleaks, push normally, and create one
PR. Record branch, head, tests, candidate evidence, private enablement, and
rollback requirement in all three tracker files.

- [ ] **Step 5: Hold live rollout**

Do not restart PM2 or modify `/home/home/.9router` before `2026-07-25 18:55 PDT`
and zero new OOM kills/restarts. At gate, use normal two-snapshot atomic exchange
and preserve existing tunnel process.
