const DEFAULT_TARGET = "cx/gpt-5.6-sol";
const DEFAULT_REASONING_EFFORT = "max";
const DEFAULT_SERVICE_TIER = "fast";

function envValue(env, key, fallback) {
  const value = env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function envEnabled(env) {
  const value = env?.NINE_ROUTER_BEST_GPT_ENABLED;
  if (value === undefined) return true;
  return !["0", "false", "off", "no"].includes(String(value).toLowerCase());
}

function modelPart(model) {
  if (typeof model !== "string") return "";
  const slash = model.indexOf("/");
  return slash === -1 ? model : model.slice(slash + 1);
}

function normalizeTarget(target) {
  return target.includes("/") ? target : `cx/${target}`;
}

export function getBestGptRouteConfig(env = process.env) {
  return {
    enabled: envEnabled(env),
    target: normalizeTarget(envValue(env, "NINE_ROUTER_BEST_GPT_TARGET", DEFAULT_TARGET)),
    reasoningEffort: envValue(env, "NINE_ROUTER_BEST_GPT_REASONING_EFFORT", DEFAULT_REASONING_EFFORT),
    serviceTier: envValue(env, "NINE_ROUTER_BEST_GPT_SERVICE_TIER", DEFAULT_SERVICE_TIER),
  };
}

export function isBestGptRouteCandidate(model) {
  return /^gpt-/i.test(modelPart(model));
}

export function applyBestGptRoute(body, env = process.env) {
  const config = getBestGptRouteConfig(env);
  const from = body?.model;
  if (!config.enabled || !isBestGptRouteCandidate(from)) {
    return { applied: false, body, model: from, config };
  }

  const next = { ...body, model: config.target };
  if (config.reasoningEffort) {
    next.reasoning_effort = config.reasoningEffort;
    const reasoning = next.reasoning && typeof next.reasoning === "object" && !Array.isArray(next.reasoning)
      ? { ...next.reasoning }
      : {};
    reasoning.effort = config.reasoningEffort;
    if (!reasoning.summary) reasoning.summary = "auto";
    next.reasoning = reasoning;
  }
  if (config.serviceTier) next.service_tier = config.serviceTier;

  return { applied: true, body: next, model: next.model, from, config };
}
