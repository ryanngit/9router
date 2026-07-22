# 9Router Update Runbook

Last updated: 2026-07-21

Use this before updating, patching, deploying, or preparing upstream PRs. The goal is minimal downtime and no rediscovery of fragile behavior.

## 0. Ground Rules

- Live data is `/home/home/.9router`.
- Live app is `/home/home/.npm-global/lib/node_modules/9router/app`.
- Live wrapper workspace is `/home/home/.openclaw/workspace-keyra/9router-patch`.
- Use a clean version-specific worktree for source changes and builds. Current local integration source is `/home/home/.openclaw/workspace-keyra/9router-local-v0540-integration`; public PR worktrees share `/home/home/.openclaw/workspace-keyra/9router-prs-20260708`.
- User traffic may be connected through 9Router; avoid restarts until the final deploy step.
- Gateway, proxy-farm, health-check, and Observer runtime changes remain behind
  their reliability soak. An explicitly requested 9Router release promotion may
  proceed separately after isolated differential QA, zero-active exchange gates,
  verified rollback, and unchanged gateway/proxy configuration.
- Do not rely on `git status` in `9router-patch` until broken worktree metadata is fixed.
- Do not push upstream branches from a dirty/broken worktree.
- Never change API-key token limits, activation, model access, or customer
  quotas to create a deployment quiet window. Those are customer contracts,
  not admission-drain controls. Use the active-request gate unchanged and wait
  for natural quiet until a dedicated connection-draining edge is deployed.
- Never proactively restart or replace cloudflared during an app upgrade. If local app health passes but the recorded raw tunnel remains down, one guarded recovery is allowed after app rollback gates pass; record the old/new PID and raw URL, then re-register the existing short ID.
- P17 deployments must run `app/custom-server.js`; `app/server.js` loses trusted tunnel client identity.
- P19/P20 Grok subscription inference is a strict Responses compatibility boundary. Never restore the old incremental mutators in `grok-cli.js`; request semantics live in `grok-cli-compat.js`.
- P1 OAuth proxy context must remain selected from authorize/device-code through callback, token exchange, and refresh. Fixed-port PKCE secrets belong in POST bodies, never query strings.
- P25 native Responses has five terminal invariants: completed/incomplete/failed/error are terminal, terminal state survives pipe wrappers, `[DONE]` appears once, failed or unterminated JSON/SSE is not account success, and incomplete usage is billable.
- P27 Responses custom tools must remain custom across the GitHub Claude Chat
  bridge. Wrapping them as Chat functions is internal only: provider requests
  receive `{input:string}`, clients receive `custom_tool_call` plus plain-string
  input, and internal metadata never reaches provider payloads or usage details.
- P28 GitHub Claude limits are Copilot transport limits, not Anthropic marketing
  limits. Fable 5 and Opus 4.8 use 200,000 prompt, 64,000 output, and 264,000
  total tokens. Large requests must use bounded `/v1/messages/count_tokens`
  preflight and return structured `context_length_exceeded`; never store an
  empty successful stream for an oversized prompt.
- Keep `Codex/<version>` heartbeat recognition route-local in
  `/v1/responses`. Adding it to `detectClientTool()` changes native-passthrough
  behavior and still loses to `X-Initiator: user` detector precedence.
- P26 cache affinity is opt-in account preference, not sticky availability.
  First requests use the configured strategy; locks, cooldowns, exclusions, and
  fallback win; only explicit successful terminal events pin or repin.
- For Codex pools expected to start every rolling quota window early, preserve
  one true `codexAutoPing.connections[connectionId]` entry per active OAuth
  profile. Auto-ping handles window activation out of band; do not weaken
  affinity or rotate live user sessions for quota priming. Enroll newly added or
  re-enabled profiles explicitly.
- P29 runtime bootstrap is process-owned, not dashboard-owned. The custom HTTP
  server probes `/api/init` after listening; that route imports the guarded
  bootstrap. API-only startup must still start watchdogs, tunnel recovery, and
  configured quota auto-ping.
- P30 cloudflared exit cleanup is child-owned. A stale child may not clear a
  successor PID file or successor in-memory process reference.
- Do not replace the local `cli/cli.js` with upstream blindly. Current wrapper intentionally preserves tunnel processes; upstream `0.5.30` wrapper can terminate them.

Current verified live deployment (2026-07-22):

- Version `0.5.40`; PM2 PID `2588779`; restart count 19; entrypoint
  `app/custom-server.js`; Sol/max/default policy remains saved in
  `/home/home/.pm2/dump.pm2`.
- Cloudflared PID `2588922`; raw URL
  `https://enough-qualified-chocolate-structure.trycloudflare.com`; short URL
  `https://rkeyra9.abc-tunnel.us`.
- Codex auto-ping is enabled for all nine active OAuth profiles so cache
  affinity cannot leave rolling quota windows unstarted. Runtime-setting backup:
  `/home/home/.9router/db/data.sqlite.bak-codex-autoping-20260721-2113`.
- Rollback app
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-tunnel-pid-active3-20260721-20260722T050308Z`;
  DB backup
  `/home/home/.9router/db/backups/pre-v0540-tunnel-pid-active3-20260721-20260722T050308Z/data.sqlite`.
- Promotion status
  `/home/home/.openclaw/workspace-keyra/9router-ops/v0540-tunnel-pid-active3-20260721.status`
  is `succeeded`; child PID ownership, local/raw/short health, DB integrity,
  9/9 Codex auto-ping coverage, and full source/live-bundle/DB verifier passed.

Source and upstream state as of 2026-07-21:

- Atomic API-key reservations and Gemini usage authority are integrated through
  local head `cb82d82`; public PR #2454 is CLEAN at `7ed5dff` on v0.5.40.
- Post-header Responses and Chat heartbeat work is live through local commit
  `863db8f`. Public PR #2666 is `CLEAN` at `c49e37e` with exact
  `Codex/0.1.0` plus `X-Initiator: user` coverage; do not restore the rejected
  shared-detector implementation from `cec2e68`.
- Cache-affinity routing and terminal hardening are integrated through
  `b03a81d`; public PR #2736 is CLEAN at `f93d8aa` on v0.5.40.
- Process-start runtime bootstrap is live; public PR #2764 is CLEAN at
  `5c54205`. Preserve both the post-listen init probe and init-route bootstrap.
- Child-owned cloudflared PID cleanup is live; public PR #2765 is CLEAN at
  `e22c5bf`. Preserve conditional `clearPid(child.pid)` in both exit handlers.
- Local v0.5.40 runtime code head is `46cbe24`; GitHub Claude prompt limits,
  bounded exact counting, and structured Responses errors passed isolated and
  live short-domain QA before promotion label
  `v0540-fable-context-cutover-20260721` made it live.
- All 21 open public PRs were checked against v0.5.40: 19 received normal merge
  updates, two already contained v0.5.40, and all 21 report `MERGEABLE/CLEAN`.
  Full heads/tests are recorded in
  `/home/home/.openclaw/workspace-keyra/9router-ops/v0540-upstream-refresh-report.md`.

## 1. Brainstorm / Analyze

Checklist:

- Read `docs/PATCH_LEDGER.md`.
- Identify which patch IDs are touched by the update.
- Confirm the target release:

```bash
npm view 9router version dist-tags --json
```

- Check current live status:

```bash
pm2 describe 9router | sed -n '1,80p'
curl -fsS http://127.0.0.1:20128/api/health
cat /home/home/.9router/tunnel/state.json 2>/dev/null || true
sqlite3 -noheader /home/home/.9router/db/data.sqlite \
  "SELECT json_extract(data,'$.codexAutoPing') FROM settings WHERE id=1;" | jq .
```

For a Codex pool using early window activation, compare enabled auto-ping IDs
against active OAuth connections before and after promotion. Counts and IDs must
match; disabled/non-OAuth profiles must remain excluded.

- Check source/config/DB invariants before building:

```bash
cd /home/home/.openclaw/workspace-keyra/9router-local-v0540-integration
node scripts/verify-local-patches.mjs \
  --root . \
  --no-bundle \
  --db /home/home/.9router/db/data.sqlite \
  --codex-config /home/home/.codex/config.toml \
  --model-catalog /home/home/.openclaw/codex-9router-model-catalog.json
```

Current live `0.5.35` bundle includes P24/P25/OAuth corrections and must pass the full verifier with zero failures/warnings. After building, run it against the candidate app; after promotion, run it against live again.

Stop if:

- Source/config/DB verification has failures, candidate verification has any failure, or live verification has any failure.
- The source directory has broken git metadata and the task is upstream PR prep.
- The live app health check fails before any edits.
- Candidate version differs from npm `latest` or the requested pinned version.

## 2. Plan

Write a short plan before editing:

- Patch IDs affected.
- Files expected to change.
- Tests to run.
- Live deploy/rollback path.
- Downtime window.

Deployment rule:

- Source-only docs/tests/scripts do not require PM2 restart.
- Runtime source changes require build-stage deploy and a backup of live app.
- DB-only aliases/settings must be verified with direct DB query and one routed request.
- Wrapper changes are a separate deployment. App bundle upgrades must not silently replace `cli/cli.js`.

## 3. Develop

Use the smallest diff that preserves the invariant.

Before editing runtime code:

- Confirm the file in source and live bundle relationship.
- Prefer source changes, then rebuild/deploy.
- Do not patch bundled `.next-cli-build` files directly except as an emergency rollback workaround.

For live aliases, use DB writes only when the source/default path is not enough:

```bash
sqlite3 /home/home/.9router/db/data.sqlite \
  "select scope,key,value from kv where scope='modelAliases' order by key;"
```

## 4. Code Review

Review the diff against the patch ledger:

- Does the change preserve every required invariant for touched patch IDs?
- Did it accidentally merge distinct ChatGPT tags/workspaces?
- Did it remove Stripe filtering or 18889 browsing behavior? If touching gateway/proxy code, stop and inspect those routes separately.
- Did it route bare `gpt-5.5` to Codex, not OpenAI API?
- Did it preserve P12 endpoint-wide routing for both bare and provider-prefixed `gpt-*` models?
- Does `pm2 env 0 | rg 'NINE_ROUTER_BEST_GPT'` show target `cx/gpt-5.6-sol`, effort `max`, and service tier `default`?
- Did it preserve explicit proxy pools and `__none__` no-proxy behavior?
- Do unavailable selected pools fail closed, and do rapid modal pool changes start only the newest generation after the prior fixed proxy stops?
- Are Codex/xAI fixed-port starts POST-only, state-bound on stop/status, and free of verifier/redirect/proxy secrets in URLs?
- Did it preserve local route access on `127.0.0.1:20128`?
- Does Console Log still work through both raw and short tunnel URLs when SSE is buffered?
- Does quota refresh have one scheduler and one real-time countdown?
- Does API-key client tracking avoid raw IP/full user-agent storage and remain observe-only?
- Does Grok inference still use `X-XAI-Token-Auth`, `x-authenticateresponse`, `x-grok-client-mode`, and `x-grok-user-id`, while model/usage resource calls retain `x-userid`/`x-email`?
- Does Grok preserve native `rs_<UUID>`, self-identifying `tco_*`, `ctc_*` plus `xs_call-*`, web-search, and code-interpreter history while removing foreign OpenAI reasoning?
- Are unmatched HTTP 400/422 errors returned without account lock/fallback, while capacity/rate/quota text still rotates accounts?
- Does xAI sanitize only OpenAI Responses transport while leaving Chat history untouched?
- Does a completed/incomplete terminal followed by `ECONNRESET` avoid a second `response.failed` and emit one `[DONE]`?
- Does EOF without any terminal become `response.failed` or fallback-capable HTTP 502 before usage/account success?
- Does cache affinity remain disabled by default, hash provider/model/session/
  client/API-key scope, preserve first-request strategy, and repin only after a
  successful fallback?
- Can concurrent provider settings changes preserve unrelated providers and
  unknown fields through one transactional read-merge-write?

Do not mark upstream-ready until:

- The branch is re-cut from a clean upstream clone.
- Tests cover the actual bug.
- Live/manual evidence exists for provider behavior that cannot be mocked.

## 5. QA & Test

Minimum local checks:

```bash
cd /path/to/clean/version-worktree
node --check scripts/verify-local-patches.mjs
node scripts/verify-local-patches.mjs \
  --root . \
  --bundle /path/to/verified/candidate/app \
  --db /home/home/.9router/db/data.sqlite \
  --codex-config /home/home/.codex/config.toml \
  --model-catalog /home/home/.openclaw/codex-9router-model-catalog.json \
  --health http://127.0.0.1:20128/api/health
```

Targeted manual checks by patch:

- P1 OAuth: expired/fake Codex exchange returns OpenAI JSON, not Cloudflare HTML. Run callback, modal race, device, Kiro social, and refresh-routing tests; verify direct mode emits no gateway traffic and selected mode keeps one pool through refresh.
- P2 Codex fast/max: GPT-5.4/GPT-5.5 `fast` maps to `priority`; GPT-5.6 `fast`/`priority` is removed; Codex `max` does not produce invalid `max`.
- P3 workspace: same email with different workspace/account IDs remains distinct.
- P4 capacity: capacity text triggers account retry, not client failure.
- P5 Copilot models: `claude-opus-4.8` and `claude-fable-5` route to `github`.
- P5 Copilot thinking: Opus 4.8 and Fable 5 with `max` must both reach native `/v1/messages`; Fable wire must use adaptive thinking plus `output_config.effort`.
- P6 usage: cached tokens lower cost; API-key grouping remains separated.
- P7 reset bank: confirmation appears before reset consume; cancel does not POST.
- P11 key limits: unlimited key proceeds; exhausted key returns HTTP 429 before
  provider/account selection; DB contains only null or non-negative integer
  limits. Run concurrent admission on SQLite and sql.js, account fallback with
  one reservation, terminal reconciliation, failure release, truncated-stream
  retention, combo/fusion isolation, same-prefix keys, OpenAI reasoning subset,
  reasoning-only legacy rows, and Gemini candidate-plus-thinking authority.
- P12 best GPT: `gpt-5.4-mini` must route to provider/usage model `gpt-5.6-sol` with effort `max`, no provider service tier, and effective response tier `default`.
- P12 Codex catalog: active model exists in the catalog, active effort is supported, Sol/Terra retain Ultra/V2, Luna remains max-only/V1, and all GPT-5.6 entries retain Responses Lite plus 372,000 context.
- P14 Responses Lite: omit `reasoning.context` and `parallel_tool_calls`; provider request must contain `reasoning.context="all_turns"` and `parallel_tool_calls=false`. Repeat with incoming `parallel_tool_calls=true`.
- P15 console: local SSE emits `init`; raw and short tunnels fall back to ETag polling after silent SSE.
- P16 quota: countdown advances once per real second and one refresh occurs at the deadline.
- P17 API clients: trusted-IP tests pass; one keyed canary appears under Usage > API Key Clients.
- P18 usage SSE: route never calls `getUsageStats`; payload contains only active/recent/error/pending fields and overlapping events coalesce.
- P19 Grok subscription: bare private `grok-4.5` still resolves to `grok-cli/grok-4.5` through its strict residential pool; do not upstream that alias or pool.
- P20 Grok codec: run minimal text, strict web search, native x-search two-turn replay, typed function/custom history, structured output, malformed/duplicate/orphan/dangling repair, local 400 no-lock, and approximately 1 MB/463-item replay.
- P20 candidate safety: copy the live DB with SQLite `.backup`, remove every `refreshToken`, bind candidate to `127.0.0.1:20129`, start no tunnel, then delete the credential-bearing candidate home after QA.
- P21 Responses heartbeat: explicit `stream:true` must return `: connected`
  immediately. Generic clients receive comments only before provider headers;
  modern Codex clients receive real ignorable events every 25 seconds before and
  after headers. A 130-second silent provider must yield five keepalives then
  unchanged completion. Fragment a provider event across chunks and split CR/LF;
  assert no keepalive appears inside it and one upstream read occurs per pull.
  Cancelling the client must close downstream, abort provider work, leave no
  timer, and avoid account locks. Repeat non-Codex, `stream:false`, omitted
  `stream`, invalid JSON, and streaming-error controls. Shared client detection
  and native provider pass-through must remain byte-equivalent.
- P25 Responses terminal matrix: completed plus reset, incomplete plus usage, failed SSE, failed JSON, top-level `event:error`, and EOF before terminal. Assert fallback-capable 502 for failures and exact cached/reasoning accounting for incomplete. Live Fable incomplete canary must use `stream:false`, `max_output_tokens:1`, and `reasoning.effort=max`; do not use `none`, because Fable rejects `thinking.type.disabled`.
- P26 cache affinity: leave disabled for baseline; then enable one isolated
  provider and verify A/A for one session, independent B for another, forced A
  failure to B, and B after A recovery. Check affinity logs contain no raw API
  key, client ID, or session ID, and confirm no affinity table or duplicate raw
  identity store was added. Repeat a client cancel after parsed terminal and an
  unterminated stream; only the former may pin and save usage.
- P27 Fable custom tools: declare one Responses `custom` tool, force that tool,
  and require `response.custom_tool_call_input.delta`,
  `response.custom_tool_call_input.done`, and `response.output_item.done` with
  `type=custom_tool_call`. Submit its `custom_tool_call_output` and require a
  normal completion. Repeat through every active GitHub profile. Also run a
  mixed ordinary-function control and assert `_customToolNames` is absent from
  provider requests and stored request details. Use a different active API key
  for each live profile so cache affinity cannot reuse the first account:
  `node scripts/probe-fable-custom-tool-roundtrip.mjs --base "$BASE" --api-key-id "$API_KEY_ID" --expect-connection "$CONNECTION_ID"`.
  Never disable live profiles merely to force this canary.
- P28 GitHub Claude context: verify live `/models` normalizes Fable 5 and Opus
  4.8 to `contextWindow=264000`, `maxPrompt=200000`, and `maxOutput=64000`.
  Small requests must make one generation call without token-count preflight.
  A synthetic request above 200,000 prompt tokens must call
  `/v1/messages/count_tokens`, skip generation, and emit one Responses
  `response.failed` with `error.code=context_length_exceeded` plus `[DONE]`.
  Repeat plain max-reasoning, forced custom-tool, and custom-tool continuation
  through every active GitHub profile. Codex catalogs must use an effective
  context no larger than 200,000 and compact below that boundary; reload each
  Codex app/CLI process after catalog edits because catalogs load at startup.
- P29 runtime bootstrap: start an isolated standalone server with a dummy
  auto-ping connection and tunnel/MITM disabled. Without opening dashboard or
  calling init manually, require local health plus exactly one
  `[AutoPing] scheduler started`. Source and bundle must retain the post-listen
  `/api/init` probe; the init route must import the guarded bootstrap.
- P30 tunnel PID ownership: save successor PID B, run stale cleanup for PID A,
  and require B to remain. Both cloudflared exit handlers must conditionally
  clear the current child reference and call `clearPid(child.pid)`. After live
  restart, observe PID file, process, and raw URL across at least three watchdog
  intervals with zero watchdog restart.
- P23 correlation: one candidate request-detail ID must equal the gateway/Observer `correlation_id` on start, selection, failover, and terminal events. Force one executor retry and verify every upstream attempt keeps that value; force account fallback and verify the next account gets a distinct provider-attempt ID.
- P24 request logs: with request logging enabled in an isolated HOME, credential-bearing client/provider headers must be `[REDACTED]`, correlation headers must remain visible, inputs must remain unchanged, and newly created directories/files must be `0700`/`0600`. Logging disabled must create nothing.

Known clean-upstream `0.5.35` baseline:

- Stock `0.5.35` passes 1,311, fails 34, and leaves 59 pending in the latest identical `CI=1` run.
- Customized `0.5.35` passes 1,588, fails 32, and leaves 59 pending. It fixes two stock `force-stream-config` failures and introduces zero candidate-only failures; compare assertion sets before attributing any future failure to a local patch.
- Stock and customized trees also share 12 React lint errors and two warnings. Run changed-path lint separately and compare any touched failing UI file against clean `v0.5.35`.

Tunnel checks:

```bash
cat /home/home/.9router/tunnel/state.json
curl -fsS --max-time 20 http://127.0.0.1:20128/api/health
curl -fsS --max-time 20 https://rkeyra9.abc-tunnel.us/api/health
ps -p "$(cat /home/home/.9router/tunnel/cloudflared.pid)" -o pid,lstart,args
```

## 6. Deploy

For runtime source changes:

1. Build in a staging directory or source workspace.
2. Copy the staged app to a candidate directory on the same filesystem as live app.
3. Verify candidate version and all patch invariants.
4. Record cloudflared PID and create a verified DB backup.
5. Exchange candidate and live app directories.
6. Start/reload PM2 once with `app/custom-server.js` as `pm_exec_path`.
7. Poll local health for up to 90 seconds before deciding rollback.
8. Give process-start bootstrap up to 120 seconds to restore raw and short
   tunnel health. Do not call tunnel enable while auto-resume is running.
9. If automatic recovery misses that deadline, call one guarded tunnel enable.
   Record any PID/URL change and verify raw plus short mapping before success.
10. Update only `cli/package.json` version after successful app health if retaining the local wrapper.

When this control conversation uses the same 9Router path, keep live untouched through source review, build, isolated QA, differential, and rollback rehearsal. Promote all runtime commits together with one PM2 restart; never use feature-by-feature live restarts.

Canonical promotion helper for current verified source:

```bash
/home/home/.openclaw/workspace-keyra/9router-ops/safe-promote-app.sh \
  /path/to/verified/candidate/app \
  descriptive-label
```

This helper runs the source/bundle/DB verifier, waits for two zero-active snapshots before backup and again before exchange, uses `mv -T --exchange`, restarts only PM2 `9router`, keeps rollback armed through local health and invariant checks, and polls existing raw/short tunnel health before any guarded tunnel-enable attempt.

Helper status `succeeded_external_pending` means app promotion and rollback checks passed but raw/short tunnel recovery still needs manual verification. When raw health passes and short returns 530, re-register current `state.json` values instead of restarting cloudflared again.

For isolated Next standalone candidates, set `HOSTNAME=127.0.0.1`; `HOST=127.0.0.1` is ignored and leaves the candidate on `0.0.0.0`. Verify with `ss -ltnp 'sport = :20129'` before any credential-bearing canary.

Default `MAX_ACTIVE=0` must remain the normal gate. `activeRequests` is grouped
by route/account, so the helper must sum each row's `count`; array length is not
request concurrency. When the deployment controller itself is the one active
9Router request and cannot finish before deployment, launch the helper with
`MAX_ACTIVE=1` only after confirming the summed count is exactly one. Both quiet
snapshots still apply, and any second request blocks the swap. Record this
exception because that one control request may reconnect during PM2 restart.

If the user explicitly accepts interrupted streams and brief downtime, an
active cutover may use `MAX_ACTIVE>1` only with
`ALLOW_ACTIVE_CUTOVER=1`. Record observed active count and threshold, retain
both pre-swap snapshots, DB backup, atomic exchange, local-health rollback, and
raw/short tunnel recovery. This is emergency downtime authorization, not a
drain mechanism. Never change API-key limits, activation, model access, account
locks, aliases, or provider quotas to manufacture a quiet window.

Before staged CLI build, verify nested CLI dev dependencies exist:

```bash
node -e "require.resolve('esbuild', { paths: ['./cli'] })"
```

If missing, install the already-declared CLI dev dependencies before building. Never deploy a candidate after `build-cli.js` stops at the MITM step. If MITM source is unchanged and an emergency build must proceed, reuse the exact verified live bundled `src/mitm/server.js` and compare SHA-256 hashes.

Allow a long command ceiling for `build-cli.js`. Historical cold builds took 23 minutes; the verified `0.5.35` warm build took 112 seconds. Completion, not elapsed time, is the gate.

Manual fallback skeleton:

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LIVE=/home/home/.openclaw/workspace-keyra/9router-patch/cli/app
CANDIDATE=/path/to/verified/candidate/app
BACKUP=/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-$STAMP
TUNNEL_PID_BEFORE=$(cat /home/home/.9router/tunnel/cloudflared.pid)
ENTRYPOINT="$LIVE/custom-server.js"

# Verify candidate bundle before this point.
mv --exchange -T "$LIVE" "$CANDIDATE"
pm2 delete 9router
env \
  PORT=20128 \
  HOSTNAME=0.0.0.0 \
  NODE_EXTRA_CA_CERTS=/home/home/.openclaw/gateway/certs/ca.crt \
  NINE_ROUTER_BEST_GPT_ENABLED=true \
  NINE_ROUTER_BEST_GPT_TARGET=cx/gpt-5.6-sol \
  NINE_ROUTER_BEST_GPT_REASONING_EFFORT=max \
  NINE_ROUTER_BEST_GPT_SERVICE_TIER=default \
  pm2 start "$ENTRYPOINT" --name 9router --cwd "$LIVE" --merge-logs --update-env

if ! curl -fsS --max-time 20 http://127.0.0.1:20128/api/health; then
  mv --exchange -T "$LIVE" "$CANDIDATE"
  pm2 delete 9router
  env \
    PORT=20128 \
    HOSTNAME=0.0.0.0 \
    NODE_EXTRA_CA_CERTS=/home/home/.openclaw/gateway/certs/ca.crt \
    NINE_ROUTER_BEST_GPT_ENABLED=true \
    NINE_ROUTER_BEST_GPT_TARGET=cx/gpt-5.6-sol \
    NINE_ROUTER_BEST_GPT_REASONING_EFFORT=max \
    NINE_ROUTER_BEST_GPT_SERVICE_TIER=default \
    pm2 start "$LIVE/custom-server.js" --name 9router --cwd "$LIVE" --merge-logs --update-env
  exit 1
fi

mv -T "$CANDIDATE" "$BACKUP"
pm2 save
curl -fsS --max-time 20 https://rkeyra9.abc-tunnel.us/api/health
test "$(cat /home/home/.9router/tunnel/cloudflared.pid)" = "$TUNNEL_PID_BEFORE"
```

Rollback:

```bash
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
LIVE=/home/home/.openclaw/workspace-keyra/9router-patch/cli/app
BACKUP=/path/to/known-good-backup
FAILED=/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.failed-$STAMP

mv --exchange -T "$LIVE" "$BACKUP"
mv -T "$BACKUP" "$FAILED"
pm2 delete 9router
env \
  PORT=20128 \
  HOSTNAME=0.0.0.0 \
  NODE_EXTRA_CA_CERTS=/home/home/.openclaw/gateway/certs/ca.crt \
  NINE_ROUTER_BEST_GPT_ENABLED=true \
  NINE_ROUTER_BEST_GPT_TARGET=cx/gpt-5.6-sol \
  NINE_ROUTER_BEST_GPT_REASONING_EFFORT=max \
  NINE_ROUTER_BEST_GPT_SERVICE_TIER=default \
  pm2 start "$LIVE/custom-server.js" --name 9router --cwd "$LIVE" --merge-logs --update-env
curl -fsS http://127.0.0.1:20128/api/health
```

Notes:

- `mv --exchange` requires `-T`; without it, an existing directory is treated as a destination parent.
- Candidate and live directories must share a filesystem.
- Check PM2 `Active requests` is zero immediately before exchange when possible.
- P17 requires PM2 to run `app/custom-server.js`; verify `pm2 jlist` after deploy. Starting `cli.js` is not required.
- Starting an unreviewed upstream wrapper can kill the stable quick tunnel. Keep the local wrapper until its process-management diff is rebased and tested separately.
- After health passes, verify `curl http://127.0.0.1:20128/api/version`, `pm2 describe 9router`, both package files, and `9router --version` report the same release.
- After every deploy, send a bare `gpt-5.4-mini` canary and verify response, request-detail, provider, and usage model are `gpt-5.6-sol`; routed/provider effort must be `max`, provider tier absent, and effective response tier `default`.
- After Usage SSE changes, open several candidate SSE clients, complete one model request, and verify `/api/health` stays responsive; never stress the pre-patch live SSE path against a large DB.
- Treat sub-second health degradation during many concurrent 400-1,100-message requests as request parsing/serialization load. Investigate only if it persists without large concurrent requests or rises into multi-second stalls; provider TTFT is tracked separately.
- Before an OAuth provider canary, run the same canary against current live bundle. A pre-existing `bad-credentials` result is a credential blocker, not a candidate rollback signal.
- Never let an isolated DB copy refresh a rotatable OAuth token. Copy a fresh unexpired access token, then remove its refresh token in candidate DB; reauthorize live profile first when access is already near expiry.
- For P21 delayed-header QA, use a candidate-only compatible provider and loopback mock. Never add the mock provider, raised connect timeout, temporary tunnel, or QA credentials to live DB/PM2 state.

## 7. Retrospective

After every patch/update:

- Update `docs/PATCH_LEDGER.md` with changed files, live backup path, tunnel URL, and verification results.
- Add or update a verifier invariant when the issue was rediscovered manually.
- Record feature commit, upstream branch head, reviewer verdict, focused counts, clean-baseline differential, candidate path, and live backup path separately; one green unit count is not a deployment record.
- Copy the updated ledger, runbook, and verifier into the clean current local branch and commit them there.
- If a pushed upstream branch was affected, mark it stale until re-cut.
- Record anything that was skipped and the trigger for adding it.

Skipped by design:

- Full upstream branch repair in this runbook. Add it when a fresh clone is available and a specific PR is being prepared.
- Gateway tag/domain ledger. Add a separate gateway ledger before touching `/home/home/.openclaw/gateway`.
