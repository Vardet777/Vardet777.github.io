/**
 * Model queue for Linnea. One source for phone + server.
 * Order: Groq free → OpenRouter free → xAI only if useXai.
 */
export const PROVIDER_VERSION = "1.0.0";

export const FREE_PROVIDERS = [
  {
    id: "groq",
    label: "Groq",
    base: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    keyField: "groqKey",
    modelField: "groqModel",
    path: "klistra Groq-nyckel. Gratis-tier, inte Copilot."
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    base: "https://openrouter.ai/api/v1",
    defaultModel: "meta-llama/llama-3.2-3b-instruct:free",
    keyField: "orKey",
    modelField: "orModel",
    path: "klistra OpenRouter-nyckel + :free-modell. Provas från enheten."
  }
];

export const XAI_PROVIDER = {
  id: "xai",
  label: "xAI",
  base: "https://api.x.ai/v1",
  defaultModel: "grok-4.6",
  keyField: "llmKey",
  modelField: "llmModel",
  path: "betald. Används bara om useXai är på och nyckel finns."
};

export const MISSING_PATHS = [
  { id: "copilot", label: "Microsoft Copilot", path: "saknar väg" },
  { id: "gemini", label: "Gemini", path: "saknar väg" },
  { id: "claude", label: "Claude", path: "saknar väg" },
  { id: "deepsearch", label: "Deep search", path: "saknar väg" }
];

export function queueFromSettings(settings = {}) {
  const queue = [];
  for (const p of FREE_PROVIDERS) {
    const key = String(settings[p.keyField] || "").trim();
    if (!key) continue;
    queue.push({
      ...p,
      key,
      model: String(settings[p.modelField] || p.defaultModel).trim() || p.defaultModel,
      base: p.base
    });
  }
  const useXai = settings.useXai === true || settings.useXai === "1" || settings.useXai === "true";
  const xaiKey = String(settings.llmKey || "").trim();
  if (useXai && xaiKey) {
    queue.push({
      ...XAI_PROVIDER,
      key: xaiKey,
      model: String(settings.llmModel || XAI_PROVIDER.defaultModel).trim() || XAI_PROVIDER.defaultModel,
      base: String(settings.llmBase || XAI_PROVIDER.base).replace(/\/$/, "") || XAI_PROVIDER.base
    });
  }
  return queue;
}

export function describePaths(settings = {}) {
  const live = queueFromSettings(settings).map((p) => `${p.label} (${p.model})`);
  return {
    live,
    local: true,
    missing: MISSING_PATHS.map((m) => `${m.label}: ${m.path}`),
    xaiArmed: queueFromSettings(settings).some((p) => p.id === "xai")
  };
}

const ALLOWED_HOSTS = ["api.groq.com", "openrouter.ai", "api.x.ai"];

function hostAllowed(base, providerId) {
  try {
    const host = new URL(base).host;
    if (providerId === "groq") return host === "api.groq.com";
    if (providerId === "openrouter") return host === "openrouter.ai";
    if (providerId === "xai") return host === "api.x.ai";
    return ALLOWED_HOSTS.includes(host);
  } catch {
    return false;
  }
}

async function tryChat(provider, system, messages) {
  if (!hostAllowed(provider.base, provider.id)) {
    return { text: null, reason: "base_not_allowed" };
  }
  const url = `${String(provider.base).replace(/\/$/, "")}/chat/completions`;
  const headers = {
    "content-type": "application/json",
    authorization: `Bearer ${provider.key}`
  };
  if (provider.id === "openrouter") {
    headers["HTTP-Referer"] = "https://linnea.local";
    headers["X-Title"] = "Linnea";
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.7,
      messages: [{ role: "system", content: system }, ...messages]
    })
  });
  if (!res.ok) {
    return { text: null, reason: `http_${res.status}` };
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text || !String(text).trim()) return { text: null, reason: "empty_completion" };
  return { text: String(text).trim(), reason: null };
}

export async function generateFromQueue({ system, messages, settings }) {
  const queue = queueFromSettings(settings);
  const attempts = [];
  for (const provider of queue) {
    try {
      const result = await tryChat(provider, system, messages);
      attempts.push({ id: provider.id, ok: Boolean(result.text), reason: result.reason || null });
      if (result.text) {
        return {
          provider: provider.id,
          label: provider.label,
          model: provider.model,
          text: result.text,
          attempts
        };
      }
    } catch {
      attempts.push({ id: provider.id, ok: false, reason: "network_or_cors" });
    }
  }
  return {
    provider: "local",
    label: "lokal",
    model: null,
    text: null,
    reason: queue.length ? "cloud_failed" : "no_cloud",
    attempts
  };
}

export function statusLabel(provider, model) {
  if (!provider || provider === "local" || provider === "persona") return "lokal";
  if (provider === "tool") return "lokal · kommando";
  if (provider === "groq") return model ? `Groq · ${model}` : "Groq";
  if (provider === "openrouter") return model ? `OpenRouter · ${model}` : "OpenRouter";
  if (provider === "xai" || provider === "llm") return model ? `xAI · ${model}` : "xAI";
  return String(provider);
}
