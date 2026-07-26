# Direct Claude Provider 9Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make direct Claude OAuth profiles identifiable, quota-aware, safely auto-pingable, and accurately described without changing private bare-model routing.

**Architecture:** Registry owns official OAuth/model constants. OAuth `postExchange` fetches profile identity through selected proxy. Claude usage service normalizes all provider quota shapes and coalesces polling. Existing scheduler consumes normalized quotas and adds one guarded inactive-window path.

**Tech Stack:** Next.js 16, Node.js ESM, Vitest, SQLite/sql.js localDb, existing `proxyAwareFetch` and provider registry.

## Global Constraints

- Work only in `/home/home/.openclaw/workspace-keyra/9router-claude-provider-v0540`.
- Do not read live tokens in tests or fixtures.
- Keep bare `claude-fable-5` and `claude-opus-4.8` private GitHub aliases unchanged.
- Keep selected OAuth proxy fail-closed and server-owned.
- No new dependency.
- Every behavior starts with a failing focused test.
- One behavior per commit; public commits contain no local routes, account data, or secrets.

---

### Task 1: Current OAuth URLs And Profile Identity

**Files:**
- Create: `tests/unit/claude-oauth-profile.test.js`
- Modify: `open-sse/providers/registry/claude.js:69-83`
- Modify: `src/lib/oauth/providers.js:75-131`
- Modify: `src/lib/db/repos/connectionsRepo.js:59-68`

**Interfaces:**
- Produces: Claude `postExchange(tokens, proxyOptions) -> { profile }`.
- Produces: mapped `email`, `displayName`, and `providerSpecificData` identity fields.
- Consumes: existing `exchangeTokens()` post-exchange hook and proxy-patched `fetch`.

- [ ] **Step 1: Write failing OAuth/profile tests**

Use synthetic profile data and assert exact endpoint, bearer/beta/version headers,
proxy propagation, non-fatal profile failure, and mapped fields:

```js
const profile = {
  account: {
    uuid: "account-uuid",
    email: "user@example.test",
    display_name: "User",
    has_claude_max: true,
    has_claude_pro: false,
  },
  organization: {
    uuid: "org-uuid",
    organization_type: "claude_max",
    rate_limit_tier: "default_claude_max_20x",
    subscription_status: "active",
  },
};

expect(fetch).toHaveBeenCalledWith(
  "https://api.anthropic.com/api/oauth/profile",
  expect.objectContaining({ proxyOptions }),
);
expect(result).toMatchObject({
  email: "user@example.test",
  displayName: "User",
  providerSpecificData: {
    accountId: "account-uuid",
    organizationId: "org-uuid",
    organizationType: "claude_max",
    rateLimitTier: "default_claude_max_20x",
    subscriptionStatus: "active",
  },
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-oauth-profile.test.js
```

Expected: FAIL because current registry URLs/scopes differ and Claude has no
`postExchange` profile mapping.

- [ ] **Step 3: Implement minimal profile mapping**

Set registry values from verified Claude Code `2.1.220`. Add:

```js
postExchange: async (tokens, proxyOptions) => {
  try {
    const response = await fetch("https://api.anthropic.com/api/oauth/profile", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        "anthropic-beta": "oauth-2025-04-20",
        "anthropic-version": "2023-06-01",
      },
      proxyOptions,
    });
    return { profile: response.ok ? await response.json() : null };
  } catch {
    return { profile: null };
  }
},
```

Map only approved profile fields. Extend `deriveConnectionName()` for provider
`claude` to prefer `email`, then `displayName`, then account UUID prefix, then
existing fallback.

- [ ] **Step 4: Verify GREEN and regressions**

Run new test plus:

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/oauth-authorize-binding.test.js tests/unit/oauth-refresh-routing.test.js
```

Expected: new tests PASS; existing tests PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/claude-oauth-profile.test.js open-sse/providers/registry/claude.js src/lib/oauth/providers.js src/lib/db/repos/connectionsRepo.js
git commit -m "fix: identify Claude OAuth profiles"
```

---

### Task 2: Complete And Coalesced Claude Usage

**Files:**
- Create: `tests/unit/claude-usage.test.js`
- Modify: `open-sse/services/usage/claude.js:18-96`

**Interfaces:**
- Produces: `getClaudeUsage(accessToken, proxyOptions)` with normalized `quotas`.
- Produces: scoped rows named `weekly <model> (7d)`.
- Internal: credential-hash cache and in-flight map; raw tokens never become log keys.

- [ ] **Step 1: Write failing quota-shape tests**

Fixture must include inactive top-level session plus `limits`:

```js
{
  five_hour: { utilization: 0, resets_at: null },
  seven_day: null,
  limits: [
    { kind: "session", group: "session", percent: 0, resets_at: null, is_active: true },
    { kind: "weekly_scoped", group: "weekly", percent: 12, resets_at: "2026-08-01T00:00:00Z", is_active: true,
      scope: { model: { display_name: "Fable" } } },
  ],
}
```

Assert one `session (5h)` row, one `weekly Fable (7d)` row, used `12`, remaining
`88`, and inactive rows retained with null reset.

- [ ] **Step 2: Write failing concurrency and 429 tests**

Assert two concurrent calls perform one upstream fetch. Seed one successful
result, then return `429` with `Retry-After: 600`; assert stale result is returned,
legacy settings URL is not called, and another immediate call makes no fetch.

- [ ] **Step 3: Verify RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-usage.test.js
```

Expected: FAIL because `limits`, coalescing, and stale-on-429 do not exist.

- [ ] **Step 4: Implement minimal normalizer and request coalescing**

Add pure helpers:

```js
export function normalizeClaudeUsage(data) { /* top-level windows plus limits */ }
function retryAfterMs(response, now = Date.now()) { /* Retry-After seconds/date */ }
function credentialKey(token) { return createHash("sha256").update(token).digest("hex"); }
```

Use one `Map` for last successful value/expiry/cooldown and one `Map` for
in-flight promises. Cap maps by deleting oldest entries above 128. Success TTL
is 65 seconds. OAuth `429` uses `Retry-After`, clamped to 3-30 minutes. OAuth
`401` returns an authentication message for usage route refresh handling. Only
`404`/`405` may use legacy fallback.

- [ ] **Step 5: Verify GREEN and UI parser compatibility**

Run:

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-usage.test.js tests/unit/quota-refresh-scheduler.test.js tests/unit/provider-quota-visibility.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/claude-usage.test.js open-sse/services/usage/claude.js
git commit -m "fix: expose complete Claude quota windows"
```

---

### Task 3: Guarded Inactive-Window Auto-Ping

**Files:**
- Modify: `tests/unit/quota-auto-ping.test.js:448-465`
- Modify: `src/shared/services/quotaAutoPing.js:79-241`
- Modify: `src/shared/constants/config.js:73-79`

**Interfaces:**
- Consumes normalized `session (5h)` and at least one `weekly*` row.
- Persists existing `lastPingAt`, `lastPingedResetAt`, and `lastPingedResetKey`.

- [ ] **Step 1: Add failing inactive-session tests**

Cover:

```js
quotas: {
  "session (5h)": { used: 0, total: 100, remaining: 100, resetAt: null },
  "weekly Fable (7d)": { used: 0, total: 100, remaining: 100, resetAt: null },
}
```

Expected one ping. Add separate tests proving no ping with missing weekly row,
exhausted weekly row, or `lastPingAt` less than five hours ago. Mock ping response
`text()` and assert it is drained once before DB update.

- [ ] **Step 2: Verify RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/quota-auto-ping.test.js
```

Expected: inactive-session test FAIL because current code returns on null reset.

- [ ] **Step 3: Implement one guarded inactive path**

Add helpers:

```js
function hasWeeklyQuota(quotas) {
  return Object.keys(quotas || {}).some((name) => name.toLowerCase().startsWith("weekly"));
}

function shouldPingInactiveSession(connection, quotas, quota, minIntervalMs, now) {
  return quota && !quota.resetAt && !isQuotaExhausted(quota) && hasWeeklyQuota(quotas)
    && !hasExhaustedBlockingQuota(quotas, "session (5h)")
    && !wasPingedRecently(connection, minIntervalMs, now);
}
```

Set Claude `minPingIntervalMs` to `5 * 60 * 60 * 1000`. Drain accepted Claude
response with existing `drainResponseBody`. Active reset behavior remains
unchanged.

- [ ] **Step 4: Verify GREEN**

Run quota test three times to expose state leakage:

```bash
for i in 1 2 3; do ./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/quota-auto-ping.test.js || exit 1; done
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/quota-auto-ping.test.js src/shared/services/quotaAutoPing.js src/shared/constants/config.js
git commit -m "fix: start inactive Claude quota windows safely"
```

---

### Task 4: Direct Claude Model Metadata

**Files:**
- Create: `tests/unit/claude-model-metadata.test.js`
- Modify: `open-sse/providers/registry/claude.js:62-68`
- Modify: `open-sse/providers/capabilities.js:73-89,196-197`

**Interfaces:**
- Produces registry models resolvable by `getModelCapabilities(provider, model)`.
- Consumed by `/v1/models` and `/v1/models/info` without UI-specific copies.

- [ ] **Step 1: Write failing table test**

Use a table of verified model ID, display name, context window, output limit,
thinking format, and any beta/conditional marker. Assert every direct registry
model has one capability result and no duplicate ID.

- [ ] **Step 2: Verify RED**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-model-metadata.test.js
```

Expected: FAIL for incomplete/incorrect registry or Haiku metadata.

- [ ] **Step 3: Apply official values only**

Use Claude Code `2.1.220` and official model docs evidence. Store runtime limits
in capabilities, not duplicate UI constants. Represent conditional 1M access in
model description/metadata rather than claiming unconditional availability.

- [ ] **Step 4: Verify GREEN and alias regression**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-model-metadata.test.js tests/unit/capabilities-opus-context.test.js tests/unit/provider-display-split.test.js
```

Expected: PASS; private GitHub aliases unchanged.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/claude-model-metadata.test.js open-sse/providers/registry/claude.js open-sse/providers/capabilities.js
git commit -m "fix: publish direct Claude model limits"
```

---

### Task 5: 9Router Review, Build, Backfill Tooling, And Public Commits

**Files:**
- Modify: `docs/superpowers/specs/2026-07-26-claude-provider-integration-design.md` only if verified evidence changed.
- Modify: local patch tracker selected during integration review.

- [ ] **Step 1: Run focused and broad gates**

```bash
./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-oauth-profile.test.js tests/unit/claude-usage.test.js tests/unit/quota-auto-ping.test.js tests/unit/claude-model-metadata.test.js tests/unit/oauth-authorize-binding.test.js tests/unit/oauth-refresh-routing.test.js tests/unit/claude-header-forwarding.test.js
npm run lint
npm run build
git diff --check
```

Expected: new and relevant tests PASS. Record the known pre-existing
`gotScraping` mock failure separately if still reproducible on untouched base.

- [ ] **Step 2: Independent code review**

Review security, token handling, duplicate OAuth identity, 429 behavior, timer
state, fallback, and private alias preservation. Fix findings test-first.

- [ ] **Step 3: Build a one-shot existing-profile backfill command**

Use application modules against a copied DB first. Fetch each missing Claude
profile through its configured pool and update `name`, `email`, `displayName`,
and approved provider-specific fields. Never print token/profile payloads.

- [ ] **Step 4: Split public commits/PRs**

Prepare separate public branches for OAuth/profile, usage, auto-ping, and model
metadata. Exclude design file if upstream ignores docs, private aliases, live
payloads, and deployment state.

- [ ] **Step 5: Update tracker**

Record commit IDs, exact files, RED/GREEN commands, build result, backfill
procedure, canary evidence, rollback, upstream branch, and reapply order.
