#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

function option(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const base = option("--base", "http://127.0.0.1:20128").replace(/\/$/, "");
const db = option("--db", "/home/home/.9router/db/data.sqlite");
const expectedConnection = option("--expect-connection");
const apiKeyId = option("--api-key-id");
if (apiKeyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKeyId)) {
  throw new Error("--api-key-id must be a UUID");
}

function sql(query, json = false) {
  const args = json ? ["-json", db, query] : [db, query];
  const result = spawnSync("sqlite3", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr.trim() || "sqlite3 failed");
  return json ? JSON.parse(result.stdout || "[]") : result.stdout.trim();
}

function parseSse(text) {
  const events = [];
  let done = 0;
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/)
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    if (data === "[DONE]") {
      done += 1;
      continue;
    }
    try {
      events.push(JSON.parse(data));
    } catch {
      throw new Error(`Invalid SSE JSON: ${data.slice(0, 160)}`);
    }
  }
  return { events, done };
}

async function request(body) {
  const response = await fetch(`${base}/v1/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "codex_cli_rs/0.136.0",
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`);
  const parsed = parseSse(text);
  const failure = parsed.events.find(event => event.type === "response.failed" || event.type === "error");
  if (failure) throw new Error(JSON.stringify(failure.error || failure.response?.error || failure));
  return parsed;
}

const apiKey = sql(apiKeyId
  ? `select key from apiKeys where id='${apiKeyId}' and isActive=1;`
  : "select key from apiKeys where isActive=1 order by createdAt limit 1;");
if (!apiKey) throw new Error("No active API key");

const startedAt = new Date().toISOString();
const suffix = crypto.randomBytes(5).toString("hex");
const toolInput = `*** Begin Patch\n*** Add File: p27-${suffix}.txt\n+P27_${suffix}\n*** End Patch`;
const marker = `P27_CONTINUATION_${suffix}`;
const first = await request({
  model: "claude-fable-5",
  stream: true,
  input: [{
    role: "user",
    content: [{
      type: "input_text",
      text: `Call apply_patch exactly once with this exact patch and do not answer with text:\n${toolInput}`,
    }],
  }],
  tools: [{
    type: "custom",
    name: "apply_patch",
    description: "Apply a patch. Input must be the complete raw patch beginning with *** Begin Patch.",
    format: { type: "text" },
  }],
  tool_choice: { type: "custom", name: "apply_patch" },
  parallel_tool_calls: false,
  reasoning: { effort: "max" },
  max_output_tokens: 1024,
});

const customDone = first.events.find(event => event.type === "response.custom_tool_call_input.done");
const customItem = first.events.find(event =>
  event.type === "response.output_item.done" && event.item?.type === "custom_tool_call")?.item;
if (!customDone || !customItem) throw new Error("Missing custom tool terminal events");
if (!customDone.input.includes(`P27_${suffix}`) || customItem.input !== customDone.input) {
  throw new Error(`Custom input mismatch: ${JSON.stringify(customDone.input)}`);
}
if (first.events.filter(event => event.type === "response.completed").length !== 1 || first.done !== 1) {
  throw new Error("First response must contain one completion and one [DONE]");
}

const second = await request({
  model: "claude-fable-5",
  stream: true,
  input: [
    {
      role: "user",
      content: [{
        type: "input_text",
        text: `Call apply_patch exactly once with this exact patch and do not answer with text:\n${toolInput}`,
      }],
    },
    {
      type: "custom_tool_call",
      call_id: customItem.call_id,
      name: customItem.name,
      input: customItem.input,
    },
    {
      type: "custom_tool_call_output",
      call_id: customItem.call_id,
      output: "Patch applied.",
    },
    {
      role: "user",
      content: [{ type: "input_text", text: `Reply with ${marker} only.` }],
    },
  ],
  reasoning: { effort: "max" },
  max_output_tokens: 256,
});

const text = second.events
  .filter(event => event.type === "response.output_text.delta")
  .map(event => event.delta || "")
  .join("");
if (!text.includes(marker)) throw new Error(`Continuation marker missing: ${JSON.stringify(text)}`);
if (second.events.filter(event => event.type === "response.completed").length !== 1 || second.done !== 1) {
  throw new Error("Continuation must contain one completion and one [DONE]");
}

const normal = await request({
  model: "claude-fable-5",
  stream: true,
  input: [{
    role: "user",
    content: [{ type: "input_text", text: `Call read_probe once with value ${suffix}.` }],
  }],
  tools: [{
    type: "function",
    name: "read_probe",
    description: "Receives one value.",
    parameters: {
      type: "object",
      properties: { value: { type: "string" } },
      required: ["value"],
    },
  }],
  tool_choice: { type: "function", name: "read_probe" },
  parallel_tool_calls: false,
  reasoning: { effort: "max" },
  max_output_tokens: 512,
});
const functionDone = normal.events.find(event => event.type === "response.function_call_arguments.done");
if (!functionDone || normal.events.some(event => event.type.startsWith("response.custom_tool_call_input."))) {
  throw new Error("Ordinary function control changed custom-tool type");
}
if (normal.events.filter(event => event.type === "response.completed").length !== 1 || normal.done !== 1) {
  throw new Error("Function control must contain one completion and one [DONE]");
}

let rows = [];
for (let attempt = 0; attempt < 40 && rows.length < 3; attempt += 1) {
  rows = sql(`
    select id,connectionId,status,
      instr(data,'_customToolNames') as metadataLeaks,
      json_extract(data,'$.providerRequest.tools[0].input_schema.properties.input.type') as inputType
    from requestDetails
    where timestamp >= '${startedAt}' and provider='github' and model='claude-fable-5'
    order by timestamp;
  `, true);
  if (rows.length < 3) await new Promise(resolve => setTimeout(resolve, 250));
}
if (rows.length !== 3) throw new Error(`Expected three stored requests, got ${rows.length}`);
const connectionId = rows[0].connectionId;
if (rows.some(row => row.connectionId !== connectionId || row.status !== "success")) {
  throw new Error(`Unexpected request rows: ${JSON.stringify(rows)}`);
}
if (expectedConnection && connectionId !== expectedConnection) {
  throw new Error(`Expected connection ${expectedConnection}, got ${connectionId}`);
}
if (rows.some(row => row.metadataLeaks !== 0)) throw new Error("Internal custom metadata was persisted");
if (rows[0].inputType !== "string") throw new Error(`Provider custom input schema is ${rows[0].inputType}`);

console.log(JSON.stringify({
  ok: true,
  connectionId,
  callId: customItem.call_id,
  customEvents: first.events.filter(event => event.type.startsWith("response.custom_tool_call_input.")).length,
  completed: 3,
  done: first.done + second.done + normal.done,
  marker,
}));
