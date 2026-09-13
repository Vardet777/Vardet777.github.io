const KEY_PREFIX = "fp.key.";
const MODEL_PREFIX = "fp.model.";
export const PROVIDERS = [
  { id: "groq", label: "Groq", gratis: true, base: "https://api.groq.com/openai/v1", defaultModel: "llama-3.1-8b-instant", host: "api.groq.com", keyUrl: "https://console.groq.com/keys" },
  { id: "openrouter", label: "OpenRouter", gratis: true, base: "https://openrouter.ai/api/v1", defaultModel: "meta-llama/llama-3.2-3b-instruct:free", host: "openrouter.ai", keyUrl: "https://openrouter.ai/keys" },
  { id: "gemini", label: "Gemini", gratis: true, base: "https://generativelanguage.googleapis.com/v1beta", defaultModel: "gemini-2.0-flash", host: "generativelanguage.googleapis.com", keyUrl: "https://aistudio.google.com/apikey", compat: "gemini" },
  { id: "mistral", label: "Mistral", gratis: true, base: "https://api.mistral.ai/v1", defaultModel: "mistral-small-latest", host: "api.mistral.ai", keyUrl: "https://console.mistral.ai/api-keys" },
  { id: "cerebras", label: "Cerebras", gratis: true, base: "https://api.cerebras.ai/v1", defaultModel: "llama3.1-8b", host: "api.cerebras.ai", keyUrl: "https://cloud.cerebras.ai" },
  { id: "xai", label: "xAI", gratis: false, base: "https://api.x.ai/v1", defaultModel: "grok-4-1-fast-non-reasoning", host: "api.x.ai", keyUrl: "https://console.x.ai" }
];
export function getKey(id) { try { return localStorage.getItem(KEY_PREFIX + id) || ""; } catch { return ""; } }
export function setKey(id, value) { const v = String(value || "").trim(); if (!v) localStorage.removeItem(KEY_PREFIX + id); else localStorage.setItem(KEY_PREFIX + id, v); }
export function getModel(id) { const p = PROVIDERS.find((x) => x.id === id); try { return localStorage.getItem(MODEL_PREFIX + id) || p?.defaultModel || ""; } catch { return p?.defaultModel || ""; } }
export function setModel(id, value) { const v = String(value || "").trim(); if (!v) localStorage.removeItem(MODEL_PREFIX + id); else localStorage.setItem(MODEL_PREFIX + id, v); }
export function liveQueue() { return PROVIDERS.filter((p) => getKey(p.id)).map((p) => ({ ...p, key: getKey(p.id), model: getModel(p.id) || p.defaultModel })); }
async function openaiChat(provider, system, user) {
  const headers = { "content-type": "application/json", authorization: "Bearer " + provider.key };
  if (provider.id === "openrouter") { headers["HTTP-Referer"] = "https://vardet777.github.io/free-plugins/"; headers["X-Title"] = "Linnea Free-Plugins"; }
  const res = await fetch(provider.base.replace(/\/$/, "") + "/chat/completions", { method: "POST", headers, body: JSON.stringify({ model: provider.model, temperature: 0.4, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
  if (!res.ok) return { text: null, reason: "http_" + res.status };
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  return text ? { text: String(text).trim() } : { text: null, reason: "empty" };
}
async function geminiChat(provider, system, user) {
  const url = provider.base.replace(/\/$/, "") + "/models/" + encodeURIComponent(provider.model) + ":generateContent?key=" + encodeURIComponent(provider.key);
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }] }) });
  if (!res.ok) return { text: null, reason: "http_" + res.status };
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n");
  return text ? { text: String(text).trim() } : { text: null, reason: "empty" };
}
export async function generateFromQueue(system, user) {
  const attempts = [];
  for (const provider of liveQueue()) {
    try {
      const result = provider.compat === "gemini" ? await geminiChat(provider, system, user) : await openaiChat(provider, system, user);
      attempts.push({ id: provider.id, ok: Boolean(result.text), reason: result.reason || null });
      if (result.text) return { provider: provider.id, label: provider.label, model: provider.model, text: result.text, attempts };
    } catch { attempts.push({ id: provider.id, ok: false, reason: "network_or_cors" }); }
  }
  return { provider: "local", text: null, attempts };
}
