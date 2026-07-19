import { convertResponsesStreamToJson } from "../../transformer/streamToJsonConverter.js";
import { createErrorResult } from "../../utils/error.js";
import { HTTP_STATUS } from "../../config/runtimeConfig.js";
import { FORMATS } from "../../translator/formats.js";
import { OPENAI_FINISH, RESPONSES_ITEM, ROLE } from "../../translator/schema/index.js";
import { extractReasoningText } from "../../translator/concerns/reasoning.js";
import { PROVIDERS } from "../../config/providers.js";
import { buildRequestDetail, extractRequestConfig, saveUsageStats, formatDoneLine } from "./requestDetail.js";

// Responses-API providers (e.g. codex) may emit SSE without content-type + use Responses output shape
const isResponsesProvider = (p) => PROVIDERS[p]?.format === FORMATS.OPENAI_RESPONSES;
import { saveRequestDetail, appendRequestLog } from "@/lib/usageDb.js";

function textFromResponsesMessageItem(item) {
  if (!item?.content || !Array.isArray(item.content)) return "";
  const byType = item.content.find((c) => c.type === "output_text");
  if (typeof byType?.text === "string") return byType.text;
  const anyText = item.content.find((c) => typeof c.text === "string");
  if (typeof anyText?.text === "string") return anyText.text;
  return "";
}

/**
 * Codex / Responses API may emit many alternating reasoning + message items.
 * Early message blocks often have empty output_text; the user-visible answer is usually in the last non-empty message.
 */
function pickAssistantMessageForChatCompletion(output) {
  if (!Array.isArray(output)) return { msgItem: null, textContent: null };
  const messages = output.filter((item) => item?.type === "message");
  if (messages.length === 0) return { msgItem: null, textContent: null };
  for (let i = messages.length - 1; i >= 0; i--) {
    const text = textFromResponsesMessageItem(messages[i]);
    if (text.length > 0) return { msgItem: messages[i], textContent: text };
  }
  const last = messages[messages.length - 1];
  return { msgItem: last, textContent: textFromResponsesMessageItem(last) };
}

function reasoningFromResponsesOutput(output) {
  const items = Array.isArray(output) ? output.filter((item) => item?.type === RESPONSES_ITEM.REASONING) : [];
  const text = items.flatMap((item) => [...(item.summary || []), ...(item.content || [])])
    .map((part) => part?.text)
    .filter((part) => typeof part === "string" && part.length > 0)
    .join("\n");
  const encrypted = items.findLast((item) => typeof item.encrypted_content === "string" && item.encrypted_content)?.encrypted_content;
  return { text, encrypted };
}

function finishReasonFromResponses(jsonResponse, hasToolCalls) {
  if (jsonResponse?.status === "incomplete") {
    switch (jsonResponse?.incomplete_details?.reason) {
      case "max_output_tokens": return OPENAI_FINISH.LENGTH;
      case "content_filter": return OPENAI_FINISH.CONTENT_FILTER;
      default: return OPENAI_FINISH.STOP;
    }
  }
  return hasToolCalls ? OPENAI_FINISH.TOOL_CALLS : OPENAI_FINISH.STOP;
}

export function responsesJsonToOpenAIResponse(jsonResponse, fallbackModel) {
  const { textContent } = pickAssistantMessageForChatCompletion(jsonResponse?.output);
  const functionCalls = (jsonResponse?.output || []).filter((item) => item?.type === "function_call");
  const toolCalls = functionCalls.map((item, index) => ({
    id: item.call_id || `call_${item.name || "tool"}_${Date.now()}_${index}`,
    type: "function",
    function: {
      name: item.name || "",
      arguments: typeof item.arguments === "string" ? item.arguments : JSON.stringify(item.arguments || {}),
    },
  }));
  const message = {
    role: ROLE.ASSISTANT,
    content: textContent || (toolCalls.length > 0 ? null : ""),
  };
  if (toolCalls.length > 0) message.tool_calls = toolCalls;
  const reasoning = reasoningFromResponsesOutput(jsonResponse?.output);
  if (reasoning.text) message.reasoning_content = reasoning.text;
  if (reasoning.encrypted) message.encrypted_content = reasoning.encrypted;

  const usage = jsonResponse?.usage || {};
  const inputTokens = usage.input_tokens || 0;
  const outputTokens = usage.output_tokens || 0;
  const response = {
    id: jsonResponse?.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: jsonResponse?.created_at || Math.floor(Date.now() / 1000),
    model: jsonResponse?.model || fallbackModel || "unknown",
    choices: [{
      index: 0,
      message,
      finish_reason: finishReasonFromResponses(jsonResponse, toolCalls.length > 0),
    }],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: usage.total_tokens || inputTokens + outputTokens,
    },
  };
  if (usage.input_tokens_details) response.usage.prompt_tokens_details = usage.input_tokens_details;
  if (usage.output_tokens_details) response.usage.completion_tokens_details = usage.output_tokens_details;
  return response;
}

export function openAIJsonToResponsesResponse(jsonResponse, fallbackModel) {
  const choice = jsonResponse?.choices?.[0] || {};
  const message = choice.message || {};
  const responseId = String(jsonResponse?.id || `resp_${Date.now()}`);
  const output = [];
  const reasoningText = message.provider_specific_fields?.reasoning_content || extractReasoningText(message);
  const encryptedContent = message.encrypted_content || message.reasoning_encrypted_content || message.reasoning?.encrypted_content;

  if (reasoningText || encryptedContent) {
    const reasoning = { id: `rs_${responseId}`, type: RESPONSES_ITEM.REASONING, summary: [] };
    if (reasoningText) reasoning.summary.push({ type: RESPONSES_ITEM.SUMMARY_TEXT, text: reasoningText });
    if (encryptedContent) reasoning.encrypted_content = encryptedContent;
    output.push(reasoning);
  }

  const toolCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls.filter((toolCall) => toolCall?.function?.name)
    : [];
  const textContent = typeof message.content === "string"
    ? message.content
    : Array.isArray(message.content)
      ? message.content.map((part) => part?.text || "").join("")
      : "";
  if (textContent || toolCalls.length === 0) {
    output.push({
      id: `msg_${responseId}`,
      type: RESPONSES_ITEM.MESSAGE,
      role: ROLE.ASSISTANT,
      content: [{ type: RESPONSES_ITEM.OUTPUT_TEXT, text: textContent, annotations: [] }],
    });
  }
  for (const toolCall of toolCalls) {
    output.push({
      id: `fc_${toolCall.id || toolCall.function.name}`,
      type: RESPONSES_ITEM.FUNCTION_CALL,
      call_id: toolCall.id || `call_${toolCall.function.name}`,
      name: toolCall.function.name,
      arguments: typeof toolCall.function.arguments === "string"
        ? toolCall.function.arguments
        : JSON.stringify(toolCall.function.arguments || {}),
    });
  }

  const finishReason = choice.finish_reason;
  const incompleteReason = finishReason === OPENAI_FINISH.LENGTH
    ? "max_output_tokens"
    : finishReason === OPENAI_FINISH.CONTENT_FILTER ? "content_filter" : null;
  const usage = jsonResponse?.usage || {};
  const inputTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
  const outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
  const response = {
    id: responseId.startsWith("resp_") ? responseId : `resp_${responseId}`,
    object: "response",
    created_at: jsonResponse?.created || Math.floor(Date.now() / 1000),
    status: incompleteReason ? "incomplete" : "completed",
    model: jsonResponse?.model || fallbackModel || "unknown",
    output,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: usage.total_tokens ?? inputTokens + outputTokens,
    },
  };
  if (usage.prompt_tokens_details) response.usage.input_tokens_details = usage.prompt_tokens_details;
  if (usage.completion_tokens_details) response.usage.output_tokens_details = usage.completion_tokens_details;
  if (incompleteReason) response.incomplete_details = { reason: incompleteReason };
  return response;
}

/**
 * Parse OpenAI-style SSE text into a single chat completion JSON.
 * Used when provider forces streaming but client wants non-streaming.
 */
export function parseSSEToOpenAIResponse(rawSSE, fallbackModel) {
  const chunks = [];

  for (const line of String(rawSSE || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try { chunks.push(JSON.parse(payload)); } catch { /* ignore malformed lines */ }
  }

  if (chunks.length === 0) return null;

  const first = chunks[0];
  const contentParts = [];
  const reasoningParts = [];
  const toolCallMap = new Map(); // index -> { id, type, function: { name, arguments } }
  let finishReason = "stop";
  let usage = null;

  for (const chunk of chunks) {
    const choice = chunk?.choices?.[0];
    const delta = choice?.delta || {};
    if (typeof delta.content === "string" && delta.content.length > 0) contentParts.push(delta.content);
    if (typeof delta.reasoning_content === "string" && delta.reasoning_content.length > 0) reasoningParts.push(delta.reasoning_content);
    if (choice?.finish_reason) finishReason = choice.finish_reason;
    if (chunk?.usage && typeof chunk.usage === "object") usage = chunk.usage;

    // Accumulate tool_calls from streaming deltas
    if (Array.isArray(delta.tool_calls)) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolCallMap.has(idx)) {
          toolCallMap.set(idx, { id: tc.id || "", type: "function", function: { name: "", arguments: "" } });
        }
        const existing = toolCallMap.get(idx);
        if (tc.id) existing.id = tc.id;
        if (tc.function?.name) existing.function.name += tc.function.name;
        if (tc.function?.arguments) existing.function.arguments += tc.function.arguments;
      }
    }
  }

  const message = { role: "assistant", content: contentParts.join("") || (toolCallMap.size > 0 ? null : "") };
  if (reasoningParts.length > 0) message.reasoning_content = reasoningParts.join("");
  if (toolCallMap.size > 0) {
    message.tool_calls = [...toolCallMap.entries()].sort((a, b) => a[0] - b[0]).map(([, tc]) => tc);
  }

  const result = {
    id: first.id || `chatcmpl-${Date.now()}`,
    object: "chat.completion",
    created: first.created || Math.floor(Date.now() / 1000),
    model: first.model || fallbackModel || "unknown",
    choices: [{ index: 0, message, finish_reason: finishReason }]
  };
  if (usage) result.usage = usage;
  return result;
}

/**
 * Handle case: provider forced streaming but client wants JSON.
 * Supports both Codex/Responses API SSE and standard Chat Completions SSE.
 */
export async function handleForcedSSEToJson({ requestId, providerResponse, sourceFormat, provider, model, body, stream, translatedBody, finalBody, requestStartTime, connectionId, apiKey, clientRawRequest, onRequestSuccess, trackDone, appendLog, reqTag, log }) {
  const contentType = providerResponse.headers.get("content-type") || "";
  const isSSE = contentType.includes("text/event-stream") || (contentType === "" && isResponsesProvider(provider));
  if (!isSSE) return null; // not handled here

  trackDone();

  const ctx = {
    id: requestId,
    provider, model, connectionId,
    request: extractRequestConfig(body, stream),
    providerRequest: finalBody || translatedBody || null
  };

  // Codex/Responses API SSE path
  const isCodexResponsesApi = isResponsesProvider(provider) || sourceFormat === FORMATS.OPENAI_RESPONSES;
  if (isCodexResponsesApi) {
    try {
      const jsonResponse = await convertResponsesStreamToJson(providerResponse.body);
      if (jsonResponse.status === "failed" || jsonResponse.error) {
        const message = jsonResponse.error?.message || "Responses stream failed";
        appendLog({ status: `FAILED ${HTTP_STATUS.BAD_GATEWAY}` });
        return createErrorResult(HTTP_STATUS.BAD_GATEWAY, message);
      }
      if (onRequestSuccess) await onRequestSuccess();

      const usage = jsonResponse.usage || {};
      appendLog({ tokens: usage, status: "200 OK" });
      saveUsageStats({
        provider,
        model,
        tokens: usage,
        connectionId,
        apiKey,
        apiKeyClient: clientRawRequest?.apiKeyClient,
        endpoint: clientRawRequest?.endpoint,
        serviceTier: finalBody?.service_tier ?? translatedBody?.service_tier ?? body?.service_tier,
        silent: true
      });
      if (log?.line) log.line(reqTag, "📊", formatDoneLine({ usage, latency: { total: Date.now() - requestStartTime } }));

      const { msgItem, textContent } = pickAssistantMessageForChatCompletion(jsonResponse.output);
      const totalLatency = Date.now() - requestStartTime;

      saveRequestDetail(buildRequestDetail({
        ...ctx,
        latency: { ttft: totalLatency, total: totalLatency },
        tokens: { prompt_tokens: usage.input_tokens || 0, completion_tokens: usage.output_tokens || 0 },
        response: { content: textContent, thinking: null, finish_reason: jsonResponse.status || "unknown" },
        status: "success"
      }, { endpoint: clientRawRequest?.endpoint || null })).catch(() => {});

      // Client is Responses API → return as-is
      if (sourceFormat === FORMATS.OPENAI_RESPONSES) {
        return { success: true, response: new Response(JSON.stringify(jsonResponse), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }) };
      }

      // Build client-format response
      const inTokens = usage.input_tokens || 0;
      const outTokens = usage.output_tokens || 0;
      let finalResp;

      if (sourceFormat === FORMATS.ANTIGRAVITY || sourceFormat === FORMATS.GEMINI || sourceFormat === FORMATS.GEMINI_CLI) {
        finalResp = {
          response: {
            candidates: [{ content: { role: "model", parts: [{ text: textContent || "" }] }, finishReason: "STOP", index: 0 }],
            usageMetadata: { promptTokenCount: inTokens, candidatesTokenCount: outTokens, totalTokenCount: inTokens + outTokens },
            modelVersion: model,
            responseId: jsonResponse.id || `resp_${Date.now()}`
          }
        };
      } else {
        finalResp = responsesJsonToOpenAIResponse(jsonResponse, model);
      }

      return { success: true, response: new Response(JSON.stringify(finalResp), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }) };
    } catch (err) {
      console.error("[ChatCore] Responses API SSE→JSON failed:", err);
      return createErrorResult(HTTP_STATUS.BAD_GATEWAY, "Failed to convert streaming response to JSON");
    }
  }

  // Standard Chat Completions SSE path
  try {
    const sseText = await providerResponse.text();
    const parsed = parseSSEToOpenAIResponse(sseText, model);
    if (!parsed) return createErrorResult(HTTP_STATUS.BAD_GATEWAY, "Invalid SSE response for non-streaming request");

    if (onRequestSuccess) await onRequestSuccess();

    const usage = parsed.usage || {};
    appendLog({ tokens: usage, status: "200 OK" });
    saveUsageStats({
      provider,
      model,
      tokens: usage,
      connectionId,
      apiKey,
      apiKeyClient: clientRawRequest?.apiKeyClient,
      endpoint: clientRawRequest?.endpoint,
      serviceTier: finalBody?.service_tier ?? translatedBody?.service_tier ?? body?.service_tier,
      silent: true
    });
    if (log?.line) log.line(reqTag, "📊", formatDoneLine({ usage, latency: { total: Date.now() - requestStartTime } }));

    const totalLatency = Date.now() - requestStartTime;
    saveRequestDetail(buildRequestDetail({
      ...ctx,
      latency: { ttft: totalLatency, total: totalLatency },
      tokens: usage,
      response: {
        content: parsed.choices?.[0]?.message?.content || null,
        thinking: parsed.choices?.[0]?.message?.reasoning_content || null,
        finish_reason: parsed.choices?.[0]?.finish_reason || "unknown"
      },
      status: "success"
    }, { endpoint: clientRawRequest?.endpoint || null })).catch(() => {});

    // Strip reasoning_content only when content is non-empty.
    // When content is empty (e.g. thinking models that used all tokens for reasoning),
    // reasoning_content is the only useful output and must be preserved.
    // Previously this was unconditional, which broke Qwen3.5, Claude extended thinking, etc.
    if (parsed?.choices) {
      for (const choice of parsed.choices) {
        if (choice?.message?.reasoning_content && choice.message.content) {
          delete choice.message.reasoning_content;
        }
      }
    }

    return { success: true, response: new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }) };
  } catch (err) {
    console.error("[ChatCore] Chat Completions SSE→JSON failed:", err);
    return createErrorResult(HTTP_STATUS.BAD_GATEWAY, "Failed to convert streaming response to JSON");
  }
}
