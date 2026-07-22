# Translated Responses Terminal Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make translated GitHub Claude streams emit one complete `response.completed` object containing exact model, ordered output history, and normalized usage.

**Architecture:** Keep ownership in the existing OpenAI Chat → Responses response translator. Capture facts already present in translated Chat chunks, retain completed items by their allocated output index, and include them in the existing terminal; persistence, routing, stream wrappers, and private canary validation remain unchanged.

**Tech Stack:** Node.js ESM, Vitest, existing 9Router translator registry and SSE stream pipeline.

## Global Constraints

- Do not relax terminal or usage validation and do not infer client-visible usage from SQLite.
- Preserve exactly one terminal and one `[DONE]`, sequence ordering, custom/function semantics, cancellation, fallback, cache accounting, and usage accuracy.
- No dependency, route, proxy, account, model, service, DB, or live-runtime change.
- Keep `18889` exactly `true_residential AND us`.
- One behavioral source commit; historical evidence remains immutable.

---

### Task 1: Complete translated Responses terminal payload

**Files:**
- Modify: `tests/unit/responses-transformer-item-index.test.js`
- Modify: `open-sse/translator/index.js:214-260`
- Modify: `open-sse/translator/response/openai-responses.js:17-430`

**Interfaces:**
- Consumes: `translateResponse(targetFormat, sourceFormat, chunk, state)` and `initState(FORMATS.OPENAI_RESPONSES)`.
- Produces: existing `response.completed` event whose `response` has `model`, ordered `output`, and Responses-shaped `usage`; no new public API.

- [ ] **Step 1: Add failing direct and Claude-pipeline regressions**

Extend the existing first item-index test so its finish chunk contains:

```js
{
  id: "chatcmpl-fable-index",
  model: "claude-fable-5",
  choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 1,
    total_tokens: 13,
    prompt_tokens_details: { cached_tokens: 2 },
  },
}
```

After existing index assertions, require terminal items in output-index order and exact model/usage:

```js
const completed = events.find(({ event }) => event === "response.completed")?.data.response;
expect(completed.model).toBe("claude-fable-5");
expect(completed.output.map((item) => item.type)).toEqual([
  "reasoning",
  "message",
  "function_call",
  "function_call",
]);
expect(completed.usage).toEqual({
  input_tokens: 12,
  input_tokens_details: { cached_tokens: 2 },
  output_tokens: 1,
  total_tokens: 13,
});
```

Add one real Claude → OpenAI Chat → Responses pipeline case:

```js
it("carries Claude model, output, and cache-aware usage into the terminal", () => {
  const state = initState(FORMATS.OPENAI_RESPONSES);
  state.created = 1;
  const chunks = [
    {
      type: "message_start",
      message: {
        id: "msg_terminal",
        model: "claude-fable-5",
        usage: { input_tokens: 10, output_tokens: 0, cache_read_input_tokens: 2 },
      },
    },
    { type: "content_block_start", index: 0, content_block: { type: "text" } },
    { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "OK" } },
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { output_tokens: 1 } },
    { type: "message_stop" },
  ];
  const events = chunks.flatMap((chunk) => translateResponse(
    FORMATS.CLAUDE,
    FORMATS.OPENAI_RESPONSES,
    chunk,
    state,
  ));
  const response = events.find(({ event }) => event === "response.completed")?.data.response;

  expect(response.model).toBe("claude-fable-5");
  expect(response.output).toMatchObject([{
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text: "OK" }],
  }]);
  expect(response.usage).toEqual({
    input_tokens: 12,
    input_tokens_details: { cached_tokens: 2 },
    output_tokens: 1,
    total_tokens: 13,
  });
});
```

- [ ] **Step 2: Run focused test and record RED**

Run:

```bash
TMPDIR="$PWD/.tmp" ./node_modules/.bin/vitest run \
  --config tests/vitest.config.js \
  --testTimeout 20000 \
  tests/unit/responses-transformer-item-index.test.js
```

Expected: assertions fail because terminal `model`, `output`, and `usage` are absent. Test collection and prior assertions must still pass.

- [ ] **Step 3: Add explicit terminal state**

In `initState(FORMATS.OPENAI_RESPONSES)`, add only:

```js
responseOutput: [],
responseUsage: null,
```

- [ ] **Step 4: Capture exact model and usage from Chat chunks**

Before the early `choices` return in `openaiToOpenAIResponsesResponse`, retain a nonempty model and normalize valid integer usage:

```js
if (typeof chunk.model === "string" && chunk.model) state.model = chunk.model;
if (chunk.usage && typeof chunk.usage === "object") {
  const inputTokens = chunk.usage.input_tokens ?? chunk.usage.prompt_tokens;
  const outputTokens = chunk.usage.output_tokens ?? chunk.usage.completion_tokens;
  const totalTokens = chunk.usage.total_tokens ?? inputTokens + outputTokens;
  if ([inputTokens, outputTokens, totalTokens]
    .every((value) => Number.isInteger(value) && value >= 0)) {
    state.responseUsage = {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
    };
    const inputDetails = chunk.usage.input_tokens_details ?? chunk.usage.prompt_tokens_details;
    const outputDetails = chunk.usage.output_tokens_details ?? chunk.usage.completion_tokens_details;
    if (inputDetails && typeof inputDetails === "object") {
      state.responseUsage.input_tokens_details = { ...inputDetails };
    }
    if (outputDetails && typeof outputDetails === "object") {
      state.responseUsage.output_tokens_details = { ...outputDetails };
    }
  }
}
```

Do not synthesize usage when input/output are absent or invalid. Keep usage-only `choices:[]` handling otherwise unchanged in this measured fix.
Add this ceiling beside the early return:

```js
// ponytail: A choices-empty usage chunk arriving after completion cannot amend
// the sent terminal; delay completion to stream flush if a required transport
// is observed using that ordering.
```

- [ ] **Step 5: Retain each completed item by output index**

In `closeReasoning`, `closeMessage`, and both branches of `closeToolCall`, build the existing `response.output_item.done.item` once, emit it, then assign:

```js
state.responseOutput[outputIndex] = item;
```

For reasoning use `state.reasoningIndex`; for messages use the existing message `outputIndex`; for tools use `state.funcOutputIndexes[idx]`. Do not append in close order because close order can differ from allocated output order.

- [ ] **Step 6: Complete the existing terminal**

Extend only the existing `sendCompleted` response object:

```js
model: state.model || null,
output: state.responseOutput.filter(Boolean),
...(state.responseUsage ? { usage: state.responseUsage } : {}),
```

Keep current terminal guard, sequence number, status, error, background flag, and event type unchanged.

- [ ] **Step 7: Run focused GREEN and broader regression**

Run:

```bash
TMPDIR="$PWD/.tmp" ./node_modules/.bin/vitest run \
  --config tests/vitest.config.js \
  --testTimeout 20000 \
  tests/unit/responses-transformer-item-index.test.js \
  tests/unit/responses-custom-tool-roundtrip.test.js \
  tests/unit/openai-responses-terminal-event.test.js \
  tests/unit/openai-responses-multiturn.test.js \
  tests/unit/responses-stream-to-json-usage.test.js \
  tests/unit/current-model-pricing.test.js \
  tests/unit/github-responses-routing.test.js
```

Expected: all selected tests pass; terminal/DONE counts remain unchanged.

- [ ] **Step 8: Static checks**

Run:

```bash
node --check open-sse/translator/response/openai-responses.js
node --check open-sse/translator/index.js
./node_modules/.bin/eslint \
  open-sse/translator/response/openai-responses.js \
  open-sse/translator/index.js \
  tests/unit/responses-transformer-item-index.test.js
git diff --check
```

Expected: syntax passes, zero new ESLint errors, clean diff.

- [ ] **Step 9: Self-review and commit**

Review exact diff for duplicate items, output ordering, usage field names,
terminal/DONE duplication, fallback/cancellation changes, content/identifier
leakage, and unrelated edits. Then run:

```bash
git add \
  open-sse/translator/index.js \
  open-sse/translator/response/openai-responses.js \
  tests/unit/responses-transformer-item-index.test.js
git commit -m "fix(responses): complete translated terminal payload"
```

Expected: one behavioral commit; `.artifacts/` and `.tmp/` remain untouched.
