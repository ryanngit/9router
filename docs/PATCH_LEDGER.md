# 9Router Local Patch Ledger

Last updated: 2026-07-11

This file tracks local 9Router changes that must survive updates. Treat it as the source of truth before merging upstream changes, rebuilding, or pushing PR branches.

Current live facts:

- Live wrapper workspace: `/home/home/.openclaw/workspace-keyra/9router-patch`
- Clean current source: `/home/home/.openclaw/workspace-keyra/9router-upgrade-v0.5.30`, branch `local-v0.5.30-upgrade`, P15-P17 candidate-QA commit `d00df0d`
- Live data: `/home/home/.9router`
- Live app bundle: `/home/home/.npm-global/lib/node_modules/9router/app` -> `/home/home/.openclaw/workspace-keyra/9router-patch/cli/app`
- PM2 app: `9router`
- Current PM2 entrypoint: `/home/home/.npm-global/lib/node_modules/9router/app/custom-server.js`.
- Current package version: `0.5.30`
- P15-P17 candidate was promoted to live on 2026-07-12; its temporary credential-bearing QA data was removed after deploy.
- Port: `20128`
- Current known short tunnel base: `https://rkeyra9.abc-tunnel.us`
- Current known raw tunnel base: `https://gui-markers-transparent-delivery.trycloudflare.com`
- Current best-GPT PM2 policy: enabled, target `cx/gpt-5.6-sol`, reasoning `max`, service tier `fast`
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

- Codex app can send `service_tier: fast`; Codex backend accepts `priority`, not `fast`.
- Priority processing does not support GPT long-context requests.
- GPT-5.6 uses `max`; legacy clients can still send `xhigh`.
- Codex Ultra is a client-side orchestration preset whose upstream reasoning effort is `max`; 9Router must preserve that value.

Files:

- `open-sse/executors/codex.js`
- `open-sse/translator/concerns/thinkingUnified.js`

Required invariants:

- Codex `service_tier: fast` becomes `priority`.
- Final GPT provider payloads estimated at 256,000 input tokens or more have `service_tier` removed before sending.
- The operational cutoff leaves a 16,000-token safety margin below the 272,000-token short-context boundary because Codex sends no exact pre-request token count.
- The lexical estimate counts words, punctuation, Unicode characters, and whitespace runs so whitespace-heavy input cannot bypass the guard.
- Other unsupported Codex service tiers are removed.
- GPT-5.6 `xhigh` becomes `max`; `max` is never downgraded.
- GitHub Claude max reasoning stays provider-native `max`.

Verification:

- Send a short `cx/gpt-5.6-sol` request with `service_tier=fast`; provider payload contains `service_tier:"priority"`. Record response tier separately because upstream can serve the request as `default`.
- Send a long synthetic GPT request with `service_tier=fast` and direct `priority`; transformed request omits `service_tier` and console logs `Priority disabled for long context`.
- Send `cx/gpt-5.6-sol` with `reasoning_effort=max`; no reasoning-effort 400.
- Send `gh/claude-opus-4.8` with `reasoning_effort=max`; request details show provider effort `max`.
- 2026-07-10 isolated bundle on `127.0.0.1:20129` passed source and bundle verification, then completed a short Sol request whose provider payload contained `service_tier:"priority"`.
- 2026-07-10 live probe returned `LIVE_OK`; request details confirmed incoming `fast` became provider `priority`. Upstream OAuth response reported effective `default`, so effective-tier accounting correctly did not claim Priority service.
- Focused test covers `fast`, direct `priority`, and whitespace-heavy long payloads.
- Live deploy used one PM2 restart. Local, `rkeyra9`, and raw TryCloudflare health passed; cloudflared PID remained `206858`.

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2452>
- Supersedes closed split PRs #1817, #1820, and #2344.
- Updated 2026-07-10 with commit `dc8b46d fix(codex): disable priority for long contexts`.
- PR now preserves `max`, removes Priority at the 256,000-token estimate, and keeps workspace binding in separate PR #1819.
- PR excludes private bare-model routing and the local GPT-5.6 `xhigh` -> `max` compatibility policy.
- Focused verification: `./node_modules/.bin/vitest run --config tests/vitest.config.js --testTimeout 20000 tests/unit/codex-fast-capacity.test.js` passed 7/7.
- Related Codex suites passed 23/23; ESLint passed for both changed files.
- Local invariant script: `node tests/unit/custom-live-patches.test.js`

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

Upstream status:

- Open PRs:
  - OAuth proxy selection/exchange path: <https://github.com/decolua/9router/pull/2343>
  - ProxyAgent timeout defaults: <https://github.com/decolua/9router/pull/1570>
- Verification: `node --check src/app/api/oauth/[provider]/[action]/route.js`; `node --check open-sse/utils/proxyFetch.js`

### P9. xAI/Grok Build Grok 4.5 and quota visibility

Purpose:

- Add `grok-4.5` from xAI/Grok Build to model picker and routing.
- Support xAI Responses endpoint for Codex-style `/v1/responses` clients.
- Route bare `grok-*` model names to xAI, so clients can use `grok-4.5` without `xai/` prefix.
- Show xAI rows in quota tracker from local `usageHistory`, since no account-quota endpoint is known.
- Normalize unsupported Codex Responses tools before xAI `/v1/responses`, because xAI rejects `custom` and `local_shell` tool variants.

Files:

- `open-sse/providers/registry/xai.js`
- `open-sse/services/model.js`
- `open-sse/services/usage.js`
- `open-sse/services/usage/xai.js`
- `open-sse/executors/default.js`
- `src/app/(dashboard)/dashboard/usage/components/ProviderLimits/utils.js`
- `open-sse/handlers/chatCore/requestDetail.js`
- `src/lib/db/repos/usageRepo.js`
- `tests/unit/model-routing.test.js`
- `tests/unit/xai-usage.test.js`

Required invariants:

- Registry includes `grok-4.5`.
- xAI has both OpenAI chat and OpenAI Responses transports.
- xAI reasoning options exposed by 9Router are `auto`, `low`, `medium`, `high`.
- Bare `grok-*` routes to provider `xai`.
- xAI quota tracker uses local request totals: today tokens, 7d tokens, 30d tokens, today requests.
- Responses usage preserves cached tokens, reasoning tokens, and `cost_in_usd_ticks` for local usage/cost display.
- xAI Responses requests convert `custom` tools to freeform `function` tools, drop `local_shell` plus unsupported nameless hosted tools, strip OpenAI-only hosted tool fields like `external_web_access`, and strip OpenAI encrypted reasoning blobs that xAI cannot decode.
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
- After PM2 restart, `rkeyra9` short worker still pointed at an older raw tunnel. Manual worker registration fixed it: `POST https://abc-tunnel.us/api/tunnel/register` with `shortId=keyra9` and the current raw tunnel URL.
- `getModelInfoCore("grok-4.5", {})` returns `{ provider: "xai", model: "grok-4.5" }`.
- `/v1/responses` request with model `grok-4.5` succeeds and latest request details row shows provider `xai`.
- `/v1/responses` request with Codex custom tools should not fail with `unknown variant custom`.
- `/api/usage/<xai connection id>` returns quota rows instead of “Usage API not implemented”.

Upstream status:

- Open PRs:
  - xAI/Grok catalog, bare `grok-*` routing, Responses transport, `grok-4.5`, and reasoning options: <https://github.com/decolua/9router/pull/2439>
  - xAI local quota rows from `usageHistory` and provider cost preservation: <https://github.com/decolua/9router/pull/2453>
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
- `NINE_ROUTER_BEST_GPT_SERVICE_TIER=fast`

Database aliases:

- `gpt-5.5` -> `cx/gpt-5.6-sol`
- `gpt-5.6-sol` -> `cx/gpt-5.6-sol`
- `gpt-5.6-terra` -> `cx/gpt-5.6-terra`
- `gpt-5.6-luna` -> `cx/gpt-5.6-luna`

Required invariants:

- Apply best-GPT routing after naming/warmup bypass handling and before combo/model resolution.
- Bare `gpt-5.4-mini`, bare `gpt-5.5`, and prefixed names such as `cx/gpt-5.6-terra` all route to the configured target.
- Non-GPT models remain unchanged. `NINE_ROUTER_BEST_GPT_ENABLED=false` remains an emergency kill switch.
- Default target is `cx/gpt-5.6-sol`; default routed reasoning is `max`; default routed service tier is `fast`.
- Codex translates routed `fast` to Priority for short context and removes Priority at the long-context guard.
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
- Lite requests preserve `additional_tools` and `parallel_tool_calls`.
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

Upstream status:

- Open PR: <https://github.com/decolua/9router/pull/2511>
- Clean branch: `/home/home/.openclaw/workspace-keyra/9router-responses-lite-pr`, branch `codex-responses-lite`, head `b7c69ef`.
- PR was rebased onto upstream `v0.5.30`; GitHub merge state is `CLEAN`.
- Focused Lite tests passed 20/20; broader Codex capacity/refresh/reset/normalization tests passed 23/23.
- Context-normalization follow-up passed ESLint and `git diff --check`.
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
- Public branch: `tunnel-dashboard-refresh` at `df7436c`.
- Commits: `c7995b8`, `df7436c`.
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

- Included in public PR #2554 at `df7436c`.

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
- Check `pm2 env 0 | rg 'NINE_ROUTER_BEST_GPT'`; target must be `cx/gpt-5.6-sol` and effort must be `max`.

Run after every update/deploy:

- Verify local health: `curl -fsS http://127.0.0.1:20128/api/health`.
- Verify tunnel health only after reading current tunnel state: `cat /home/home/.9router/tunnel/state.json`.
- Verify `/api/version`, PM2 version, live app package version, CLI package version, and `9router --version` agree.
- Verify the original cloudflared PID still serves port `20128`.
- Send `gpt-5.4-mini` to `/v1/responses`; confirm route log, request details, response model, and usage model all resolve to `gpt-5.6-sol`, with routed effort `max`.
- Send one Responses Lite request with context omitted and confirm stored provider context is `all_turns`.
- Open Console Log through local, raw, and short URLs; local must remain on SSE and tunnel paths must populate through fallback polling.
- Observe quota countdown for at least 70 seconds through the short URL; it must decrement once per real second and refresh once.
- Confirm PM2 `pm_exec_path` ends in `app/custom-server.js` and live DB contains `apiKeyClients`.
- Send one API-key request with `X-9Router-Client-ID`; verify one Usage > API Key Clients row and matching usage tokens without storing the full IP.
- Re-run the verifier against source, bundle, and DB.
- Save the backup path and tunnel URL in this ledger if they changed.
