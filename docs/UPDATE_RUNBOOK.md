# 9Router Update Runbook

Last updated: 2026-07-13

Use this before updating, patching, deploying, or preparing upstream PRs. The goal is minimal downtime and no rediscovery of fragile behavior.

## 0. Ground Rules

- Live data is `/home/home/.9router`.
- Live app is `/home/home/.npm-global/lib/node_modules/9router/app`.
- Live wrapper workspace is `/home/home/.openclaw/workspace-keyra/9router-patch`.
- Use a clean version-specific worktree for source changes and builds. Current clean source is `/home/home/.openclaw/workspace-keyra/9router-upgrade-v0.5.30`.
- User traffic may be connected through 9Router; avoid restarts until the final deploy step.
- Do not rely on `git status` in `9router-patch` until broken worktree metadata is fixed.
- Do not push upstream branches from a dirty/broken worktree.
- Never restart or replace cloudflared during an app upgrade.
- P17 deployments must run `app/custom-server.js`; `app/server.js` loses trusted tunnel client identity.
- Do not replace the local `cli/cli.js` with upstream blindly. Current wrapper intentionally preserves tunnel processes; upstream `0.5.30` wrapper can terminate them.

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
```

- Check source/live invariants:

```bash
cd /home/home/.openclaw/workspace-keyra/9router-upgrade-v0.5.30
node scripts/verify-local-patches.mjs \
  --root . \
  --bundle /home/home/.npm-global/lib/node_modules/9router/app \
  --db /home/home/.9router/db/data.sqlite
```

Stop if:

- The verifier has failures.
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
- Does `pm2 env 0 | rg 'NINE_ROUTER_BEST_GPT'` show target `cx/gpt-5.6-sol` and effort `max`?
- Did it preserve explicit proxy pools and `__none__` no-proxy behavior?
- Did it preserve local route access on `127.0.0.1:20128`?
- Does Console Log still work through both raw and short tunnel URLs when SSE is buffered?
- Does quota refresh have one scheduler and one real-time countdown?
- Does API-key client tracking avoid raw IP/full user-agent storage and remain observe-only?

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
  --bundle /home/home/.npm-global/lib/node_modules/9router/app \
  --db /home/home/.9router/db/data.sqlite \
  --health http://127.0.0.1:20128/api/health
```

Targeted manual checks by patch:

- P1 OAuth: expired/fake Codex exchange returns OpenAI JSON, not Cloudflare HTML.
- P2 Codex fast/max: `service_tier=fast` does not produce `Unsupported service_tier: fast`; Codex `max` does not produce invalid `max`.
- P3 workspace: same email with different workspace/account IDs remains distinct.
- P4 capacity: capacity text triggers account retry, not client failure.
- P5 Copilot models: `claude-opus-4.8` and `claude-fable-5` route to `github`.
- P6 usage: cached tokens lower cost; API-key grouping remains separated.
- P7 reset bank: confirmation appears before reset consume; cancel does not POST.
- P12 best GPT: `gpt-5.4-mini` must route to provider/usage model `gpt-5.6-sol`, effort `max`, and short-context Priority.
- P14 Responses Lite: omit `reasoning.context` and `parallel_tool_calls`; provider request must contain `reasoning.context="all_turns"` and `parallel_tool_calls=false`. Repeat with incoming `parallel_tool_calls=true`.
- P15 console: local SSE emits `init`; raw and short tunnels fall back to ETag polling after silent SSE.
- P16 quota: countdown advances once per real second and one refresh occurs at the deadline.
- P17 API clients: trusted-IP tests pass; one keyed canary appears under Usage > API Key Clients.
- P18 usage SSE: route never calls `getUsageStats`; payload contains only active/recent/error/pending fields and overlapping events coalesce.

Known clean-upstream `0.5.30` baseline failures:

- Eight Cursor auto-import tests.
- Two Codex image-fetch MIME tests.
- Reproduce failures in a clean detached worktree before attributing them to local patches.

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
8. Verify short and raw tunnel health without restarting cloudflared.
9. Confirm cloudflared PID is unchanged.
10. Update only `cli/package.json` version after successful app health if retaining the local wrapper.

Before staged CLI build, verify nested CLI dev dependencies exist:

```bash
node -e "require.resolve('esbuild', { paths: ['./cli'] })"
```

If missing, install the already-declared CLI dev dependencies before building. Never deploy a candidate after `build-cli.js` stops at the MITM step. If MITM source is unchanged and an emergency build must proceed, reuse the exact verified live bundled `src/mitm/server.js` and compare SHA-256 hashes.

Allow at least 45 minutes for `build-cli.js` on this host. A verified 2026-07-13 build took about 23 minutes; 10-minute and 20-minute command ceilings killed valid builds before standalone packaging completed.

Skeleton:

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
  NINE_ROUTER_BEST_GPT_SERVICE_TIER=fast \
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
    NINE_ROUTER_BEST_GPT_SERVICE_TIER=fast \
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
  NINE_ROUTER_BEST_GPT_SERVICE_TIER=fast \
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
- After every deploy, send a bare `gpt-5.4-mini` canary and verify response, request-detail, provider, and usage model are `gpt-5.6-sol`; routed/provider effort must be `max`.
- After Usage SSE changes, open several candidate SSE clients, complete one model request, and verify `/api/health` stays responsive; never stress the pre-patch live SSE path against a large DB.
- Treat sub-second health degradation during many concurrent 400-1,100-message requests as request parsing/serialization load. Investigate only if it persists without large concurrent requests or rises into multi-second stalls; provider TTFT is tracked separately.
- Before an OAuth provider canary, run the same canary against current live bundle. A pre-existing `bad-credentials` result is a credential blocker, not a candidate rollback signal.
- Never let an isolated DB copy refresh a rotatable OAuth token. Copy a fresh unexpired access token, then remove its refresh token in candidate DB; reauthorize live profile first when access is already near expiry.

## 7. Retrospective

After every patch/update:

- Update `docs/PATCH_LEDGER.md` with changed files, live backup path, tunnel URL, and verification results.
- Add or update a verifier invariant when the issue was rediscovered manually.
- Copy the updated ledger, runbook, and verifier into the clean current local branch and commit them there.
- If a pushed upstream branch was affected, mark it stale until re-cut.
- Record anything that was skipped and the trigger for adding it.

Skipped by design:

- Full upstream branch repair in this runbook. Add it when a fresh clone is available and a specific PR is being prepared.
- Gateway tag/domain ledger. Add a separate gateway ledger before touching `/home/home/.openclaw/gateway`.
