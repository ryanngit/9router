# Grok CLI Responses Compatibility Design

Date: 2026-07-15

## Goal

Provide one complete, source-pinned compatibility boundary from Codex/OpenAI
Responses requests to the Grok Build subscription Responses endpoint. Replace
incremental field patches with deterministic translation, preserve all current
semantics that Grok can represent, and stop malformed client requests before
they trigger provider retries or account locks.

This boundary covers HTTP request translation, native history continuity,
inference headers, model capability parsing, provider error classification,
stream passthrough, verification, deployment, and upstream maintenance. It does
not recreate the Grok Build TUI, tool runtime, persistence layer, or compaction
state machine.

## Source Of Truth

Pin behavior to `xai-org/grok-build` commit
`b189869b7755d2b482969acf6c92da3ecfeffd36`.

Relevant official behavior:

- `ConversationRequest -> rs::CreateResponse` defines the emitted Responses
  body and optional sampling fields.
- `conversation_item_to_input_items` defines valid message, reasoning,
  function-call, function-output, web-search, x-search, and code-interpreter
  history.
- `build_responses_tools` and `extra_raw_tools` define function, `web_search`,
  and `x_search` tool wire shapes. Hosted tools win name collisions.
- `GrokRequestHeaders` defines inference identity and session headers,
  including `x-grok-user-id`.
- `/v1/models` metadata defines context/output limits, API backend, backend
  search support, reasoning options, compaction metadata, and streamed tool
  call support.
- Grok Build conversation repair validates malformed function arguments,
  repairs dangling calls, and deduplicates tool results before inference.

Live backend evidence confirms current drift:

- `web_search.external_web_access` returns HTTP 400; the same tool without that
  field completes.
- Native x-search output uses `custom_tool_call` items with `ctc_*` IDs and
  `xs_call-*` call IDs.
- Native x-search continuity includes `tco_*` encrypted reasoning siblings.
- Normal reasoning and messages use `rs_<UUID>` and `msg_<UUID>` IDs.
- Function output uses `fc_<UUID>_<index>` IDs and a separate `call_id`.
- `parallel_tool_calls:false` is accepted.

## Architecture

### Compatibility Codec

Add one pure, provider-specific module beside the Grok CLI executor. Its public
entry point accepts an OpenAI Responses body, resolved model, and known model
capabilities, then returns a new strict Grok Responses body plus diagnostics.

The codec must be:

- pure: never mutate the client body;
- idempotent: translating an already translated body yields equivalent wire;
- deterministic: identical input yields byte-equivalent JSON key/value data;
- strict by construction: known wire objects are rebuilt from accepted fields;
- independently testable without OAuth, network access, or a running server.

Keep auth, proxy selection, model resolution, session/turn IDs, request IDs,
headers, credential refresh, and HTTP execution in `grok-cli.js`. This makes the
executor an orchestrator instead of a second schema implementation.

The executor catches codec compatibility errors and returns an immediate local
HTTP 400 response. It does not call the provider, refresh credentials, or mark
the selected account unavailable. Successful translation emits one compact
debug diagnostic summary without adding a new database schema.

### Responses

Grok CLI and Codex both use OpenAI Responses SSE. Successful provider streams
remain byte-for-byte passthrough so Codex receives native reasoning, backend
tool events, annotations, usage, and terminal response objects. Do not pivot
through Chat Completions or rebuild successful SSE events.

Existing stream termination and usage tracking remain responsible for
transport-level handling. Compatibility tests must prove native x-search and
web-search events survive unchanged.

### Model Capabilities

Normalize `/v1/models` metadata in `grokCliModels.js` without adding a new
per-request discovery call. Preserve these fields when supplied at the top
level or under model metadata:

- `apiBackend`
- `contextWindow`
- `maxOutputTokens`
- `supportsBackendSearch`
- `supportsReasoningEffort`
- `reasoningEffort`
- `reasoningEfforts`
- `compactionAtTokens`
- `compactionsRemaining`
- `streamToolCalls`

Known static models retain conservative fallbacks. Unknown models omit
reasoning effort unless metadata proves support; omission is safer than sending
an unsupported enum.

## Request Contract

### Top-Level Fields

Build a fresh provider body. Retain only validated fields with a known Grok
equivalent:

- `model`
- `input`
- `reasoning`
- `include`
- `tools`
- `tool_choice`
- `text`
- `max_output_tokens`
- `temperature`
- `top_p`
- `parallel_tool_calls`

Always set `stream:true` and `store:false`. Remove Chat Completions leftovers,
OpenAI service tiers, previous stored-response references, prompt-cache routing
fields, client metadata, and unknown top-level fields.

Convert non-empty `instructions` into a leading system message, matching the
official Grok Build conversation wire. Avoid duplicating identical leading
system content when the client already provided it.

### Messages

Accept string input or an input array. Normalize role-based objects without a
type as messages.

- Preserve `system`, `user`, and `assistant` roles.
- Map `developer` to `system`.
- Preserve string text and typed text/image content.
- Normalize output text in historical assistant messages to valid input text.
- Retain supported image URLs, file IDs, detail values, and data URLs.
- Remove message IDs, status, output-only annotations, and internal metadata.
- Drop empty content blocks; retain a message when valid content remains.

An empty or invalid final input receives the existing minimal user placeholder
so the provider never receives an empty prompt.

### Reasoning History

Preserve only reasoning encrypted by the current Grok backend:

- `rs_<UUID>` reasoning with string `encrypted_content` is native.
- `tco_*` reasoning is native only when its encrypted content begins with its
  own item ID plus `_`, matching live Grok backend output.

For native reasoning:

- retain `id`, `summary`, typed `content`, and `encrypted_content`;
- remove output-only `status` and internal metadata;
- ensure each reasoning content entry has `type:"reasoning_text"`.

Discard foreign OpenAI reasoning ciphertext. Provider ciphertext is opaque and
cannot be translated cryptographically. Following assistant messages and tool
results remain as model-visible history.

### Function Calls And Results

Normalize client-executed calls to official function history:

- require non-empty `call_id` and name;
- retain `call_id`, name, and JSON argument string;
- remove output-only item `id` and status;
- convert object arguments to JSON;
- replace malformed historical argument strings with `{}` to prevent a
  deterministic provider 400, matching official Grok repair behavior.

Normalize function results as follows:

- preserve string output;
- preserve supported typed text/image content arrays;
- convert scalar or unknown structured values to deterministic JSON text;
- remove result item IDs and status;
- drop outputs with no matching function call;
- keep the last duplicate output for a call ID;
- insert an official-style cancelled result for historical calls that have no
  result before the next conversation turn.

Repairs apply only to historical calls. They must not fabricate a result for a
new provider response because response streams bypass the request codec.

### Custom Tools

Codex custom tools have no equivalent client-side Grok custom-tool definition.
Translate them to function tools with one required string property named
`input`. Translate matching custom call/output history to function call/output
history.

Do not translate native Grok x-search history. Preserve a `custom_tool_call`
when it has the live native identity shape: `ctc_*` item ID plus `xs_call-*`
call ID. Preserve its `id`, `call_id`, name, input, and status exactly, apart
from internal metadata removal.

### Backend Tools

Only two request tool definitions are source-backed:

- `web_search`: rebuild with `type` and optional
  `filters.allowed_domains`; keep only non-empty string domains.
- `x_search`: rebuild as exactly `{ "type": "x_search" }`.

Preserve native historical `web_search_call`, x-search custom calls, and
`code_interpreter_call` items. These are backend output history, not client tool
definitions.

Drop unsupported hosted definitions such as `web_search_preview`,
`file_search`, `image_generation`, `code_interpreter`, `mcp`, and
`local_shell`. A new hosted type or field requires evidence from a newer pinned
Grok Build source commit and a live canary.

Deduplicate hosted types. Drop function tools whose names collide with retained
hosted tools; hosted tools win, matching official Grok Build.

### Tool Choice

Normalize tool choice after tool normalization.

- Preserve `auto`, `none`, and `required` only when a non-empty tool set exists.
- Convert valid Codex custom choices to function choices.
- Preserve a function choice only when its normalized name exists.
- Remove object choices that force a hosted tool; pinned official source emits
  only mode or function choices and provides no source-backed hosted choice.
- Remove stale or malformed choices and always remove tool choice when no tools
  remain.

### Reasoning And Structured Output

Rebuild reasoning from accepted fields. Always request a concise summary.
Include effort only when the model supports it. Grok's official parser treats
`max` as the UI alias for wire `xhigh`; preserve `low`, `medium`, `high`, and
`xhigh`, and omit unsupported values for unknown models.

Request `reasoning.encrypted_content` whenever reasoning is active so native
Grok continuity remains available on subsequent turns.

Rebuild `text` to supported plain-text or JSON-schema format. Preserve schema,
name, description, and strict mode where valid. Remove unsupported verbosity or
provider-specific modifiers.

## Inference Headers

Use official inference headers:

- `x-grok-client-identifier`
- `x-grok-client-version`
- `x-grok-session-id`
- `x-grok-conv-id`
- `x-grok-req-id`
- `x-grok-turn-idx`
- `x-grok-agent-id`
- `x-grok-model-override`
- optional `x-grok-deployment-id`
- optional `x-grok-user-id`

Inference must not rely on legacy `x-userid`. Resource endpoints such as
models, user, billing, and workspace calls continue using `x-userid` and
`x-email`, matching official Grok clients.

Session and turn values remain stable across retries. Per-session maps stay
bounded and expire through existing memory settings.

## Compaction Boundary

Codex remains owner of task compaction through its model catalog,
`model_context_window`, and `model_auto_compact_token_limit`. A Codex-generated
plain summary is normal message history and passes through the codec.

Do not emulate the Grok TUI compaction state machine. In particular, do not
blindly send `x-compaction-at` or `x-compactions-remaining`: official values
depend on per-model metadata and whether the Grok runtime already persisted a
compaction summary, state that stateless 9Router does not own.

Expose compaction metadata from `/v1/models` for observability and future
clients. Do not claim that OpenAI encrypted compaction blobs can be translated;
they cannot be decrypted by Grok.

## Error And Retry Policy

Request-schema failures are deterministic client/provider contract errors, not
account health failures.

- HTTP 400 and 422 do not lock a model or switch accounts by status alone.
- Existing text rules for capacity, overload, rate limits, and quota remain
  higher priority and may still switch accounts even when the status is 400.
- 401, 402, 403, 404, 429, and transient 5xx handling remain unchanged.
- Provider transport retries remain limited to configured transient statuses.

If the codec encounters a known optional field with no Grok equivalent, drop it
and record a diagnostic. If a future input item carries semantic content but no
safe mapping, return an immediate local compatibility error naming the item
index and type. Do not send it upstream and do not mark the account unhealthy.

## Verification

### Pure Unit Matrix

Use red-green tests for:

1. Top-level allowlist and immutability.
2. Instructions/system-message conversion and deduplication.
3. String, text-array, image, developer, assistant, and empty messages.
4. Foreign reasoning removal.
5. Native `rs_*` and `tco_*` reasoning preservation with status removal.
6. Reasoning content discriminator repair.
7. Function argument validation and output-only field removal.
8. String, scalar, JSON, text-array, and image-array function outputs.
9. Orphan removal, duplicate-result handling, and dangling-call repair.
10. Codex custom tool/call/output conversion.
11. Native x-search `ctc_*`/`xs_call-*` preservation.
12. Native web-search and code-interpreter history preservation.
13. Strict `web_search` fields and exact `x_search` shape.
14. Unsupported tool removal, deduplication, and hosted/function collision.
15. Tool-choice reconciliation.
16. Reasoning capability and `max -> xhigh` handling.
17. Structured-output normalization.
18. Idempotence and deterministic output.
19. Official inference/resource header separation.
20. HTTP 400/422 no-fallback behavior with capacity-text precedence.
21. Full official capability metadata parsing.

### Regression Matrix

Run existing Grok CLI, xAI, Responses, account fallback, usage, OAuth proxy,
model routing, and stream tests. Record known clean-upstream baseline failures
separately; no new failure may be hidden as baseline noise.

### Live Candidate Matrix

Run an isolated candidate on `127.0.0.1:20129` with a temporary copied DB and no
tunnel process. Required canaries:

1. Minimal text turn.
2. `web_search.external_web_access` input whose provider wire omits the field.
3. `web_search` with valid and invalid domain filters.
4. Native x-search turn followed by exact native `ctc_*`/`tco_*` replay.
5. Forced function call followed by typed text/image output.
6. Codex custom tool call/output continuation.
7. Structured JSON-schema output.
8. Malformed, duplicate, orphaned, and dangling function history.
9. Synthetic 463-item, approximately 1 MB mixed-provider history.
10. Concurrent requests with isolated session/request/model headers.
11. Deterministic 400/422 classification without account lock.

Inspect stored provider requests after each canary. Validate field shape, item
order, model, effort, usage attribution, and account identity. Delete temporary
credential-bearing candidate data after verification.

## Deployment

Build a separate candidate app. Do not replace the live tunnel-preserving CLI
wrapper.

Promotion sequence:

1. Back up live app and SQLite DB; verify SQLite integrity.
2. Require two consecutive zero-active-request gates.
3. Atomically exchange candidate and live app directories.
4. Restart only PM2 `9router`; do not restart or kill cloudflared.
5. Verify local health and one local inference canary.
6. Verify raw tunnel and `https://rkeyra9.abc-tunnel.us` health/inference.
7. Verify usage attribution, console output, DB integrity, PM2 policy, and
   tunnel PIDs.
8. Roll back app atomically on any failed gate; restore health before further
   diagnosis.

## Upstream And Local Boundaries

Update existing public PR #2590 with:

- compatibility codec;
- executor integration and official inference headers;
- model capability parsing;
- deterministic 400/422 fallback classification;
- focused public tests.

Keep these local only:

- `grok-4.5 -> grok-cli/grok-4.5` alias;
- residential pool and port `18889` binding;
- API keys, OAuth state, DB contents, emails, and proxy credentials;
- private GPT/Claude routing;
- deployment backups and local operational paths.

Update `docs/PATCH_LEDGER.md`, `docs/UPDATE_RUNBOOK.md`, and
`scripts/verify-local-patches.mjs` after deployment. Record pinned source commit,
test counts, canary evidence, backup paths, live commit, PR head, and exact
future-repatch checks.

## Deliberate Ceiling

This design provides complete compatibility for current Codex/OpenAI Responses
semantics that have a valid Grok Build wire equivalent. It does not and cannot
translate ciphertext produced by another provider, execute unsupported hosted
tools, or reproduce state owned by the Grok TUI. New Grok wire features require
a new pinned source revision, focused fixtures, and a live candidate canary
before acceptance.
