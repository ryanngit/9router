# Direct Claude Provider Integration

Date: 2026-07-26

## Goal

Make direct Claude Code OAuth profiles useful and observable through 9Router and
the Go gateway without changing existing Codex, GitHub, Grok, proxy-pool, or
fallback behavior.

## Confirmed Baseline

- 9Router direct Claude provider is `claude` with aliases `cc` and `claude`.
  Bare `claude-fable-5` and `claude-opus-4.8` remain private GitHub aliases;
  direct routing therefore requires `cc/...` or `claude/...`.
- OAuth exchange stores tokens and proxy-pool ID but never calls
  `/api/oauth/profile`. Live rows consequently have no email or account ID and
  are named `Account N`.
- Live `/api/oauth/profile` supplies account UUID, email, display name, Max/Pro
  flags, organization UUID/type, billing type, rate-limit tier, and subscription
  status.
- Live `/api/oauth/usage` can return inactive windows: `five_hour` has
  `utilization: 0` and `resets_at: null`; top-level `seven_day*` can be null;
  `limits` contains `session` and optional `weekly_scoped` model rows such as
  Fable.
- Current quota parser ignores `limits`. Current auto-ping requires a non-null
  five-hour reset, so an inactive 100% session displays `N/A` and never starts.
- Auto-ping and Web UI can independently poll usage. Their three-minute retry
  alignment produced repeated live 429/legacy-fallback traffic.
- Port 18888 currently tunnels `api.anthropic.com` through the generic `dc`
  pool. TLS and all Claude headers remain opaque, but profiles share one
  host-level sticky binding and gateway logs cannot distinguish them.
- Adding Anthropic to current MITM without code changes would impose a 120-second
  timeout on long SSE and label health as `github-copilot`.

## Options

1. 9Router only. Lowest risk, but no per-profile gateway stickiness or Claude
   transport telemetry.
2. Transparent Claude-aware MITM plus 9Router provider fixes. Selected.
3. Full Claude protocol translation and token management in Go. Rejected because
   it duplicates 9Router and creates two owners for OAuth, tools, and SSE.

## 9Router Design

### OAuth And Identity

- Use Claude Code `2.1.220` authorize
  `https://claude.com/cai/oauth/authorize`, token
  `https://platform.claude.com/v1/oauth/token`, and default scopes
  `org:create_api_key user:profile user:inference user:sessions:claude_code
  user:mcp_servers user:file_upload`.
- Add a best-effort `postExchange` profile fetch through the OAuth session's
  selected proxy.
- Persist only fields needed for identity and operations:
  `email`, `displayName`, account UUID, organization UUID/type, Max/Pro flags,
  rate-limit tier, and subscription status.
- Name new connections by email. Use display name, account UUID prefix, then
  `Account N` only when profile fetch is unavailable.
- Keep profile failure non-fatal. Token exchange remains successful and the
  fallback label remains editable.
- Backfill existing direct Claude rows once during deployment using the same
  profile endpoint and each row's configured proxy. No persistent migration
  daemon.

### Usage

- Keep top-level `five_hour`, `seven_day`, and `seven_day_*` parsing.
- Merge `limits` and compatibility `rate_limits` rows without duplicate names.
- Map `session` to `session (5h)` only when top-level five-hour data is absent.
- Map unscoped weekly rows to `weekly (7d)` and `weekly_scoped` rows to
  `weekly <model> (7d)`. Preserve inactive rows as 0% used with `resetAt: null`.
- Do not invent a global weekly quota when upstream returns none.
- Coalesce concurrent usage calls per credential and cache successful payloads
  briefly so UI and auto-ping share one upstream read.
- Honor `Retry-After` or provider reset headers after 429. Return stale cached
  data when available. Do not call legacy organization endpoints after OAuth
  endpoint 429/401; legacy fallback is reserved for unsupported OAuth endpoint
  responses.
- Never log tokens, profile payloads, or raw provider errors.

### Auto-Ping

- Preserve opt-in per-profile settings.
- Active session behavior remains reset-driven.
- Inactive behavior may send one tiny ping only when all conditions hold:
  session quota exists, session is not exhausted, at least one weekly quota row
  exists, no weekly row is exhausted, selected proxy is available, and no
  successful ping occurred within five hours.
- Drain the accepted ping response before marking success.
- Persist `lastPingAt` and dedup state. Failed pings retain the existing
  15-minute cooldown. Missing weekly data stays `N/A` and does not ping.

### Models And Context

- Registry and `/v1/models/info` expose context and output metadata from one
  capability source.
- Expose verified direct API models: Fable 5, Opus 5, Sonnet 5, Opus 4.8/4.7/4.6,
  Sonnet 4.6/4.5, and Haiku 4.5. Fable/Opus 5/Sonnet 5/Opus 4.x/Sonnet 4.6 use
  1M context and 128K maximum output; Sonnet 4.5 and Haiku 4.5 use 200K context
  and 64K maximum output.
- Current API 1M limits need no beta header. Describe subscription entitlement
  conditions separately: Opus 1M is included for Max/Team/Enterprise, while
  Sonnet 4.6 1M can require usage credits.
- Private bare-model routing aliases remain unchanged.

### Count Tokens

- Keep the local estimator in this change unless official Claude Code evidence
  shows exact upstream counting is required for correctness.
- ponytail: local estimation is the ceiling for this patch; add authenticated
  provider-aware `/v1/messages/count_tokens` forwarding when measured context
  drift affects compaction or admission decisions.

## Go Gateway Design

- Add private `18888` route entries for Anthropic API traffic with existing `dc`
  policy and `sticky: auth`. OAuth browser navigation remains browser-direct.
- Add `api.anthropic.com` to MITM only on the default listener.
- Preserve method, path, query, request body, bearer/x-api-key auth,
  `anthropic-version`, `anthropic-beta`, SSE bytes, status, request ID, and all
  `anthropic-ratelimit-*` headers. No Claude body translation or header spoofing
  in Go.
- Fingerprint `x-api-key` when bearer auth is absent, using only a short hash.
- Classify Anthropic separately in logs and health telemetry.
- Use timeout-free streaming mode for Anthropic SSE. Keep bounded deadlines for
  non-streaming profile, usage, and count-token calls.
- Do not retry ambiguous non-idempotent `POST /v1/messages` transport failures.
  Count-token and read-only calls may use bounded pre-response failover.
- Keep existing shared MITM client pool from the gateway branch to avoid a new
  transport implementation.
- ponytail: upstream TLS uses existing gateway client modes, not an exact Node
  ClientHello clone; add captured Claude Code ClientHelloSpec only if provider
  enforcement or measured acceptance requires it.

## Tests

9Router failing tests first:

- current authorize/token/scopes and proxy propagation
- profile mapping, non-fatal profile failure, email naming, dedup identity
- inactive and active usage windows, scoped weekly rows, duplicate suppression
- concurrent usage coalescing, stale-on-429, no legacy fallback on 429/401
- inactive-session ping gates, five-hour dedup, weekly exhaustion, response drain
- direct model IDs and context/output metadata

Gateway failing tests first with fake proxy and TLS origin:

- exact Messages and count-token request passthrough for bearer and x-api-key
- response and rate-limit header preservation
- incremental SSE beyond 120 seconds without clean completion fabrication
- distinct sticky keys by credential
- no duplicate retry for ambiguous Messages failure
- JSON 401/403/429/529 passthrough and existing GitHub/Codex/Grok regressions

## Canary And Deployment

1. Build candidates from isolated worktrees.
2. Run unit, integration, race, vet, lint, secret scan, and build gates.
3. Start fake-origin gateway test and loopback-only alternate listeners.
4. Start alternate-port 9Router against copied DB with tokens removed; use
   synthetic OAuth/profile/usage fixtures.
5. Run one real read-only profile/usage canary per account through port 18888.
6. Run one tiny direct Claude generation and one long synthetic SSE canary.
7. Re-read goal task `019f888f-293d-7460-ae80-e3d5fd10fa7e`. Stop if it is
   promoting gateway or 9Router.
8. Promote 9Router first, verify all existing providers and URLs, then promote
   gateway separately with connection draining. Never restart both together.
9. Backfill existing Claude labels, verify quota rows and ping suppression, then
   retain rollback artifacts.

## Upstream Boundary

General 9Router fixes are separate public commits/PRs: official OAuth endpoints,
profile identity, usage schema/coalescing, safe auto-ping, and model metadata.
Private changes stay local: forced model aliases, real profile data, pool IDs,
route tags, and environment deployment scripts.

Gateway changes remain local unless a public upstream exists. Patch ledger must
record source commit, private route diff, tests, artifact hash, deploy order,
rollback, and reapply instructions.
