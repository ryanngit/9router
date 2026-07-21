# Fable Custom Tool Round Trip Design

## Problem

Codex sends freeform tools such as `apply_patch` through the Responses API as
`custom` declarations and records their turns as `custom_tool_call` and
`custom_tool_call_output` items. GitHub Claude models use a Chat/Claude bridge.
The shared Responses-to-Chat translator currently turns a custom declaration
into an empty-schema function, ignores custom call history, and translates the
upstream call back as `function_call`. Codex therefore cannot dispatch or
continue the turn even though 9Router records HTTP 200.

The old `0.5.30` `{ input: string }` compatibility patch is scoped to xAI and
Grok CLI executors. It remains present. No prior GitHub/Fable round-trip patch
exists; update QA failed to cover this client contract.

## Design

At the shared Responses-to-Chat boundary, represent each custom tool as a Chat
function with one required string property named `input`. Convert custom call
history to the same wrapper and custom outputs to ordinary Chat tool results.
Attach the set of original custom tool names as internal request metadata, then
remove it before provider dispatch.

Thread that metadata into the existing response translation state. When an
upstream Chat tool call uses one of those names, unwrap its buffered JSON
`input` and emit the official Responses events:

- `response.output_item.added` with `type: custom_tool_call`
- `response.custom_tool_call_input.delta`
- `response.custom_tool_call_input.done`
- `response.output_item.done` with the complete plain-string `input`

Ordinary function tools retain existing event types and streaming behavior.
Malformed wrapped arguments fall back to their raw string so output is not
silently discarded.

`ponytail:` Chat and Anthropic tool schemas cannot enforce a Responses CFG.
The bridge preserves freeform text and tool identity, but not grammar-guided
sampling. Remove this ceiling when GitHub exposes native Responses custom tools.

## Boundaries

- No model aliases, routing, pool assignments, credentials, limits, affinity,
  usage accounting, tunnel settings, or Go gateway behavior change.
- Custom-name metadata is request-local and never enters provider JSON or DB
  request details.
- Streaming and forced-SSE-to-JSON paths must preserve tool type.
- Fallback/account switching remains unchanged.

## Verification

1. Red tests prove current code drops custom history and emits `function_call`.
2. Unit tests verify declaration wrapping, history conversion, mixed
   function/custom output, fragmented arguments, official terminal events, and
   one `[DONE]`.
3. Existing Fable index, Claude pairing, routing, terminal, heartbeat, affinity,
   and reservation tests remain green.
4. Isolated `127.0.0.1:20129` candidate performs a real Fable custom tool call
   and custom output continuation with no tunnel and stripped refresh tokens.
5. Live short-domain test repeats both turns before closeout.
