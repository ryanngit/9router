# Fable Responses Stream Integrity Design

## Problem

GitHub Claude models use Copilot's `/v1/messages` endpoint, then pass through
Claude-to-OpenAI and Chat-to-Responses stream translators. The final translator
uses Chat choice and tool indexes as Responses `output_index` values. A Fable
turn containing both reasoning and a tool call therefore emits two distinct
items at `output_index: 0`. Codex does not continue the tool turn reliably, while
9Router records the upstream HTTP 200 as a success and stores an empty response.

## Design

Keep current GitHub `/v1/messages` route and cache-token accounting. Change only
the shared Chat-to-Responses transformer:

- Allocate one monotonically increasing output index when each reasoning,
  message, or function-call item is first seen.
- Reuse that allocated index for every delta and terminal event for that item.
- Preserve existing event names, IDs, sequence numbers, response lifecycle, and
  provider routing.
- Keep fallback, account affinity, quota accounting, heartbeat behavior, and Go
  gateway behavior unchanged.

## Verification

Add direct transformer regressions for reasoning plus one tool call and for
reasoning plus multiple tool calls. Assert unique indexes, stable indexes across
item events, one `response.completed`, and one `[DONE]`. Run focused tests, full
stream/translator tests, local Fable tool-call and continuation canaries, then a
short-URL canary before promotion.

## Deployment

Build outside the live app, run patch verification and DB integrity checks,
back up app and DB, then promote with one PM2 restart. Verify local, raw tunnel,
and short URL health. Roll back app only if protocol canary or health fails.

## Non-Goals

No endpoint rollback, provider-specific transformer, model alias change, proxy
pool change, or broader stream refactor.
