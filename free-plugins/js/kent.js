import { contextForAgent, rememberChat, addFact } from "./memory.js";
import { liveQueue, generateFromQueue } from "./providers.js";

const PROVIDER_SYSTEM = "Du är Kent i Free-Plugins, en separat agent i Vardet777:s privata verkstad. Linnea och Kent är två olika agenter. Svara på svenska, kort och konkret. Använd inte påhittade fakta om projektet. Använd bara den kontext som ges. Ändra aldrig filer, publicera aldrig och utför aldrig externa åtgärder bara genom att svara.";

function localReply(text) {
  const t = String(text || "").trim();
  const ctx = contextForAgent("kent");
  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) return "Kent. Jag är en separat agent från Linnea och använder samma delade minnessystem. Säg minne för att se sparad kontext.";
  const remember = t.match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (remember) { addFact({ agent: "kent", text: remember[2], tags: ["ägaren"] }); return "Sparat: " + remember[2]; }
  if (/^minne\b/i.test(t)) return ["Delat minne — Kent", ctx.facts || "Inga fakta än."].join("\n");
  if (/^klarhet\b/i.test(t)) return "Klarhet: Kent är separat från Linnea men kan läsa samma delade minneskontext.";
  if (/^fokus\b/i.test(t)) return "Fokus: håll Kent och Linnea som separata agentidentiteter.";
  if (/^risk\b/i.test(t)) return "Risk: blanda inte ihop Kent med Linnea eller ViccyK3.";
  addFact({ agent: "kent", text: t, tags: ["ägaren"] });
  return "Sparat: " + t + "\nSäg minne om du vill se listan.";
}

function isLocalCommand(text) {
  return /^(vad kan du|plugins|hjälp|minne|klarhet|fokus|risk)\b/i.test(String(text || "").trim()) || /^(kom ihåg|minns|spara)\s*[:\-]?\s*.+$/i.test(String(text || "").trim());
}

export async function answer(text) {
  const local = localReply(text);
  if (isLocalCommand(text) || liveQueue().length === 0) {
    rememberChat({ query: text, reply: local, agent: "kent" });
    return { text: local, source: "local" };
  }
  const ctx = contextForAgent("kent");
  const result = await generateFromQueue(
    PROVIDER_SYSTEM + "\nProjektkontext:\n" + JSON.stringify(ctx),
    String(text || "").trim()
  );
  const finalText = result.text || local;
  rememberChat({ query: text, reply: finalText, agent: "kent" });
  return {
    text: finalText,
    source: result.text ? result.provider : "local",
    provider: result.text ? result.label : "Lokal fallback",
    model: result.text ? result.model : null,
    attempts: result.attempts || []
  };
}
