# 9Router Local Patch Ledger

Last updated: 2026-07-17

This file tracks local 9Router changes that must survive updates. Treat it as the source of truth before merging upstream changes, rebuilding, or pushing PR branches.

Current live facts:

- Live wrapper workspace: `/home/home/.openclaw/workspace-keyra/9router-patch`
- Current source: `/home/home/.openclaw/workspace-keyra/9router-upgrade-v0.5.35`, branch `local-v0.5.35-upgrade`; P21 runtime commit is `c743708` above Claude pairing base `818ed87`.
- Live data: `/home/home/.9router`
- Live app bundle: `/home/home/.npm-global/lib/node_modules/9router/app` -> `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app`
- PM2 app: `9router`
- Current PM2 entrypoint: `/home/home/.npm-global/lib/node_modules/9router/app/custom-server.js`.
- Current app and retained-wrapper package version: `0.5.35`.
- P15-P17 candidate was promoted to live on 2026-07-12; its temporary credential-bearing QA data was removed after deploy.
- P2/P18 latency candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed after deploy.
- P9 xAI stale-tool-choice candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed before deploy.
- P19 official Grok Build subscription candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed before deploy.
- P19 model-aware effort, console-label, and paid zero-cap quota corrections were promoted on 2026-07-13; final isolated QA data was removed before deploy.
- P19 cross-provider history normalization was promoted on 2026-07-15 PDT; its copied credential-bearing candidate HOME and replay script were removed after live QA.
- P2 GPT-5.6 unsupported-tier and estimator-latency correction was promoted on 2026-07-13 PDT; isolated credential-bearing QA data was removed before deploy.
- Port: `20128`
- Current known short tunnel base: `https://rkeyra9.abc-tunnel.us`
- Current known raw tunnel base: `https://holidays-heating-revenues-cathedral.trycloudflare.com`.
- Current cloudflared PID: `2694503`; it is a child of PM2's 9Router PID, so an ungated PM2 restart can kill the tunnel.
- Current best-GPT PM2 policy: enabled, target `cx/gpt-5.6-sol`, reasoning `max`, service tier `default`.
- The 2026-07-15 controlled promotion applied that policy with `--update-env`; `pm2 save` persisted it in `/home/home/.pm2/dump.pm2`.
- Global outbound proxy remains `http://127.0.0.1:18888`; `outboundNoProxy` is empty.
- xAI OAuth profile `songoku200794@gmail.com` uses proxy pool `3497197d-1c66-48f8-845c-325a9e46d49e` (`http://127.0.0.1:18888`). Gateway routes `x.ai`/`grok.com` domains through US exits on both listeners.
- xAI OAuth access expired around 2026-07-13 02:56 local time and all refresh attempts failed; the profile requires reauthorization before live Grok canaries can pass again.
- Active `grok-cli` device-code profile `songoku200794@gmail.com` is X Premium+ with Grok Code access and dedicated residential proxy pool `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` on `http://127.0.0.1:18889`.
- Private live alias `grok-4.5 -> grok-cli/grok-4.5` bypasses the separate expired xAI API OAuth profile. Keep this alias private; upstream source intentionally preserves bare `grok-4.5 -> xai`.
- Current PM2 PID after the P21 promotion: `2694238`.
- Latest live rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p21-responses-heartbeat-20260717-20260717T072141Z`.
- Latest pre-promotion DB backup: `/home/home/.9router/db/backups/pre-p21-responses-heartbeat-20260717-20260717T072141Z/data.sqlite`.
- Previous live rollback app from Claude pairing: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-claude-pairing-max2-20260717T033932Z-20260717T034004Z`.
- Previous DB backup from Claude pairing: `/home/home/.9router/db/backups/pre-claude-pairing-max2-20260717T033932Z-20260717T034004Z/data.sqlite`.
- Previous `0.5.35` live rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0.5.35-live-max1-20260716T210305Z-20260716T210331Z`.
- Previous `0.5.35` DB backup: `/home/home/.9router/db/backups/pre-v0.5.35-live-max1-20260716T210305Z-20260716T210331Z/data.sqlite`.
- Previous live backup from reviewed cross-provider Grok history v2: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-history-v2-20260715-20260716T034051Z`.
- Previous DB backup from reviewed cross-provider Grok history v2: `/home/home/.9router/db/backups/pre-grok-history-v2-20260715-20260716T034051Z/data.sqlite`.
- Previous live backup from initial cross-provider Grok history normalization: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-history-20260715-20260716T022152Z`.
- Previous DB backup from initial cross-provider Grok history normalization: `/home/home/.9router/db/backups/pre-grok-history-20260715-20260716T022152Z/data.sqlite`.
- Latest live backup from GPT-5.6 tier correction: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-gpt56-tier-latency-20260714-20260714T040713Z`.
- Latest DB backup from GPT-5.6 tier correction: `/home/home/.9router/db/backups/pre-gpt56-tier-latency-20260714-20260714T040713Z/data.sqlite`.
- Latest live backup from final Grok corrections: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-final-20260713-20260713T225502Z`
- Latest DB backup from final Grok corrections: `/home/home/.9router/db/backups/pre-grok-final-20260713-20260713T225502Z/data.sqlite`
- Latest live backup from official Grok Build deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-cli-20260713T203029Z`
- Latest DB backup from official Grok Build deploy: `/home/home/.9router/db/backups/pre-grok-cli-20260713T203029Z/data.sqlite`
- Latest live backup from xAI stale-tool-choice deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-xai-tool-choice-20260713T094526Z`
- Latest DB backup from xAI stale-tool-choice deploy: `/home/home/.9router/db/backups/pre-xai-tool-choice-20260713T094526Z/data.sqlite`
- Latest live backup from corrected Priority deployment: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-priority2-20260713T083828Z`
- Latest DB backup from corrected Priority deployment: `/home/home/.9router/db/backups/pre-priority2-20260713T083828Z/data.sqlite`
- Previous live backup from initial latency deployment: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-latency-20260713T074916Z`
- Previous DB backup from initial latency deployment: `/home/home/.9router/db/backups/pre-latency-20260713T074916Z/data.sqlite`
- Latest live backup from best-GPT route restoration: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-best-gpt-20260711T040715Z`
- Latest live backup from P15-P17 deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p15-p17-20260712T075616Z`
- Latest DB backup from P15-P17 deploy: `/home/home/.9router/db/backups/pre-p15-p17-20260712T075616Z/data.sqlite`
- Latest DB backup from best-GPT route restoration: `/home/home/.9router/db/backups/pre-best-gpt-20260711T040715Z/data.sqlite`
- Latest live backup from the `0.5.30` upgrade: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0.5.20-20260711T012155Z`
- Latest pre-upgrade DB backup: `/home/home/.9router/db/backups/pre-v0.5.30-manual-20260711T011614Z/data.sqlite`
- Latest live backup from Codex Responses Lite deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260710T105048Z-pre-responses-lite`
- Latest live backup from cost-breakdown correction deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.pre-costfix-20260709-2053`
- Latest DB backup from cost-breakdown correction: `/home/home/.9router/db/backups/pre-cost-breakdown-fix-20260709-204827.sqlite`
- Last live backup from GitHub Copilot profile identity labels deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-github-label-021056`
- Last live backup from GPT long-context Priority guard deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260710-002329-gpt-priority`
- Last live backup from xAI final encrypted-content strip deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-xai-final-strip`
- Previous live bundle saved during xAI final encrypted-content strip deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.swap-20260709-xai-final-strip`
- Previous xAI tool-normalization backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-xai-tools-v3`
- Previous xAI tool-normalization swap: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.swap-20260709-xai-tools-v3`
- Last live backup from xAI input-variant sanitizer deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-xai-input-023507`
- Older live backup from xAI/OAuth proxy deploy: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-keyra-xai-20260708-185415`
- Last DB backup from xAI/OAuth proxy deploy: `/home/home/.9router/db/backups/pre-xai-20260708-185415`

Important repository state:

- The current `9router-patch` folder has broken git worktree metadata. `git status` fails because `.git` points at a missing worktree admin directory.
- Do not push upstream PRs directly from this folder until git metadata is repaired or the patch is re-cut from a fresh clone.
- Use `scripts/verify-local-patches.mjs` for local source/live checks; do not use broken git state as proof.
- Keep the live tunnel-preserving `cli/cli.js`. Upstream `0.5.30` wrapper startup/shutdown behavior can terminate cloudflared, so upgrades must replace `cli/app` only until wrapper divergence is reviewed separately.

## Latest Upgrade Record

### `0.5.20` -> `0.5.30` on 2026-07-10

- npm `latest` was confirmed as `0.5.30`.
- Clean patched source: `/home/home/.openclaw/workspace-keyra/9router-upgrade-v0.5.30` at `e17010e`.
- Candidate source and bundle verification: zero failures and zero warnings.
- Patched QA: 21 test files, 128 tests passed. ESLint had zero errors and two existing anonymous-default-export warnings.
- Clean upstream `0.5.30` independently reproduces 10 unrelated failures: eight Cursor auto-import tests and two Codex image-fetch MIME tests.
- Candidate restart rehearsal recovered health in 9.038 seconds.
- Deployment replaced only `cli/app`, retained local `cli/cli.js`, and used one `pm2 restart 9router --update-env`.
- Live local health recovered in 5 seconds; tunnel health passed on first probe; cloudflared stayed PID `206858`.
- `/api/version`, PM2, live app package, CLI wrapper package, and `9router --version` all report `0.5.30`.
- Public Responses Lite probe omitted `reasoning.context`, returned HTTP 200 with `OK`, and stored provider payload `reasoning.context="all_turns"` plus `reasoning.effort="max"`.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0.5.20-20260711T012155Z`.
- Pre-upgrade DB backup: `/home/home/.9router/db/backups/pre-v0.5.30-manual-20260711T011614Z/data.sqlite`.

### Best-GPT route restoration on 2026-07-10

- The `0.5.30` repatch incorrectly preserved exact aliases only. The endpoint-wide `gpt-*` route layer and its verifier checks were omitted.
- Live PM2 still held stale `NINE_ROUTER_BEST_GPT_TARGET=cx/gpt-5.5` and `NINE_ROUTER_BEST_GPT_REASONING_EFFORT=xhigh`; both were corrected during deploy.
- Restored the original dedicated route service with current defaults: `cx/gpt-5.6-sol`, `max`, `fast`.
- Added `tests/unit/best-gpt-route.test.js` and source/bundle checks in `scripts/verify-local-patches.mjs`.
- Isolated candidate on `127.0.0.1:20129` accepted `gpt-5.4-mini` and stored provider model `gpt-5.6-sol`, provider effort `max`, and provider tier `priority`.
- Live canary returned HTTP 200 and stored request/usage model `gpt-5.6-sol`, routed effort `max`, and provider Priority.
- Deployment used one PM2 restart. Local, short-tunnel, and raw-tunnel health passed; cloudflared stayed PID `206858`.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-best-gpt-20260711T040715Z`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-best-gpt-20260711T040715Z/data.sqlite`.

### P15-P17 dashboard/client-activity deploy on 2026-07-12

- Promoted the verified staged bundle with one atomic directory exchange.
- Drained active model requests before exchange and made an integrity-checked SQLite backup.
- Replaced PM2 `app/server.js` entrypoint with `app/custom-server.js`; new PM2 PID is `2345576`.
- Live DB migrated schema version 1 to 2 and created `apiKeyClients`; automatic migration backup is `/home/home/.9router/db/backups/schema-1-to-2-0.5.30-20260712-005714`.
- Local, raw Quick Tunnel, and short URL health all returned HTTP 200 after startup.
- Cloudflared stayed PID `206858`; no tunnel process restart or URL change occurred.
- Full source/bundle/DB/local/raw/short verifier passed with zero failures and zero warnings.
- Live Console Log returned REST HTTP 200 and conditional HTTP 304 on all paths; local SSE returned `init`, while raw and short SSE remained buffered and therefore use polling fallback.
- Live Codex traffic created one API-key client row and usage rows with matching API-key ID/client fingerprint metadata; `/api/usage/clients` through the short URL returned HTTP 200.
- Existing endpoint-wide routing stayed active: post-deploy logs show `gpt-5.5` and `gpt-5.6-sol` routing to `codex/gpt-5.6-sol` with `max`; long requests still remove Priority.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p15-p17-20260712T075616Z`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-p15-p17-20260712T075616Z/data.sqlite`.

### xAI OAuth recovery and regional bypass on 2026-07-12

- `songoku200794@gmail.com` failed with `unauthenticated:bad-credentials`: access token expired on 2026-07-09 and xAI returned `invalid_grant` because its refresh token was revoked.
- Reauthorized through the existing proxy pool. OAuth dedup updated connection `afe8eb39-0b45-46ce-9ca0-b7fc4762c582`; no duplicate profile was created.
- Fresh token and exact 9Router provider payload returned HTTP 200 when sent directly to `https://api.x.ai/v1/responses`.
- 9Router still returned `The model grok-4.5 is not available in your region` because removing the per-profile pool fell back to global outbound proxy `http://127.0.0.1:18888`.
- A temporary direct bypass proved the regional cause: removing the xAI profile pool and setting `outboundNoProxy=api.x.ai` made local and short-URL canaries pass.
- Gateway config then added separate US routes for `x.ai`/`grok.com`: port `18888` requires `dc+us`; port `18889` requires `true_residential+us`. ChatGPT tags, Stripe routes, MITM domains, and listener defaults were unchanged.
- Restored the xAI profile pool and cleared `outboundNoProxy`. Direct gateway canaries passed on both ports; 9Router local and `https://rkeyra9.abc-tunnel.us/v1/responses` canaries returned `LOCAL_OK` and `TUNNEL_OK` through the US DC exit.
- Short tunnel health remained HTTP 200 and cloudflared stayed PID `237493`.
- Diagnostic rule: `bad-credentials` requires token/refresh inspection and usually reauthorization; `model ... not available in your region` requires direct-versus-proxy replay before changing credentials again.

### Codex latency correction on 2026-07-13

- End-to-end analysis found normal Codex time was dominated by time to first token, not tunnel transport: about 93% of total time occurred before first token, while strict gateway matching showed about 0.57 seconds median outside-gateway overhead.
- Priority usage fell from 52% to 11.5% between sampled 30-minute windows while average TTFT rose from 19.8 to 29.6 seconds.
- Root cause 1: `estimateCodexInputTokens()` charged every ordinary space as one token. Typical English requests were estimated at about twice their provider-reported token count, so Priority was removed around 121K-127K actual tokens instead of near the 256K safety cutoff.
- First fix discounted ordinary spaces but still rounded every short word and punctuation run upward. Post-deploy evidence showed it remained wrong: 72 large requests still lost Priority while provider usage averaged about 186K input tokens.
- Final fix estimates whole serialized ASCII payload at five characters per token, adds a long-whitespace surcharge to reach one token per four consecutive spaces, and counts non-ASCII UTF-16 units conservatively. This avoids per-run JSON rounding while retaining bounded early exit.
- Replay over 131 completed structured payloads measured 4.88-5.88 serialized characters per provider token. Final estimator predicts 87.9% Priority, zero unsafe Priority requests at or above 272K actual tokens, three safety-margin removals from 256K-272K, and 13 required removals above 272K.
- Tests prove 220K repeated words and punctuation-heavy 1.1M-character input retain Priority, while 260K repeated words and 1,024,000 consecutive spaces remove it.
- Root cause 2: every completed request made every Usage SSE client run default all-history `getUsageStats()`. The live DB had 161,728 usage rows; measured aggregation was about 34.5 seconds for `all`, 7.3 seconds for `7d`, and 1.8 seconds for `today`.
- Fix: Usage SSE sends only `activeRequests`, `recentRequests`, `errorProvider`, and `pending`; full period aggregates remain on `/api/usage/stats`. One in-flight snapshot plus one queued rerun coalesces update bursts.
- Source QA passed 16 files and 83 tests; focused regression passed 13/13; ESLint, `git diff --check`, and source verifier passed.
- Production build completed Next.js compile, TypeScript, 126 pages, standalone copy, and MITM bundle. Output was 57 MB; full build took about 23 minutes, so deployment build commands need a timeout above 20 minutes on this host.
- Isolated `127.0.0.1:20129` SSE delivered a 3.8 KB realtime-only event in 638 ms against the copied 161K-row DB. With 12 concurrent SSE clients and a routed Sol request, health p95 was 150 ms and max was 160 ms; process event-loop p95 settled near 50 ms.
- Under many simultaneous 400-1,100-message production requests, local health p95 still reached about 626 ms. This is residual request parsing and serialization load, not the removed 34.5-second Usage aggregation; provider TTFT remains the dominant end-to-end delay.
- Candidate bare `gpt-5.4-mini` canaries returned HTTP 200 as `gpt-5.6-sol`; stored request/provider effort was `max` and tier was `priority`.
- Isolated gateway `18890` tested `chatgpt_api+dc+us` with warm probing disabled. Across eight healthy same-account pairs, `18890` averaged 4.68 seconds and `18888` averaged 4.72 seconds, but `18890` also had one 60-second zero-byte stall. No production gateway route changed; temporary listener/config were removed.
- Wrapper diagnostic `scripts/probe-codex-model-access.mjs` now accepts `PROBE_PROXY_URL` and `PROBE_PROFILE_LIMIT` and prints elapsed milliseconds, allowing repeatable same-account proxy A/B without DB edits.
- Deployment used an atomic bundle exchange and one `pm2 restart 9router --update-env` with zero active requests. Local health recovered immediately; local, raw, and short health returned HTTP 200; cloudflared stayed PID `237493`.
- Post-deploy traffic proved the first whitespace-only estimator remained too conservative, so `a961a4f` replaced it and was deployed with a second atomic exchange and one restart. Completed requests around 123K and 219K provider-reported input tokens retained Priority; requests around 253K removed it conservatively before the 272K long-context boundary.
- Final short-URL canary returned HTTP 200 as Sol and stored request/provider `max` plus `priority`. Full source/live bundle/DB/local verifier passed with zero failures and warnings.
- Current rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-priority2-20260713T083828Z`.
- Current pre-deploy DB backup: `/home/home/.9router/db/backups/pre-priority2-20260713T083828Z/data.sqlite`; integrity check returned `ok`.
- Earlier rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-latency-20260713T074916Z`.
- Earlier pre-deploy DB backup: `/home/home/.9router/db/backups/pre-latency-20260713T074916Z/data.sqlite`.

### GPT-5.6 unsupported-tier latency correction on 2026-07-13 PDT

- One-hour baseline: 490 successful Sol requests had TTFT mean `13.86s`, p50 `12.61s`, p95 `25.12s`; TTFT was 94.6% of total time and input averaged about 180K tokens with 96% cache reads.
- Gateway correlation matched 489 requests: gateway/upstream mean `13.92s`; outside-gateway mean `813ms`. A stricter later split over 325 matches measured pre-gateway transform p50 `732ms`, post-gateway persistence p50 `77ms`.
- Pre-gateway work scaled with provider payload: p50 `265ms` below 250KB, `430ms` at 250-750KB, `685ms` at 750KB-1.25MB, and `932ms` at 1.25MB or more.
- Root cause: every Sol request still carried local `fast`, became `priority`, and ran the long-context lexical estimator even though all 799 sampled Priority-requested Sol responses reported effective tier `default`.
- Official Codex documentation currently lists Fast mode for GPT-5.5 and GPT-5.4, not GPT-5.6. Official API Priority documentation applies to pay-as-you-go API projects; direct ChatGPT-account Sol probes did not gain Priority.
- Old estimator cost about `108ms` at 250KB, `377ms` at 750KB, and `687ms` at 1.25MB. One-pass UTF-16 scanning preserved all 10,004 equivalence cases and measured `7ms`, `31ms`, and `49ms` p50 at those sizes.
- Actual 1.377MB executor benchmark: supported GPT-5.5 guarded Fast averaged `104ms`; unsupported Sol skipped estimation at `0.3ms`.
- Direct matched proxy A/B used one Team workspace and identical 23,415-token Lite/max requests with 23,296 cached tokens. Fast DC TTFT mean was `2.30s`; slow DC mean was `3.67s`. About `0.68s` came from tunnel/TLS setup and `0.53s` from later upstream wait.
- Tunnel ingress is a separate client-visible cost excluded from 9Router TTFT. A valid 1.50MB request added about `0.15s` locally versus `7.74s` raw tunnel and `5.58s` short-domain before 9Router's clock. A fresh QUIC Quick Tunnel reproduced `4.13-7.24s`; changing tunnel protocol did not help.
- Runtime fix: `fast` becomes `priority` only for GPT-5.4/GPT-5.5; GPT-5.6 `fast`/`priority` is removed. Supported-model estimation uses the equivalent one-pass scanner. Live PM2 policy now requests `default` for the private Sol route.
- Public PR #2452 was updated at `418560f`; merge state was `CLEAN`. Latest public focused tests passed 24/24, ESLint and diff checks passed.
- Canonical integration passed 60/60 Codex/Lite/reasoning tests, ESLint, source verifier, candidate bundle verifier, and isolated canary.
- Production candidate built in 25m50s, size 57MB. Safe promotion used two zero-active gates, SQLite backup, atomic exchange, one PM2 restart, and automatic rollback protection.
- Live short-domain canary returned `LIVE_NO_TIER_OK`; provider payload stored Sol `max`, `reasoning.context=all_turns`, `parallel_tool_calls=false`, no `service_tier`, and effective response tier `default`.
- Local, raw, and short health passed; cloudflared stayed PID `237493`. Initial post-deploy strict samples reduced large-request pre-gateway p50 to `508ms` from the previous 750KB+ weighted range; keep collecting before treating that small sample as final.
- Gateway client pooling remains unshipped. Curl proved a reusable tunnel avoids about `741ms` reconnect cost, but an exact `surf` diagnostic did not complete within bounded time. Require isolated gateway canary before changing live gateway code.

## Upstream Branches Already Pushed

These branches were pushed before the current ledger existed. Current status was re-audited on 2026-07-09 from `/home/home/.openclaw/workspace-keyra/9router-prs-20260708`.

| Branch | Status | Notes | Verification |
| --- | --- | --- | --- |
| `fast-tier` | Closed, superseded | Covered by combined PR #2452. | `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-fast-capacity.test.js` |
| `reasoning-effort-translation` | Closed, superseded | Covered by combined PR #2452. | Same as #2452. |
| `codex-sse-capacity-fallback` | Closed, superseded | Covered by combined PR #2452. | Same as #2452. |
| `chatgpt-workspace-binding` | Open PR #1819 | Workspace/account header binding stays separate from fast/capacity PR. | `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-usage-account.test.js` |
| `cli-standalone-path` | Closed, replaced | Replaced by #2479 `cli-staged-build-destination`. | `node --check cli/scripts/build-cli.js`; `node --check cli/scripts/buildMitm.js` |

## Current Local Patch Set

### P1. Codex OAuth endpoint and proxy-safe exchange

Purpose:

- Fix Codex OAuth token exchange after upstream changed/lagged token URL behavior.
- Stop "no proxy" OAuth from accidentally using global environment proxy or the Go gateway.
- Recover from Cloudflare HTML 400 by retrying direct once.

Files:

- `open-sse/providers/registry/codex.js`
- `open-sse/utils/proxyFetch.js`
- `src/app/api/oauth/[provider]/[action]/route.js`
- `src/lib/oauth/providers.js`
- `open-sse/services/tokenRefresh/providers.js`

Required invariants:

- Codex token URL is `https://auth.openai.com/api/accounts/oauth/token`.
- Stale Codex token URL `https://auth.openai.com/oauth/token` is absent from Codex registry/bundle.
- OAuth route imports `open-sse/utils/proxyFetch.js` so global fetch is patched.
- `proxyPoolId` missing or `__none__` returns `{ disableEnvProxy: true }`.
- `proxyFetch` honors `disableEnvProxy`.
- Codex refresh disables env proxy until refresh can receive per-connection proxy context.

Verification:

- `node scripts/verify-local-patches.mjs --root . --bundle /home/home/.npm-global/lib/node_modules/9router/app`
- Fake or expired Codex code exchange should return OpenAI JSON, not Cloudflare HTML.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2343>
- Scope in PR: OAuth proxy selection during authorize/exchange/poll/callback, no-proxy env bypass, proxy pool selector readiness, manual auth URL visibility.
- Still split/re-cut Codex token URL behavior separately if upstream requests narrower scope.

### P2. Codex fast tier, long-context guard, and reasoning preservation

Purpose:

- Codex app can send `service_tier: fast`; supported GPT-5.4/GPT-5.5 requests use upstream `priority`.
- GPT-5.6 ChatGPT-account requests do not currently receive Fast/Priority service and must skip its costly long-context estimate.
- Priority processing does not support GPT long-context requests.
- GPT-5.6 uses `max`; legacy clients can still send `xhigh`.
- Codex Ultra is a client-side orchestration preset whose upstream reasoning effort is `max`; 9Router must preserve that value.

Files:

- `open-sse/executors/codex.js`
- `open-sse/providers/thinkingLevels.js`
- `open-sse/translator/concerns/thinkingUnified.js`
- `tests/unit/thinking-effort-openai-max-clamp.test.js`
- `tests/unit/thinking-levels-gpt56-sol.test.js`

Required invariants:

- Codex `service_tier: fast` becomes `priority` only for GPT-5.4 and GPT-5.5.
- GPT-5.6 `fast` and direct `priority` are removed; effective response tier is tracked separately.
- Final supported Fast-mode GPT payloads estimated at 256,000 input tokens or more have `service_tier` removed before sending.
- The operational cutoff leaves a 16,000-token safety margin below the 272,000-token short-context boundary because Codex sends no exact pre-request token count.
- The lexical estimate counts whole serialized ASCII payload at about five characters per token, surcharges long ASCII whitespace to one token per four characters, and counts non-ASCII UTF-16 units conservatively.
- Estimation uses one bounded UTF-16 pass. Do not restore regex-per-token scanning; it consumed hundreds of milliseconds on normal 0.75-1.5MB Codex payloads.
- Other unsupported Codex service tiers are removed.
- GPT-5.6 `xhigh` becomes `max`; `max` is never downgraded.
- Unified translation preserves `max` for Codex Sol, Terra, and Luna before request-summary logging; generic OpenAI models still clamp unsupported `max` to `xhigh`.
- GitHub Claude max reasoning stays provider-native `max`.

Verification:

- Send short GPT-5.4/GPT-5.5 executor requests with `service_tier=fast`; transformed payload contains `service_tier:"priority"`.
- Send short `cx/gpt-5.6-sol` requests with `fast` and direct `priority`; transformed provider payload omits `service_tier` and effective response tier remains `default`.
- Send a long synthetic supported Fast-mode GPT request with `fast` and direct `priority`; transformed request omits `service_tier` and logs `Priority disabled for long context`.
- Send `cx/gpt-5.6-sol` with `reasoning_effort=max`; no reasoning-effort 400.
- Send `gh/claude-opus-4.8` with `reasoning_effort=max`; request details show provider effort `max`.
- 2026-07-10 isolated bundle on `127.0.0.1:20129` passed source and bundle verification, then completed a short Sol request whose provider payload contained `service_tier:"priority"`.
- 2026-07-10 live probe returned `LIVE_OK`; request details confirmed incoming `fast` became provider `priority`. Upstream OAuth response reported effective `default`, so effective-tier accounting correctly did not claim Priority service.
- Focused test covers `fast`, direct `priority`, and whitespace-heavy long payloads.
- 2026-07-13 calibration tests prove 220K repeated words and punctuation-heavy 1.1M-character input retain Priority; 260K repeated words and 1,024,000 consecutive spaces remove it.
- 2026-07-13 PDT follow-up proved GPT-5.6 Priority ineffective, gated Fast to GPT-5.4/GPT-5.5, replaced the estimator with an equivalent one-pass scan, and deployed with one safe PM2 restart. See the latency correction record above.
- Live deploy used one PM2 restart. Local, `rkeyra9`, and raw TryCloudflare health passed; cloudflared PID remained `206858`.
- GPT-5.6 max-log correction deployed 2026-07-12:
  - Root cause: unified OpenAI translation changed `max` to `xhigh` before request-summary logging. Codex executor changed it back to `max`, so actual provider wire was already correct but console `THINK:xhigh` was misleading and verifier missed the earlier stage.
  - Translation now preserves `max` directly for Codex `gpt-5.6-*`; generic OpenAI models still clamp unsupported `max` to `xhigh`.
  - Sol, Terra, and Luna exact pipeline checks each reported `intermediate=max outgoing=max`; focused reasoning/Codex suite passed 59/59, ESLint and diff checks passed.
  - Isolated valid Responses Lite canary returned HTTP 200 with console `THINK:max`, stored request `max`, provider wire `max`, and provider Priority.
  - First candidate probe omitted required `parallel_tool_calls:false`, producing candidate-only HTTP 400 rows across copied accounts. Corrected probe passed; live DB/accounts were unaffected.
  - Live canary returned HTTP 200 with `LIVE_MAX_OK`; stored request and provider effort were both `max`, provider tier was `priority`, and console showed `THINK:max`.
  - Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-gpt56-max-20260712T213807Z`.
  - Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-gpt56-max-20260712T213807Z/data.sqlite`; integrity check returned `ok`.
  - PM2 restart interrupted the combined deployment shell after app promotion. App health and rollback artifacts were intact, but tunnel recovery commands were skipped. Future deploys must run post-restart tunnel recovery in a separate command.
  - Concurrent tunnel auto-resume/API enable calls killed each other's cloudflared child. Detached fallback restored `keyra9` at `https://rochester-wanted-ware-movements.trycloudflare.com`; short health passed. VM DNS had not yet propagated for direct raw-host resolution, so final verifier used local plus short health.
  - Final source/live bundle/DB/local/short verifier passed with zero failures and zero warnings; credential-bearing candidate data was removed.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2452>
- Supersedes closed split PRs #1817, #1820, and #2344.
- Rebased onto upstream `v0.5.30` and updated 2026-07-13 at head `418560f`; GitHub merge state is `CLEAN`.
- PR now preserves GPT-5.6 `max`, removes unsupported GPT-5.6 Fast/Priority, maps supported GPT-5.4/GPT-5.5 Fast, uses a one-pass 256K guard, and preserves upstream workspace/account fallback.
- PR excludes private bare-model routing and the local GPT-5.6 `xhigh` -> `max` compatibility policy.
- Latest focused Codex/reasoning suites passed 24/24; estimator equivalence passed 10,004/10,004; focused ESLint and `git diff --check` passed.
- Pre-rebase branch retained locally as `backup/codex-fast-capacity-fallback-pre-rebase-20260712`.
- Local invariant command: `node scripts/verify-local-patches.mjs --root . --bundle /home/home/.npm-global/lib/node_modules/9router/app --db /home/home/.9router/db/data.sqlite`

### P3. Codex ChatGPT workspace binding and cache affinity

Purpose:

- ChatGPT email+workspace combinations have separate quota/banking.
- Codex request, usage, and import paths must preserve workspace identity.
- Prompt cache keys should be stable per client/workspace/account.

Files:

- `open-sse/executors/codex.js`
- `open-sse/services/usage/codex.js`
- `src/lib/oauth/providers.js`
- `src/app/api/oauth/codex/bulk-import/route.js`
- `src/app/api/oauth/[provider]/[action]/route.js`

Required invariants:

- OAuth/access-token import stores `chatgptAccountId` when available.
- Codex request headers include `chatgpt-account-id` from `workspaceId || chatgptAccountId`.
- Codex usage headers use the same account ID source.
- Duplicate email is allowed only when workspace/account IDs differ.

Verification:

- Add two profiles with same email and different team/free workspace IDs; UI must show distinct profiles after refresh.
- Usage probes for each workspace must not collapse into one quota row.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/1819>
- Verification: `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-usage-account.test.js`

### P4. Codex SSE capacity fallback

Purpose:

- Codex sometimes returns HTTP 200 SSE with an embedded error: `Selected model is at capacity. Please try a different model.`
- 9Router must mark that account/model unavailable and retry another account instead of surfacing the error to Codex.

Files:

- `open-sse/executors/codex.js`
- `src/sse/handlers/chat.js`
- `open-sse/services/accountFallback.js`
- `open-sse/config/errorConfig.js`

Required invariants:

- Codex executor peeks the start of the SSE body.
- Capacity text or `model_at_capacity` becomes an account-fallback response.
- Normal successful SSE bodies are reassembled so peeking does not truncate output.
- Account fallback excludes the failed connection and tries the next account.

Verification:

- Unit fixture for a 200 SSE capacity event should trigger fallback response.
- Live logs should show `SSE account fallback`, then `trying fallback`, not immediate client failure.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2452>
- Supersedes closed split PR #2344.
- Verification: `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-fast-capacity.test.js`

### P5. GitHub Copilot live model catalog and status probing

Purpose:

- GitHub Copilot static model lists lag behind available models.
- Copilot profile status should distinguish free, banned/forbidden, rate-limited, weekly-limited, and active accounts.
- `claude-opus-4.8` and `claude-fable-5` should be visible/routable when Copilot exposes them.

Files:

- `open-sse/providers/registry/github.js`
- `open-sse/services/copilotModels.js`
- `open-sse/services/copilotStatus.js`
- `open-sse/services/model.js`
- `tests/unit/copilot-status.test.mjs`
- `tests/unit/model-routing.test.js`

Live DB aliases:

- `claude-opus-4.8 -> gh/claude-opus-4.8`
- `claude-fable-5 -> gh/claude-fable-5`

Required invariants:

- Bare `claude-opus-4.8` resolves to GitHub, not Anthropic.
- Bare `claude-fable-5` resolves to GitHub.
- GitHub registry includes both models for dashboard visibility.
- Live DB aliases are present after reinstall/update.

Verification:

- `sqlite3 /home/home/.9router/db/data.sqlite "select scope,key,value from kv where scope='modelAliases' and key in ('claude-opus-4.8','claude-fable-5');"`
- Non-streaming requests to `claude-opus-4.8` and `claude-fable-5` should route to provider `github`.

Extended-context verification completed 2026-07-09:

- No 9Router or Go gateway request patch is required to activate GitHub Copilot long context.
- Official Copilot CLI `1.0.70` reported Claude Opus 4.8 limits of 200,000 default prompt tokens, 936,000 long-context prompt tokens, 1,000,000 total context tokens, and 64,000 output tokens.
- Copilot CLI `--context long_context` sent no custom request header and no context-tier field in the provider wire body. The option controls client-side limits/compaction.
- Live 9Router accepted a `gh/claude-opus-4.8` `/v1/chat/completions` request with 222,919 provider-reported prompt tokens and returned HTTP 200 with two output tokens.
- 9Router logged `github/claude-opus-4.8` through `http://127.0.0.1:18888`; the Go gateway logged the matching `POST api.githubcopilot.com/chat/completions -> 200`.
- `/home/home/.openclaw/gateway/server.go` applies a Chrome TLS fingerprint for Copilot and forwards existing headers/body unchanged. 9Router supplies its VS Code identity headers; neither mechanism selects the context tier.
- After updates, do not add guessed `long_context` headers or body fields. Re-run one over-200K prompt probe only if GitHub starts rejecting the existing path.

Upstream status:

- Candidate as separate feature. Keep static aliases and live catalog fetch separate if upstream prefers one but not the other.

### P5L. Local-only Codex catalog aliases for GitHub Claude models

Purpose:

- Personal Codex CLI/Desktop config uses 9Router with `wire_api = "responses"`.
- Codex CLI rejects `wire_api = "chat"`, so GitHub Copilot Claude models must remain usable through `/v1/responses`.
- Bare model names shown in Codex catalog should route to GitHub Copilot without requiring `gh/` in the UI.

Files:

- `open-sse/services/model.js`

Live DB aliases:

- `claude-opus-4.8 -> gh/claude-opus-4.8`
- `claude-fable-5 -> gh/claude-fable-5`

Required invariants:

- `wire_api = "responses"` remains the Codex provider config.
- `claude-opus-4.8` resolves to GitHub Copilot, not Anthropic.
- `claude-fable-5` resolves to GitHub Copilot, not Anthropic.
- `/v1/responses` requests for these bare aliases reach GitHub with `providerRequest.messages` as an array and no `providerRequest.input`.
- No upstream PR for this patch; these route choices are personal aliases.

Verification:

- `sqlite3 /home/home/.9router/db/data.sqlite "select scope,key,value from kv where scope='modelAliases' and key in ('claude-opus-4.8','claude-fable-5');"`
- Send `/v1/responses` with model `claude-opus-4.8`; response should return text and latest `requestDetails` row should show `provider='github'`, `model='claude-opus-4.8'`, `json_type(data,'$.providerRequest.messages')='array'`, and `json_type(data,'$.providerRequest.input') is null`.

Upstream status:

- Local-only. Do not upstream. Re-apply after updates if `open-sse/services/model.js` loses `BUILTIN_MODEL_ALIASES` or live DB aliases disappear.

### P5M. GitHub Copilot profile identity labels

Purpose:

- Avoid meaningless GitHub Copilot profile labels like `Account 1` / `Account 2`.
- Use GitHub login first, then email/name fallback, so dashboard/log rows can identify Copilot profiles.

Files:

- `src/lib/oauth/providers.js`
- `src/lib/db/repos/connectionsRepo.js`
- `tests/unit/db-sqlite-vs-lowdb.test.js`

Required invariants:

- GitHub OAuth `mapTokens()` stores top-level `name`, `displayName`, and `email` when `/user` returns them.
- New GitHub OAuth/access-token connections derive name from `providerSpecificData.githubLogin || githubEmail || email || githubName` before `Account N`.
- Existing live DB rows may need one-time backfill from stored `providerSpecificData.githubLogin`.

Verification:

- `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/db-sqlite-vs-lowdb.test.js`
- `sqlite3 -json /home/home/.9router/db/data.sqlite "select id,provider,name,email,json_extract(data,'$.providerSpecificData.githubLogin') as githubLogin from providerConnections where provider='github';"` should show real login names.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2498>
- Verification: `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/db-sqlite-vs-lowdb.test.js`

### P5T. Claude tool-result pairing repair

Purpose:

- Codex compaction or cross-model history can retain `function_call_output` after dropping or separating its matching call.
- GitHub Copilot Claude uses strict Anthropic `/v1/messages`; every structured `tool_result` must match a `tool_use` in the immediately previous assistant message.
- Preserve orphaned output as labeled user text instead of returning HTTP 400 or silently deleting context.

Files:

- `open-sse/translator/formats/claude.js`
- `tests/unit/claude-tool-result-pairing.test.js`
- `scripts/verify-local-patches.mjs`

Required invariants:

- Keep one structured result for each matching immediately preceding tool use, in tool-use order.
- Fill missing parallel results with the existing empty-result fallback.
- Convert orphaned and duplicate results to labeled user text after valid structured results.
- Apply the same reconciliation to one-message histories; do not bypass them through the old early return.
- Preserve valid result content and every orphaned output byte represented by the parsed JSON body.

Verification:

- `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/claude-tool-result-pairing.test.js`
- Send a Fable `/v1/responses` request containing one valid result, one missing parallel result, and one orphan result; provider request must contain only paired structured IDs and response must complete without Anthropic pairing errors.

Upstream status:

- Public PR: <https://github.com/decolua/9router/pull/2663>, head `ee0ce30`, merge state `CLEAN`.
- Public branch contains only translator and regression-test files; private aliases, pools, credentials, verifier, ledger, and deployment evidence are excluded.

Verification and deployment:

- Production failure was `github/claude-fable-5` HTTP 400: `unexpected tool_use_id ... Each tool_result block must have a corresponding tool_use block in the previous message`.
- Red tests reproduced mixed valid/missing/orphan results and one-message orphan history. Focused public matrix passed 18/18; customized matrix passed 20/20; focused ESLint and `git diff --check` passed.
- Full customized and clean `v0.5.35` JSON reports showed no changed-path failure. Differential failures remained unrelated generated provider snapshots/concurrency versus two clean xAI timing failures.
- Candidate built 130 routes plus MITM at 58 MB. Copied DB integrity was `ok`, contained zero refresh tokens, tunnel was disabled, and bind was only `127.0.0.1:20129`.
- Exact candidate wire retained `call-valid`, synthesized empty `call-missing`, converted `call-orphan` to labeled text, and returned `CLAUDE_PAIRING_CANDIDATE_OK`; streaming emitted `response.completed`. Opus control passed.
- Continuous traffic required `MAX_ACTIVE=2`; helper still refused three active requests and used both five-second gates. App promotion passed at `03:40:14Z` with rollback retained.
- Restart replaced child cloudflared. Raw `https://fitting-reaction-products-emacs.trycloudflare.com` became healthy, but helper timed out while short mapping remained HTTP 530. Manual current-state registration restored `https://rkeyra9.abc-tunnel.us` without another tunnel restart.
- Exact live short-domain wire preserved the same pairing and returned `CLAUDE_PAIRING_LIVE_OK`; streaming emitted `response.completed`. No GitHub errors were recorded after deployment.
- Final source/live-bundle/DB/local/raw/short verifier returned zero failures/warnings. Live and backup DB integrity returned `ok`; PM2 saved PID `2529688`, cloudflared PID `2530526`.
- Promotion helper now reports `succeeded_external_pending` instead of `succeeded` when app promotion passes but raw/short recovery does not.

### P6. Usage/cost accuracy and API-key grouping

Purpose:

- 9Router cost display was misleading for cached vs uncached tokens.
- Current-model estimates must follow published cache-read, cache-write, output, context, and service-tier rates.
- Provider-reported cost must win when available.
- Stats should remain attributable by API key after upstream updates.

Files:

- `open-sse/providers/pricing.js`
- `src/lib/db/repos/usageRepo.js`
- `open-sse/utils/usageTracking.js`
- `open-sse/handlers/chatCore/requestDetail.js`
- `open-sse/handlers/chatCore/nonStreamingHandler.js`
- `open-sse/handlers/chatCore/streamingHandler.js`
- `open-sse/handlers/chatCore/sseToJsonHandler.js`
- `open-sse/transformer/streamToJsonConverter.js`
- `open-sse/translator/response/openai-responses.js`
- `src/app/(dashboard)/dashboard/usage/components/UsageTable.js`
- `src/app/(dashboard)/dashboard/usage/components/RequestDetailsTab.js`
- `tests/unit/current-model-pricing.test.js`
- `tests/unit/responses-stream-to-json-usage.test.js`
- `tests/unit/xai-usage.test.js`
- `tests/unit/usage-api-key-stats.test.js`
- `scripts/recalculate-current-model-costs.mjs` (local maintenance only; do not upstream)

Required invariants:

- Cost calculation uses normal input rate for uncached input tokens.
- Cost calculation uses cached rate for cache-read tokens.
- Cache-write tokens use their own published rate.
- Reasoning tokens remain visible but are not billed twice when already included in output totals.
- `gpt-5.5` uses published Standard, Batch, Flex, Priority, and over-272K-context prices instead of the generic `gpt-5*` fallback.
- OpenAI lists GPT-5.5 cache writes as unavailable; if a compatible provider reports them anyway, use the normal input rate instead of treating them as free.
- `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna` use published Standard, Batch, Flex, Priority, and over-272K-context prices.
- Effective response `service_tier` wins over requested tier; request tier is only fallback metadata.
- Priority/fast GPT-5.6 uses published Priority prices. No unlisted long-context Priority price is invented.
- `grok-4.5` uses provider `cost_in_usd_ticks` first, with `1 USD = 10^10 ticks`; static fallback uses normal and over-200K prices.
- `claude-fable-5`, `claude-opus-4.8`, and Opus 4.8 fast mode use GitHub's published token prices.
- Responses usage preserves `input_tokens_details.cache_write_tokens`, cache reads, reasoning, model, and effective tier through streaming and forced-SSE paths.
- Claude streaming merges `message_start` input/cache usage with final `message_delta` output usage.
- Dashboard shows separate uncached-input, cache-read, cache-write, output, and total token/cost columns.
- Stored cost breakdown components must sum to the trusted total. Scale components when the provider reports an exact total.
- Historical rows without a complete stored breakdown show `-` for components instead of a fake proportional split.
- `byApiKey` stats use API key identity instead of collapsing everything together.

Verification:

- `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/current-model-pricing.test.js tests/unit/responses-stream-to-json-usage.test.js tests/unit/xai-usage.test.js tests/unit/usage-api-key-stats.test.js tests/unit/db-sqlite-vs-lowdb.test.js tests/unit/usage-dispatch.test.js tests/unit/usage-concern.test.js tests/unit/openai-responses-terminal-event.test.js`
- Unit matrix covers all three GPT-5.6 models across Standard, Batch, Flex, Priority/fast, and long-context rates.
- Unit calculation covers cache read, cache write, and reasoning-within-output.
- Unit xAI calculation proves `22,940,000` ticks equals `$0.002294`.
- Dashboard stats for different API keys must remain separated.
- Live post-deploy probes must store cache-write tokens and effective tier when provider returns them.
- `node scripts/recalculate-current-model-costs.mjs` must be a no-write dry run.
- Before historical repair, use SQLite's `.backup`; then run `node scripts/recalculate-current-model-costs.mjs --apply`.

Published rates checked 2026-07-09:

- OpenAI pricing: `https://developers.openai.com/api/docs/pricing`
- OpenAI GPT-5.6 context threshold: `https://developers.openai.com/api/docs/models/gpt-5.6-sol`
- xAI Grok 4.5 model pricing: `https://docs.x.ai/developers/models/grok-4.5`
- xAI exact cost ticks: `https://docs.x.ai/developers/cost-tracking`
- GitHub Copilot model pricing: `https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing`

Historical repair notes:

- Existing stored costs need one guarded recalculation after deployment because prior rows used fallback model prices and xAI ticks were divided by `10^12`.
- Back up `/home/home/.9router/db/data.sqlite` first, recalculate only target models, then rebuild affected `usageDaily` rows.
- Missing historical GPT-5.6 cache-write/tier fields cannot be reconstructed; future rows become exact when provider returns them.

Deployment and repair completed 2026-07-09:

- Built and deployed 9Router `0.5.20` with one PM2 restart; final measured interruption was `1.689s`.
- Final app backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-180354-pricingfix`
- Earlier app backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-172242-pricing`
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-pricing-20260709-172242.sqlite`
- Pre-repair DB backup: `/home/home/.9router/db/backups/pre-history-pricing-repair-20260709-172957.sqlite`
- Live request proved effective response tier wins: requested Priority, provider returned `default`, stored cost used Standard rates.
- Live Standard Sol row with 240,187 input, 238,976 cache-read, and 263 output tokens stored `$0.133433`, matching the published formula.
- Final live Standard Sol proof stored 162,970 input, 161,152 cache-read, 552 output, effective tier `default`, and cost `$0.106226`, exactly matching the published formula.
- Forced-SSE Sol probe preserved `input_tokens_details.cache_write_tokens`; provider returned zero cache-write tokens and stored `$0.051565` for 10,277 uncached input plus 6 output tokens.
- Historical repair changed 497 old Sol rows by `-$49.43245`, 89 Fable rows by `+$41.8950056`, and 13 Grok rows by `+$0.0790511`; Opus rows were already exact.
- Repaired totals at transaction time: Sol `$73.018122`, Fable `$59.850008`, Grok `$0.096142`, Opus `$0.0320555`.
- Rebuilt local-day aggregates for `2026-05-28`, `2026-06-29`, `2026-07-01`, `2026-07-08`, and `2026-07-09`.
- Post-repair dry run reported zero changed rows; raw-history request/token/cost totals matched every rebuilt `usageDaily` row.
- `PRAGMA integrity_check` returned `ok`; local, short-domain, and raw Cloudflare health endpoints all returned `{"ok":true}`.
- Historical rows without service-tier or cache-write metadata use Standard tier and zero cache writes because missing facts cannot be reconstructed.

GPT-5.5 and component-breakdown correction completed 2026-07-09:

- Root cause: GPT-5.5 had no exact model entry after the update, so 39,504 of 150,220 rows used the generic GPT-5 fallback. The main usage table also omitted Cache Write and fabricated component costs by token proportion.
- Pre-repair total for GPT-5.5: `$29,352.522218`; corrected total: `$32,850.922796`; delta: `+$3,498.400578`.
- Database backup: `/home/home/.9router/db/backups/pre-cost-breakdown-fix-20260709-204827.sqlite`.
- Backup SHA-256: `d67111bc56c8627c0b4024e41b189b350480c39041e79744febcb35cd8042c4d`.
- Repair added deterministic `cost_breakdown` data to target-model history and rebuilt every affected local-day aggregate from `2026-05-11` through `2026-07-09`.
- Post-repair dry run reported zero changed costs and zero changed breakdowns.
- Raw history and `usageDaily` matched at 151,722 requests and `$33,076.06383725` before the final live requests arrived.
- Staged bundle: `/tmp/9router-app-stage-costfix-20260709-202853`.
- Live app backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.pre-costfix-20260709-2053`.
- Deployment used one PM2 restart; local health recovered inside the 3.2-second swap/restart command.
- Fresh post-deploy requests stored `cost_breakdown` objects and effective response tier `default`.
- Final repair caught 17 requests completed during the swap window; the following dry run reported zero drift.
- Authenticated `/api/usage/stats?period=today` returned separate uncached-input, cache-read, cache-write, and output costs; `costBreakdownRequests` equaled total requests. Cache Write was correctly zero because current provider rows reported zero cache-write tokens.
- `scripts/verify-local-patches.mjs` now guards GPT-5.5 exact pricing, stored cost breakdowns, and both new cost columns in source and live bundle.
- `PRAGMA integrity_check` returned `ok`; local, `rkeyra9`, and raw Cloudflare health endpoints returned `{"ok":true}`.

Upstream status:

- Open PRs:
  - API-key stats identity: <https://github.com/decolua/9router/pull/2364>
  - Provider cost preservation, xAI local usage rows, current-model pricing, service tiers, and cache-write accounting: <https://github.com/decolua/9router/pull/2453>
- Latest pricing/accounting commit: `96115e3 fix(usage): restore exact cost breakdowns`
- Historical repair script remains local-only and must not be upstreamed.

### P7. Codex reset bank display and guarded consume

Purpose:

- Show Codex reset credits with count and expiry info.
- Require confirmation before consuming a reset credit.
- Consume one credit server-side with a server-generated redeem request ID.

Files:

- `open-sse/services/usage/codex.js`
- `src/app/api/usage/[connectionId]/codex-reset-credits/route.js`
- `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/index.js`

Required invariants:

- Reset credit count parses multiple possible upstream field names.
- Expiry parses multiple possible upstream field names.
- UI displays a compact count and expiry tooltip.
- UI uses `ConfirmModal` before POST consume.
- Server generates `crypto.randomUUID()` redeem request IDs.
- Usage and consume use workspace-aware Codex headers.

Verification:

- Dashboard shows nonzero count for an account known to have reset credits.
- Clicking reset opens confirmation before any POST.
- Cancel makes no POST.
- Confirm spends exactly one credit and refreshes quota row.

Upstream status:

- Open PR for parser/expiry/workspace header portion: <https://github.com/decolua/9router/pull/2345>
- Verification: `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-reset-credits.test.js`
- Confirmation UI behavior remains local/experimental unless separately verified and split.

### P8. Proxy/connect timeout and gateway interaction

Purpose:

- Reduce false `fetch connect timeout` failures when 9Router routes through the Go gateway.
- Preserve explicit proxy pool behavior while allowing direct OAuth/refresh paths.

Files:

- `open-sse/utils/proxyFetch.js`
- `src/app/api/oauth/[provider]/[action]/route.js`
- `open-sse/services/tokenRefresh/providers.js`

Required invariants:

- Explicit proxy pool traffic still uses the configured pool.
- `__none__` bypasses env proxy.
- Strict proxy pools fail closed.
- Non-strict proxy pools may fall back direct only where existing behavior allows it.

Verification:

- Local Codex request with proxy on should not fail immediately with `fetch connect timeout`.
- OAuth no-proxy exchange should not hit Go gateway logs.
- Gateway-side no-header stalls are tracked separately in `/home/home/.openclaw/gateway/PATCH_LEDGER.md` as G1. Do not raise 9Router's 60-second fetch timer to hide them: G1 bounds each ChatGPT proxy response-header attempt at 20 seconds and leaves SSE duration unlimited after headers.

Upstream status:

- Open PRs:
  - OAuth proxy selection/exchange path: <https://github.com/decolua/9router/pull/2343>
  - ProxyAgent timeout defaults: <https://github.com/decolua/9router/pull/1570>
- Verification: `node --check src/app/api/oauth/[provider]/[action]/route.js`; `node --check open-sse/utils/proxyFetch.js`

### P9. xAI/Grok Build Grok 4.5 and quota visibility

Purpose:

- Add `grok-4.5` from xAI/Grok Build to model picker and routing.
- Support xAI Responses endpoint for Codex-style `/v1/responses` clients.
- Keep GitHub Claude, Gemini, Grok, and unknown models on Chat Completions even when clients use `/v1/responses`.
- Route bare `grok-*` model names to xAI, so clients can use `grok-4.5` without `xai/` prefix.
- Show xAI rows in quota tracker from local `usageHistory`, since no account-quota endpoint is known.
- Normalize unsupported Codex Responses tools before xAI `/v1/responses`, because xAI rejects `custom` and `local_shell` tool variants.

Files:

- `open-sse/providers/registry/xai.js`
- `open-sse/services/model.js`
- `open-sse/services/usage.js`
- `open-sse/services/usage/xai.js`
- `open-sse/executors/default.js`
- `open-sse/executors/github.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/handlers/responsesHandler.js`
- `open-sse/services/provider.js`
- `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js`
- `open-sse/handlers/chatCore/requestDetail.js`
- `src/lib/db/repos/usageRepo.js`
- `tests/unit/model-routing.test.js`
- `tests/unit/xai-usage.test.js`

Required invariants:

- Registry includes `grok-4.5`.
- xAI has both OpenAI chat and OpenAI Responses transports.
- Native Responses selection is provider- and model-aware. GitHub uses `/responses` only for `gpt-*`, `o1-*`, `o3-*`, and `o4-*`; unknown models fail closed to Chat Completions.
- GitHub Claude Responses clients are bridged to non-empty Chat `messages`; they never send native `input` to `/chat/completions`.
- GitHub executor fallback and initial transport selection share one native Responses capability helper.
- xAI reasoning options exposed by 9Router are `auto`, `low`, `medium`, `high`.
- Bare `grok-*` routes to provider `xai`.
- xAI quota tracker uses local request totals: today tokens, 7d tokens, 30d tokens, today requests.
- Responses usage preserves cached tokens, reasoning tokens, and `cost_in_usd_ticks` for local usage/cost display.
- xAI Responses requests convert `custom` tools to freeform `function` tools, drop `local_shell` plus unsupported nameless hosted tools, strip OpenAI-only hosted tool fields like `external_web_access`, and strip OpenAI encrypted reasoning blobs that xAI cannot decode.
- xAI Responses requests remove `tool_choice` when `tools` is absent, empty, or fully removed by normalization; valid non-empty tool lists preserve `tool_choice`.
- Final xAI executor return must run `normalizeXaiResponsesPayload(transformed)` after `injectReasoningContent(...)`. The first helper-only patch existed in source but live outgoing payloads still retained `encrypted_content`; this final-return strip is the regression guard.
- xAI request input sanitizer must drop `reasoning` items, convert `custom_tool_call` / `custom_tool_call_output` to normal function call variants, and stringify `function_call_output.output` arrays/objects. Live xAI rejects these with `data did not match any variant of untagged enum ModelInput`.

Verification:

- Official xAI docs checked 2026-07-08: `grok-4.5` supports Responses API and reasoning `low|medium|high`; disabling reasoning is not supported by docs.
- Live probe before deploy accepted `xai/grok-4.5` with `low`, `medium`, `high`, and `none`; `none` still returned high-style reasoning metadata, so UI should not advertise `none`.
- Live post-deploy probe accepted bare `grok-4.5` through `/v1/responses`; response returned `OK`, status `completed`, cached input tokens, and reasoning tokens.
- Live post-deploy effort matrix sent `low`, `medium`, `high`; requestDetails preserved sent effort. xAI providerResponse still reported `reasoning.effort = "high"` for all three, so use requestDetails `providerRequest.reasoning_effort` as the source of what 9Router sent.
- Live post-deploy quota endpoint returned `plan: "Local usage"` with today/7d/30d token rows and today request row.
- Live post-deploy probe on 2026-07-09 accepted `/v1/responses` `grok-4.5` with `custom` + `local_shell` + `web_search.external_web_access`; xAI response was HTTP 200 and provider response showed converted `apply_patch`, stripped `local_shell`, and stripped `external_web_access`.
- Live post-deploy probe on 2026-07-09 accepted `/v1/responses` `grok-4.5` with fake `encrypted_content` plus `include:["reasoning.encrypted_content"]`; xAI response was HTTP 200. Latest `requestDetails.providerRequest` had `encrypted_content=0`, `external_web_access=0`, `custom=0`, `local_shell=0`.
- Live post-deploy probe on 2026-07-09 accepted `/v1/responses` `grok-4.5` with reasoning input, custom tool call, custom tool output, and array tool output after sanitizer. Before the patch, xAI returned HTTP 422 `data did not match any variant of untagged enum ModelInput`.
- Follow-up compaction compatibility probe on 2026-07-09:
  - `claude-opus-4.8` via GitHub returned HTTP 200; provider request used `messages`, not `input`, and had no `encrypted_content`.
  - `claude-fable-5` via GitHub returned HTTP 200; provider request used `messages`, not `input`, and had no `encrypted_content`.
  - `grok-4` via xAI returned HTTP 200; provider request used `input` and had no `encrypted_content`; xAI response reported model `grok-4.3`.
  - `grok-4.5` via xAI returned HTTP 403 `permission-denied` / region unavailable in this run; provider request still had no `encrypted_content`, so failure was not compaction-related.
- Regression found 2026-07-12 after the generic xAI native-Responses patch: `claude-fable-5` requests arrived from Codex as native Responses `input`, but GitHub executor correctly selected `/chat/completions`, producing `messages must be non-empty` on both accounts.
- Model-aware transport regression tests passed 16/16 on 2026-07-12. They prove Fable becomes one non-empty Chat message, GitHub GPT keeps `/responses`, unknown GitHub models default to Chat, and xAI remains native Responses.
- Broader Responses regression run passed 33 tests with three expected failures; focused ESLint, `git diff --check`, source checks, and staged bundle checks passed.
- Persistent staged bundle: `/home/home/.openclaw/workspace-keyra/9router-app-stage-github-responses-20260712-0931`; production build completed Next.js, TypeScript, 126 static pages, and MITM bundling at 57 MB.
- Isolated candidate on `127.0.0.1:20129` returned HTTP 200 for Fable non-streaming through GitHub account `emileytoneyth` and Fable streaming through `browndav123731`. Logs showed `FMT: openai-responses→openai`, one input message, and `/chat/completions`; stored provider request had two final messages and no `input`.
- Same candidate returned HTTP 200 for `grok-4.5`; log stayed `FMT: openai-responses→openai-responses`, proving xAI native Responses behavior remained intact.
- Live deploy on 2026-07-12 used one atomic exchange plus one PM2 restart. Local health recovered within the four-second deploy command.
- Live Fable streaming canary returned HTTP 200 with valid `response.created`, `response.output_text.delta`, and `response.completed` events. Stored row was `success`, had two provider messages, no provider `input`, and no provider error.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-github-responses-20260712T163759Z`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-github-responses-20260712T163759Z/data.sqlite`; integrity check returned `ok`.
- Windows restart interrupted the first staged build before any live exchange. Second build used a persistent workspace path so restart could not erase completed output.
- PM2 restart killed post-reboot cloudflared PID `122779` because it was a child of the old Next PID. Tunnel was restored without another 9Router restart at raw URL `https://fighting-documentation-wedding-continues.trycloudflare.com`; `keyra9` was registered again and local/raw/short health passed.
- Final source/live/DB/local/raw/short verifier passed with zero failures and zero warnings. Credential-bearing isolated candidate data was removed.
- After PM2 restart, `rkeyra9` short worker still pointed at an older raw tunnel. Manual worker registration fixed it: `POST https://abc-tunnel.us/api/tunnel/register` with `shortId=keyra9` and the current raw tunnel URL.
- `getModelInfoCore("grok-4.5", {})` returns `{ provider: "xai", model: "grok-4.5" }`.
- `/v1/responses` request with model `grok-4.5` succeeds and latest request details row shows provider `xai`.
- `/v1/responses` request with Codex custom tools should not fail with `unknown variant custom`.
- `/api/usage/<xai connection id>` returns quota rows instead of “Usage API not implemented”.
- Regression on 2026-07-13: a 248-message Codex request arrived with `tool_choice` but no `tools`; xAI returned HTTP 400 `A tool_choice was set on the request but no tools were specified` on every retry.
- Source fix `6927f65` removes stale `tool_choice` for absent, empty, and fully filtered tool sets while retaining it for usable tools.
- Normalizer self-check passed 5/5; xAI/GitHub Responses regression passed 12/12; focused ESLint and `git diff --check` passed.
- Full staged build completed Next.js, TypeScript, 126 pages, standalone copy, and MITM bundle in 22m15s at 57 MB.
- Isolated `127.0.0.1:20129` exact canary with `tool_choice:"auto"` and no tools returned HTTP 200. Stored provider request had neither `tools` nor `tool_choice`.
- Isolated all-filtered canary with only `local_shell` plus `tool_choice:"required"` returned HTTP 200. Stored provider request again had neither field.
- Temporary 191 MB credential-bearing QA DB was deleted after candidate tests; isolated process stopped and port `20129` was released.
- A two-snapshot zero-active gate safely aborted without touching live files because traffic never stayed idle. First deployment attempt used a zero-active instant but rolled back when the post-deploy Grok canary returned unrelated HTTP 403 `bad-credentials`; local/raw/short health recovered immediately.
- Log evidence showed xAI access expiry around 02:56 and three failed refresh attempts. Final deployment therefore used candidate proof plus source/bundle/DB and tunnel gates instead of an impossible live OAuth canary.
- Final deployment exchanged the bundle at a zero-active snapshot and restarted PM2 once. Local, raw, and short health returned HTTP 200; cloudflared remained PID `237493`; DB integrity and full verifier passed.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-xai-tool-choice-20260713T094526Z`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-xai-tool-choice-20260713T094526Z/data.sqlite`; integrity check returned `ok`.

Upstream status:

- Open PRs:
  - xAI/Grok catalog, bare `grok-*` routing, Responses transport, `grok-4.5`, and reasoning options: <https://github.com/decolua/9router/pull/2439>
  - xAI local quota rows from `usageHistory` and provider cost preservation: <https://github.com/decolua/9router/pull/2453>
- PR #2439 now includes model-aware GitHub native-Responses routing plus stale `tool_choice` cleanup at head `76bc3ee`; GitHub merge state is `CLEAN` after push on 2026-07-13.
- Clean PR branch passed 15 focused Vitest cases, five xAI node self-checks, focused ESLint, and `git diff --check` before push.
- Bare `grok-*` routing is generic enough for upstream, but keep it in the catalog/Responses PR so it remains reviewable.

### P10. Staged CLI bundle builds for live-safe deploy

Purpose:

- Build a replacement CLI app bundle without deleting the live `cli/app` directory while PM2 is serving user traffic.
- Keep default publish behavior unchanged.

Files:

- `cli/scripts/build-cli.js`
- `cli/scripts/buildMitm.js`

Required invariants:

- Default build destination remains `cli/app`.
- Setting `NINEROUTER_CLI_APP_DIR=/tmp/some-dir` writes Next standalone files and bundled MITM files there.
- Live deploy can build to staging, backup live bundle, swap, restart PM2 once, and rollback by restoring backup.

Verification:

- `NINEROUTER_CLI_APP_DIR=/tmp/9router-app-stage node cli/scripts/build-cli.js` creates `/tmp/9router-app-stage/server.js`.
- Live `cli/app` remains present during build.
- Used for 2026-07-08 deploy: staged build at `/tmp/9router-app-stage-20260708-184642`, then swapped into live bundle with one PM2 restart.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2479>
- Scope in PR: `NINEROUTER_CLI_APP_DIR` for staged CLI app and MITM bundle output. Default output remains `cli/app`.

### P11. API-key daily token limits

Purpose:

- Add optional per-API-key daily token limits.
- Use tokens, not dollars, because model/provider cost estimates can drift.
- Enforce before provider/account selection so exhausted keys stop early with HTTP 429.

Files:

- `src/app/(dashboard)/dashboard/endpoint/EndpointPageClient.js`
- `src/app/api/keys/[id]/route.js`
- `src/app/api/keys/route.js`
- `src/lib/db/index.js`
- `src/lib/db/migrate.js`
- `src/lib/db/repos/apiKeysRepo.js`
- `src/lib/db/repos/usageRepo.js`
- `src/lib/db/schema.js`
- `src/lib/localDb.js`
- `src/sse/handlers/chat.js`
- `tests/unit/db-sqlite-vs-lowdb.test.js`

Required invariants:

- Blank or null limit means unlimited.
- Limit is stored as a non-negative integer token count.
- Daily window is the server local day.
- Prompt, completion, and reasoning tokens count toward the limit.
- Same-prefix API keys remain separate in usage grouping and masking.

Verification:

- Key with no limit continues normally.
- Key above its daily token limit returns HTTP 429 before provider selection.
- Unit test covers SQLite and LowDB paths.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2454>

### P12. Private Codex GPT-5.6 Sol default and Ultra reasoning

Purpose:

- Keep existing Codex clients on one endpoint while moving the local default from GPT-5.5/xhigh to GPT-5.6 Sol/Ultra.
- Route every chat/Responses model whose model portion starts with `gpt-`, including provider-prefixed names, through one configurable endpoint layer to `cx/gpt-5.6-sol`.
- Use Codex Ultra for maximum model reasoning plus proactive multi-agent delegation.
- Let Codex translate local `ultra` to upstream `reasoning.effort: max`; 9Router must never downgrade it.
- Preserve explicit `max`; never downgrade it to `xhigh`.
- Upgrade legacy clients that still send `xhigh` only after routing to a GPT-5.6 model.
- Keep GPT-5.5 and older explicit `xhigh` requests unchanged.

Files:

- `open-sse/executors/codex.js`
- `open-sse/providers/registry/codex.js`
- `open-sse/services/model.js`
- `src/sse/services/bestGptRoute.js`
- `src/sse/handlers/chat.js`
- `scripts/verify-local-patches.mjs`
- `tests/unit/best-gpt-route.test.js`
- `tests/unit/codex-tool-normalization.test.js`
- `/home/home/.codex/config.toml`
- `/home/home/.openclaw/codex-9router-model-catalog.json`

Runtime PM2 policy:

- `NINE_ROUTER_BEST_GPT_ENABLED=true`
- `NINE_ROUTER_BEST_GPT_TARGET=cx/gpt-5.6-sol`
- `NINE_ROUTER_BEST_GPT_REASONING_EFFORT=max`
- `NINE_ROUTER_BEST_GPT_SERVICE_TIER=default`

Database aliases:

- `gpt-5.5` -> `cx/gpt-5.6-sol`
- `gpt-5.6-sol` -> `cx/gpt-5.6-sol`
- `gpt-5.6-terra` -> `cx/gpt-5.6-terra`
- `gpt-5.6-luna` -> `cx/gpt-5.6-luna`

Required invariants:

- Apply best-GPT routing after naming/warmup bypass handling and before combo/model resolution.
- Bare `gpt-5.4-mini`, bare `gpt-5.5`, and prefixed names such as `cx/gpt-5.6-terra` all route to the configured target.
- Non-GPT models remain unchanged. `NINE_ROUTER_BEST_GPT_ENABLED=false` remains an emergency kill switch.
- Default target is `cx/gpt-5.6-sol`; default routed reasoning is `max`.
- Live PM2 routed service tier is `default`. The source fallback remains `fast` for older targets, but P2 removes it after routing to unsupported GPT-5.6.
- Sol provider payloads contain no `service_tier`; effective response tier is `default`. Change PM2 tier only after proving a future target supports Fast.
- Unified route log includes `GPT-ROUTE`, original model, target, effort, and tier.
- Usage and request details store the actual provider model `gpt-5.6-sol`, not the incoming alias such as `gpt-5.4-mini`.
- PM2 must not retain stale target `cx/gpt-5.5` or stale effort `xhigh` after deploy.
- Candidate and live bundle verifier must contain both `NINE_ROUTER_BEST_GPT_TARGET` and `GPT-ROUTE`.
- Catalog uses Codex CLI 0.144.1 bundled metadata as base, then appends `claude-opus-4.8`, `claude-fable-5`, `grok-build-0.1`, and `grok-4.5`.
- Catalog contains 12 unique models.
- Sol and Terra expose 372,000 context, `multi_agent_version: v2`, and `low,medium,high,xhigh,max,ultra`.
- Luna exposes 372,000 context, `multi_agent_version: v1`, and `low,medium,high,xhigh,max`; Luna must not advertise Ultra.
- Sol, Terra, and Luna set `use_responses_lite: true`; P14 must pass before preserving that setting after future updates.
- `/home/home/.codex/config.toml` sets `model_reasoning_effort = "ultra"`.
- Codex model-visible prompt contains the proactive multi-agent policy and four total concurrency slots.
- Upstream request reasoning is `max`; literal `ultra` must not reach 9Router or the Codex backend.
- GPT-5.6 with omitted effort sends `max`.
- GPT-5.6 with explicit `max` sends `max`.
- GPT-5.6 with legacy explicit `xhigh` sends `max`.
- GPT-5.5 and older models with explicit `xhigh` keep `xhigh`.

Verification:

- `tests/unit/best-gpt-route.test.js` covers the exact `gpt-5.4-mini` regression, provider-prefixed GPT routing, summary preservation, non-GPT bypass, and kill switch.
- Focused route/Codex test run passed 20/20; targeted ESLint and `git diff --check` passed.
- Candidate verifier passed with zero failures and zero warnings before deploy.
- Isolated candidate canary returned HTTP 200 with response model `gpt-5.6-sol`; request details stored routed/provider effort `max` and provider tier `priority`; usage stored `gpt-5.6-sol`.
- Live canary on 2026-07-10 returned HTTP 200 with response model `gpt-5.6-sol`; request details stored routed effort `max` and provider Priority; usage stored `gpt-5.6-sol`.
- Post-deploy source/live/DB/local/short-tunnel verifier passed with zero failures and zero warnings.
- All configured Codex profiles accepted Sol, Terra, and Luna in direct probes on 2026-07-09.
- Codex CLI 0.144.1 source maps `ReasoningEffort::Ultra` to request effort `Max` and selects proactive mode for Ultra on multi-agent V2.
- `codex debug models` on 2026-07-10 loaded Sol/Terra as Ultra-capable V2 and Luna as max-only V1.
- `codex debug prompt-input` contained exactly one proactive multi-agent mode message and one four-slot runtime message.
- Initial live probe with official `use_responses_lite: true` failed with HTTP 400 `Unknown parameter: 'input[0].content'` because 9Router did not forward the Lite transport header.
- After setting `use_responses_lite: false`, a clean temporary-Codex-home probe returned `ULTRA_OK`; 9Router logged `gpt-5.6-sol`, `effort=max`, and `service_tier=priority`.
- Successful Ultra probe stored 13,124 input tokens, 7 output tokens, and no response error.
- Active catalog SHA-256 after Responses Lite enablement: `087182e46cc7dfa80e1c87091c9bbeff967173cea4add4883e4098d9af329448`.
- Pre-merge catalog backup: `/home/home/.openclaw/codex-9router-model-catalog.json.bak-20260710T075954Z`.
- Pre-Lite-compatibility backup: `/home/home/.openclaw/codex-9router-model-catalog.json.pre-lite-compat-20260710T081144Z`.
- Pre-Responses-Lite enablement backup: `/home/home/.openclaw/codex-9router-model-catalog.json.pre-responses-lite-20260710T1056Z`.
- Isolated staged bundle booted on `127.0.0.1:20129`, returned healthy, and listed all three GPT-5.6 models.
- Live omitted-effort and explicit-`max` Sol requests returned HTTP 200.
- Live legacy probe sent bare `gpt-5.5` plus `xhigh`; request detail recorded provider `codex`, model `gpt-5.6-sol`, outgoing effort `max`, and status `success`.
- Final deploy backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-161352-pre-xhigh-upgrade`.
- Earlier pre-GPT-5.6 deploy backup: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260709-155249-gpt56-max`.
- 2026-07-13 PDT live tier correction returned `LIVE_NO_TIER_OK`; stored provider payload had `max`, `all_turns`, `parallel_tool_calls=false`, and no service tier. Rollback and DB backup paths are recorded in current live facts.

Upstream status:

- Private local routing/catalog policy. Do not upstream the `gpt-5.5` alias, custom model catalog, or forced GPT-5.6 legacy-effort upgrade.
- Do not upstream the endpoint-wide best-GPT target policy; it intentionally overrides explicit GPT model selections for this installation.
- Generic `max` preservation and long-context Priority removal are included in PR #2452.
- On future target changes, update `DEFAULT_TARGET`, PM2 `NINE_ROUTER_BEST_GPT_TARGET`, tests, verifier, and this ledger together.
- On future Codex updates, rebuild from the new bundled catalog, append the four custom Claude/Grok entries, and verify P14 before preserving `use_responses_lite: true`.

### P13. Grok probe usage cleanup

Purpose:

- Remove misleading `grok-4` usage generated by local compatibility probes without touching real `grok-4.5` usage.

Required invariants:

- `usageHistory` contains zero `xai/grok-4` rows after cleanup.
- Existing `xai/grok-4.5` rows remain.
- Affected `usageDaily` dates are rebuilt after deleting probe rows.

Verification:

- Removed 10 known `grok-4` probe rows.
- Rebuilt affected daily aggregates.
- Final check on 2026-07-09: `grok-4` rows = 0; `grok-4.5` rows = 13.
- Database backup: `/home/home/.9router/db/backups/pre-gpt56-grok-clean-20260709-151754.sqlite`.

Upstream status:

- No code bug found and no upstream patch needed. Rows came from explicit local probe requests.

### P14. Codex Responses Lite transport

Purpose:

- Support Codex catalog models with `use_responses_lite: true` through 9Router.
- Forward only required Lite transport metadata instead of disabling the newer Codex request format.
- Preserve native normal Responses and unary `/responses/compact` behavior across account and HTTP retries.

Files:

- `open-sse/executors/base.js`
- `open-sse/executors/codex.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/rtk/systemInject.js`
- `open-sse/utils/clientDetector.js`
- `src/sse/handlers/chat.js`
- `tests/unit/base-executor-retry.test.js`
- `tests/unit/client-detector.test.js`
- `tests/unit/codex-tool-normalization.test.js`
- `tests/unit/system-inject.test.js`

Required invariants:

- Client opt-in header `x-openai-internal-codex-responses-lite: true` reaches the Codex backend.
- Only allowlisted Codex metadata headers, valid `originator`, and native Codex user agents are forwarded.
- `codex_exec`, `codex_cli_rs`, and `codex-cli` user agents use native Codex passthrough.
- Lite requests preserve `additional_tools` and always send `parallel_tool_calls=false`; the backend rejects omitted or true values.
- Lite requests always send `reasoning.context="all_turns"` because the Codex backend rejects missing or other context values when the Lite header is present.
- System prompt injection never adds `content` to an `additional_tools` item.
- Compact requests are transformed before URL selection, use `/backend-api/codex/responses/compact`, stay non-streaming, and retain compact state through retries.
- Account/model fallback clones nested request data so one failed account cannot grow or mutate later attempts.
- Requests without the Lite opt-in header retain existing standard Responses behavior.

Verification:

- Focused local tests passed 22/22 on 2026-07-10.
- Same patch in clean upstream worktree passed 20/20; ESLint and `git diff --check` passed.
- Staged production bundle: `/tmp/9router-lite-stage-v3-XXjuOq/app`.
- Isolated server on `127.0.0.1:20129` returned HTTP 200 for Lite compact with `object=response.compaction` and encrypted compaction content.
- Go gateway journal confirmed `/backend-api/codex/responses/compact -> 200`.
- Normal Lite request immediately after compact returned `V3_NORMAL_AFTER_COMPACT`; gateway confirmed `/backend-api/codex/responses`.
- Account fallback request size stayed constant at 44,277 bytes across attempts.
- Live bundle deployed with one PM2 restart using `mv --exchange -T`; PM2 PID became `933789`.
- Live rollback bundle: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260710T105048Z-pre-responses-lite`.
- Local and `https://rkeyra9.abc-tunnel.us/api/health` returned HTTP 200; cloudflared PID stayed `206858`.
- Live compact canary returned HTTP 200, `object=response.compaction`, and one encrypted compaction summary.
- Live normal canary returned HTTP 200 with `LIVE_LITE_NORMAL_OK`; gateway logged `/backend-api/codex/responses -> 200`.
- Active Sol/Terra/Luna catalog flags are `use_responses_lite: true`.
- Fresh Codex CLI 0.144.1 canary loaded the active catalog and returned `CATALOG_LITE_OK`.
- Canary request detail preserved `reasoning.context=all_turns`, `parallel_tool_calls=false`, and a provider payload beginning with `additional_tools`.
- Active catalog SHA-256: `087182e46cc7dfa80e1c87091c9bbeff967173cea4add4883e4098d9af329448`.
- `0.5.30` canary accepted both missing context and invalid `current_turn`, normalizing each to `all_turns`.
- Post-upgrade public tunnel probe on 2026-07-10 returned HTTP 200 and `OK`; request detail recorded incoming context `null`, provider context `all_turns`, effort `max`, and success.
- On 2026-07-13, a Codex client omitted `parallel_tool_calls`; all seven account retries returned HTTP 400 because Lite requires explicit `false`. P14 now normalizes both omitted and `true` to `false`, with regression coverage for both cases.
- Isolated `0.5.30` candidate canaries on port `20129` returned HTTP 200 for both omitted and incoming `parallel_tool_calls=true`. Stored provider payloads contained `parallel_tool_calls=false`, `reasoning.context="all_turns"`, and `reasoning.effort="max"`.
- Live deploy on 2026-07-14 waited for two consecutive zero-active checks, atomically exchanged bundles, and used one PM2 reload. PM2 PID changed from `875138` to `934108`; local health recovered in 17.6 seconds; cloudflared PID remained `237493`.
- Post-deploy verifier returned zero failures. Local, raw Quick Tunnel, and `https://rkeyra9.abc-tunnel.us/api/health` returned HTTP 200.
- Short-domain omitted-field canary returned HTTP 200 with `LIVE_LITE_FALSE_OK`; stored provider payload contained `parallel_tool_calls=false`, `reasoning.context="all_turns"`, and `reasoning.effort="max"`.
- Rollback bundle: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-20260714T003627Z-pre-lite-parallel`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-lite-parallel-20260714T003627Z/data.sqlite`; integrity `ok`; SHA-256 `ef0d97e7680ce475848fa370de7171fffd4f8279dec09c1f2eea8b975b6f09b6`.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2511>
- Clean branch: `/home/home/.openclaw/workspace-keyra/9router-responses-lite-pr`, branch `codex-responses-lite`, head `1e59517`.
- PR was rebased onto upstream `v0.5.30`; GitHub merge state is `CLEAN`.
- Focused Lite tests passed 21/21; broader Codex capacity/refresh/reset/normalization tests passed 23/23.
- Context-normalization follow-up passed ESLint and `git diff --check`.
- Parallel-tool normalization follow-up was pushed to PR #2511 as `1e59517`; ESLint, `git diff --check`, omitted-field self-check, and focused tests passed.
- Two `codex-image-fetch.test.js` failures reproduce unchanged on clean upstream `v0.5.30`; not introduced by P14.
- Private GPT aliases, catalog contents, effort upgrades, and routing policy are excluded.

### P15. Tunnel-safe console transport

Purpose:

- Keep Console Log usable when Cloudflare buffers SSE through the raw Quick Tunnel or short Worker URL.
- Preserve SSE locally while falling back to low-cost conditional REST polling only when the stream stays silent.

Files:

- `src/app/(dashboard)/dashboard/console-log/ConsoleLogClient.js`
- `src/app/(dashboard)/dashboard/console-log/transport.js`
- `src/app/api/translator/console-logs/route.js`
- `src/app/api/translator/console-logs/stream/route.js`
- `src/lib/consoleLogBuffer.js`
- `src/shared/constants/config.js`
- `tests/unit/console-log-api.test.js`
- `tests/unit/console-log-transport.test.js`
- `tests/unit/usage-stream-cleanup.test.js`

Required invariants:

- Load one REST snapshot before opening SSE so tunnel users see existing logs immediately.
- Keep local SSE when an `init` event arrives; switch to polling after five seconds of silent SSE or an SSE error.
- Poll with `If-None-Match`; unchanged buffers return HTTP 304 without retransmitting logs.
- Every SSE connection sends an `init` event, including an empty log buffer.
- Clearing logs clears pending batches and invalidates the polling ETag.
- Request abort removes console and usage SSE listeners; reconnects must not accumulate emitter listeners.

Verification:

- Before patch, eight-second console SSE probes returned about 23 KB locally and zero bytes through both tunnel URLs; console REST returned about 22 KB on all paths.
- Public worktree tests passed 12/12; integrated P15-P17 regression run passed 73/73 with clean ESLint and diff checks.
- Live local/raw/short Console Log transport checks passed after deploy.
- Staged bundle built successfully with Next.js production compile, TypeScript, 126 static pages, and MITM bundle; output size is 57 MB.
- Isolated candidate on `127.0.0.1:20129` returned console REST HTTP 200, ETag conditional HTTP 304, and immediate local SSE `init`.
- Temporary Quick Tunnel `https://lace-hart-litigation-portrait.trycloudflare.com` returned console REST HTTP 200 and conditional HTTP 304 while SSE stayed buffered for eight seconds, exercising the intended fallback condition.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2554>
- Public branch: `tunnel-dashboard-refresh` at `f7bac99`.
- Commits: `c7995b8`, `df7436c`, `f7bac99`.
- Clean worktree: `/home/home/.openclaw/workspace-keyra/9router-tunnel-dashboard`.
- GitHub merge state after push: `CLEAN`.

### P16. Stable quota refresh scheduler

Purpose:

- Stop quota countdown acceleration caused by duplicate interval owners and callback recreation.
- Keep one refresh deadline across visibility changes and slow quota requests.

Files:

- `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/index.js`
- `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js`
- `src/app/api/usage/stream/route.js`
- `tests/unit/quota-refresh-scheduler.test.js`
- `tests/unit/usage-stream-cleanup.test.js`

Required invariants:

- One scheduler owns one refresh timeout and one countdown interval.
- Countdown derives from an absolute deadline; rerenders cannot speed it up.
- Hidden tabs pause timers; visible tabs resume the same deadline or refresh once when overdue.
- Slow refreshes never overlap. A queued refresh runs once after the active refresh completes.
- Manual refresh resets the next deadline after completion.
- Changing `expiringFirst` does not recreate the connection-fetch callback.

Verification:

- Scheduler tests cover timer count, visibility resume, slow refresh overlap, and manual deadline reset.
- Integrated P15-P17 regression run passed 73/73 with clean ESLint and diff checks.
- Candidate source/bundle/DB/health verifier passed with zero failures and zero warnings.

Upstream status:

- Included in public PR #2554 at `f7bac99`.

### P17. API-key client activity

Purpose:

- Give API-key owners a lightweight signal when one key appears active from multiple clients.
- Show client activity under Usage instead of adding more controls to Endpoint/key management.

Files:

- `client-ip.js`
- `custom-server.js`
- `cli/scripts/build-cli.js`
- `open-sse/handlers/chatCore/nonStreamingHandler.js`
- `open-sse/handlers/chatCore/requestDetail.js`
- `open-sse/handlers/chatCore/sseToJsonHandler.js`
- `open-sse/handlers/chatCore/streamingHandler.js`
- `open-sse/utils/clientDetector.js`
- `src/app/(dashboard)/dashboard/usage/components/ApiKeyClientsTable.js`
- `src/app/api/usage/clients/route.js`
- `src/lib/apiKeyClientIdentity.js`
- `src/lib/db/migrations/002-api-key-clients.js`
- `src/lib/db/repos/apiKeyClientsRepo.js`
- `src/lib/db/schema.js`
- `src/sse/handlers/chat.js`
- `tests/unit/api-key-client-activity.test.js`
- `tests/unit/api-key-client-identity.test.js`
- `tests/unit/api-key-client-usage-meta.test.js`
- `tests/unit/client-ip.test.js`

Required invariants:

- Run the production app through `custom-server.js`; bare `server.js` cannot stamp trusted client identity.
- Trust forwarding headers only from a loopback proxy. Raw Quick Tunnel uses `CF-Connecting-IP`; short Worker traffic accepts the first XFF address only with the validated Cloudflare cross-zone chain.
- Strip client-supplied forwarding/internal identity headers before stamping trusted replacements.
- Store no full IP and no full user agent. Store a machine-secret HMAC fingerprint, client family or validated `X-9Router-Client-ID`, masked network, source, and timestamps.
- Generic client version changes such as `curl/8.10` to `curl/8.11` keep one client family.
- More than one client active for the same key within one hour shows `Review`; this is observation only, not device authentication or automatic blocking.
- Usage rows keep existing cost/cache metadata and add only API-key ID plus client fingerprint metadata.
- P11 daily token limits remain enforced before provider/account selection.
- `/api/usage/clients` remains under existing dashboard authentication.

Verification:

- Header-chain probes confirmed raw Quick Tunnel preserves spoofable first XFF while short Worker traffic emits `original IP, 2a06:98c0:3600::103`; resolver tests cover both paths and malformed chains.
- Public focused run passed 54/54; integrated P15-P17 regression run passed 73/73. ESLint and diff checks passed.
- Upstream `db-concurrent.test.js` independently reproduces its existing count-loss failures; P17 did not introduce them.
- Live DB migration, short-URL API response, usage attribution, and PM2 entrypoint checks passed after deploy.
- Candidate migration advanced schema version 1 to 2, created `apiKeyClients`, and preserved existing aliases/settings.
- Candidate PM2 process ran `app/custom-server.js` on `127.0.0.1:20129` and stayed healthy.
- Successful keyed canary routed bare `gpt-5.4-mini` to `codex/gpt-5.6-sol`, stored Priority, 2,490 input tokens, 5 output tokens, API-key ID, and client fingerprint.
- `/api/usage/clients` returned the same client with one request and 2,495 total tokens.
- Raw Quick Tunnel request with spoofed `X-Forwarded-For: 198.51.100.77` stored the real Cloudflare client network and source `cloudflare`.
- Simulated validated short Worker chain stored `203.0.113.*` with source `cloudflare-worker`.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2553>
- Public branch: `api-key-client-activity` at `dd9b15b`.
- Commits: `cd204dd`, `dd9b15b`.
- Clean worktree: `/home/home/.openclaw/workspace-keyra/9router-api-client-activity`.
- GitHub merge state after push: `CLEAN`.

### P18. Lightweight Usage SSE

Purpose:

- Prevent Usage dashboard realtime updates from running all-history aggregation on the main Node event loop.
- Preserve active, recent, error, and pending UI updates without retransmitting aggregate tables the client ignores.

Files:

- `src/app/api/usage/stream/route.js`
- `src/lib/db/repos/usageRepo.js`
- `tests/unit/usage-stream-cleanup.test.js`
- `scripts/verify-local-patches.mjs`

Required invariants:

- Usage SSE must not import or call `getUsageStats()`.
- Initial, `pending`, and `update` events call only `getActiveRequests()`.
- Realtime payload contains `activeRequests`, `recentRequests`, `errorProvider`, and `pending`.
- At most one activity snapshot runs per SSE client; overlapping events queue one coalesced rerun.
- Abort, cancel, enqueue failure, and already-aborted requests remove both emitter listeners and keepalive timers.
- Full period statistics remain on `/api/usage/stats?period=...`; `UsageStats` merges only realtime SSE fields into its REST snapshot.

Verification:

- Focused SSE/Codex regression passed 13/13; broader local regression passed 83/83.
- Public PR worktree console/scheduler/SSE/DB run passed 35/35; ESLint and `git diff --check` passed.
- Copied 161,728-row DB produced first SSE event in 638 ms with only four realtime fields.
- Twelve concurrent candidate SSE clients plus one routed request kept health p95 at 150 ms and max at 160 ms.
- Source verifier rejects `getUsageStats` in Usage SSE and requires update coalescing plus pending snapshot.

Upstream status:

- Included in open PR <https://github.com/decolua/9router/pull/2554> at head `f7bac99`.
- GitHub merge state after push is `CLEAN`.

### P19. Official Grok Build subscription path

Purpose:

- Support official `@xai-official/grok` subscription traffic through `cli-chat-proxy.grok.com` without conflating it with `xai/grok-4.5` API OAuth or `grok-web/*` cookie traffic.
- Preserve selected proxy pool through device authorization, polling, profile lookup, refresh, model discovery, usage, and inference.
- Match current Grok CLI protocol metadata and expose only account-entitled live models when available.

Files:

- `open-sse/config/grokCli.js`
- `open-sse/executors/grok-cli.js`
- `open-sse/providers/registry/grok-cli.js`
- `open-sse/services/grokCliModels.js`
- `open-sse/services/oauthCredentialManager.js`
- `open-sse/services/tokenRefresh.js`
- `open-sse/services/tokenRefresh/providers.js`
- `open-sse/services/usage/grok-cli.js`
- `src/app/api/oauth/[provider]/[action]/route.js`
- `src/app/api/providers/[id]/models/route.js`
- `src/app/api/v1/models/route.js`
- `src/lib/oauth/providers.js`
- `src/lib/oauth/services/xai.js`
- `src/sse/services/auth.js`
- `tests/unit/grok-cli-*.test.js`

Required invariants:

- `grok-build` routes to provider `grok-cli`; `grok-build-0.1` remains the legacy xAI API model, bare `grok-4.5` remains `xai`, and `grok-web/*` remains separate.
- Subscription inference uses `https://cli-chat-proxy.grok.com/v1/responses`, model `grok-build`, `stream:true`, `store:false`, and encrypted reasoning continuity.
- Current official fingerprint is `grok-shell/0.2.99`; model metadata is 500,000 context and 64,000 max output.
- Do not restore invented `x-compaction-at`; official CLI compaction is client-side near 85% context.
- Cross-provider Codex/OpenAI history is normalized by the pure Grok compatibility codec: foreign encrypted reasoning is removed; native `rs_<UUID>` and self-identifying `tco_*` reasoning retains encrypted continuity; output-only message/function IDs and statuses are removed.
- Codex custom calls become normal function-call history and custom tool definitions become `{input:string}` function schemas. Valid typed text/image outputs stay typed; other non-string outputs use deterministic JSON text. Orphans are removed, duplicate outputs keep the last result, and dangling calls receive the official cancellation result.
- `grok-4.5` reasoning maps `max` to `xhigh`, keeps `low|medium|high|xhigh`, and normalizes unsupported values to `high`. Unknown/non-reasoning models omit effort while retaining summary and encrypted continuity.
- Empty, absent, or fully filtered tools remove `tool_choice`; custom tool choices become matching flat function choices.
- Session fallback stays stable when assistant history first appears. Per-session turn state is LRU-bounded at 5,000 entries; retries of the same body do not advance the turn.
- Device request, token poll, user lookup, token refresh, model lookup, usage, and inference use the selected pool. Strict pools never fall back direct.
- `/v1/models` and per-connection model lookup query `/v1/models`, refresh once on auth failure, then fall back to static `grok-build` metadata.
- Quota parsing accepts old cap/used fields plus current `monthlyLimit`, `includedUsed`, `totalUsed`, and `subscription_tier` shapes.
- Grok Build subscription usage has no invented API token price; local cost stays unknown/zero unless provider returns exact cost data.

Verification:

- Official binaries `0.2.93` and `0.2.99` were wire-captured against a local fake session; `0.2.99` used `/v1/models`, `/v1/user`, `/v1/settings`, `/v1/billing?format=credits`, and `/v1/responses` with model `grok-build`.
- Official embedded metadata reported 500,000 context, 64,000 max output, Responses backend, and `supported_in_api:false`.
- Gateway `18888` reached `auth.x.ai` and `cli-chat-proxy.grok.com` through a US exit; `18889` timed out and is not used for this migration.
- Candidate focused suite passed 40/40; broader Grok/xAI/Responses suite passed 65/65. Focused ESLint had zero errors and one existing anonymous-default-export warning.
- Source verifier passed with zero failures and warnings.
- Device authorization created one X Premium+ `grok-cli` profile with `hasGrokCodeAccess=true`; model, inference, encrypted-history, tool, effort, refresh, and billing probes then used that real entitlement.
- Production build completed Next.js compilation, TypeScript, 126 pages, standalone copy, and MITM bundling at 57 MB. Source/candidate verifier passed with zero failures and warnings.
- Final isolated `127.0.0.1:20129` used a copied DB with every refresh token removed and tunnel disabled. Incoming `max` returned HTTP 200 for `grok-build`, Composer, and `grok-4.5`; stored provider payload omitted effort for build/Composer and sent `xhigh` only for `grok-4.5`. Console omitted false THINK labels for build/Composer. The credential-bearing QA directory was deleted after testing.
- Isolated existing-route canary returned `CANDIDATE_OK` as `gpt-5.6-sol`; stored provider request kept `max`, `all_turns`, and Priority.
- Detached deployment guard waited for two zero-active snapshots, atomically exchanged directories, restarted PM2 once, and retained automatic rollback until local health passed.
- Live local, raw `https://rochester-wanted-ware-movements.trycloudflare.com`, and short `https://rkeyra9.abc-tunnel.us` health returned HTTP 200. Cloudflared stayed PID `237493`; PM2 resumed online as PID `804122` through `app/custom-server.js`.
- Short-URL post-deploy canary returned `LIVE_GROK_DEPLOY_OK` as Sol. Stored request and provider payload both had `max`, `all_turns`, and Priority.
- Full source/live bundle/DB/local/raw/short verifier passed with zero failures and warnings.
- Real `/v1/models` returned entitled `grok-4.5` (500K context, low/medium/high advertised) and `grok-composer-2.5-fast` (200K context). Backend also accepts hidden fallback `grok-build`.
- Real `grok-4.5` requests with `high` and translated `max -> xhigh` returned HTTP 200 as response model `grok-4.5-build`.
- Real `grok-build` rejected any `reasoningEffort` with HTTP 400, then exact direct wire without effort returned HTTP 200. Composer likewise returned HTTP 200 without effort. Follow-up executor commit omits effort unless model is proven `grok-4.5`.
- Real billing for X Premium+ returned `onDemandCap=0`, `onDemandUsed=0`, `hasGrokCodeAccess=true`, and `subscriptionTier=XPremiumPlus` while inference remained active. Zero means no separate on-demand allowance, not exhausted subscription quota.
- Paid tiers with no numeric allotment now report active subscription and explicitly state that Grok exposes no numeric included quota. Tierless zero-cap promo/free profiles retain the depleted state.
- Final live canaries returned HTTP 200 for build, Composer, and `grok-4.5` through local/short paths. Stored wire omitted build/Composer effort, sent `xhigh` for `grok-4.5`, and console labels matched the provider wire.
- 2026-07-15 incident: bare `grok-4.5` still resolved to the expired xAI OAuth profile and returned delayed HTTP 403 `unauthenticated:bad-credentials`. The active Grok CLI token and identical inference payload returned HTTP 200 direct, HTTP 400 Cloudflare HTML through DC port `18888`, and HTTP 200 through residential port `18889`; `/v1/models` returned HTTP 200 on all three paths.
- Created dedicated strict pool `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` for `http://127.0.0.1:18889`, bound only the `grok-cli` profile, and set private DB alias `grok-4.5 -> grok-cli/grok-4.5`. This keeps `18888` DC and `18889` residential semantics separate.
- Post-fix explicit local canary returned `GROKCLI_RESI_OK`; bare short-domain canary returned `BARE_GROK45_OK` as `grok-4.5-build`. Stored provider was `grok-cli`, model `grok-4.5`, effort `xhigh`, status `success`.
- Pre-change DB backup: `/home/home/.9router/db/backups/pre-grok-cli-residential-20260716T010837Z/data.sqlite`.
- 2026-07-15 cross-provider history incident: a 990,841-byte Codex `/v1/responses` body with 463 input items failed through `grok-cli/grok-4.5` with HTTP 422 `data did not match any variant of untagged enum ModelInput`. Failed provider payloads contained 162-172 foreign OpenAI reasoning items, 123-132 custom-tool call/output pairs, structured tool outputs, and OpenAI-only metadata.
- Root fix runs at the Grok CLI executor boundary: discard foreign encrypted reasoning; preserve native Grok encrypted reasoning only when IDs use Grok's hyphenated UUID form; convert Codex `custom_tool_call` history to `function_call`; convert custom outputs to string-valued `function_call_output`; remove OpenAI passthrough metadata; and expose custom tools as normal function schemas with one required string `input`.
- Focused executor QA passed 21/21 in canonical source; four-file Grok CLI QA passed 40/40; ESLint and `git diff --check` passed. A direct sanitized 590 KB replay and compiled-candidate 990,841-byte replay both returned HTTP 200. Native Grok encrypted two-turn continuity and a forced custom `exec` call also returned HTTP 200.
- Candidate source/bundle/DB verifier returned zero failures and warnings. Promotion used two zero-active gates, SQLite backup, atomic app exchange, one PM2 restart, and automatic rollback protection.
- Restart replaced child cloudflared PID `40865`, so the old raw target returned HTTP 530 until the guarded tunnel-enable path created `https://tattoo-recovery-industries-predict.trycloudflare.com` and re-registered `rkeyra9`. Local, raw, and short health then returned HTTP 200.
- Exact live short-domain replay returned HTTP 200 SSE for all 990,841 request bytes and 463 items. Latest stored row was `grok-cli/grok-4.5`, effort `xhigh`, status `success`, with no provider error.
- Live rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-history-20260715-20260716T022152Z`; pre-deploy DB backup: `/home/home/.9router/db/backups/pre-grok-history-20260715-20260716T022152Z/data.sqlite`.
- Post-deploy cleanup removed `/home/home/.openclaw/workspace-keyra/9router-candidate-grok-history-home` and `/tmp/grok-candidate-history-request.mjs`. PM2 policy was saved as Sol/max/default.
- Mandatory post-implementation review found four defects in that first version: structured arrays were concatenated and `null` became empty text; invalid calls could leave orphan outputs; the existing Grok multi-turn fixture still failed; and native `fc_` preservation lacked coverage. These were treated as deployment defects, not deferred.
- V2 JSON-stringifies every non-string output, filters `function_call_output` against normalized call IDs, changes the stale continuity fixture to real native UUID IDs, and covers native `rs_`, `msg_`, and `fc_` items. TDD first reproduced two focused failures, then passed 28/28; canonical seven-file QA passed 56/56 and public PR QA passed 57/57. Focused ESLint and `git diff --check` passed; independent re-review found no actionable issues.
- V2 production build compiled, type-checked, generated 126 pages, copied standalone assets, and bundled MITM output at 57 MB in 19m09s. Source/candidate/DB verifier returned zero failures and warnings.
- Isolated v2 exact replay completed HTTP 200 SSE for 990,844 bytes and 463 items. A small provider-wire canary retained `[1,2]` as the string `"[1,2]"`, retained `null` as `"null"`, and removed an orphan output. Native encrypted two-turn continuity and forced custom `exec` both completed.
- V2 safe promotion used two zero-active gates, SQLite backup, atomic exchange, one PM2 restart, and rollback protection. Because restart killed the known child tunnel PID, the ops guard waited 10 seconds instead of 120 before guarded re-enable; raw and short health recovered in 42 seconds at `https://uni-found-thought-podcast.trycloudflare.com`.
- Live short-domain v2 replay completed all 990,844 bytes/463 items with HTTP 200 and `response.completed`. Live structured-output wire and native encrypted two-turn checks passed. Source/live/DB verifier returned zero failures/warnings; live and backup SQLite integrity checks returned `ok`.
- V2 rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-history-v2-20260715-20260716T034051Z`; pre-deploy DB backup: `/home/home/.9router/db/backups/pre-grok-history-v2-20260715-20260716T034051Z/data.sqlite`.
- Cleanup removed `/home/home/.openclaw/workspace-keyra/9router-candidate-grok-history-v2-home`, `/tmp/grok-history-v2-canary.mjs`, and `/tmp/grok-native-v2-canary.mjs`. `pm2 save` persisted Sol/max/default after final promotion.
- Bare `gpt-5.4-mini` through the short URL returned HTTP 200 as `gpt-5.6-sol`; stored request used `max` and Priority. Local, raw, and short health passed; cloudflared stayed PID `237493`.
- X Premium+ quota returned plan `XPremiumPlus`, empty numeric quotas, and the active-subscription message. Live and backup SQLite integrity checks returned `ok`; full source/live/DB verifier returned zero failures and warnings.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-final-20260713-20260713T225502Z`.
- Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-grok-final-20260713-20260713T225502Z/data.sqlite`; integrity check returned `ok`.

Upstream status:

- Protocol/model/session/quota PR <https://github.com/decolua/9router/pull/2590> was closed by the maintainer at `b8f288c` with a merge comment, but upstream `master` remained at `v0.5.30`. Complete codec follow-up PR <https://github.com/decolua/9router/pull/2647> supersedes it.
- OAuth proxy PR <https://github.com/decolua/9router/pull/2343> is open and merge-clean at `640fa12`; 15 focused tests passed.
- Private GPT/Claude routing and personal aliases beyond bare official `grok-build` remain excluded from upstream.

### P19 deployment retrospective

- First promotion attempt found an ops-script bug before restart: GNU `mv --exchange` needed `-T` to treat both paths as directories to exchange. Live files and PID stayed unchanged.
- Second attempt started the candidate and passed local health, but the post-swap verifier inherited the ops directory as its source root. Automatic rollback exchanged the previous app back, restarted it, and passed rollback health. Cloudflared stayed PID `237493`.
- The helper now runs the exact source/candidate/DB verifier before waiting, uses `mv -T --exchange`, passes explicit verifier paths after swap, requires two zero-active snapshots both before backup and immediately before exchange, and keeps rollback armed through local health and invariant checks.
- Final promotion used `/home/home/.openclaw/workspace-keyra/9router-ops/safe-promote-app.sh`, one successful app restart, PM2 PID `875138`, and no tunnel restart. Earlier controlled rollback caused two additional app restarts; both are recorded instead of hidden.
- Cross-provider history v1 was promoted only after protocol replay passed, but later independent code review exposed output-fidelity, orphan-pair, and regression-test gaps. V2 was built and safely promoted in the same run; the first deployment and its rollback artifacts remain recorded above.
- `safe-promote-app.sh` now shortens only the post-restart external-health loop when the captured tunnel PID is already gone. This reduced measured v2 short-domain recovery from about 200 seconds to 42 seconds without changing normal 60-attempt behavior when the tunnel process survives.

### P20. Complete Grok Responses compatibility codec

Purpose:

- Replace accumulated Grok request mutations with one source-pinned OpenAI Responses compatibility codec based on `xai-org/grok-build` commit `b189869b7755d2b482969acf6c92da3ecfeffd36`.
- Preserve native Grok reasoning/backend-tool continuity and successful SSE while deterministically translating only client history and tools Grok can represent.
- Stop schema failures locally or at one account without treating them as account health failures.

Files:

- `open-sse/executors/grok-cli-compat.js`
- `open-sse/executors/grok-cli.js`
- `open-sse/services/accountFallback.js`
- `open-sse/services/grokCliModels.js`
- `src/lib/oauth/providers.js`
- `tests/unit/account-fallback.test.js`
- `tests/unit/grok-cli-executor.test.js`
- `tests/unit/grok-cli-models.test.js`
- `tests/unit/grok-cli-responses-compat.test.js`
- `scripts/verify-local-patches.mjs`

Required invariants:

- Build a fresh provider body; never mutate client input. Keep validated Responses fields only, set `stream:true` and `store:false`, and convert non-empty instructions into one exact-byte system message.
- Preserve native `rs_<UUID>` reasoning only with encrypted content. Preserve `tco_*` only when ciphertext starts with its own ID plus `_`. Add `reasoning_text`, remove status/internal metadata, and discard foreign OpenAI ciphertext.
- Preserve native x-search `ctc_*` plus `xs_call-*`, `web_search_call`, and `code_interpreter_call` history. Do not convert native x-search into client function history.
- Convert non-native custom calls/tools to function wire with one required string `input`. Require call ID/name, repair malformed JSON args to `{}`, preserve valid typed output arrays, stringify other structures, remove orphans, keep last duplicate output, and repair dangling calls.
- Allow only exact `web_search` with filtered non-empty domains and exact `x_search`. Deduplicate hosted tools, let hosted tools win name collisions, and reconcile tool choice against final tools. Never send `external_web_access`.
- Rebuild reasoning with concise summary; translate `max -> xhigh` only for proven reasoning models and request `reasoning.encrypted_content`. Rebuild plain text or JSON schema output without verbosity/provider modifiers.
- Inference sends official `X-XAI-Token-Auth`, `x-authenticateresponse`, `x-grok-client-mode`, `x-grok-*` request identity, and optional `x-grok-user-id`. Resource endpoints keep `x-userid`/`x-email`.
- Successful Grok Responses SSE stays byte-for-byte provider passthrough. Unknown semantic input returns local HTTP 400 before provider transport.
- Unmatched HTTP 400/422 causes no account lock/fallback. Existing capacity, overload, rate, and quota text rules remain higher priority.
- `/v1/models` normalizes `apiBackend`, context/output limits, backend-search/reasoning capability, effort options, compaction fields, and streaming tool-call metadata from top level or `_meta`.
- Private alias `grok-4.5 -> grok-cli/grok-4.5`, strict residential pool, credentials, deployment artifacts, verifier, ledger, and runbook never enter the public PR.

Verification before deployment:

- TDD codec/executor/model/fallback matrix passed 81/81 across ten focused files; focused ESLint, syntax, `git diff --check`, and pinned-source invariants passed.
- Full local unit run passed 1,031 tests, skipped 24, and retained 26 unrelated baseline/local failures outside all changed Grok/account files. No changed test failed.
- Independent review found missing official proxy headers, cross-account agent-ID carryover, empty-message retention, and instruction trimming. Red tests reproduced all four; commits `0210ee1` and `decde81` fixed them. Review request to allowlist backend history was rejected because it conflicts with the approved/source-backed full native backend-item preservation contract.
- Production build completed in 117 seconds: Next.js compiled, TypeScript passed, 126 pages generated, standalone assets copied, MITM bundled, final size 57 MB.
- Source/candidate/copied-DB verifier passed with zero failures/warnings. Candidate bound only `127.0.0.1:20129`; copied DB integrity was `ok`, contained zero refresh tokens, and no candidate tunnel started.
- Minimal `grok-4.5` returned HTTP 200 as `grok-4.5-build`; stored provider wire used model `grok-4.5`, effort `xhigh`, `parallel_tool_calls:false`, and encrypted reasoning include.
- Strict web search returned HTTP 200 with reasoning/message/web-search output. Stored wire retained only `web_search.filters.allowed_domains=["x.com"]`; `external_web_access` and search modifiers were absent.
- Native x-search emitted and replayed 24 `ctc_*` plus 24 self-identifying `tco_*` items; second turn returned `CONTINUITY_OK` with HTTP 200.
- Combined history canary returned HTTP 200 and proved malformed args repaired, typed image retained, duplicate output deduped, orphan removed, dangling result inserted, custom history converted, and JSON schema retained.
- Local unknown semantic input returned HTTP 400 in 17 ms with nested `grok_cli_compatibility_error`; account lock/test/error/backoff state stayed byte-identical.
- A 1,088,882-byte request with 463 history items and 336,865 provider input tokens returned `LARGE_OK` in 42.4 seconds. Eighty-three concurrent health probes stayed below 6.6 ms.
- Four-way non-streaming through the one residential profile produced three HTTP 200 responses and one upstream proxy socket close/502; after its 30-second transient cooldown, two-way streaming returned two HTTP 200 responses with complete `response.completed` events.
- Candidate recorded 11 successful Grok canaries and three deliberate/transport errors. Final copied DB integrity was `ok`; credential-bearing candidate home and temporary payloads were removed before promotion.

Deployment/upstream status:

- Safe promotion `grok-compat-v3-20260716` completed through the detached two-snapshot/atomic-exchange guard. PM2 resumed online as PID `1047581` from `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app/custom-server.js`; the global package app resolves to the same promoted directory.
- Restart replaced the prior child tunnel. Current cloudflared PID `1048656` serves raw `https://triple-alfred-broader-clouds.trycloudflare.com`; local, raw, and `https://rkeyra9.abc-tunnel.us` health each returned HTTP 200. Short health recovered without a second registration mutation.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-compat-v3-20260716-20260716T082831Z`. Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-grok-compat-v3-20260716-20260716T082831Z/data.sqlite`. Live and backup SQLite integrity checks returned `ok`.
- Live short-domain `grok-4.5` canary returned HTTP 200 with `GROK_CODEC_LIVE_OK` as `grok-4.5-build`. Stored provider was `grok-cli`, model `grok-4.5`, wire effort `xhigh`, status `success`; console confirmed strict pool `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` on `http://127.0.0.1:18889`.
- Live short-domain bare `gpt-5.4-mini` canary returned HTTP 200 with `GPT_DEFAULT_LIVE_OK` as `gpt-5.6-sol` and effective response tier `default`. Console recorded `gpt-5.4-mini -> cx/gpt-5.6-sol`, effort `max`, tier `default`; usage stored model `gpt-5.6-sol`.
- Post-deploy independent review found five real gaps: current billing percentage/legacy-used fields, generated agent IDs shared across accounts and retries, duplicate function calls retained, unsupported nested message semantics silently dropped, and malformed input containers converted to placeholders. Red tests reproduced each gap before commits `ff347ab`, `e9a1caa`, `40f51e4`, and `f147a4b`; stale primitive-drop fixture was corrected by `a083f9d`.
- Review requests to replace the proven npm `0.2.99` wire fingerprint with Cargo workspace `0.1.220-alpha.4`, allowlist evolving native backend history, and preserve unadvertised Grok 4.5 `none|minimal` efforts were rejected. npm and Cargo use different version tracks; native backend fields are an explicit source-backed continuity contract; live Grok 4.5 metadata advertises `low|medium|high`, with `max -> xhigh` proven separately.
- Final local focused matrix passed 87/87; clean public matrix passed 78/78. Public production build compiled, type-checked, and generated 126 routes. Full public unit run passed 954, skipped 24, and retained the same 26 failures in unchanged baseline files. Final re-review returned no actionable findings.
- V4 isolated candidate `/home/home/.openclaw/workspace-keyra/9router-candidate-grok-compat-v4-app` built in 105 seconds at 57 MB. Copied DB integrity was `ok`, contained zero refresh tokens, and candidate bound only `127.0.0.1:20129`. Grok and GPT canaries returned `GROK_V4_CANDIDATE_OK` and `GPT_V4_CANDIDATE_OK`; malformed object input returned local HTTP 400 in 15 ms. Credential-bearing candidate home was deleted before promotion.
- Safe promotion `grok-compat-v4b-20260716` used explicit `MAX_ACTIVE=1` because this task's own control request could not end before deployment. The guard still required two five-second snapshots and would not swap with any additional traffic. Default remains zero. App exchange, one PM2 restart, rollback protection, and all post-swap invariants passed.
- PM2 runs PID `1323261`; cloudflared PID `1324069` serves raw `https://bills-genesis-rpm-prescription.trycloudflare.com`. Local, raw, and `https://rkeyra9.abc-tunnel.us` health returned HTTP 200 after one guarded tunnel replacement/re-registration.
- V4 rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-grok-compat-v4b-20260716-20260716T095229Z`. Pre-deploy DB backup: `/home/home/.9router/db/backups/pre-grok-compat-v4b-20260716-20260716T095229Z/data.sqlite`. Live and backup integrity checks returned `ok`.
- Live short-domain canaries returned `GROK_V4_LIVE_OK` as `grok-4.5-build`, local malformed-input HTTP 400 in 419 ms, and `GPT_V4_LIVE_OK` as `gpt-5.6-sol`/`default`. Grok model-lock, error, backoff, and test-status fields remained byte-equivalent to the pre-deploy backup after the deterministic 400. Final source/live-bundle/DB verifier passed with zero failures and warnings.
- Fresh V4 large replay sent 1,050,001 bytes and 463 mixed history items through the short domain. It returned HTTP 200 with structured `LARGE_V4_OK` in 20.5 seconds, recorded 178,704 provider input tokens and a 1,035,099-byte provider body, and stored status `success`. All 76 concurrent short-domain health probes completed; maximum observed latency was 840 ms.
- Public branch head `ccb00ac` passed private-data leak scan and is open, mergeable, and `CLEAN` in replacement PR <https://github.com/decolua/9router/pull/2647>. Private aliases, pools, DB, verifier, ledger, runbook, and deployment artifacts remain excluded.

### P21. Early Responses SSE heartbeat and cancellation

Purpose:

- Prevent Cloudflare `524` and Codex reconnect loops when account/provider work takes longer than the public tunnel's response-header window.
- Stop disconnected public requests from continuing as orphan provider jobs or consuming another account.

Files:

- `src/app/api/v1/responses/route.js`
- `src/sse/handlers/chat.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/utils/responsesStreamBridge.js`
- `open-sse/utils/responsesStreamHelpers.js`
- `open-sse/utils/streamHandler.js`
- `tests/unit/responses-early-stream.test.js`
- `tests/unit/responses-route.test.js`
- `tests/unit/headroom-chat-core.test.js`
- `scripts/verify-local-patches.mjs`

Required invariants:

- Only explicit `stream:true` `/v1/responses` requests use the deferred bridge. `stream:false`, omitted `stream`, and invalid JSON retain direct HTTP status and JSON bodies.
- Return HTTP 200/SSE immediately with `: connected`, then emit `: keepalive` every 25 seconds while account fallback or provider headers are pending.
- Stop heartbeat immediately when provider SSE headers arrive, then pull one upstream chunk per downstream demand and preserve provider bytes exactly. This prevents comments from splitting fragmented provider events and bounds buffering.
- Convert delayed JSON/transport errors into one schema-complete `response.failed` terminal plus `[DONE]`; include `sequence_number`, request model, and required Response object fields.
- Downstream stream cancellation and inbound request abort both reach the provider `AbortController`; parent abort also closes downstream. Pre-aborted requests never start provider work. Normal completion removes the external listener and every abort/heartbeat timer.
- Client cancellation returns internal `499` without calling `markAccountUnavailable`; real provider failures retain existing account fallback.
- No gateway, proxy pool, model alias, port, credential, or tunnel registration belongs to this patch.

Verification before deployment:

- Root-cause correlation found stable tunnel health/PID while Fable provider headers arrived after 142,878-233,943 ms. Codex retried about every 125 seconds; provider jobs continued for 3-7 minutes. Several proxy header waits ended at 300,985-304,177 ms.
- Initial TDD red run covered missing heartbeat/cancellation behavior. Independent review then found five concrete gaps: heartbeat insertion inside fragmented SSE, open downstream on parent abort, eager upstream draining, incomplete failure schema, and a redundant external-abort timer. Six red assertions reproduced them before the pull-based refactor. Final review also found that omitted `stream` incorrectly entered the bridge; its route regression test failed with `text/event-stream` before the one-condition fix. Final focused matrix passes 25/25 across bridge, route gate, chat-core cleanup, Responses terminal, and Claude pairing tests.
- Full unit run passes 1,151, fails 27, and skips 24. Clean `v0.5.35` passes 1,023, fails the exact same 27 assertions in the exact same 16 files, and skips 24; P21 adds only passing tests. Changed-path ESLint and `git diff --check` pass.
- Official staged build completed in 160.8 seconds, compiled and type-checked, generated 130 routes, bundled MITM, and produced a 58 MB app. Source/candidate-bundle/candidate-DB verifier returns zero failures/warnings.
- Isolated candidate uses an integrity-checked 208 MB SQLite backup with zero nested `refreshToken` fields, no tunnel settings, and loopback-only `127.0.0.1:20129`. Real GitHub Fable returned HTTP 200 with `response.completed`; first byte arrived in 32 ms and total time was 9.88 seconds. Invalid JSON remained JSON HTTP 400; `stream:false` auth remained JSON HTTP 401; streaming auth became schema-complete SSE `response.failed` HTTP 200.
- Fresh v2 public QA first omitted candidate-only `FETCH_CONNECT_TIMEOUT_MS=180000`; the custom delayed provider therefore made three expected 60-second header attempts and the test timed out. Live runtime was untouched. Restoring the recorded test environment produced HTTP 200, first byte 232 ms, total 140.484 seconds, five keepalives, exactly one upstream request, one completion, and no `524` or reconnect.
- Public cancellation QA returned first byte in 679 ms. Client timeout left `started=1`, `active=0`, `completed=0`, `aborted=1`; cooldown, lock, backoff, error, and test-status state remained unchanged.

Deployment/upstream status:

- Candidate HOME, staged/promote app copies, delayed mock, raised-timeout build HOME, and temporary tunnel artifacts were deleted after promotion QA. Clean upstream worktree and rollback artifacts remain.
- Generic runtime/test files are isolated in clean upstream PR <https://github.com/decolua/9router/pull/2666>, branch `responses-stream-heartbeat`, head `d47cfc0`, merge state `CLEAN`. Its nine-file diff excludes private verifier, ledger, runbook, candidate data, tunnel URLs, routing, aliases, pools, DB, and deployment artifacts.
- Safe promotion completed at `2026-07-17T07:22:37Z` through the two-snapshot atomic exchange guard. PM2 is online as PID `2694238`; guarded tunnel recovery started cloudflared PID `2694503`, raw `https://holidays-heating-revenues-cathedral.trycloudflare.com`, and restored short `https://rkeyra9.abc-tunnel.us`.
- Rollback app is `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p21-responses-heartbeat-20260717-20260717T072141Z`; DB backup is `/home/home/.9router/db/backups/pre-p21-responses-heartbeat-20260717-20260717T072141Z/data.sqlite`. Both SQLite integrity checks returned `ok`.
- Live short-domain Fable probes completed in `10.72s` and `11.08s` through distinct GitHub profiles; Sol completed in `7.65s`. A 140-second public delayed-header canary returned first byte in `232ms`, emitted five keepalives, started one provider request, completed once, and produced no `524` or retry.
- Cancellation QA left one provider request aborted, zero active/completed, and no account lock/cooldown/error mutation. Final local/raw/short health and source/live-bundle/DB verifier returned zero failures and warnings.
- Fresh final short-domain probes returned Sol HTTP 200 with `890ms` first byte and `7.01s` total, and Fable HTTP 200 with `562ms` first byte and `9.17s` total. Both emitted `: connected`, `response.completed`, and the requested marker; Go gateway recorded both provider requests as HTTP 200.
- `pm2 save` persisted exactly one process with `custom-server.js`, port `20128`, `HOSTNAME=0.0.0.0`, and best-GPT `cx/gpt-5.6-sol`/`max`/`default`.
- Final review's omitted-`stream` JSON-default correction is in source commit `c743708` and upstream PR #2666, but not the already-promoted live bundle. Live Codex uses explicit `stream:true`, so the `524` heartbeat/cancellation fix is active. Carry the one-condition gate in the next planned app rebuild; do not cause a second tunnel restart solely for this non-streaming compatibility correction.

## v0.5.35 Upgrade Audit (2026-07-16)

Baseline and merge:

- Published `0.5.30` is tag/git head `9845a170`; published `0.5.35` is tag/git head `bc252ea8`. Local customized `0.5.30` was `45634a41`.
- Source/live/DB verification on customized `0.5.30` returned zero failures/warnings. Stock `0.5.30` failed 31 bundle invariants, proving deployed behavior was not the published bundle.
- `0.5.30..0.5.35` contains 27 commits, overlaps local changes in 21 files, and produced ten explicit merge conflicts. Audited merge commit is `0098d86`; upgrade design/plan commit is `c47b0f0`.
- P1-P4, P6-P9, P11-P12, and P14-P21 remain required. P5M and P10 are upstream; only dependent additions remain. GitHub Claude uses upstream native `/v1/messages`; Grok Build uses upstream protocol/model base plus local strict codec. Private aliases, proxy pools, ports, and best-GPT routing remain local.
- Source and new-bundle verifier returned zero failures/warnings. Focused patch matrix passed 273/273.
- Full merged suite passed 1,414, failed 46, pending 59. Clean `v0.5.35` passed 1,299 with the exact same 46 failures and 59 pending; merged source introduced zero new full-suite failures.
- Lint produced the same 12 React errors and two warnings in customized `0.5.30`, stock `0.5.35`, and merged source. Changed-path server/test lint remained clean apart from existing anonymous-default-export warnings.

Candidate QA:

- Final standalone candidate built in 112 seconds, generated 130 routes, bundled MITM, and measured 58 MB. Staged app is `/home/home/.openclaw/workspace-keyra/9router-candidate-v0.5.35-app-v2`.
- Candidate used a SQLite backup with integrity `ok`, zero direct/nested refresh tokens, no tunnel, and `127.0.0.1:20129` only. A restart command initially used `HOST`; Next standalone reads `HOSTNAME`, so it briefly bound `0.0.0.0`. Restart with `HOSTNAME=127.0.0.1` fixed the bind and the runbook now names the required variable.
- Usage/provider APIs returned HTTP 200. Console REST returned 200, conditional ETag returned 304, and SSE emitted immediate `init`.
- Bare GPT routed to `gpt-5.6-sol` with `max/default`. Responses Lite accepted incoming `parallel_tool_calls=true` and returned HTTP 200, proving provider wire normalization to serial tools and `reasoning.context=all_turns`.
- GitHub Opus 4.8 returned HTTP 200. Stock `0.5.35` Fable failed with `thinking.type.enabled is not supported`; Opus control passed. Red test proved Fable was classified `claude-budget`; commit `4c386b4` changes only Fable to `claude-adaptive`. Rebuilt candidate returned HTTP 200 for Fable/max.
- Grok 4.5 returned HTTP 200 through its strict residential route. Malformed input returned local HTTP 400 in 35 ms without changing model lock or last-error state.
- First 940,522-byte/463-item high-token-density Grok stress attempt reached HTTP 200 but provider stream terminated after 54 seconds and omitted the marker; it was not counted as a pass. Lower-token-density replay sent 1,084,565 bytes/463 items, recorded 134,067 input tokens, returned marker plus `response.completed` in 14.0 seconds, and kept 55 concurrent health probes at zero failures, 5.3 ms p95, 68.2 ms max.
- Candidate DB ended with integrity `ok`. Candidate PM2 process, copied credential home, old candidate app, and response artifacts were deleted; verified v2 app remains staged for promotion.

Public PR refresh:

- All existing public branches were merged normally onto `v0.5.35`; no force-push was used. Every open PR reports `CLEAN`.
- Heads: #1570 `bd21faaa`, #1819 `2be8bfd2`, #2343 `1901e4b9`, #2345 `ff1a6b6f`, #2364 `f61f8852`, #2439 `0bd3215c`, #2452 `0a509a2e`, #2453 `302a4ba8`, #2454 `1e8b904f`, #2511 `990ff251`, #2553 `2f5927ca`, #2554 `8c5fc3d7`, and #2647 `41f7a38f`.
- Conflict PR comments record retained upstream behavior and focused evidence. #2647 shrank from 19 changed files to 11 because upstream absorbed eight pieces; its focused matrix passed 73/73.
- New Fable adaptive-thinking PR is <https://github.com/decolua/9router/pull/2652> at `cdfcfc7e`; focused matrix passed 18/18 and GitHub reports `CLEAN`.
- Pre-update heads remain available as local `backup/v0535-pr-*` refs. Private ledger/runbook/verifier, aliases, pools, credentials, and deployment files were excluded from every public diff.

Deployment status:

- Pre-promotion PM2 PID was `1323261`; cloudflared PID was `1324069`; raw URL was `https://bills-genesis-rpm-prescription.trycloudflare.com`; short URL remained `https://rkeyra9.abc-tunnel.us`.
- The first detached helper used normal `MAX_ACTIVE=0`, observed one continuously active task plus intermittent second traffic, and was stopped before backup or swap. The second run used the documented `MAX_ACTIVE=1` exception, still refused two requests, required two five-second snapshots, and swapped only after the second gate was at or below one request.
- Promotion exchanged only `cli/app`, restarted PM2 once, and retained the tunnel-safe local wrapper. Local app health and all bundle invariants passed by `21:03:50Z`; PM2 is online as PID `2311000` through `app/custom-server.js`.
- The PM2 restart replaced child cloudflared PID `1324069`. Guarded recovery created PID `2311237` and raw `https://created-identifies-blades-domestic.trycloudflare.com`; raw and short health both passed by `21:04:41Z`.
- Live app, `/api/version`, PM2, retained wrapper package, and `9router --version` report `0.5.35`. `pm2 save` persisted Sol/max/default and `HOSTNAME=0.0.0.0` on port `20128`.
- Bare short-domain `gpt-5.4-mini` returned `GPT_V0535_OK` as `gpt-5.6-sol` with effort `max` and effective tier `default`. A Responses Lite request omitted context, sent incoming `parallel_tool_calls=true`, and returned `LITE_V0535_OK`, proving provider normalization remained accepted.
- Opus 4.8 and Fable 5 returned HTTP 200 through `/v1/responses`; streaming emitted `response.completed`. Stored native GitHub wire used `thinking.type=adaptive` and `output_config.effort=max` for both.
- Bare short-domain Grok 4.5 returned `GROK_V0535_OK` and streaming `response.completed` as `grok-4.5-build`. Console and stored wire confirmed `grok-cli`, strict pool `b9b6de29-4fd4-42f6-9498-7d7d41014bf3`, port `18889`, and translated effort `xhigh`.
- Malformed Grok semantic input returned local HTTP 400 immediately. Hashes of test status, error, backoff, last-error, and model-lock fields were identical before and after, proving no account lock/fallback mutation.
- Console REST returned HTTP 200 through local/raw/short paths, immediate conditional fetch returned HTTP 304, and local SSE emitted `init`. Short usage/provider APIs listed `codex`, `github`, and `grok-cli`; API-client usage returned nine tracked clients.
- Final source/live-bundle/DB/local/raw/short verifier returned zero failures and zero warnings. Live and backup SQLite integrity checks returned `ok`.
- Rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0.5.35-live-max1-20260716T210305Z-20260716T210331Z`; DB backup: `/home/home/.9router/db/backups/pre-v0.5.35-live-max1-20260716T210305Z-20260716T210331Z/data.sqlite`.

## Not Yet Verified As Local Patch

- Codex CLI helper model picker showing Claude Opus 4.8 as a canned option. Provider registry/model alias routing exists, but `src/shared/constants/cliTools.js` does not currently add `claude-opus-4.8` to the Codex helper defaults.
- Gateway tag/domain routing in `/home/home/.openclaw/gateway` and `/home/home/.openclaw/workspace-keyra/gateway`. This ledger is only for 9Router.

## Required Update Checklist

Run before every 9Router update:

- Read this ledger.
- Read `docs/UPDATE_RUNBOOK.md`.
- Confirm npm latest with `npm view 9router version`.
- Run `node scripts/verify-local-patches.mjs --root . --bundle /home/home/.npm-global/lib/node_modules/9router/app --db /home/home/.9router/db/data.sqlite`.
- Record which patch IDs are expected to change.
- Use a fresh clone for upstream PR prep if `git status` fails in this directory.
- Compare upstream `cli/cli.js` with the local tunnel-preserving wrapper; do not replace it blindly.
- Check `pm2 env 0 | rg 'NINE_ROUTER_BEST_GPT'`; target must be `cx/gpt-5.6-sol`, effort `max`, and service tier `default`.
- Confirm `src/app/api/usage/stream/route.js` does not import or call `getUsageStats`.

Run after every update/deploy:

- Verify local health: `curl -fsS http://127.0.0.1:20128/api/health`.
- Verify tunnel health only after reading current tunnel state: `cat /home/home/.9router/tunnel/state.json`.
- Do not trust tunnel-enable JSON alone after a PM2 restart. Poll raw and short health separately; if short returns 530, POST the current `shortId` and raw URL to `https://abc-tunnel.us/api/tunnel/register`, then poll again.
- Run atomic swap/restart and tunnel recovery as separate shell commands. A control-channel SIGTERM during `pm2 restart` can skip every command that follows it in the same shell.
- If startup auto-resume and `/api/tunnel/enable` overlap and both report `cloudflared killed`, disable tunnel first. If stale in-flight enables still race, launch one detached Quick Tunnel, persist its PID/state/settings, register `keyra9`, and verify short health.
- Verify `/api/version`, PM2 version, live app package version, CLI package version, and `9router --version` agree.
- Verify the original cloudflared PID still serves port `20128`.
- Send `gpt-5.4-mini` to `/v1/responses`; confirm route log, request details, response model, and usage model all resolve to `gpt-5.6-sol`, with routed effort `max`, no provider service tier, and effective tier `default`.
- Send one Responses Lite request with context omitted and confirm stored provider context is `all_turns`.
- Open Console Log through local, raw, and short URLs; local must remain on SSE and tunnel paths must populate through fallback polling.
- Observe quota countdown for at least 70 seconds through the short URL; it must decrement once per real second and refresh once.
- Confirm PM2 `pm_exec_path` ends in `app/custom-server.js` and live DB contains `apiKeyClients`.
- Send one API-key request with `X-9Router-Client-ID`; verify one Usage > API Key Clients row and matching usage tokens without storing the full IP.
- Re-run the verifier against source, bundle, and DB.
- Open Usage once and confirm `/api/usage/stream` emits only realtime fields without blocking `/api/health`.
- Save the backup path and tunnel URL in this ledger if they changed.
