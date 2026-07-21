// Helpers for OpenAI Responses API streaming termination + event framing
import { FORMATS } from "../translator/formats.js";
import { formatSSE } from "./streamHelpers.js";

// Responses API events that signal the stream has reached a terminal state
const OPENAI_RESPONSES_TERMINAL_EVENTS = new Set([
  "response.completed",
  "response.done",
  "response.incomplete",
  "response.failed",
  "error"
]);

const SUCCESS_TERMINAL_REASONS = new Set([
  "stop", "end_turn", "max_tokens", "length", "tool_use", "tool_calls",
  "function_call", "stop_sequence", "pause_turn", "refusal", "content_filter",
  "completed", "complete", "done", "finish", "finished", "safety", "recitation",
  "language", "other", "blocklist", "prohibited_content", "spii",
  "malformed_function_call", "image_safety", "image_prohibited_content", "no_image",
  "unexpected_tool_call", "too_many_tool_calls",
]);
const FAILED_TERMINAL_REASONS = new Set([
  "abort", "aborted", "cancelled", "canceled", "error", "failed",
]);

export function getStopReasonOutcome(reason) {
  if (typeof reason !== "string" || !reason.trim()) return null;
  const normalized = reason.trim().toLowerCase();
  if (FAILED_TERMINAL_REASONS.has(normalized)) return "failure";
  if (SUCCESS_TERMINAL_REASONS.has(normalized)) return "success";
  return null;
}

export function getOpenAIResponsesEventName(eventName, chunk) {
  if (eventName) return eventName;
  if (chunk && typeof chunk.type === "string") return chunk.type;
  return null;
}

export function isOpenAIResponsesTerminalEvent(eventName, chunk) {
  const type = getOpenAIResponsesEventName(eventName, chunk);
  if (OPENAI_RESPONSES_TERMINAL_EVENTS.has(type)) return true;
  const status = chunk?.response?.status;
  return status === "completed" || status === "incomplete" || status === "failed";
}

export function isOpenAIResponsesSuccessfulTerminalEvent(eventName, chunk) {
  const type = getOpenAIResponsesEventName(eventName, chunk);
  if (type === "response.completed" || type === "response.done" || type === "response.incomplete") {
    return true;
  }
  const status = chunk?.response?.status;
  return status === "completed" || status === "incomplete";
}

const sharedEncoder = new TextEncoder();

// Encoded response.failed + [DONE] payload for aborted/stalled Responses passthrough streams
export function buildAbortedResponsesTerminalBytes({ terminalSeen = false, doneSeen = false, model } = {}) {
  if (doneSeen) return null;
  const failed = terminalSeen ? "" : formatIncompleteOpenAIResponsesStreamFailure({ model });
  return sharedEncoder.encode(`${failed}data: [DONE]\n\n`);
}

export function buildResponsesFailureTerminalBytes(message, options = {}) {
  return sharedEncoder.encode(`${formatOpenAIResponsesStreamFailure(message, options)}data: [DONE]\n\n`);
}

// Synthesize a response.failed event for streams that close without a terminal event
export function formatIncompleteOpenAIResponsesStreamFailure({ model } = {}) {
  return formatOpenAIResponsesStreamFailure(
    "stream closed before response.completed",
    { code: "stream_disconnected", model },
  );
}

function formatOpenAIResponsesStreamFailure(message, {
  code = "upstream_error",
  model = "unknown",
  sequenceNumber = 1,
} = {}) {
  const now = Date.now();
  return formatSSE({
    event: "response.failed",
    data: {
      type: "response.failed",
      sequence_number: sequenceNumber,
      response: {
        id: `resp_${now}_${Math.random().toString(36).slice(2, 8)}`,
        object: "response",
        created_at: Math.floor(now / 1000),
        status: "failed",
        incomplete_details: null,
        instructions: null,
        metadata: {},
        model: model || "unknown",
        output: [],
        parallel_tool_calls: true,
        temperature: null,
        tool_choice: "auto",
        tools: [],
        top_p: null,
        error: {
          code,
          message,
        }
      }
    }
  }, FORMATS.OPENAI_RESPONSES);
}
