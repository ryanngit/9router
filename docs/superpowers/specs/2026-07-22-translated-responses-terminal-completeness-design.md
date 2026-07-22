# Translated Responses Terminal Completeness

Date: 2026-07-22

## Problem

GitHub Claude streams are translated through Claude → OpenAI Chat → OpenAI
Responses. Intermediate state contains exact model, completed output items, and
usage, but `response.completed.response` currently emits none of them. Live
Phase 1C therefore completed one near-limit stream and persisted exact usage,
then failed strict terminal-usage validation. Cross-model history extraction
would also fail because terminal `output` is absent.

## Decision

Fix the owning OpenAI Chat → Responses response translator. Preserve accumulated
model, completed output items, and exact OpenAI usage under Responses field names
in the single `response.completed` event. Do not infer terminal fields from
SQLite, relax canary validation, change routing, or add an outer stream repair.

## Data flow

1. Capture model and final OpenAI usage from translated Chat chunks.
2. Retain each reasoning, message, custom-tool, and function item exactly once
   when its existing `response.output_item.done` event is emitted.
3. Build the existing single terminal with accumulated `model`, `output`, and
   `usage`; keep sequence numbers, event ordering, and `[DONE]` behavior intact.
4. Leave persistence/accounting callbacks unchanged; this patch only completes
   client-visible terminal representation from already-known facts.

## Failure handling

Missing upstream usage remains missing; no token estimate is invented in the
translator. Existing stream failure, incomplete, cancellation, fallback, and
account-lock behavior stays unchanged.

## Verification

- RED first: a complete Claude stream through the real translator pipeline must
  fail because terminal model/output/usage are absent.
- GREEN: terminal contains exact model, message output, input/output/total token
  values, and cache detail; exactly one completion and one `[DONE]` remain.
- Run focused custom-tool/terminal/usage tests, broader Responses and Claude
  translation matrix, ESLint, syntax, diff, production build/verifier, isolated
  candidate canary, privacy scan, and independent review before any live retry.

## Rollback

Source rollback is one commit. Any later live promotion uses the existing
atomic app exchange and retained prior bundle/SQLite backup; 9Router and Go
gateway are never restarted together.
