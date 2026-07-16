# Grok CLI Hosted-Tool Translation Design

Date: 2026-07-15

## Goal

Complete the Grok CLI provider boundary for hosted tools so Codex/OpenAI-only tool fields never reach `cli-chat-proxy.grok.com`.

This is not a universal provider translator. Existing Grok CLI translation remains responsible for top-level request filtering, reasoning effort, cross-provider history, custom/function calls, structured outputs, and tool choice. This change completes hosted-tool translation inside that boundary.

## Source Of Truth

Pin behavior to `xai-org/grok-build` commit `b189869b7755d2b482969acf6c92da3ecfeffd36`:

- `HostedTool` defines only backend `web_search` and `x_search`.
- `web_search` serializes as its type plus optional `filters.allowed_domains`.
- `x_search` serializes as exactly `{ "type": "x_search" }`.
- Backend-hosted tools win name collisions with client function tools.

The live backend independently confirms this contract: a minimal `web_search` request with `external_web_access` returns HTTP 400, while the same request without that field completes.

## Translation

Add a pure hosted-tool normalizer in `open-sse/executors/grok-cli.js` and call it from the existing tool normalization pass.

- Rebuild `web_search` from scratch. Retain only `type` and validated non-empty string entries from `filters.allowed_domains`.
- Rebuild `x_search` as only its type.
- Drop unsupported hosted types such as `web_search_preview`, `file_search`, `image_generation`, `code_interpreter`, `mcp`, and `local_shell`.
- Preserve existing function and custom-tool conversion.
- Deduplicate hosted types and drop function tools whose names collide with retained hosted types; hosted tools win, matching official Grok Build.
- Revalidate `tool_choice` after filtering. Remove choices that reference dropped tools; retain valid function or hosted choices.

Unknown fields are dropped instead of forwarded. Adding a new hosted field or type requires evidence from a newer pinned Grok Build source commit plus a backend canary.

## Error Handling

- Malformed tools are dropped without throwing.
- Invalid or empty `allowed_domains` entries are removed.
- Empty tool sets remove `tools` and `tool_choice` together.
- Function/custom schemas keep existing trust-boundary validation.
- No retry hides provider HTTP 400. Sanitization occurs before the first provider attempt.

## Verification

Use red-green tests for:

1. `external_web_access` and unrelated fields removed from `web_search` while valid domain filters survive.
2. `x_search` rebuilt without extra fields.
3. Unsupported hosted types removed.
4. Hosted/function name collision resolved in favor of hosted tool.
5. Invalid `tool_choice` removed after filtering.
6. Existing function/custom translation unchanged.
7. Existing Grok CLI, xAI, and Responses multi-turn suites remain green.

Candidate QA must include:

- Exact failing long Codex history through isolated `127.0.0.1:20129`.
- A minimal `web_search.external_web_access` request whose stored provider wire omits the field.
- Native encrypted two-turn continuation.
- Source/bundle/DB verifier, lint, build, and SQLite integrity checks.

## Deployment And Upstream

Build into a separate staged app directory. Promote only at two consecutive zero-active gates using atomic exchange, one PM2 restart, rollback protection, and guarded tunnel recovery. Verify local, raw, and short-domain health before cleanup.

Update existing public PR #2590 with executor and tests. Keep private aliases, proxy pools, DB state, deployment scripts, and local ledger details out of upstream.
