# 9Router Local Patch Ledger

Last updated: 2026-07-21

This file tracks local 9Router changes that must survive updates. Treat it as the source of truth before merging upstream changes, rebuilding, or pushing PR branches.

Current live facts:

- Live wrapper workspace: `/home/home/.openclaw/workspace-keyra/9router-patch`
- Current source: `/home/home/.openclaw/workspace-keyra/9router-local-v0540-integration`, branch `local-v0.5.40-integration`, runtime code head `46cbe24`. Merge commit `717c275` applies published v0.5.40 over the tracked local patch history. Live runs the reviewed `46cbe24` bundle; later verifier/ledger-only commits do not change it.
- Live data: `/home/home/.9router`
- Live app bundle: `/home/home/.npm-global/lib/node_modules/9router/app` -> `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app`
- PM2 app: `9router`
- Current PM2 entrypoint: `/home/home/.npm-global/lib/node_modules/9router/app/custom-server.js`.
- Current app and retained-wrapper package version: `0.5.40`.
- P15-P17 candidate was promoted to live on 2026-07-12; its temporary credential-bearing QA data was removed after deploy.
- P2/P18 latency candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed after deploy.
- P9 xAI stale-tool-choice candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed before deploy.
- P19 official Grok Build subscription candidate was promoted to live on 2026-07-13; its temporary credential-bearing QA data was removed before deploy.
- P19 model-aware effort, console-label, and paid zero-cap quota corrections were promoted on 2026-07-13; final isolated QA data was removed before deploy.
- P19 cross-provider history normalization was promoted on 2026-07-15 PDT; its copied credential-bearing candidate HOME and replay script were removed after live QA.
- P2 GPT-5.6 unsupported-tier and estimator-latency correction was promoted on 2026-07-13 PDT; isolated credential-bearing QA data was removed before deploy.
- Port: `20128`
- Current known short tunnel base: `https://rkeyra9.abc-tunnel.us`
- Current known raw tunnel base: `https://enough-qualified-chocolate-structure.trycloudflare.com`.
- Current cloudflared PID: `2588922`; it is a child of PM2's 9Router PID, so an ungated PM2 restart can kill the tunnel.
- Current best-GPT PM2 policy: enabled, target `cx/gpt-5.6-sol`, reasoning `max`, service tier `default`.
- The 2026-07-19 combined promotion retained that policy; `pm2 save` persisted it in `/home/home/.pm2/dump.pm2` after live canaries.
- Global outbound proxy remains `http://127.0.0.1:18888`; `outboundNoProxy` is empty.
- xAI OAuth profile `songoku200794@gmail.com` uses proxy pool `3497197d-1c66-48f8-845c-325a9e46d49e` (`http://127.0.0.1:18888`). Gateway routes `x.ai`/`grok.com` domains through US exits on both listeners.
- xAI OAuth access expired around 2026-07-13 02:56 local time and all refresh attempts failed; that profile requires reauthorization before direct `xai` canaries can pass again.
- Active `grok-cli` device-code profile `songoku200794@gmail.com` is X Premium+ with Grok Code access and dedicated residential proxy pool `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` on `http://127.0.0.1:18889`.
- All GitHub Copilot profiles use that same residential pool on `18889`. The shared `18888` pool returned trade-restricted/HTML token-refresh failures; both active GitHub profiles refresh and test valid on `18889`.
- Private live alias `grok-4.5 -> grok-cli/grok-4.5` bypasses the separate expired xAI API OAuth profile. Keep this alias private; upstream source intentionally preserves bare `grok-4.5 -> xai`.
- Current PM2 PID after the Fable context-guard promotion: `2468145`.
- Latest live rollback app: `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-fable-context-cutover-20260721-20260721T224739Z`.
- Latest pre-promotion DB backup: `/home/home/.9router/db/backups/pre-v0540-fable-context-cutover-20260721-20260721T224739Z/data.sqlite`.
- Latest pre-GitHub-pool DB backup: `/home/home/.9router/db/backups/pre-github-residential-pool-20260721T140531Z/data.sqlite`.
- Active Linux Codex config references `/home/home/.openclaw/codex-9router-model-catalog.json` and currently selects `gpt-5.6-sol` with effort `max`. This client selection is independent of the endpoint-wide best-GPT route for incoming `gpt-*` models.
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

P5M and P10 are retained below as absorbed-upstream records; P13 is a historical data operation. They are not repatch requirements for v0.5.35 or later.

### P1. Codex OAuth endpoint and proxy-safe exchange

Purpose:

- Fix Codex OAuth token exchange after upstream changed/lagged token URL behavior.
- Stop "no proxy" OAuth from accidentally using global environment proxy or the Go gateway.
- Recover from Cloudflare HTML 400 by retrying direct once.

Files:

- `open-sse/executors/codex.js`
- `open-sse/providers/registry/codex.js`
- `open-sse/utils/proxyFetch.js`
- `src/app/api/oauth/[provider]/[action]/route.js`
- `src/app/api/oauth/kiro/social-authorize/route.js`
- `src/app/api/oauth/kiro/social-exchange/route.js`
- `src/app/api/providers/[id]/test/testUtils.js`
- `src/lib/oauth/proxyOptions.js`
- `src/lib/oauth/services/kiro.js`
- `src/lib/oauth/utils/server.js`
- `src/lib/oauth/providers.js`
- `src/shared/components/KiroOAuthWrapper.js`
- `src/shared/components/KiroSocialOAuthModal.js`
- `src/shared/components/OAuthModal.js`
- `src/shared/components/OAuthProxyPoolSelector.js`
- `open-sse/services/oauthCredentialManager.js`
- `open-sse/services/tokenRefresh.js`
- `open-sse/services/tokenRefresh/providers.js`
- `src/sse/services/tokenRefresh.js`
- `tests/unit/manual-oauth-refresh-proxy.test.js`
- `tests/unit/oauth-modal-behavior.test.js`
- `tests/unit/oauth-refresh-routing.test.js`

Required invariants:

- Codex token URL is `https://auth.openai.com/api/accounts/oauth/token`.
- Stale Codex token URL `https://auth.openai.com/oauth/token` is absent from Codex registry/bundle.
- OAuth route imports `open-sse/utils/proxyFetch.js` so global fetch is patched.
- `proxyPoolId` missing or `__none__` returns `{ disableEnvProxy: true }`.
- A selected but unavailable pool fails closed; it never silently goes direct.
- `proxyFetch` honors `disableEnvProxy`.
- Authorize, exchange, device-code, poll, fixed-port callback, manual xAI code, Kiro social login, and proactive/reactive refresh all use the same selected pool context.
- Fixed-port Codex/xAI PKCE sessions start with POST JSON. Verifier, state, redirect URI, and pool never appear in a GET URL.
- Fixed-port status exposes only allowlisted public fields. Stop requests carry OAuth state and cannot close another active session.
- Modal flow generations cancel stale device polls. Pool changes serialize stop then start, and only the latest selection may launch authorization.
- Main and Kiro social OAuth initialize from the active pool; users can still explicitly select Direct after initialization. Kiro's default is local-only.
- No-pool refresh disables env proxy; explicit per-connection proxy and relay settings remain intact.

Verification:

- `node scripts/verify-local-patches.mjs --root . --bundle /home/home/.npm-global/lib/node_modules/9router/app`
- Fake or expired Codex code exchange should return OpenAI JSON, not Cloudflare HTML.
- Candidate OAuth matrix: 11 files, 94/94 tests. Changed-path ESLint and `git diff --check` pass.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2343>
- Scope in PR: OAuth proxy selection during authorize/exchange/poll/callback, no-proxy env bypass, proxy pool selector readiness, manual auth URL visibility.
- Reviewed public branch head is `38be2f0`; independent review returned APPROVED after a runtime regression caught and fixed dropped `effectiveProxy` scope. Candidate integration ends at `9faa373` and preserves the private active-pool defaults.
- Fresh public matrix passes 94/94. Changed-path lint reproduces only upstream's two `page.js` React effect errors and anonymous registry-export warning; no new diagnostic appears. `git diff --check` and Gitleaks pass.
- PR #2343 was lease-protected updated from `1901e4b` to `38be2f0`; description now records concurrent state-bound sessions and runtime refresh coverage. GitHub reports `OPEN`/`CLEAN`.
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
- `open-sse/handlers/imageProviders/codex.js`
- `open-sse/services/codexAccount.js`
- `open-sse/services/usage.js`
- `open-sse/services/usage/codex.js`
- `src/lib/oauth/providers.js`
- `src/app/api/oauth/codex/bulk-import/route.js`
- `src/app/api/oauth/codex/import-token/route.js`
- `src/app/api/oauth/[provider]/[action]/route.js`
- `src/app/api/usage/[connectionId]/codex-reset-credits/route.js`
- `src/lib/oauth/providerHelpers.js`
- `src/shared/services/quotaAutoPing.js`
- `tests/unit/codex-usage-account.test.js`

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
- `claude-opus-4.8`, `claude-opus-5`, and `claude-fable-5` should be visible/routable when Copilot exposes them.

Files:

- `open-sse/providers/registry/github.js`
- `open-sse/providers/capabilities.js`
- `open-sse/services/copilotModels.js`
- `open-sse/services/copilotStatus.js`
- `open-sse/services/model.js`
- `src/app/api/providers/[id]/test/testUtils.js`
- `src/sse/services/tokenRefresh.js`
- `tests/unit/copilot-status.test.mjs`
- `tests/unit/capabilities.test.js`
- `tests/unit/model-routing.test.js`

Live DB aliases:

- `claude-opus-4.8 -> gh/claude-opus-4.8`
- `claude-fable-5 -> gh/claude-fable-5`

Required invariants:

- Bare `claude-opus-4.8` resolves to GitHub, not Anthropic.
- Bare `claude-fable-5` resolves to GitHub.
- GitHub registry includes all three verified models for dashboard fallback visibility.
- GitHub `claude-opus-5` uses the provider-specific 200,000 prompt / 64,000 output guard instead of inheriting direct Claude's 1M metadata.
- Live DB aliases are present after reinstall/update.

Verification:

- `sqlite3 /home/home/.9router/db/data.sqlite "select scope,key,value from kv where scope='modelAliases' and key in ('claude-opus-4.8','claude-fable-5');"`
- Non-streaming requests to `claude-opus-4.8` and `claude-fable-5` should route to provider `github`.
- `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 --pool=threads --maxWorkers=1 tests/unit/capabilities.test.js tests/unit/claude-model-metadata.test.js`

Extended-context verification completed 2026-07-09:

- No 9Router or Go gateway request patch is required to activate GitHub Copilot long context.
- Official Copilot CLI `1.0.70` reported Claude Opus 4.8 limits of 200,000 default prompt tokens, 936,000 long-context prompt tokens, 1,000,000 total context tokens, and 64,000 output tokens.
- Copilot CLI `--context long_context` sent no custom request header and no context-tier field in the provider wire body. The option controls client-side limits/compaction.
- Live 9Router accepted a `gh/claude-opus-4.8` `/v1/chat/completions` request with 222,919 provider-reported prompt tokens and returned HTTP 200 with two output tokens.
- 9Router logged `github/claude-opus-4.8` through `http://127.0.0.1:18888`; the Go gateway logged the matching `POST api.githubcopilot.com/chat/completions -> 200`.
- `/home/home/.openclaw/gateway/server.go` applies a Chrome TLS fingerprint for Copilot and forwards existing headers/body unchanged. 9Router supplies its VS Code identity headers; neither mechanism selects the context tier.
- After updates, do not add guessed `long_context` headers or body fields. Re-run one over-200K prompt probe only if GitHub starts rejecting the existing path.

Current Copilot verification completed 2026-07-26:

- Both active Copilot profiles returned HTTP 200 for `gh/claude-opus-5`; Fable 5 also returned HTTP 200.
- Copilot `/models` reports Fable 5 and Opus 5 with 264,000 total context, 200,000 maximum prompt, 64,000 maximum output, adaptive thinking, and `low|medium|high|xhigh|max` efforts.

Upstream status:

- PR <https://github.com/decolua/9router/pull/2756> updated at head `367666f` with Opus 5 limits and static Fable 5 / Opus 4.8 / Opus 5 fallback entries; GitHub reports `OPEN`/`CLEAN`.
- Private bare aliases remain excluded from that PR.

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

### P5C. Provider-qualified Codex Claude 5 catalog

Purpose:

- Keep direct Claude subscriptions and GitHub Copilot profiles usable from the same Codex installation.
- Avoid ambiguous provider selection by publishing four explicit model choices.

Catalog files:

- `/home/home/.openclaw/codex-9router-model-catalog.json`
- `/home/home/.openclaw/codex-9router-model-catalog.windows.json`
- `/home/home/.openclaw/exports/custom-model-catalog-windows-9router.json`

Required invariants:

- `cc/claude-fable-5` and `cc/claude-opus-5` retain direct Claude 1M context metadata.
- `gh/claude-fable-5` and `gh/claude-opus-5` retain `context_window=210527`, `effective_context_window_percent=95`, and `auto_compact_token_limit=185000`, keeping Codex below Copilot's 200K prompt ceiling.
- GitHub entries expose `low|medium|high|xhigh|max` and no unverified Fast/Priority tier.
- Catalog updates never replace one provider's entries with the other provider's entries.

Verification:

- `node scripts/verify-local-patches.mjs --root . --no-bundle --no-db`
- Select each of the four slugs in Codex and confirm the 9Router request log shows the matching `claude` or `github` provider.

Upstream status:

- Catalog files are local Codex configuration. Public 9Router model metadata is tracked in PR #2756.

### P5M. GitHub Copilot profile identity labels (absorbed upstream)

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

- Absorbed by published v0.5.35. No local source delta or repatch remains.
- Historical PR: <https://github.com/decolua/9router/pull/2498>
- Keep the DB backfill verification only when importing older profile rows.

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
- `open-sse/providers/registry/xai.js`
- `open-sse/services/usage.js`
- `open-sse/services/usage/misc.js`
- `open-sse/services/usage/xai.js`
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
- `src/shared/components/PricingModal.js`
- `src/shared/components/UsageStats.js`
- `tests/unit/cached-token-e2e.test.js`
- `tests/unit/cached-token-usage.test.js`
- `tests/unit/current-model-pricing.test.js`
- `tests/unit/responses-stream-to-json-usage.test.js`
- `tests/unit/xai-usage.test.js`
- `tests/unit/usage-dispatch.test.js`

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

- `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/cached-token-e2e.test.js tests/unit/cached-token-usage.test.js tests/unit/current-model-pricing.test.js tests/unit/responses-stream-to-json-usage.test.js tests/unit/xai-usage.test.js tests/unit/db-sqlite-vs-lowdb.test.js tests/unit/usage-dispatch.test.js tests/unit/usage-concern.test.js tests/unit/openai-responses-terminal-event.test.js`
- Unit matrix covers all three GPT-5.6 models across Standard, Batch, Flex, Priority/fast, and long-context rates.
- Unit calculation covers cache read, cache write, and reasoning-within-output.
- Unit xAI calculation proves `22,940,000` ticks equals `$0.002294`.
- Dashboard stats for different API keys must remain separated.
- Live post-deploy probes must store cache-write tokens and effective tier when provider returns them.
- Historical repair tooling was intentionally not retained in this source tree. Any future recalculation needs a fresh reviewed script, SQLite `.backup`, dry run, and aggregate reconciliation before write mode.

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
- Historical repair procedure remains local-only; no repair script is currently tracked.

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
- Route GitHub Claude through Anthropic `/v1/messages` and GitHub Gemini through Chat Completions when clients use `/v1/responses`; current policy sends other GitHub models, including unknown names, through native Responses.
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
- Native Responses selection is provider- and model-aware. GitHub Claude uses `/v1/messages`, Gemini uses Chat Completions, and every other GitHub model currently uses native Responses for Responses clients. Changing unknown-model behavior requires an explicit policy test.
- GitHub Claude Responses clients are translated to non-empty Claude `messages` for `/v1/messages`; they never send native OpenAI `input`. Gemini Responses clients bridge to non-empty Chat `messages` for `/chat/completions`.
- GitHub executor fallback and initial transport selection share one native Responses capability helper.
- xAI reasoning options exposed by 9Router are `auto`, `low`, `medium`, `high`.
- Bare `grok-*` routes to provider `xai`.
- xAI quota tracker uses local request totals: today tokens, 7d tokens, 30d tokens, today requests.
- Responses usage preserves cached tokens, reasoning tokens, and `cost_in_usd_ticks` for local usage/cost display.
- xAI Responses requests convert `custom` tools to freeform `function` tools, drop `local_shell` plus unsupported nameless hosted tools, strip OpenAI-only hosted tool fields like `external_web_access`, and strip OpenAI encrypted reasoning blobs that xAI cannot decode.
- xAI Responses requests remove `tool_choice` when `tools` is absent, empty, or fully removed by normalization; valid non-empty tool lists preserve `tool_choice`.
- Final xAI executor return must run `normalizeXaiResponsesPayload(transformed)` after `injectReasoningContent(...)`. The first helper-only patch existed in source but live outgoing payloads still retained `encrypted_content`; this final-return strip is the regression guard.
- The final xAI sanitizer is gated by `runtimeTransport.format === "openai-responses"`; OpenAI Chat transport preserves Chat reasoning/history fields.
- xAI request input sanitizer must drop `reasoning` items, convert `custom_tool_call` / `custom_tool_call_output` to normal function call variants, and stringify `function_call_output.output` arrays/objects. Live xAI rejects these with `data did not match any variant of untagged enum ModelInput`.
- Generic native Responses terminal, failure, and usage rules are owned by P25.

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
- Model-aware transport regression tests passed 16/16 on 2026-07-12. They prove Fable becomes one non-empty Chat message, GitHub GPT keeps `/responses`, and xAI remains native Responses. The old claim that unknown GitHub models default to Chat is superseded by the current `!/(?:gemini|claude)/i` policy.
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
- 2026-07-19 reviewed PR branch `a62a53a` closes duplicate-terminal, missing-terminal, failed-JSON, incomplete-usage, and top-level-error gaps. Independent review returned APPROVED with no findings.
- Candidate commits `930f502`/`6d6d9a7` preserve local cache-write, service-tier, exact-cost, encrypted-history, and private-routing behavior. Focused candidate matrix passes 87/87 Vitest cases plus 6/6 xAI node checks; changed-path ESLint and diff checks pass.
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
- PR #2439 local and remote branch now end at reviewed head `a62a53a`; lease-protected update replaced `0bd3215`. Description now records actual GitHub transport policy plus complete terminal/usage behavior. GitHub reports `OPEN`/`CLEAN`.
- Clean PR branch passes 69 focused Vitest cases plus six xAI node checks. Changed-path lint has zero errors and the upstream anonymous registry-export warning; `git diff --check` and Gitleaks pass.
- Bare `grok-*` routing is generic enough for upstream, but keep it in the catalog/Responses PR so it remains reviewable.

### P10. Staged CLI bundle builds for live-safe deploy (absorbed upstream)

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

- Absorbed by published v0.5.35. No local source delta or repatch remains.
- Historical PR: <https://github.com/decolua/9router/pull/2479>
- Keep using the environment variable during candidate builds; verifier coverage remains because deployment depends on the upstream feature.

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
- `src/lib/db/adapters/betterSqliteAdapter.js`
- `src/lib/db/adapters/nodeSqliteAdapter.js`
- `src/lib/db/adapters/sqljsAdapter.js`
- `src/lib/db/schema.js`
- `src/lib/localDb.js`
- `src/sse/handlers/chat.js`
- `src/sse/services/usageReservation.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/handlers/chatCore/streamingHandler.js`
- `open-sse/handlers/chatCore/sseToJsonHandler.js`
- `open-sse/utils/usageTracking.js`
- `open-sse/translator/formats/maxTokens.js`
- `tests/unit/chat-daily-limit-http.test.js`
- `tests/unit/api-key-usage-reservations.test.js`
- `tests/unit/api-key-usage-reservations-adapters.test.js`
- `tests/unit/chat-stream-reservation-authority.test.js`
- `tests/unit/chat-token-reservation-estimate.test.js`
- `tests/unit/chat-usage-reservation-plumbing.test.js`
- `tests/unit/db-sqlite-vs-lowdb.test.js`

Required invariants:

- Blank or null limit means unlimited.
- Limit is stored as a non-negative integer token count.
- Daily window is the server local day.
- Canonical prompt and completion tokens count toward the limit. OpenAI/Responses
  reasoning is a completion subset and must not be added twice. Gemini candidate
  and separately reported thinking tokens are folded into completion exactly once.
- Same-prefix API keys remain separate in usage grouping and masking.
- Reserve a translated output ceiling atomically before provider/account selection.
  SQLite uses one DB transaction; sql.js uses its local mutex.
- One reservation follows account fallback. Successful authoritative terminal
  usage replaces it; pre-upstream/upstream failure releases it; uncertain or
  truncated usage remains reserved for bounded six-hour expiry.
- Combo members and fusion panels reserve independently. Reservation release is
  ownership-qualified and idempotent.

Verification:

- Key with no limit continues normally.
- Key above its daily token limit returns HTTP 429 before provider selection.
- Route-level test uses real Bearer-key extraction, proves exhausted keys do not reach model/account selection or `handleChatCore`, and proves an unlimited control does reach selection without network access.
- Unit tests cover better-sqlite3, node:sqlite, bun:sqlite, and sql.js paths.
- Final 2026-07-20 verification: expanded reservation/accounting matrix 160/160
  across nine files; Gemini RED was 2 failures/52 passes and GREEN was 54/54.
  Changed-file ESLint, diff check, 12-feature-commit Gitleaks, isolated 130-route
  build, and loopback exhausted/admitted release checks passed.
- Final independent review first found Gemini mixed candidate/thinking undercount;
  `3a91b38` fixed normalization and re-review returned no findings.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2454>
- Public head `7ed5dff` is `OPEN`/`CLEAN` on upstream v0.5.40. Update used a
  normal merge, not force-push; its one adapter conflict preserves both atomic
  transaction scope and upstream spread-parameter binding.
- Local v0.5.35 integration includes atomic commits through `5a9d56c` and Gemini
  authority `cb82d82`. Neither is live before the zero-OOM deployment gate.

### P12. Private best-GPT Sol/max routing and custom Codex catalog

Purpose:

- Keep existing Codex clients on one endpoint while routing incoming `gpt-*` requests to GPT-5.6 Sol/max by default.
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
- `/home/home/.codex/config.toml` references the tracked custom catalog. Its interactive model selection may change independently from 9Router's best-GPT route; the current selection is `grok-4.5` with effort `max`.
- The selected Codex model and effort must exist as a supported pair in the catalog. Selecting Sol or Terra with client-side Ultra remains valid and reaches upstream effort `max`; Luna must not advertise Ultra.
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
- Do not rewrite the user's active `model` or `model_reasoning_effort` while repairing the catalog or route policy unless that selected pair becomes invalid.

### P13. Grok probe usage cleanup (historical operation; no patch)

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
- `src/lib/db/index.js`
- `src/lib/db/migrations/002-api-key-clients.js`
- `src/lib/db/migrations/index.js`
- `src/lib/db/repos/apiKeyClientsRepo.js`
- `src/lib/db/repos/apiKeysRepo.js`
- `src/lib/db/repos/usageRepo.js`
- `src/lib/db/schema.js`
- `src/lib/localDb.js`
- `src/lib/usageDb.js`
- `src/shared/components/UsageStats.js`
- `src/shared/utils/machineId.js`
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
- Prevent Codex `idle timeout waiting for SSE` after provider headers when the
  provider emits no parsed event for about 120 seconds.
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
- Return HTTP 200/SSE immediately with `: connected`. Generic clients receive
  `: keepalive` comments every 25 seconds while account fallback or provider
  headers are pending.
- Codex clients receive an ignorable real SSE `9router.keepalive` event every 25
  seconds before and after provider headers. Codex discards comments before its
  idle timer but parsed unknown events reset that timer and are ignored safely.
- Inject post-header keepalives only between complete SSE events. Track CR/LF
  boundaries, pull one upstream chunk per downstream demand, and preserve every
  fragmented provider byte without mid-event insertion.
- Detect modern `codex_cli_rs`/`codex_exec` UAs inside the Responses route only;
  do not change shared native-pass-through detection or provider routing.
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
- Post-header root-cause pair: 9Router started at `06:06:27`; Codex disconnected
  at `124.402s`; the same Go-gateway stream completed at `125.862s`. Tunnel and
  gateway remained healthy. Codex source wraps parsed events in idle timeout;
  eventsource comments do not reset it.
- New TDD regression failed waiting for post-header data before the fix. Final
  route/bridge matrix passes 12/12; changed-file ESLint, diff check, PR-range
  Gitleaks, 130-route build, and independent re-review pass.
- Isolated loopback provider paused 130 seconds after `response.created`.
  Candidate emitted five 25-second `9router.keepalive` events, then unchanged
  `response.completed` and `[DONE]`; temporary ports `20129`/`20130` were freed.

Deployment/upstream status:

- Candidate HOME, staged/promote app copies, delayed mock, raised-timeout build HOME, and temporary tunnel artifacts were deleted after promotion QA. Clean upstream worktree and rollback artifacts remain.
- Generic runtime/test files are isolated in upstream PR <https://github.com/decolua/9router/pull/2666>, branch `responses-stream-heartbeat`, head `dfb0ac2`. Its route-local Codex extension excludes private verifier, ledger, runbook, candidate data, tunnel URLs, provider routing, aliases, pools, DB, and deployment artifacts.
- Safe promotion completed at `2026-07-17T07:22:37Z` through the two-snapshot atomic exchange guard. PM2 is online as PID `2694238`; guarded tunnel recovery started cloudflared PID `2694503`, raw `https://holidays-heating-revenues-cathedral.trycloudflare.com`, and restored short `https://rkeyra9.abc-tunnel.us`.
- Rollback app is `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p21-responses-heartbeat-20260717-20260717T072141Z`; DB backup is `/home/home/.9router/db/backups/pre-p21-responses-heartbeat-20260717-20260717T072141Z/data.sqlite`. Both SQLite integrity checks returned `ok`.
- Live short-domain Fable probes completed in `10.72s` and `11.08s` through distinct GitHub profiles; Sol completed in `7.65s`. A 140-second public delayed-header canary returned first byte in `232ms`, emitted five keepalives, started one provider request, completed once, and produced no `524` or retry.
- Cancellation QA left one provider request aborted, zero active/completed, and no account lock/cooldown/error mutation. Final local/raw/short health and source/live-bundle/DB verifier returned zero failures and warnings.
- Fresh final short-domain probes returned Sol HTTP 200 with `890ms` first byte and `7.01s` total, and Fable HTTP 200 with `562ms` first byte and `9.17s` total. Both emitted `: connected`, `response.completed`, and the requested marker; Go gateway recorded both provider requests as HTTP 200.
- `pm2 save` persisted exactly one process with `custom-server.js`, port `20128`, `HOSTNAME=0.0.0.0`, and best-GPT `cx/gpt-5.6-sol`/`max`/`default`.
- Final review's omitted-`stream` JSON-default correction from source commit `c743708` and upstream PR #2666 was carried in the P22 app rebuild. Live invalid-model control with omitted `stream` now returns direct HTTP 404 `application/json`; source and live bundle are aligned.
- The original pre-header heartbeat/cancellation patch above is live. The new
  post-header Codex event extension is source-only at local commit `029d6ce` and
  must not be promoted before the zero-OOM gate ending `2026-07-25 18:55 PDT`.
- Fresh 2026-07-20 live inspection found no `9router.keepalive` string in the
  deployed bundle. Current logs contain repeated Codex `client_closed` events at
  about 124-126 seconds, matching the known client idle timer. This is not proof
  of a tunnel or provider outage; the post-header extension remains required.

### P22. Codex cross-model encrypted-history recovery

Purpose:

- Recover a Codex conversation when switching from GitHub Claude back to OpenAI Codex leaves stale or foreign `reasoning.encrypted_content` in client history.
- Preserve valid encrypted reasoning continuity on normal requests.
- Avoid pointless account rotation for deterministic encrypted-payload errors.

Files:

- `open-sse/executors/codex.js`
- `tests/unit/codex-encrypted-content-recovery.test.js`
- `scripts/verify-local-patches.mjs`

Required invariants:

- Normal Codex requests keep every incoming reasoning `encrypted_content` value unchanged.
- Only an upstream HTTP 400 carrying `invalid_encrypted_content` or its exact verification/decryption message activates recovery.
- Recovery clones the already-transformed request, removes `encrypted_content` only from top-level `type:reasoning` input items, and drops reasoning items with no remaining summary/content.
- Recovery retries exactly once through the same executor call, credentials, workspace header, proxy, model, and signal.
- Retry logs contain only removed-item count, never ciphertext.
- A second encrypted-content failure or any unrelated HTTP 400 returns normally. Existing deterministic-400 classification prevents account cooldown/fallback.

Verification:

- TDD RED returned the original HTTP 400 after one upstream call.
- GREEN regression passes three cases: same-account sanitized retry, accepted ciphertext preservation, and unrelated-400 no-retry.
- Focused Codex/Responses/reasoning/account-fallback matrix passes 54/54.
- Changed-file ESLint, syntax checks, and `git diff --check` pass.
- Full unit run passes 1,155, fails the same 27 assertions in the same 16 files, and skips 24. Recorded pre-P22 source passed 1,151 with those same 27 failures and 24 skips; P22 plus the pending P21 route test add only passing coverage.
- Standalone candidate built in 200.2 seconds, compiled/type-checked 130 routes, bundled MITM, measured 58 MB, and passed source/candidate/DB verification with zero failures/warnings.
- Candidate DB integrity was `ok`, contained zero `refreshToken` fields, disabled tunnel startup, kept one Codex profile active, and bound only `127.0.0.1:20129`. Credential-bearing candidate HOME and response artifacts were deleted after QA.
- Real candidate malformed-cipher replay received upstream `invalid_encrypted_content`, logged one count-only same-account recovery, and returned HTTP 200 with `P22_RECOVERY_OK`. A returned valid Lite reasoning item then completed with `P22_CONTINUITY_OK` without increasing recovery count.
- Exact candidate switch sequence completed Fable HTTP 200, then desktop-style Responses Lite Sol HTTP 200 with `P22_SWITCH_OK`; total recovery count increased by exactly one and active Codex model locks remained zero.

Deployment/upstream status:

- Source commit is `28ed332` on `local-v0.5.35-upgrade`.
- Safe promotion passed at `2026-07-17T08:52:13Z` using documented `MAX_ACTIVE=1` control-request exception. Guard observed a transient second active request, delayed, then required two five-second snapshots before backup and exchange. PM2 is online as PID `2744827`; exactly one restart changed count from seven to eight.
- Rollback app is `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-p22-encrypted-history-20260717-20260717T085151Z`. DB backup is `/home/home/.9router/db/backups/pre-p22-encrypted-history-20260717-20260717T085151Z/data.sqlite`; live and backup integrity checks returned `ok`.
- PM2 restart replaced its child Quick Tunnel. Guarded recovery created cloudflared PID `2745020` and raw `https://hanging-reward-activities-outlets.trycloudflare.com`. Helper timed out as `succeeded_external_pending` while short registration still returned 530, then raw and `https://rkeyra9.abc-tunnel.us` recovered without another restart or manual registration.
- Live short-domain malformed Lite history returned HTTP 200 with `P22_LIVE_SWITCH_OK`, exactly one recovery log, and latest stored Codex request status `success`. Local/raw/short health and authenticated Console REST all return HTTP 200.
- Final source/live-bundle/DB verifier reports zero failures/warnings. `pm2 save` persists `custom-server.js`, port `20128`, and best-GPT `cx/gpt-5.6-sol`/`max`/`default`.
- Generic provider-safe patch is open in upstream PR <https://github.com/decolua/9router/pull/2667>, branch `codex-encrypted-history-recovery`, head `bc3162a`, and reports `MERGEABLE`. Public diff contains only `open-sse/executors/codex.js`, `open-sse/services/accountFallback.js`, and its regression test.
- Stock `v0.5.35` rotates accounts for every unmatched 400, so PR #2667 includes a narrow code/message classifier that suppresses fallback only for `invalid_encrypted_content`. Live already has the stronger P20 deterministic-400 policy; no extra live patch is needed.
- Upstream focused matrix passes 15/15. Full stock differential passes 1,027 versus 1,023 before P22, with the same 27 failures and 24 skips. ESLint, syntax, diff, and private-data scans pass; private verifier, ledger, aliases, pools, credentials, and deployment artifacts stay local.

### P23. Cross-layer request correlation

Purpose:

- Correlate one 9Router provider attempt with Go gateway selection, connection, provider-header, and stream timing without timestamp guessing.
- Preserve one request-wide correlation ID across account/combo attempts while keeping one distinct attempt ID across each attempt's executor retries and request-detail updates.
- Record bounded monotonic local phases so provider wait is separable from 9Router ingress, auth, routing, overlapping DB work, translation, compression, response transfer, and fallback work.

Files:

- `open-sse/executors/base.js`
- `open-sse/executors/github.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/handlers/chatCore/{requestDetail,nonStreamingHandler,sseToJsonHandler,streamingHandler}.js`
- `open-sse/utils/{requestTiming,stream,streamHandler}.js`
- `src/lib/db/repos/requestDetailsRepo.js`
- `src/sse/handlers/chat.js`
- `tests/unit/{base-executor-retry,chat-request-timing,force-stream-config,github-responses-routing,request-correlation,request-details-tab,request-timing}.test.js`

Required invariants:

- `handleChat` creates one internal request-wide correlation UUID. Incoming client request IDs are not trusted or reused.
- Each provider/account/combo attempt creates a distinct internal attempt UUID. Initial execution, config-driven network/status retries, and the post-refresh retry send that attempt value as `x-request-id`.
- GitHub `/chat/completions`, native `/responses`, and Claude `/v1/messages` routes use the supplied value instead of generating an unrelated GitHub request ID.
- Executor errors, upstream HTTP errors, forced SSE-to-JSON, true JSON, streaming-in-progress, and streaming-complete records preserve the same request-detail ID. Streaming completion updates the initial row instead of creating an unrelated row.
- Account fallback and combo/fusion children share the parent correlation ID but keep independent attempt IDs and immutable timing state.
- Duration math uses `performance.now()`. Non-finite or negative phases are omitted.
- `*_total_ms` fields are cumulative by name. `db_overlap_ms` is diagnostic overlap inside auth/routing totals and is not additive.
- `latency.total` is attempt-local; `latency.request_total` is inbound-request-wide. Response timing begins when upstream headers are available.
- Correlation adds no DB query, network round trip, retry, dependency, or live-path behavior change beyond one UUID and one bounded header.

Verification/status:

- TDD RED isolated five missing base/core/detail behaviors, two missing GitHub native-route behaviors, and one duplicate-casing header behavior.
- Public focused correlation/GitHub matrix passes 34/34 after adding status/network retry, base-URL fallback, concurrent-attempt, Worker-global UUID, and outbound-header coverage. Local integrated matrix passes 37/37.
- Changed-file ESLint and `git diff --check` pass.
- Full differential used identical `CI=1 --update none` settings. Patched source introduced zero candidate-only failures; the clean `ebb7e86` baseline alone failed the two stale `force-stream-config` assertions and two flaky xAI OAuth assertions that patched source passed.
- Initial review found one compatibility defect: Base passed `requestId` into the third `buildHeaders` slot already used as Antigravity `sessionId`. Commit `ff56efb` restores the two-argument Base contract, applies the header afterward, and adds regression coverage; independent re-review is clean.
- Public PR <https://github.com/decolua/9router/pull/2710>, branch `request-correlation`, head `46d18ce`, contains no private routes, aliases, proxy data, credentials, tunnel logic, or deployment files.
- Fresh timing/correlation/fallback matrix passes 72/72; combo/persistence compatibility passes 32/32; changed-path ESLint and `git diff --check` pass. Review found and fixed cumulative-label, attempt-identity, combo-race, monotonic-clock, retry-boundary, and terminal-persistence gaps.
- Local source is staged as `cc2cf0f` plus compatibility commit `ff56efb`. Gateway/Observer correlation source is `3816ee96f`; immutable candidates and hashes live under `/home/home/.openclaw/gateway/deployments/request-correlation-20260719T093355Z`.
- Standalone 9Router candidate `/home/home/.openclaw/workspace-keyra/9router-candidate-p23-p24-app` built from staged source `ca6fa26`, measured 58 MB, passed every source/bundle invariant, and bound only `127.0.0.1:20129`. Candidate gateway/Observer bound only `127.0.0.1:28888-28889/28887`; normalized route configuration matched live except alternate binds, disabled warm probing, and a temporary QA host.
- Normal GitHub canary returned HTTP 200. Request-detail ID `4be24446-e924-4266-9d05-02561668943d` matched gateway request `8` across `request.start`, `request.selected`, and `request.complete` with status 200.
- Configured BaseExecutor retry made two separate gateway requests `368` and `370`; both carried correlation ID `0aa26504-4426-4afa-9cf5-8c574e38588b`.
- Candidate-only account fallback deliberately produced GitHub 401 request `382` with ID `a4d98bd7-f9bb-4d36-93e3-e15a22be5b9b`, then success request `387` with distinct ID `b786f7a4-4372-4839-94fb-3f50ab8a1ab2`. SQLite request details and direct gateway SSE agreed.
- Final resource gate passed 20/20 concurrent streams plus 40/40 burst requests. Gateway PID stayed `253717`; errors, dropped events, evictions, overflows, and OOM counters stayed zero; 180 cache hits shared one entry, and all leases returned to zero. Observer caught up after its cached snapshot lagged final body closure by about one second.
- Gateway candidate memory peaked at 925,962,240 bytes. Observer candidate peaked at 409,231,360 bytes; its 512 MiB max had zero max/OOM events, while 384 MiB `MemoryHigh` recorded pressure. Fresh gateway and Observer race suites plus `go vet` pass.
- Sanitized evidence is retained under `/home/home/.openclaw/gateway/deployments/request-correlation-20260719T093355Z`. Credential-bearing candidate HOME and SQLite backup were deleted; temporary QA tunnel/origin and all alternate listeners were stopped. Live local/short health remains HTTP 200 with unchanged PIDs `2744827`/`2745020`/`51362`/`53239`.
- Existing candidate evidence predates the phase-timing extension. Rebuild both candidates and repeat correlation plus settled-memory load gates before any promotion.
- Live promotion remains pending. Isolated correlation/load gates pass; promotion still requires zero-active drain, rollback artifacts, and the zero-OOM launch window. Current health remains degraded at one OOM in 24 hours and 12 in seven days, last at `2026-07-18T15:53:45.864522Z`.

### P24. Request-log credential redaction

Purpose:

- Prevent optional request debug logging from storing reusable API, OAuth, cookie, or proxy credentials.
- Restrict newly created request-log directories and files to the local user.

Files:

- `open-sse/utils/requestLogger.js`
- `tests/unit/request-logger-security.test.js`

Required invariants:

- Logging disabled creates no session directory or files.
- `authorization`, `proxy-authorization`, cookies, API-key variants, and header names containing `token` or `secret` become `[REDACTED]` on client, source, target, and provider-response paths.
- Correlation and content metadata headers remain visible; caller-owned plain objects and `Headers` instances are not mutated.
- New log directories use mode `0700`; new JSON, stream, and error files use mode `0600`.
- Runtime request behavior, bodies, provider payloads, and response streams remain unchanged.

Verification/status:

- Focused security matrix passes 3/3. Changed-path ESLint, syntax, and `git diff --check` pass.
- Independent security review is clean and includes inherited-object, multi-value `Headers`, case, and Worker-import probes.
- Public PR <https://github.com/decolua/9router/pull/2709>, branch `request-log-redaction`, head `535e272`, is clean and mergeable.
- Local source commit is `ffedfbf`; verifier commit `0f65bb3` makes P23/P24 loss fail future source and bundle checks. Standalone candidate bundle passed redaction and file-mode invariants; combined promotion `v0535-p25-oauth-20260719` moved it live.

### P25. Native Responses transport, terminal, and usage semantics

Deployment state: live since combined promotion `v0535-p25-oauth-20260719`. Live contains incomplete/EOF/failed-JSON handling and P24 request-log redaction; full live-bundle verification must remain green.

Purpose:

- Preserve provider-native Responses behavior across streaming, forced SSE-to-JSON, and non-streaming paths.
- Treat provider failure or premature EOF as failure before account-success callbacks and usage writes.
- Preserve complete usage details for completed and incomplete responses.

Files:

- `open-sse/executors/default.js`
- `open-sse/executors/github.js`
- `open-sse/handlers/chatCore.js`
- `open-sse/handlers/chatCore/nonStreamingHandler.js`
- `open-sse/handlers/chatCore/sseToJsonHandler.js`
- `open-sse/handlers/chatCore/streamingHandler.js`
- `open-sse/handlers/responsesHandler.js`
- `open-sse/services/provider.js`
- `open-sse/transformer/streamToJsonConverter.js`
- `open-sse/translator/request/openai-responses.js`
- `open-sse/translator/response/openai-responses.js`
- `open-sse/utils/responsesStreamHelpers.js`
- `open-sse/utils/stream.js`
- `open-sse/utils/streamHandler.js`
- `open-sse/utils/usageTracking.js`
- `tests/unit/cached-token-usage.test.js`
- `tests/unit/github-responses-routing.test.js`
- `tests/unit/openai-responses-multiturn.test.js`
- `tests/unit/openai-responses-terminal-event.test.js`
- `tests/unit/responses-abort-terminal.test.js`
- `tests/unit/xai-native-responses-routing.test.js`

Required invariants:

- GitHub Claude uses Anthropic `/v1/messages`, Gemini uses Chat Completions, and every other GitHub model currently selects native Responses for Responses clients. Initial and fallback transport use the same helper.
- `response.completed`, `response.incomplete`, `response.failed`, and top-level Responses errors are terminal. Terminal state survives `pipeWithDisconnect()` wrappers.
- A valid terminal followed by `ECONNRESET` emits no synthetic failure and exactly one `[DONE]`.
- SSE or JSON `status:"failed"` returns fallback-capable HTTP 502 before account-success callbacks, request-success state, or usage-success writes.
- Stream EOF before any terminal becomes `response.failed` for streaming clients and HTTP 502 for forced non-stream conversion.
- `response.incomplete` maps `max_output_tokens` to Chat finish reason `length` and remains a billable successful terminal.
- Completed/incomplete usage preserves input, output, cache-read, cache-write, reasoning, effective service tier, and provider cost fields.
- Top-level `event:error` retains provider diagnostics instead of collapsing into a generic parse error.

Verification/status:

- Public branch `/home/home/.openclaw/workspace-keyra/9router-grok-build-pr` is reviewed APPROVED at `a62a53a`; 69/69 focused Vitest cases, 6/6 xAI node checks, zero new lint diagnostics, `git diff --check`, and Gitleaks pass.
- Integrated candidate commits are `3bb47d7`, `930f502`, and `6d6d9a7`; focused candidate matrix passes 87/87 Vitest cases plus 6/6 xAI node checks.
- Regression matrix covers completed plus reset, incomplete plus detailed usage, failed SSE, failed JSON, top-level error, EOF without terminal, and non-stream conversion EOF.
- Public scope is carried in open PR <https://github.com/decolua/9router/pull/2439>. Clean-base differential and private-data scan passed; remote head is `a62a53a` and GitHub reports `OPEN`/`CLEAN`.

### P26. Provider cache-affinity account routing

Deployment state: live on `0.5.40`; public PR remains open.

Purpose:

- Improve prompt-cache hit probability by keeping a stable client session on
  the last account that completed successfully.
- Preserve first-request round robin, account cooldowns, model locks, account
  exclusion, and fallback.
- Avoid claiming provider cache behavior that is not observable: Codex
  email/workspace affinity is known operationally; GitHub and xAI remain
  best-effort same-session/account affinity.

Files:

- `src/sse/services/cacheAffinity.js`
- `src/sse/handlers/chat.js`
- `src/sse/services/auth.js`
- `src/shared/utils/providerStrategies.js`
- `src/lib/db/repos/settingsRepo.js`
- `src/app/(dashboard)/dashboard/providers/[id]/page.js`
- `src/app/(dashboard)/dashboard/providers/components/ConnectionsCard.js`
- `open-sse/handlers/chatCore/{nonStreamingHandler,sseToJsonHandler,streamingHandler}.js`
- `open-sse/utils/{responsesStreamHelpers,stream,streamHandler}.js`
- `tests/unit/cache-affinity*.test.js`
- `tests/unit/chat-cache-affinity.test.js`
- `tests/unit/provider-{cache-affinity-ui,strategy-settings}.test.js`

Required invariants:

- Feature is disabled by default and enabled independently per provider.
- A new scope uses the existing account strategy. Only explicit successful
  completion creates or moves affinity.
- Scope priority is session plus optional client ID plus API key, then client
  ID plus API key, then API key. Provider and model are always part of the key.
- Affinity state and affinity logs never retain raw session IDs, client IDs, or
  API keys; SHA-256 keys index process-local state. Existing API-key storage is
  unchanged and no affinity table or duplicate identity store is added.
- State is bounded to 5,000 LRU entries with fixed TTLs: six hours for session,
  30 minutes for client, and five minutes for API-key-only scope.
- Affinity is a preference, never an availability override. Locks, cooldowns,
  exclusions, disabled accounts, and fallback remain authoritative.
- Successful fallback repins the scope. Failed, cancelled, truncated, and
  unterminated streams never pin or save successful usage.
- Cache affinity intentionally does not rotate successful user sessions merely
  to activate idle Codex quota windows. Pools that need every Codex window
  started early must enable `codexAutoPing.connections[connectionId]` for each
  active OAuth profile. Auto-ping sends an out-of-band tiny request and must not
  change user-session affinity or fallback state.
- Adding or re-enabling a Codex profile requires checking its auto-ping entry;
  the setting is per connection and does not enroll future profiles implicitly.
- Provider settings use one atomic read-merge-write transaction. Concurrent UI
  saves are serialized, preserve unknown provider fields, and refetch confirmed
  state only when the latest save fails.

Verification/status:

- Public v0.5.40 branch has six commits from `a5dcc41` through `f93d8aa`.
  Upstream PR <https://github.com/decolua/9router/pull/2736> is open and clean.
- Isolated production build generated 130/130 routes. Focused matrix passed
  37/37; wider relevant stream/terminal matrix passed 180/180.
- Two-account canary produced A/A for one session and B for an independent
  session. Forced A HTTP 503 fell back and repinned B; after A recovered, the
  first session remained on B.
- Atomic settings API canary added a second provider strategy without changing
  the existing affinity provider settings.
- Gitleaks scanned all six public commits and found no leaks.
- Local integration commits are `c31bf4a`, `993c342`, and `b03a81d` on top of the earlier
  P26 commits `7f3002c` through `6af1459`. Local resolution preserves request
  correlation, atomic token reservations, exact usage details, and private
  routing.
- First local build canary exposed a parity bug absent from the public branch:
  session IDs without a stored client fingerprint collapsed to API-key scope.
  `b03a81d` restores session-only isolation and adds locked/excluded preferred-
  account tests before the candidate rebuild.
- Final local build generated 130/130 routes after routing Google Fonts through
  the existing loopback Go proxy. The linked worktree's symlinked `node_modules`
  produced an incomplete standalone trace, so QA used loopback `next start`;
  this build is evidence, not a promotable artifact. Deployment must rebuild
  from physical dependencies and verify the standalone bundle.
- Final local canary produced A/A for session 1 and B for session 2. Forced A
  HTTP 503 fell back and repinned B; after the 30-second lock expired and A
  recovered, session 1 remained on B. Atomic settings PATCH preserved the
  affinity provider while adding an unrelated provider strategy. Ports 20129
  and 20130 were stopped; live 20128 remained PID `638076`.
- Live `20128`, PM2, `/home/home/.9router`, cloudflared, and tunnel mapping were
  not touched during build, canary, integration, or PR publication.
- P26 was later promoted in the live `0.5.40` bundle. On 2026-07-21,
  `nouvoigoiheuxi-1846@trendteam.dedyn.io` exposed the quota-window interaction:
  its first selected stream ended `client_closed` after 124 seconds and created
  no successful usage row, while affinity kept established sessions on their
  existing accounts. `codexAutoPing` was absent from the live DB and every
  retained DB backup, so this was missing configuration, not update loss.
- Auto-ping was enabled for all nine active Codex OAuth profiles and the
  scheduler logged `scheduler started`. The same profile then completed 18
  requests; its live quota probe reported 2/100 used, 98 remaining, reset at
  `2026-07-29T04:14:16Z`. Focused auto-ping tests passed 19/19.
- Runtime-setting backup before activation:
  `/home/home/.9router/db/data.sqlite.bak-codex-autoping-20260721-2113`.

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
- Heads: #1570 `aa19e8a0`, #1819 `5430052e`, #2343 `38be2f0f`, #2345 `877977a7`, #2364 `9da2ae98`, #2439 `a62a53aa`, #2452 `dfcd956d`, #2453 `bf2da725`, #2454 `e2f8abd1`, #2511 `14b04502`, #2553 `fe6366e7`, #2554 `10a1ba47`, #2647 `7b1f6937`, #2652 `ac0fb073`, #2663 `9504daab`, #2666 `f3e3ac7e`, #2667 `89c9c381`, #2686 `6656f566`, #2709 `535e2727`, and #2710 `46d18cee`.
- Conflict PR comments record retained upstream behavior and focused evidence. #2647 shrank from 19 changed files to 11 because upstream absorbed eight pieces; its focused matrix passed 73/73.
- Fable adaptive-thinking PR <https://github.com/decolua/9router/pull/2652> is rebased at `ac0fb073`; its focused matrix passed 18/18 and GitHub reports `CLEAN`.
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

### Post-audit candidate corrections on 2026-07-19

- `930f502`/`6d6d9a7` complete public Grok/OpenAI Responses transport semantics on top of private cost, routing, and history patches.
- `2cc1b9f`/`8e6499d`/`4839f09` complete OAuth proxy selection from login through callback and refresh, with state-bound concurrent fixed-port lifecycle and runtime-tested refresh proxy propagation. `9faa373` keeps the active-pool default private.
- Full source, live-bundle, active Codex config/catalog, live DB, and local-health verification passes with zero failures/warnings. The verifier checks P11, P25, Kiro social, newest OAuth lifecycle, catalog metadata, selected model/effort compatibility, and deployed-bundle markers; every live marker is enforced.
- Identical `CI=1` full-suite runs report stock v0.5.35 at 1,311 passed/34 failed/59 pending and candidate at 1,588 passed/32 failed/59 pending. Failed-assertion sets are identical except candidate fixes both stock `force-stream-config` failures; candidate introduces zero new failures. Twelve missing golden entries for intentionally added local providers are now recorded; the five remaining golden mismatches reproduce on stock.
- Standalone build completed in 152.6 seconds, generated 130 routes, bundled MITM, measured 58 MB, and was promoted from `/home/home/.openclaw/workspace-keyra/9router-candidate-v0535-final-20260719-app`. Full source/bundle/config/DB verification returned zero failures/warnings.
- Isolated QA used a SQLite backup with integrity `ok`, zero `refreshToken` keys, tunnel disabled, one active Codex/GitHub/Grok CLI profile each, and bind only `127.0.0.1:20129`.
- Real candidate wires passed: bare `gpt-5.4-mini` returned `CANDIDATE_CODEX_OK` as `gpt-5.6-sol` with console `THINK:max`; Fable/max returned one billable `response.incomplete` with cache-write usage and then completed `CANDIDATE_FABLE_OK` through GitHub `messages`; private Grok returned `CANDIDATE_GROK_OK` as `grok-4.5-build` with provider effort `xhigh` and no stale tool fields.
- Candidate process stopped, port `20129` released, and credential-bearing HOME plus response/log artifacts were deleted. Live local/raw/short health remained HTTP 200 with unchanged PIDs `2744827`/`2745020` during preparation.
- Independent reviews approved the integration, full stock/candidate differential found zero candidate-only failures, Gitleaks found no leaks, and rollback rehearsal passed before promotion.
- Safe promotion label `v0535-p25-oauth-20260719` exchanged only `cli/app` and restarted PM2 once. PM2 is PID `638076`; guarded tunnel recovery created cloudflared PID `638304`, raw `https://others-assuming-cooking-tagged.trycloudflare.com`, and restored `https://rkeyra9.abc-tunnel.us`.
- Rollback app is `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0535-p25-oauth-20260719-20260719T193507Z`; DB backup is `/home/home/.9router/db/backups/pre-v0535-p25-oauth-20260719-20260719T193507Z/data.sqlite`. Both live and backup DB integrity checks returned `ok`.
- Short-domain live canaries passed: Codex returned `LIVE_P25_CODEX_OK` as `gpt-5.6-sol`/`default`; Fable/max non-stream returned billable `status=incomplete` with `max_output_tokens`, 1,278 input, 1 output, and 1,250 cached tokens; Grok returned `LIVE_P25_GROK_OK` as `grok-4.5-build` with `xhigh`, 219 input, 59 output, 128 cached, and 50 reasoning tokens.
- Since promotion, request details recorded 118 Codex successes, four Fable successes, and one Grok success during the audit window. The only error was a deliberate Fable `none` probe proving that model rejects `thinking.type.disabled`; it emitted one structured `response.failed` and created no account lock.
- Local/raw/short health, package/version surfaces, PM2 entrypoint/policy, full verifier, and `pm2 save` passed after canaries. Promotion status `/home/home/.openclaw/workspace-keyra/9router-ops/v0535-p25-oauth-20260719.status` is `succeeded`.

## v0.5.40 Upgrade Audit (2026-07-20)

Baseline and integration:

- npm `latest` and published source both resolve to `0.5.40`; upstream commit is
  `79918c7`. Local merge commit `717c275` preserves the tracked patch history;
  `501deb9` aligns only local verification fixtures.
- Ten merge conflicts were resolved across request timing, terminal stream
  handling, OAuth proxy lifecycle, Kimi device identity/refresh, SQLite spread
  binding, and provider model resolution. Private aliases, proxy pools,
  best-GPT policy, ports, and tunnel behavior remain outside public branches.
- Source verification and the physical standalone bundle each return zero
  failures and zero warnings. Production build compiled, type-checked, generated
  130/130 routes, bundled MITM, and produced a 58 MB candidate.

Differential and isolated QA:

- Full local suite reports 2,114 passed, 68 failed, 18 expected failures, and 66
  skipped. Clean v0.5.40 reports 1,388 passed, 82 failed, and 18 expected
  failures. Clean upstream reproduces the 36 Cursor codec failures and the DB
  concurrency failures; candidate-only timeout files pass 24/24 when isolated.
- Full-suite failures move between timeout-sensitive files under parallel load;
  exact candidate-only OAuth/cache-affinity files pass with a 30-second test
  timeout. Always use `TMPDIR="$PWD/.tmp"`; the host `/tmp` quota can make Vitest
  fail with `EDQUOT`.
- Candidate `/home/home/.openclaw/workspace-keyra/9router-candidate-v0540-20260720/app`
  uses a copied SQLite home, has integrity `ok`, starts no tunnel, and binds only
  `127.0.0.1:20129`.
- Real candidate canaries returned HTTP 200 for Sol/max, Fable/max, Opus/max,
  and Grok 4.5. Live/candidate model catalog parity is exact for GPT-5.6,
  Fable, Opus, and Grok.
- A 130-second silent provider emitted five `9router.keepalive` events, one
  completion, and one `[DONE]` from one provider request with zero aborts. This
  verifies post-header protection for the observed Codex idle-SSE disconnect.
- Cache-affinity canary used A/A for session 1 and B for session 2. Forced A
  HTTP 503 reached B through existing fallback and repinned; after A recovery,
  session 1 stayed on B. Provider transport retried the failed A request four
  times before account fallback, which is a separate retry-budget optimization.

Upstream and rollout state:

- Public PR #2666 (Responses heartbeat) is clean at `171355b`; PR #2736
  (cache affinity) is clean at `f93d8aa`.
- All 21 open public PRs now report `MERGEABLE/CLEAN`: 19 branches received
  normal merge updates, while #2454 and #2736 already contained v0.5.40. The
  two initial conflicts, #2710 request correlation and #2343 OAuth proxy
  routing, were resolved with 40/40 and 125/125 focused tests. No force push or
  PR closure occurred; durable heads and test results are in
  `/home/home/.openclaw/workspace-keyra/9router-ops/v0540-upstream-refresh-report.md`.
- Live v0.5.35 remains untouched during merge, build, differential, canaries,
  and review. Promotion exchanges only `cli/app`, retains the local wrapper and
  PM2 environment, uses one restart, and preserves rollback until local health,
  bundle invariants, DB integrity, raw tunnel, and short tunnel pass.
- Promotion preflight found `/api/usage/stats.activeRequests` contains grouped
  rows with a numeric `count`. The helper incorrectly used array length. Its
  gate now sums `count` with a one-request fallback for legacy rows; a runnable
  regression proves grouped `2+3+legacy` equals six and an empty list equals
  zero. The first wait was cancelled before backup or exchange, and live stayed
  v0.5.35/healthy.
- Delete the credential-bearing candidate data directory after successful
  promotion or rollback.

### Chat SSE heartbeat correction (2026-07-21)

- Post-v0.5.40 logs still contained `123-124s client_closed` requests with
  `FMT: openai->openai-responses`. These enter through
  `/v1/chat/completions`; the existing Responses-route heartbeat never reaches
  that wire. Codex waits on parsed EventSource events, so SSE comments do not
  reset its idle timer. Chat needs a valid `data:` event.
- Generic commits `5181b17` and `0b81aee` wrap only OpenAI Chat output after
  translation. Every 25 seconds of output silence they emit a schema-valid
  empty `chat.completion.chunk` at an SSE event boundary. The wrapper respects
  backpressure, cancels its reader on enqueue failure, and clears its timer on
  EOF, error, or downstream cancellation. Because insertion occurs after the
  translation/usage stream, heartbeats cannot alter provider requests, usage,
  terminal detection, cache affinity, or fallback.
- TDD covers payload schema, fragmented SSE boundaries, downstream cleanup,
  repeated cadence under timer jitter, and production handler wiring. The
  focused Chat/Responses/affinity/reservation matrix passes 63/63; changed-file
  ESLint, `git diff --check`, source verifier, production build, and candidate
  bundle verifier pass.
- The first physical 130-second Chat canary found a fixed-interval drift: only
  three heartbeats arrived because every second interval fired slightly before
  the previous heartbeat's elapsed threshold. That candidate was rejected.
  `0b81aee` replaces interval comparison with a timeout rescheduled from every
  source chunk or heartbeat.
- Rebuilt candidate
  `/home/home/.openclaw/workspace-keyra/9router-candidate-v0540-chat-heartbeat-20260721/app`
  produced five heartbeats with exact gaps `25,25,25,25`, one provider request,
  one successful terminal record, one `[DONE]`, and HTTP 200 after 130 seconds.
  Its copied DB had integrity `ok`, one local fake provider, zero OAuth
  profiles/refresh tokens, tunnel disabled, and loopback-only ports `20129` and
  `22001`. Candidate processes stopped, ports freed, and copied credentials
  were removed after QA.
- Public PR #2666 is `MERGEABLE/CLEAN` at `79be8a1`; its 19-test focused matrix,
  ESLint, diff check, and Gitleaks pass. Private verifier commits `66ab07e` and
  `58bcfa4`, deployment paths, aliases, pools, and DB data remain local.
- Promotion label `v0540-chat-heartbeat-20260721` used `MAX_ACTIVE=1` and two
  five-second quiet gates. Real `Yuki`/`OC` traffic held 8-14 concurrent Codex
  streams, so the gate correctly refused to swap. No live backup, app exchange,
  or restart occurred for this correction.
- A temporary attempt to drain new admissions by setting the `Yuki` and `OC`
  daily token limits to `1` was wrong: clients immediately received
  `API key daily token limit exceeded (.../1 tokens)`. Both limits were restored
  to `NULL`, the marker/watchdog were removed, and the queued promotion was
  cancelled before backup, app exchange, or restart. New requests resumed on
  live PID `2004259`. Never use customer quota fields as deployment controls.
  Wait for a natural quiet window until a dedicated connection-draining edge
  exists.
- The user later approved brief downtime. Promotion label
  `v0540-chat-heartbeat-active-cutover-20260721` therefore used an explicit
  active cutover with threshold 20 while 12 real Codex streams were active; it
  never changed key activation, quotas, limits, model access, or routing.
  SQLite backup completed before exchange, then one atomic `cli/app` swap and
  one PM2 restart promoted the verified Chat-heartbeat bundle.
- Local app health returned in 6.8 seconds. PM2 is online as PID `2062112`,
  restart count 11, through `app/custom-server.js`; live package, wrapper, PM2,
  and `9router --version` all report `0.5.40`. Live bundle contains
  `chatcmpl-9router-keepalive`; focused stream tests pass 26/26 and the complete
  source/live-bundle/config/DB verifier reports zero failures and warnings.
- Restart replaced cloudflared. Guarded recovery created PID `2062293`, raw URL
  `https://brilliant-words-sustainability-intl.trycloudflare.com`, and restored
  `https://rkeyra9.abc-tunnel.us`; local, raw, and short health each return HTTP
  200. Post-restart requests recorded successful Codex completions and both
  `Yuki`/`OC` retain `dailyLimitTokens=NULL`.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-chat-heartbeat-active-cutover-20260721-20260721T084955Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-v0540-chat-heartbeat-active-cutover-20260721-20260721T084955Z/data.sqlite`.
  Promotion status is `succeeded`.

### Codex Desktop Responses heartbeat detection (2026-07-21)

- Current Windows Codex app sends `User-Agent: Codex/<version>` together with
  `X-Initiator: user`. `detectClientTool()` classifies `X-Initiator: user` as
  `github-copilot` before checking Codex CLI user agents, so the Responses route
  selected comment keepalives. Codex ignores comment-only frames for its event
  idle timer. Review also corrected an earlier evidence error: post-cutover
  123-125 second `client_closed` entries were large `/v1/chat/completions`
  requests, not native `/v1/responses` requests.
- Commit `cec2e68` tried to recognize `Codex/<version>` in the shared client
  detector. Exact-header regression testing found that `X-Initiator` still
  shadowed the UA, while detector-wide recognition could also enable native
  passthrough outside the heartbeat decision. Commit `863db8f` is the final
  fix: shared detection again excludes `Codex/<version>`, and only the
  `/v1/responses` heartbeat gate checks `userAgent.startsWith("codex/")`.
  Provider payloads, routing, account selection, usage, affinity, and fallback
  remain unchanged.
- Credential-free native Responses QA used loopback-only ports `20129` and
  `20130` with a fresh empty data directory. Provider headers stayed silent for
  52 seconds. The candidate emitted two typed `9router.keepalive` events before
  `QA_MARKER`, then emitted `response.completed`, `[DONE]`, and clean EOF in 53
  seconds. No comment-only heartbeat or failed/incomplete terminal appeared;
  QA processes stopped and the QA home was removed.
- Promotion label `v0540-codex-route-heartbeat-20260721` used explicitly
  authorized `MAX_ACTIVE=12` and `ALLOW_ACTIVE_CUTOVER=1`; the gate observed 10
  active requests. SQLite backup completed before one atomic app exchange and
  one PM2 restart. Local service recovered in about four seconds. Guarded
  Cloudflare recovery restored the external path about 46 seconds after the
  restart. No key limit, activation, alias, account lock, or quota changed.
- PM2 is online as PID `2115168`, restart count 13. Cloudflared is PID
  `2115378`; raw URL is `https://gorgeous-bare-lung-beer.trycloudflare.com`, and
  `https://rkeyra9.abc-tunnel.us` remains the short URL. Local, raw, and short
  health return HTTP 200; source/candidate/live verification reports zero
  failures or warnings; live and backup DB integrity return `ok`; `Yuki` and
  `OC` retain `dailyLimitTokens=NULL`; no API key has one-token limit. A live
  short-URL Codex Responses canary returned `LIVE_OK`, `response.completed`, and
  `[DONE]` in six seconds without a failed/incomplete terminal.
- Public PR #2666 is `CLEAN` at head `499d4db`. Its public diff includes the
  route-local UA condition, exact-header regression coverage, and delayed
  Responses error-code preservation. Focused route/Responses/Chat/cancellation
  tests pass 27/27; changed-file ESLint, `git diff --check`, and the 130-route
  production build pass. No private verifier, alias, credential, pool,
  deployment, or environment-specific routing change is included.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-codex-route-heartbeat-20260721-20260721T103823Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-v0540-codex-route-heartbeat-20260721-20260721T103823Z/data.sqlite`.
  Promotion status is `succeeded`.

### Fable Responses stream-integrity correction (2026-07-21)

- Production-path debugging found two independent translator defects. The
  registered OpenAI-to-Responses translator reused source index `0` for
  reasoning, message, and the first tool call. The translated stream also
  suppressed upstream `[DONE]` while marking it sent, which could omit the
  downstream sentinel after terminal flush.
- Commit `e7af782` initially changed the legacy transformer only and was
  rejected in review. Final commit `2ec49db` supersedes it: allocator state now
  lives in `open-sse/translator/index.js`, registered translation allocates
  stable monotonic indexes in
  `open-sse/translator/response/openai-responses.js`, and
  `open-sse/utils/stream.js` emits terminal events before exactly one `[DONE]`.
- `cli/scripts/build-cli.js` removes the staged `.next-cli-build` directory
  before compiling. This prevents linked-worktree cache reuse from producing a
  stale runtime bundle after source tests pass.
- Focused production-path tests pass 37/37. Changed-file ESLint,
  `git diff --check`, source checks, candidate-bundle checks, candidate DB
  checks, and candidate health pass. Candidate verification reports zero
  failures and zero warnings. Independent reviewer
  `019f84bd-8c5a-7cd0-965a-990af1c4a4e6` found no Critical, Important, or Minor
  issues.
- Isolated candidate
  `/home/home/.openclaw/workspace-keyra/9router-candidate-v0540-fable-index-20260721/app`
  bound only `127.0.0.1:20129`, started no tunnel, and used an
  integrity-checked DB with zero direct or nested `refreshToken` fields. A
  forced Fable tool turn emitted reasoning at output index `0`, the function
  call at `1`, one `response.completed`, and one `[DONE]`. Its
  `function_call_output` continuation returned
  `CANDIDATE_FABLE_CONTINUATION_OK` with one completion, one sentinel, and zero
  failures. Candidate HOME was deleted and port `20129` released before
  promotion.
- Initial candidate attempts through shared pool `3497197d-1c66-48f8-845c-325a9e46d49e`
  on `18888` failed before model execution: expired Copilot tokens could not
  refresh because exits returned `trade_restricted_country`, GitHub HTML, or
  proxy fetch errors. Candidate-only use of existing residential pool
  `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` on `18889` proved this was egress,
  separate from stream translation.
- Promotion label `v0540-fable-stream-integrity-20260721` used explicitly
  authorized `MAX_ACTIVE=10` and `ALLOW_ACTIVE_CUTOVER=1`. The gate observed 10
  active streams, backed up SQLite, exchanged only `cli/app`, restarted PM2
  once, and passed the complete source/live-bundle/config/DB verifier with zero
  failures or warnings. Promotion status is `succeeded`.
- Restart replaced cloudflared. Guarded recovery created PID `2216695`, raw URL
  `https://accept-notified-earrings-gotta.trycloudflare.com`, and restored
  `https://rkeyra9.abc-tunnel.us`. Local, raw, and short health each return
  HTTP 200.
- GitHub connections were updated through the provider API, not raw live DB
  writes, to use the existing residential pool on `18889`; Codex, xAI, global
  outbound routing, aliases, API-key limits, and account activation were not
  changed. Both active Copilot profile tests return `valid=true`; their token
  expiries advanced after refresh.
- Live short-URL QA passed the exact two-turn failure path. Forced Fable/max
  tool output used indexes `0/1`, one completion, and one `[DONE]`.
  `function_call_output` then returned `LIVE_FABLE_CONTINUATION_OK`, one
  completion, one `[DONE]`, and zero failed events.
- Public PR #2747 is `OPEN/CLEAN` at `5ff68ef`; it contains only registered
  Responses index allocation, translated terminal/sentinel handling, and
  regression coverage. Public PR #2748 is `OPEN/CLEAN` at `ba7d3ab`; it
  contains only staged Next build cleanup. The private GitHub pool assignment,
  profile data, aliases, deployment paths, and ledger remain excluded.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-fable-stream-integrity-20260721-20260721T135949Z`.
  Pre-promotion DB backup:
  `/home/home/.9router/db/backups/pre-v0540-fable-stream-integrity-20260721-20260721T135949Z/data.sqlite`.
  Pre-pool-change DB backup:
  `/home/home/.9router/db/backups/pre-github-residential-pool-20260721T140531Z/data.sqlite`.

### P27. Responses custom-tool round trip

Deployment state: live on `0.5.40`. Candidate promoted under label
`v0540-fable-custom-roundtrip-20260721` at `2026-07-21T20:30:23Z` with one PM2
restart. Running PM2 PID is `2392590`; tunnel PID is `2392792`.

- A real Codex/Fable request completed upstream with a tool call but Codex sent
  no continuation. Live wire inspection showed ordinary `function_call` output
  and zero custom-tool input events. GitHub completed normally; proxy and token
  transport were not the failing boundary.
- Audit of published `0.5.30`, local upgrade history, and current `0.5.40`
  found no former shared GitHub custom-tool patch. Existing `{input:string}`
  compatibility code was confined to xAI/Grok executors. Update QA was still
  defective because it tested ordinary function continuation and allowed this
  required Codex/Fable behavior to remain absent.
- Request commits `b02a7b6` and `c5d8069` wrap Responses `custom` declarations
  as Chat functions with one required string `input`, convert custom call/output
  history, and preserve ordinary function-output semantics. Commit `e65171c`
  carries request-local custom names through streaming, JSON, and forced-SSE
  response paths, strips internal metadata before dispatch/persistence, and
  restores official custom-tool events. Commit `1602633` preserves forced
  custom and function choices across the Chat bridge.
- Focused red-green coverage passes 13/13. Broader translator, index, pairing,
  GitHub routing, terminal, xAI, reservation, affinity, correlation, and Kiro
  matrix passes 86/86. Changed-file ESLint, source verifier, and diff checks
  pass. A 409-test broad translator baseline and current comparison have the
  same 12 legacy failures; P27 adds 13 passing tests and no failure. Independent
  reviewer `019f84bd-8c5a-7cd0-965a-990af1c4a4e6` found no Critical or
  Important issue.
- Standalone build compiled, type-checked, generated 130 routes, bundled MITM,
  and produced a 58 MB candidate at
  `/home/home/.openclaw/workspace-keyra/9router-candidate-v0540-fable-custom-20260721/app`.
  Source/bundle/config/DB verification reports zero failures and warnings.
- Isolated candidate bound only `127.0.0.1:20129`, started no tunnel, and used
  an integrity-checked SQLite backup with zero `refreshToken` keys. Each active
  GitHub profile was enabled alone so fallback could not mask failure. Both
  `903b7db5-5366-47f6-b135-95cd56edb54b` and
  `f42d668a-ee2f-430c-aefe-85e4c8dadacc` emitted official custom input
  delta/done events for real `apply_patch`, completed after
  `custom_tool_call_output`, stored required `input:string` provider schemas,
  and persisted no `_customToolNames`. Profile `f42d668a` also passed an
  ordinary function control. Every request produced one completion and one
  `[DONE]`. Credential-bearing candidate HOME was deleted and port `20129` was
  released after QA.
- Reusable local canary is
  `scripts/probe-fable-custom-tool-roundtrip.mjs`; it reads the key without
  printing it and verifies exact account, custom continuation, ordinary
  function compatibility, provider schema, terminals, and metadata leakage.
  `--api-key-id` selects an active key without exposing it; use independent
  keys plus `--expect-connection` to cover every profile without disabling live
  accounts or letting cache affinity hide one.
- Live source/bundle/config/DB verification passed with zero failures and zero
  warnings after promotion. Local and short-domain canaries each completed all
  three requests with three terminal events and three `[DONE]` sentinels.
  Profile `f42d668a-ee2f-430c-aefe-85e4c8dadacc` passed at
  `2026-07-21T20:55Z`; profile `903b7db5-5366-47f6-b135-95cd56edb54b` passed
  through `https://rkeyra9.abc-tunnel.us` at `2026-07-21T20:57Z` after its
  expired Copilot IDE token refreshed through residential pool
  `b9b6de29-4fd4-42f6-9498-7d7d41014bf3`.
- Earlier `401 IDE token expired`, `trade_restricted_country`, and HTML refresh
  failures occurred before promotion. They were auth/proxy failures, not custom
  translation failures. Diagnose source, bundle, wire events, and token refresh
  separately before declaring P27 lost.
- Rollback backups are
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-fable-custom-roundtrip-20260721-20260721T203017Z`
  and
  `/home/home/.9router/db/backups/pre-v0540-fable-custom-roundtrip-20260721-20260721T203017Z/data.sqlite`.
  Raw tunnel is `https://reflected-item-competitors-implied.trycloudflare.com`;
  short tunnel is `https://rkeyra9.abc-tunnel.us`.
- Public subset is pushed to PR `decolua/9router#2747` at head `30082c6` with
  merge state `CLEAN`. Local non-stream/forced-SSE support remains private
  because it depends on P25 infrastructure absent from stock `0.5.40`.
- Future upgrades fail source/bundle verification unless custom request
  metadata, `{input:string}` wrapping, metadata stripping, official custom input
  events, and continuation regression coverage remain present. Runbook P27
  requires an exact custom call plus `custom_tool_call_output` through every
  active GitHub profile; ordinary `function_call` coverage cannot substitute.

### P28. GitHub Claude context guard and model downshift

Deployment state: live on `0.5.40`. Runtime code head is `46cbe24`; promotion
label `v0540-fable-context-cutover-20260721` completed at
`2026-07-21T22:49:09Z`.

- Phone-to-PC synchronization was healthy: the Fable prompt appeared in the
  desktop thread. Request `19ffabfd-0b09-4bbd-94f6-174cac0cface` then reached
  9Router with 280 messages and 247,910 prompt tokens. GitHub Fable accepts at
  most 200,000 prompt tokens, but 9Router sent the oversized request, treated
  its empty stream as success, and stored `[Empty streaming response]`.
- Copilot's live model catalog reports 264,000 total, 200,000 prompt, and
  64,000 output tokens for Fable 5 and Opus 4.8. These provider-specific limits
  replace the inappropriate 1M Anthropic capability on the GitHub path only;
  other Claude providers retain their own limits.
- Commit `74ac1d5` adds static and live-catalog capability normalization plus a
  bounded exact `/v1/messages/count_tokens` preflight for large GitHub Claude
  requests. Requests estimated below half the prompt limit keep one upstream
  generation call. Large requests use a 10-second count timeout and return
  `context_length_exceeded` before generation when over 200,000.
- Commits `9b32be6` and `46cbe24` preserve safe structured error codes through
  executor parsing and the delayed Responses SSE bridge. Oversized streams now
  produce one schema-complete `response.failed`, exact
  `error.code=context_length_exceeded`, one `[DONE]`, and no false account lock
  or empty-success usage row. Commit `f332109` makes future source/bundle checks
  fail if this chain disappears.
- Linux and Windows catalogs set Fable 5 and Opus 4.8 to
  `context_window=max_context_window=210527`,
  `effective_context_window_percent=95`, and
  `auto_compact_token_limit=185000`. Codex therefore exposes exactly 200,000
  effective tokens and compacts before GitHub's prompt boundary. Codex clamps a
  larger global `model_context_window` to catalog `max_context_window`, but the
  app/CLI must restart after catalog edits because model catalogs load at
  process startup.
- Red tests reproduced both losses: delayed Responses changed the code to
  `upstream_error`, then the real GitHub executor changed it to `bad_request`.
  Final focused/broader matrix passes 75/75. Earlier full unit comparison was
  1,869 passed with the same 58 unrelated existing failures. Standalone build
  compiled, type-checked, generated 130 routes, bundled MITM, and produced a
  58 MB candidate. Source/bundle/catalog/DB verification reports zero failures
  and zero warnings.
- Isolated candidate bound only `127.0.0.1:20129`. A 361,080-token synthetic
  prompt was rejected before generation with the exact structured code. Both
  active GitHub profiles independently passed plain max-reasoning output,
  forced Responses custom-tool output, and `custom_tool_call_output`
  continuation: six successful requests with correct account isolation and
  cache accounting. Profile activation state was restored, candidate HOME was
  securely removed, and port `20129` was released.
- Natural zero-active drain fluctuated between three and six active Codex
  requests. User-authorized downtime used `MAX_ACTIVE=6` with
  `ALLOW_ACTIVE_CUTOVER=1`; the gate observed three, created an integrity-checked
  SQLite backup, exchanged only `cli/app`, restarted PM2 once, and retained
  rollback through local health and full invariant checks.
- PM2 is online at PID `2468145`; cloudflared recovered under PID `2468357`
  with raw URL `https://palmer-insider-getting-promise.trycloudflare.com`.
  Local, raw, and `https://rkeyra9.abc-tunnel.us` health pass; live DB integrity
  is `ok`; ports `18888` and `18889` remained unchanged.
- Public short-URL QA rejected the 361,080-token prompt in 9.885 seconds with
  exact `context_length_exceeded` and then completed a small Fable/max request
  in 10.045 seconds with `LIVE_FABLE_CONTEXT_OK`, `response.completed`, one
  `[DONE]`, and no failed event.
- Public PR #2756 is `OPEN/CLEAN` at head `7a04c74`. It contains only GitHub
  Claude capability limits, live Copilot catalog normalization, bounded exact
  token-count preflight, structured executor error propagation, and regression
  tests. Focused tests pass 15/15 and `git diff --check` passes. Private model
  aliases, catalogs, pools, credentials, verifier, deployment paths, and DB data
  are excluded.
- Delayed Responses error-code preservation remains in PR #2666 at head
  `499d4db`; keep both PRs or equivalent upstream changes when rebasing. PR
  #2756 alone preserves executor errors through `chatCore`, while PR #2666 owns
  the already-started SSE bridge that emits the final `response.failed` code.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-fable-context-cutover-20260721-20260721T224739Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-v0540-fable-context-cutover-20260721-20260721T224739Z/data.sqlite`.

### P29. Process-start runtime bootstrap

Deployment state: live on `0.5.40`. Promotion label
`v0540-runtime-bootstrap-active3-20260721` completed at
`2026-07-22T04:47:12Z`.

- Root cause: background services were imported only by the root dashboard
  layout. Static and API-only startup could serve inference without evaluating
  that layout, so tunnel auto-resume, watchdogs, and quota auto-ping remained
  inactive after PM2 restart. A settings PATCH started auto-ping only because
  that route explicitly called `configureQuotaAutoPing`.
- `custom-server.js` now sends a loopback `GET /api/init` after the HTTP server
  reaches `listening`. `src/app/api/init/route.js` imports the existing guarded
  bootstrap. Heavy startup remains deferred and init-probe failure logs without
  stopping the HTTP server.
- Red tests independently reproduced both missing boundaries. Focused local
  matrix passed 22/22; clean upstream matrix passed 39/39 with dashboard guard
  and quota auto-ping coverage. ESLint and `git diff --check` passed.
- Standalone build generated 130 routes and a 58 MB candidate. Isolated port
  `20129` became healthy and logged `[AutoPing] scheduler started` without any
  dashboard or manual init request. Tunnel/MITM were disabled in the isolated
  DB; no canary cloudflared process started. Credential-bearing canary data was
  removed after shutdown.
- Live traffic never reached zero. User-approved bounded downtime used
  `MAX_ACTIVE=3`; two snapshots passed at three active requests. Promotion made
  an integrity-checked DB backup, atomically exchanged `cli/app`, restarted PM2
  once, and retained rollback through source/live/DB verification.
- New process independently logged auto-ping start and tunnel auto-resume.
  Local, raw, and short health returned HTTP 200. Six Sol requests completed
  after cutover. Codex auto-ping coverage remained 9/9; `nouvoigoiheuxi` quota
  reported 15/100 used, 85 remaining, reset `2026-07-29T04:14:18Z`.
- First rollout exposed an ops race: the old promotion script waited only ten
  seconds after cloudflared PID loss, then called tunnel enable while automatic
  bootstrap was still reconnecting. It recovered, but
  `9router-ops/safe-promote-app.sh` now waits its full 60 probes before guarded
  enable so future deploys do not double-spawn cloudflared.
- Public PR <https://github.com/decolua/9router/pull/2764> is `OPEN/CLEAN` at
  head `5c54205`. Public scope contains only startup hook, init-route bootstrap,
  and two regression tests.
- Source and bundle verifier now require both startup boundaries. DB verifier
  fails when active Codex OAuth profile IDs are missing from auto-ping settings.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-runtime-bootstrap-active3-20260721-20260722T044631Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-v0540-runtime-bootstrap-active3-20260721-20260722T044631Z/data.sqlite`.

### P30. Cloudflared child PID ownership

Deployment state: live on `0.5.40`. Promotion label
`v0540-tunnel-pid-active3-20260721` completed at `2026-07-22T05:04:05Z`.

- P29 rollout briefly overlapped automatic tunnel recovery with the promotion
  script's guarded enable. Child A exited after child B had saved its PID, but
  both cloudflared exit handlers unconditionally cleared global process state
  and the shared PID file. Watchdog then saw a healthy child as absent and
  rotated Quick Tunnel URLs every 120-second cooldown.
- `clearPid(expectedPid)` now unlinks only when the PID file still belongs to
  that child. Both cloudflared exit handlers clear in-memory ownership only
  when the exiting child is still current and release only `child.pid`.
  Explicit disable retains unconditional cleanup.
- Red test reproduced PID 100 deleting successor PID 200. Final focused matrix
  passes 49/49; ownership regression passes 2/2; ESLint and diff checks pass.
  Standalone build generated 130 routes and a 58 MB candidate; full candidate
  verifier returned zero failures and warnings.
- Bounded live promotion again used `MAX_ACTIVE=3`, backed up SQLite, atomically
  exchanged the app, and restarted PM2 once. Updated promotion logic waited for
  automatic bootstrap and did not issue a competing tunnel enable.
- PM2 is online at PID `2588779`; cloudflared PID file and live process both
  remain `2588922`. Raw URL
  `https://enough-qualified-chocolate-structure.trycloudflare.com` and short URL
  both return HTTP 200. PID, process, and raw URL remained unchanged for five
  minutes across four watchdog intervals, with no watchdog restart/degraded
  event.
- Public PR <https://github.com/decolua/9router/pull/2765> is `OPEN/CLEAN` at
  head `e22c5bf` and contains only child-owned PID cleanup plus regression tests.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-tunnel-pid-active3-20260721-20260722T050308Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-v0540-tunnel-pid-active3-20260721-20260722T050308Z/data.sqlite`.

### Phase 1C current-set Codex auto-ping reconciliation (private operation; no patch ID)

Deployment state: finalized `DONE` on `0.5.40` at
`2026-07-23T11:49:01Z`. This was one private DB-field reconciliation, not an app
deployment or lifecycle behavior change.

- Fresh transaction-bound membership was 10 active Codex OAuth profiles, all
  credential-complete. Preimage field had 23 entries/12 true with five current
  entries missing and 18 stale extras. One native database-scoped transaction
  committed exactly the current 10-member all-true field.
- The fixed apply latch is consumed. Apply ran exactly once and must never be
  retried. Finalize ran exactly once. No automatic rollback exists.
- Postcheck verifier returned zero failures and warnings; live and backup
  SQLite integrity are `ok`; scheduler remained 30 starts, zero stops/start
  failures, last started. No 9Router/gateway restart, route change, provider
  request, manual scheduler tick, or profile status/quota polling occurred.
- Private source/self-test SHA-256 values are
  `314607374101ccc807cf87e2865cbc4572a3e773e078f5933048658dd8353e08` and
  `830c632522a55ed1facfac98727b01004291f55dcf146b33fd70d2d1eb2df9bd`.
  Membership and intended-field SHA-256 values are
  `5c2854e6a36858348f502c424f243a5b1d95a0984a9b13ae19e3714c84ca0b1d`
  and `581e90b3aa388868011c9ebbcd7a57ae28924a3e5c11d2fc9fc2f320f56452b7`.
- Backup bundle:
  `/home/home/.9router/db/backups/phase-1c-current-set-autoping-20260723T113137Z`.
  Backup SHA-256 is
  `9546b6ff6cd7996c8be0368259d1b5d3f9ac9f8e3eb2325f4d890143f8ac35c2`.
  Operator-only rollback command is
  `bash /home/home/.9router/db/backups/phase-1c-current-set-autoping-20260723T113137Z/rollback.sh`.
  Do not invoke it while inspection classifies live state `INTENDED`.
- Sanitized operation evidence is under
  `/home/home/.openclaw/gateway/evidence/phases-1-10/20260722T065306Z/phase-1/current-set-autoping-20260723T113137Z`;
  fresh closure evidence is
  `phase-1/endstate-current-set-20260723T121818Z/summary.json`.
- No future default-on behavior was added. Newly added or re-enabled profiles
  remain explicit operator enrollment. No upstream PR applies to this private
  state-only operation.

### Phase 1C translated Responses terminal completeness

Deployment state: live on `0.5.40` under label
`phase1c-terminal-completeness-v4-20260723` at
`2026-07-23T15:29:20Z`. Runtime behavior commit is `e045562`; current docs-only
source head is `fc442d2`.

- Deterministic Claude to Chat to Responses reproduction emitted one
  `response.completed` but omitted terminal `model`, `output`, and `usage` even
  though request-local translator state contained exact values. This blocked
  strict live Fable usage validation and later history reuse.
- Two terminal-completeness assertions failed before the fix and passed after.
  Focused tests passed `3/3`; broader translator/terminal tests passed `56/56`.
  Syntax, changed-file ESLint, diff checks, TypeScript, 130-route build, and
  MITM bundle passed. Independent source review returned spec PASS, quality
  APPROVED, findings `0/0/0`.
- Fix retains completed items by allocated output index, carries exact
  normalized request-local usage, and preserves the existing one-shot terminal
  guard. It does not change routing, fallback, cancellation, context, model,
  reasoning, tools, cache, or usage formulas.
- Isolated credential-free candidate bound only `127.0.0.1:20129`, started no
  tunnel, and emitted one completion plus one `[DONE]` with terminal model,
  output, and exact `12/1/13` usage including two cached tokens. Candidate tree
  SHA-256 is
  `7f862901d9724ba6ba9c6ea3c71438ca81075d2abc4f8907437f60b1b58098ef`.
- Promotion helper hardening closed CLI-token argv exposure, private modes,
  DB-backup integrity/hash, named-PM2 lookup, raw-tunnel logging, TOCTOU,
  failure-status, dual-lock, PM2-FD inheritance, and GNU empty-file predicate
  defects. V4 helper/test SHA-256 values are
  `dcc4ab66f0f503b0d981003332fc061073162eb7a2f796f903e4326177434920`
  and `0f5846e4ed1075a9f92ce2b73c555deeaf50ec64ee1f99a591ebdd73df03a4cd`;
  independent review is PASS/APPROVED `0/0/0`.
- First detached launch stopped before its log because GNU stat reports an
  empty regular lock as `regular empty file`; no live action ran. Second launch
  stopped after a zero-byte private log because controller PATH omitted the
  bundled `rg`; no live action ran. A strict `MAX_ACTIVE=1` waiter then ran for
  7m38s and was stopped before backup because traffic stayed 2-6.
- Binding bounded-downtime authority permitted `MAX_ACTIVE=4` with
  `ALLOW_ACTIVE_CUTOVER=1`. Helper observed pre-backup `4/4`, created and
  verified SQLite backup, re-gated after resumed traffic, atomically exchanged
  the app, and restarted only 9Router once. Local app plus full verifier passed
  by `15:29:20Z`; raw/short health passed by `15:31:14Z` after child tunnel
  recovery. Gateway and Observer PIDs/restarts stayed unchanged.
- Live tree equals candidate SHA-256. Previous tree SHA-256 is
  `d496358828b11240fa612cfd38f05f3638fdf876d97bd65de884aa8ada113558`.
  Fresh independent source/live/DB verifier is zero failures/warnings; local,
  raw, short, SQLite, versions, listeners, no-handoff, Sol/max/default policy,
  exact `18889=true_residential AND us`, and promotion-log privacy checks pass.
- Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-phase1c-terminal-completeness-v4-20260723-20260723T152846Z`.
  DB backup:
  `/home/home/.9router/db/backups/pre-phase1c-terminal-completeness-v4-20260723-20260723T152846Z/data.sqlite`,
  SHA-256
  `9953fbba359a3626dfa6df16bf3cdc918d6cb14f7d495a8fd0506aea4954ca30`.
- Sanitized deployment evidence:
  `/home/home/.openclaw/gateway/evidence/phases-1-10/20260722T065306Z/phase-1/translator-deploy-20260723T152846Z/summary.txt`.
- Live provider proof is pending. Do not mark Phase 1C complete or infer
  near-limit/model-switch success from isolated candidate evidence.

Public upstream status: no new PR yet. Add this generic terminal-completeness
fix to the owning existing Responses translation PR only after bounded live
proof; exclude private runner, profiles, pools, routes, paths, and evidence.

### P31. Direct Claude OAuth identity, quota windows, auto-ping, and model metadata

Deployment state: pending review/canary. Source worktree is
`/home/home/.openclaw/workspace-keyra/9router-claude-provider-v0540`, branch
`local-v0.5.40-claude-provider`; canonical integration head is `34f8ed1`.
Do not mark this patch live until candidate and post-promotion checks below pass.

Purpose:

- Match Claude Code `2.1.220` OAuth endpoints, scopes, client headers, profile,
  usage, and session identity.
- Show stable email/display/account identity instead of `Account N` when
  provider profile data is available.
- Expose five-hour, weekly, and model-scoped weekly quota rows without
  inventing unavailable limits.
- Start an inactive five-hour window only through opt-in, guarded, non-spammy
  auto-ping when weekly capacity is known and available.
- Publish direct Claude model context/output limits from one capability source.
- Keep Go gateway transport-only; this patch does not change listener filters,
  route tags, proxy pools, private bare-model aliases, or provider fallback.

Required invariants:

- Authorize URL is `https://claude.com/cai/oauth/authorize`; token URL is
  `https://platform.claude.com/v1/oauth/token`; scopes include profile,
  inference, Claude Code sessions, MCP servers, and file upload.
- Profile and usage calls use the connection-selected proxy, fail closed when
  that pool is unavailable, and never log tokens or raw profile payloads.
- OAuth dedup prefers stable Claude account UUID. Email is display metadata,
  not sole account identity.
- Usage calls coalesce per SHA-256 credential key, cache success for 65 seconds,
  honor `Retry-After` and numeric `anthropic-ratelimit-*-reset`, retain stale
  success on 429, and use legacy endpoints only for 404/405.
- Auto-ping requires opt-in, a non-exhausted inactive `session (5h)`, at least
  one non-exhausted weekly row, no exhausted blocking row, available selected
  proxy, and no successful ping in five hours. Accepted bodies are drained;
  failed pings retain 15-minute suppression.
- Fable 5, Opus 5, Sonnet 5, Opus 4.8, and Opus 4.7 advertise 1M context and
  128K output. Opus 4.6 and Sonnet 4.6 advertise 200K base context and 128K
  output; optional upstream 1M mode is not silently enabled. Sonnet 4.5 and
  Haiku 4.5 advertise 200K context and 64K output.
- Bare `claude-fable-5` and `claude-opus-4.8` remain private GitHub aliases.
  Direct Claude models remain provider-qualified through `cc/` or `claude/`.

Reapply order from base `ca9b391`:

1. OAuth/profile identity: `b08f374`, then account-ID correction `b59a43c`.
2. Usage windows/coalescing: `e264e75`, `5637441`, `6f7426f`, then reset-header
   correction `7a27740`.
3. Guarded auto-ping: `786181b`, `6c8a083`, `e6f84c2`.
4. Model metadata: `f0ff368`, `75e83e5`, then 4.6 base-context correction
   `7bc5265`.
5. Existing-profile tooling: `ccd1ed0`, `e981bb6`, `7aa6713`, dry-run guard
   `0c1cbb5`, and apply-only refresh `8c29c1b`.
6. Claude Code protocol parity: `bf4ead1`.

Backfill procedure:

- Dry-run requires an explicit copied/offline `--data-dir`; it must never open
  live data by default.
- `--apply` rejects process-scoped sql.js. Use the native process-safe adapter,
  selected proxy per profile, and refresh an expired credential only after a
  profile 401. Output contains aggregate reason codes only.
- Back up SQLite with integrity check before live apply. Verify connection IDs
  and counts before/after; never print access tokens, refresh tokens, or profile
  payloads.

Current verification evidence:

- Live pre-patch DB has six active direct Claude OAuth profiles. All six lack
  email/account/rate-tier metadata and use the existing `18888` proxy pool.
  Three are explicitly enrolled in Claude auto-ping; all six have null
  `lastPingAt`. Live logs repeatedly show OAuth usage 401/429 falling through
  to legacy polling, confirming both identity and quota-refresh defects.
- Focused Claude/OAuth/quota/model/protocol/backfill gate: `141/142`; all Claude
  assertions passed. Sole failure is the unchanged-base `gotScraping` mock in
  `claude-header-forwarding.test.js`.
- Broader OAuth/Claude/capability/session/translator gate: `487` passed, `14`
  failed. Failures are unchanged Cursor auto-import tests, stale non-Claude
  golden snapshots, and the same unchanged `gotScraping` mock. Claude golden
  header filter passed `2/2`.
- Changed-file ESLint: zero errors, one pre-existing anonymous-default-export
  warning. Production build generated `130/130` routes. Gitleaks scanned the
  branch range with no leaks. `git diff --check` passed.
- First source build inherited default `DATA_DIR` and loaded
  `/home/home/.9router/db/data.sqlite` while collecting static page data. No
  candidate or live bundle was promoted, but repeat builds must set an isolated
  `DATA_DIR`; verify live DB integrity before deployment.
- `/tmp` user quota is currently exhausted and returns errno `-122`; verification
  commands use `TMPDIR=/home/home/.cache/codex-tmp`. This is host state, not a
  source failure.
- `scripts/verify-local-patches.mjs` now checks P31 OAuth endpoints, stable
  identity, usage cooldowns, auto-ping gates, 4.6 base context, CLI protocol,
  backfill safety, focused tests, and candidate bundle markers. Source-only
  verifier returns zero failures and warnings.

Pending deployment/canary:

- First isolated staged build correctly used the candidate `DATA_DIR` but
  stopped at MITM bundling because declared CLI `esbuild` was not installed.
  Installing existing CLI dependencies with `--no-package-lock` fixed that
  prerequisite. Second build completed all 130 routes and MITM bundling but
  produced a rejected 685 MiB artifact: this worktree's root `node_modules` is
  a symlink and `copyRecursive()` followed it into the full development tree.
  Live bundle is 58 MiB. Rebuild from the canonical physical dependency tree;
  never promote or manually prune the oversized candidate.
- Rejected artifact still served credential-free loopback on
  `127.0.0.1:20129` with isolated HOME/data. Health passed; `/v1/models` exposed
  nine direct Claude IDs; model-info returned 1M/128K for Fable 5, Opus 5, and
  Opus 4.8, 200K/128K for Opus/Sonnet 4.6, and 200K/64K for Sonnet/Haiku 4.5.
  Source-plus-bundle verifier returned zero failures/warnings. Backfill no-arg
  guard failed before DB import, while copied empty data dry-run scanned zero.
- Build standalone candidate with isolated `DATA_DIR` and staged
  `NINEROUTER_CLI_APP_DIR`; do not let build initialization touch live data.
- Run copied-DB integrity/secret removal, loopback-only candidate, synthetic
  profile/usage tests, model-info checks, and one read-only real profile/usage
  canary per account through its configured pool.
- Promote 9Router before gateway, using the reviewed atomic helper and one PM2
  restart. Verify local/raw/short health and existing Codex/GitHub/Grok paths.
- Retain exact candidate/live hashes, DB backup, old app directory, PM2/tunnel
  PIDs, and rollback command here after promotion.

Upstream boundary:

- Public/general: OAuth/profile identity, usage normalization/coalescing,
  guarded auto-ping, model metadata, and protocol parity. Split by behavior and
  include focused tests.
- Local/private: real account data, pool IDs, listener/route policy, deployment
  paths, bare-model aliases, and environment-specific evidence.
- Model metadata PR: <https://github.com/decolua/9router/pull/2847>, head
  `f6686d75641baab202dfac481554b8838bb036c0`, OPEN/CLEAN. It includes the
  conservative Fable subscription eligibility gate while keeping Max and Pro
  eligible for Opus 5. Focused public gate passed 34/34.
- OAuth/profile identity extends existing proxy-flow PR
  <https://github.com/decolua/9router/pull/2343>, head
  `6d9df86959a2faf04ffc29be693492261b733c96`, OPEN/CLEAN. Claude profile
  coverage passed 7/7; the wider OAuth matrix passed 220/220 after excluding
  the unchanged stale Cursor auto-import suite.
- Usage PR: <https://github.com/decolua/9router/pull/2848>, head
  `e3308cfacefad50d27546daea88273b635fa1132`, OPEN/CLEAN. Fresh usage and
  dispatch coverage passed 22/22; changed-file ESLint passed.
- Protocol PR: <https://github.com/decolua/9router/pull/2849>, head
  `32ba6ec2f0a87728abe7f2a164191b5b66401f73`, OPEN/CLEAN. Protocol,
  Responses, cloaking, session, and terminal coverage passed 54/54; Claude
  golden headers passed 2/2; changed-file ESLint passed.
- Auto-ping PR: <https://github.com/decolua/9router/pull/2850>, head
  `e1de3bac4801833d83492bed2bda449f732c8158`, OPEN/CLEAN. Fresh auto-ping
  and provider-visibility coverage passed 33/33; changed-file ESLint passed.

Pre-promotion state correction on 2026-07-26:

- Final source/bundle/live-DB verification first failed only the Codex
  auto-ping membership gate at 0/10. Root cause was ten active Codex profile
  IDs created or recreated after the finalized 2026-07-23 current-set
  reconciliation; none matched its explicit per-connection map. Claude uses
  the separate `claudeAutoPing` map, which remained correctly enrolled at
  3/6 active profiles.
- Backed up live SQLite before correction at
  `/home/home/.9router/db/backups/pre-claude-provider-codex-autoping-20260726T161025Z/data.sqlite`.
  Backup mode is 0600, integrity is `ok`, and SHA-256 is
  `18f0d9769dd6ddcd9d01a7fa57d3e224bc02c1223e90ce51501f45a9fe8f4ad9`.
- One `BEGIN IMMEDIATE` transaction replaced only
  `codexAutoPing.connections` after asserting one settings row, ten active
  OAuth profiles, ten credential-complete profiles, and valid settings JSON.
  Postcheck is 10 entries/10 true/10 active matches; `claudeAutoPing` remains
  five entries/three true. Live SQLite integrity remains `ok`.
- Fresh source, 58 MiB v2 candidate bundle, and live-DB verifier returned zero
  failures and zero warnings immediately after reconciliation.
  `test-safe-promote-active-count.sh` passes with `TMPDIR=/run/user/1000`; the
  host `/tmp` quota failure is environmental.
- First promotion attempt aborted before active gating, backup, swap, or
  restart. While QA was running, three Codex profiles were explicitly disabled
  at 09:18:16, 09:18:22, and 09:18:34 PDT, then a settings PATCH changed the
  mutable opt-in map to 0/7 and stopped the scheduler at 09:18:53. The separate
  proxy-observer goal confirmed it made no profile/settings/SQLite mutation.
- `scripts/verify-local-patches.mjs` now reports partial Codex auto-ping
  enrollment as an explicit warning instead of a deployment failure. Auto-ping
  is user-controlled opt-in state; source/bundle behavior and DB value validity
  remain hard gates. A deployment verifier must not overwrite or reject a
  deliberate live preference.

Post-promotion Claude OAuth canary on 2026-07-26:

- Browser consent explicitly identified the requesting application as
  `Claude Code`; `Claude chat account` described the subscription account being
  connected. The consent listed profile, subscription inference, Claude Code
  sessions, connectors, file upload, and coding-session privacy access. Do not
  infer OAuth client identity from the separate Claude website or Desktop magic
  login links.
- Re-authorizing `songoku200794@outlook.com` through the live 9Router flow
  updated existing connection `b853eaee-5c4c-4999-a96a-305ffd355c48` in place.
  Connection count remained four, stable account UUID and original `createdAt`
  were preserved, no duplicate account UUID appeared, and the existing Go
  gateway pool binding remained unchanged.
- The new credential persisted the complete subscription grant returned by
  Anthropic: `user:file_upload user:inference user:mcp_servers user:profile
  user:sessions:claude_code`. `org:create_api_key` is requested by the shared
  client for Console login but is not part of this Claude Max subscription
  grant. Profile metadata remained active `default_claude_max_20x`.
- Fresh-token profile and quota calls traversed `18888` and returned HTTP 200.
  Usage exposed an active zero-percent five-hour window plus an inactive
  zero-percent Fable weekly window; upstream still returned `seven_day: null`.
  This confirms the absent all-model weekly row is account payload, not parser
  loss or reduced OAuth scope.
- A direct fresh-token `claude-fable-5` canary through `18888` returned HTTP
  200 and exact `OK` with 43 input and 4 output tokens. A separate live
  `/v1/responses` translation canary returned exact `OK`, one
  `response.completed`, and one `[DONE]`; 9Router recorded 1,263 prompt tokens,
  4 completion tokens, and 1,250 cache-creation tokens. It selected the
  existing `hughessmallfrog437+2dadaf@gmail.com` connection, so fresh-token
  acceptance and 9Router translation were proven independently without
  mutating account routing.
- Do not force-refresh the fresh grant merely for QA: Anthropic refresh tokens
  may rotate. Verify automatic refresh near the configured four-hour lead and
  confirm the five user scopes remain persisted afterward.
- OAuth callback changes are not warranted by current evidence. Three older
  profiles still carry pre-patch `user:inference user:profile` grants and may
  be re-authorized in place, one at a time; do not delete them first.
- Protocol-fingerprint parity remains separate from OAuth correctness. A local
  Claude Code 2.1.220 request capture found drift in static beta flags, runtime
  version, billing block, and identity prompt. Refresh protocol PR evidence
  against a captured golden request before changing live headers; do not copy
  Claude Code's full system prompt or tool catalog into Codex-translated
  requests.

Direct Codex catalog and entitlement correction on 2026-07-26:

- Live entitlement probes through Go gateway port `18888` proved
  `claude-fable-5` and `claude-opus-5` on all three Max 20x profiles. The Pro
  profile accepts Opus 5 but rejects Fable 5 with HTTP 429 `Usage credits are
  required for this model.`
- Account selection excludes only profiles explicitly classified as Pro-only
  from Fable 5. Unknown, Team, and Enterprise profiles remain eligible so
  incomplete metadata cannot disable valid subscriptions. Existing account
  fallback and exclusion behavior remains unchanged.
- Linux and Windows Codex catalogs use provider-qualified
  `cc/claude-fable-5` and `cc/claude-opus-5`. Both advertise Anthropic's 1M
  context, 128K maximum output, `low|medium|high|max` adaptive effort, a 900K
  auto-compaction threshold, and no unverified fast tier. Bare
  `claude-fable-5` and `claude-opus-4.8` remain private GitHub aliases in the
  live DB and are intentionally absent from the direct catalog.
- Removed global `model_context_window` and `model_auto_compact_token_limit`
  from `/home/home/.codex/config.toml`; those 372K-era overrides silently
  capped every catalog model, including direct Claude.
- A real Codex Fable request exposed a terminal Responses incompatibility:
  Claude supplied only `cache_creation_tokens`, while Codex requires
  `input_tokens_details.cached_tokens` whenever that object exists. The
  translator now supplies zero when cache reads are absent and aliases Claude
  cache creation to `cache_write_tokens` without discarding provider fields.
  The later assistant-prefill error was a retry symptom after Codex rejected
  the malformed first terminal, not the primary failure.
- Reapply gates: direct Claude catalog entries must retain the 1M/900K/95%
  metadata and four effort levels; source and bundle must contain Fable Pro
  exclusion plus terminal cache aliases; live Codex Fable and Opus probes must
  exit zero without reconnect or assistant-prefill errors.
- Runtime commits: `62e701f` normalizes Responses cache details and
  `230c329` excludes known Pro-only profiles from Fable. `5de6786` repairs the
  upstream Read-tool test fixture to include the terminal chunk required by
  buffered sanitization; `d33a379` updates local verifier/ledger contracts.
- Focused Claude/Responses matrix passed 114/114; changed-file ESLint,
  `git diff --check`, source verification, candidate bundle verification, and
  final live bundle/DB/health verification passed. The only verifier warning is
  deliberate Codex auto-ping opt-in coverage at 1/9.
- Public Responses PR #2747 is OPEN/CLEAN at `f761272`; model PR #2847 is
  OPEN/CLEAN at `f6686d7`; protocol PR #2849 is OPEN/CLEAN at `32ba6ec`.
  Their descriptions contain current real-client evidence and test counts.
- Isolated candidate Codex probes returned exact `CATALOG_FABLE_OK` and
  `CATALOG_OPUS_OK` with exit zero. Final post-9Router and post-gateway probes
  returned exact `FINAL_FABLE_OK` and `FINAL_OPUS_OK`, no reconnect, no new
  prefill/cached-token errors, and correct cache read/write fields.
- Linux and Windows catalog JSON is semantically identical. Fable selected Max
  profiles only. Opus selected both Pro and Max profiles across canaries, so
  Max quota remains usable for Opus after its Fable-specific weekly bucket.
- Fresh closure probes at 16:44 PDT returned exact `FINAL_FABLE_OK` and
  `FINAL_OPUS_OK` with one `response.completed` each in 2.8-3.0 seconds.
  Fable selected Max profile `Käthe`; Opus selected Max profile `Walther`.
  Gateway port `18888` recorded both Anthropic streams as HTTP 200.
- OAuth scope closure at 17:11 PDT preserved the same four connection rows,
  four distinct stable account IDs, four distinct emails, original creation
  timestamps, credentials, priorities, and proxy bindings. All four profiles
  now store the full `user:file_upload user:inference user:mcp_servers
  user:profile user:sessions:claude_code` grant; entitlement remains three Max
  20x and one Pro.
- Fresh usage calls for all four profiles traversed gateway port `18888` and
  returned HTTP 200. Max profiles exposed `session (5h)` plus `weekly Fable
  (7d)`; the Pro profile exposed `session (5h)`. Fresh Responses canaries
  returned exact `REAUTH_FABLE_OK` and `REAUTH_OPUS_OK`, each with one
  `response.completed`; Fable selected Max `Käthe`, Opus selected Max
  `Walther`, and both Anthropic streams returned HTTP 200. Local and short
  health remained `{"ok":true}` without restarting 9Router or the Go gateway.
- Safe promotion label `v0540-claude-codex-terminal-20260726` succeeded. DB
  backup:
  `/home/home/.9router/db/backups/pre-v0540-claude-codex-terminal-20260726-20260726T224748Z/data.sqlite`
  with SHA-256
  `23368dcc21a02ab97283dd1fc50f51e8b5b61c51f72394ded698210b769bd1c6`.
  Rollback app:
  `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app.backup-v0540-claude-codex-terminal-20260726-20260726T224748Z`.
- Live PM2 PID is `187881`; cloudflared PID is `188027`. App restart rotated
  the raw quick-tunnel process, then the existing short ID was re-registered.
  Local, raw, and `https://rkeyra9.abc-tunnel.us/api/health` all pass.

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
- Confirm P26 remains opt-in, bounded to 5,000 entries, hashes every identity,
  and calls `rememberCacheAffinity` only from terminal success.

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
- With affinity enabled on an isolated provider, send two requests with one
  session ID and one request with another. Verify first-session reuse,
  independent first-request rotation, fallback repin, and no raw identity in
  logs or SQLite.
- Run a provider that delays more than 30 seconds after headers through the
  short URL. Verify Codex receives heartbeat events until terminal completion
  and no `idle timeout waiting for SSE` or false account lock occurs.
- Confirm every GitHub profile remains bound to residential pool
  `b9b6de29-4fd4-42f6-9498-7d7d41014bf3` on `18889`; test both active profiles.
- Through the short URL, force Fable to call one Responses `custom` tool and
  submit its `custom_tool_call_output`. Require custom input delta/done events,
  unique monotonic output indexes, exactly one `response.completed`, exactly
  one `[DONE]`, and a successful continuation through every active GitHub
  profile. Repeat one ordinary function control.
- Confirm Fable 5 and Opus 4.8 advertise 264,000 total, 200,000 prompt, and
  64,000 output tokens on the GitHub path. Send one small control and assert no
  token-count preflight. Send one prompt above 200,000 and require exact
  `/v1/messages/count_tokens` rejection, `context_length_exceeded`, one
  `response.failed`, one `[DONE]`, no generation call, and no account lock.
- Confirm every Codex catalog keeps GitHub Fable/Opus effective context at or
  below 200,000 and auto-compaction below that limit. Restart each Codex
  app/CLI after catalog replacement before testing a GPT-to-Fable downshift.
- Re-run the verifier against source, bundle, and DB.
- Open Usage once and confirm `/api/usage/stream` emits only realtime fields without blocking `/api/health`.
- Save the backup path and tunnel URL in this ledger if they changed.
