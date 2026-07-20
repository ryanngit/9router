# Cache-Affinity Account Routing

Date: 2026-07-20

## Goal

Improve prompt-cache locality without replacing first-request round-robin or
weakening account fallback. Apply to any provider only when its per-provider
setting is enabled.

Cache affinity optimizes account locality, latency, and billable cache use. It
does not claim to change model output quality. Provider-native cache controls
remain authoritative.

## Evidence

Seven-day local request history already shows high cache reuse:

- Codex switched-account requests: 97.4% request hits, 95.9% prompt tokens cached.
- Codex same-account requests: 92.5% request hits, 89.8% prompt tokens cached.
- GitHub Fable switched-account requests: 98.2% request hits, 91.2% prompt tokens cached.
- GitHub Opus switched-account requests: 98.4% request hits, 92.4% prompt tokens cached.
- Grok CLI same-account requests: 99.9% request hits, 94.2% prompt tokens cached.

These results reject global forced affinity. Feature must be opt-in and preserve
load distribution for first requests.

## Alternatives

### Selected: bounded in-memory affinity

First request uses current strategy. A successful account is remembered for a
hashed request scope. Subsequent matching requests prefer that account.

Benefits: no schema migration, no dependency, no persistent identity data, no
extra DB write, and immediate fallback.

### Rejected: global account pinning

Pins all requests from a key or provider. This defeats round-robin fairness and
lets one long session concentrate load on one subscription.

### Deferred: durable affinity in SQLite or Redis

Survives process restarts and supports multiple router nodes, but adds request
path I/O, cleanup, synchronization, and identity retention. Add only when a
second 9Router node exists and measured restart misses justify it.

## Scope Identity

Affinity key includes provider and model plus strongest available identity:

1. Stable client session + API-key client fingerprint + API key.
2. API-key client fingerprint + API key.
3. API key only.

Session candidates use stable session, conversation, or prompt-cache fields.
Per-request IDs are excluded. Every component is hashed before insertion. Raw
API keys, sessions, IPs, emails, workspaces, and fingerprints are never stored
or logged by affinity code.

Fixed lifetimes:

- Session scope: 6 hours.
- Client scope: 30 minutes.
- API-key scope: 5 minutes.
- Capacity: 5,000 entries with lazy expiry and least-recently-used eviction.

No cleanup timer runs. Reads refresh recency but do not extend absolute expiry.

## Request Flow

1. Existing authentication, model routing, usage reservation, and client
   activity validation run unchanged.
2. When provider affinity is enabled, build one hashed scope and look up its
   preferred connection.
3. Pass preferred connection ID to `getProviderCredentials`.
4. Existing availability filters reject locked, excluded, inactive, or deleted
   connections. Existing selection strategy chooses another account.
5. Existing provider/account fallback continues across attempts.
6. Store or replace affinity only after an attempt returns success. A successful
   fallback therefore repins future requests.
7. Failures, cancellation, invalid requests, and exhausted API keys do not
   create or refresh affinity.

Combo models resolve affinity independently per concrete provider/model.
Fusion panels do not share a connection choice unless their concrete scope is
identical.

## Provider Semantics

No wire-format cache behavior changes:

- Codex keeps `prompt_cache_key` and email/workspace account identity.
- xAI/Grok keeps conversation and prompt-cache keys.
- Claude keeps explicit `cache_control` blocks.
- Gemini keeps explicit and implicit cache behavior.

Feature is provider-neutral but disabled by default. Private rollout enables
Codex, GitHub, and Grok CLI only after candidate verification.

## Configuration And Telemetry

Add `cacheAffinityEnabled` to existing per-provider strategy settings and show
one provider-level toggle beside fallback strategy controls.

Debug logs report provider/model, scope level, and hit/miss/repin outcome. They
must not include affinity hashes or raw identity material. Existing account
selection logs remain unchanged.

## Tests

- Scope priority, hashing, fixed TTL, lazy expiry, LRU cap, and no raw values.
- First request follows current round-robin and records successful account.
- Hit prefers recorded account without advancing strategy state.
- Locked, excluded, inactive, and deleted preferred accounts fall back.
- Successful fallback repins; failed/cancelled request does not.
- Provider disabled leaves selection calls byte-equivalent.
- Combo models isolate provider/model scopes.
- Existing account fallback, API-key reservation, and stream cancellation tests
  remain green.

## Rollout

1. Build and test in isolated source worktree.
2. Prepare clean public branch containing generic code, UI, and tests only.
3. Enable private provider settings in copied candidate DB.
4. Compare cache-hit rate, account distribution, TTFT, fallback, and errors.
5. Keep live unchanged until the active zero-OOM gate and deployment checks pass.

