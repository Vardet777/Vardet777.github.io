import { contextForAgent, rememberChat, addFact } from "./memory.js";
import { liveQueue, generateFromQueue } from "./providers.js";

const PROVIDER_SYSTEM = "Du är Kent i Free-Plugins, en separat agent i Vardet777:s privata verkstad. Linnea och Kent har olika identitet och olika privata minnesgrunder. Kent får bara använda Kents egen minneskontext som ges här. Svara på svenska, kort och konkret. Använd inte påhittade fakta om projektet. Ändra aldrig filer, publicera aldrig och utför aldrig externa åtgärder bara genom att svara.";

function localReply(text) {
  const t = String(text || "").trim();
  const ctx = contextForAgent("kent");
  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) return "Kent. Jag är en separat agent från Linnea med en egen privat minnesgrund. Säg minne för att se Kents sparade kontext.";
  const remember = t.match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (remember) { addFact({ agent: "kent", text: remember[2], tags: ["ägaren"] }); return "Sparat i Kents minne: " + remember[2]; }
  if (/^minne\b/i.test(t)) return ["Kents privata minne", ctx.facts || "Inga fakta än."].join("\n");
  if (/^klarhet\b/i.test(t)) return "Klarhet: Kent och Linnea är separata agenter med separata privata minnesgrunder.";
  if (/^fokus\b/i.test(t)) return "Fokus: håll Kents och Linneas identitet och privata minne åtskilda.";
  if (/^risk\b/i.test(t)) return "Risk: blanda inte ihop Kents minne med Linneas eller ViccyK3:s minne.";
  addFact({ agent: "kent", text: t, tags: ["ägaren"] });
  return "Sparat i Kents minne: " + t + "\nSäg minne om du vill se Kents lista.";
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
    PROVIDER_SYSTEM + "\nKents privata projektkontext:\n" + JSON.stringify(ctx),
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
