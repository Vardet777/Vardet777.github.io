import { contextForAgent, rememberChat, addFact } from "./memory.js";
import { cookbookChat, renderPassportText, validatePack } from "./pack.js";
import { getKey, setKey, liveQueue, generateFromQueue } from "./providers.js";

const XAI_KEY_OLD = "fp.xai.key";
export function getXaiKey() {
  const now = getKey("xai");
  if (now) return now;
  try {
    const legacy = localStorage.getItem(XAI_KEY_OLD) || "";
    if (legacy) setKey("xai", legacy);
    return legacy;
  } catch { return ""; }
}
export function setXaiKey(value) {
  setKey("xai", value);
  try {
    if (value) localStorage.setItem(XAI_KEY_OLD, String(value).trim());
    else localStorage.removeItem(XAI_KEY_OLD);
  } catch {}
}
function findItem(items, q) {
  const needle = String(q || "").toLowerCase();
  return items.find((it) => `${it.name} ${it.id} ${(it.tags || []).join(" ")}`.toLowerCase().includes(needle));
}
export function replyTo(text, catalog, packs = []) {
  const t = String(text || "").trim();
  const items = catalog?.items || [];
  const ctx = contextForAgent("linnea");
  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) {
    return "Linnea. Jag minns det du skriver. Tryck Prata. Ingen nyckel behövs. Säg minne för att se faktan.";
  }
  const remember = t.match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (remember) {
    addFact({ agent: "linnea", text: remember[2], tags: ["ägaren"] });
    return "Sparat: " + remember[2];
  }
  if (/^minne\b/i.test(t)) {
    return ["Delat minne", ctx.facts || "Inga fakta än."].join("\n");
  }
  const recipeAsk = t.match(/^(recept|visa|kokbok|laga)\s*[:\-]?\s*(.*)$/i);
  if (recipeAsk) {
    const cook = packs.find((p) => p.kind === "cookbook") || packs.find((p) => p.id === "husmanskost-v1");
    if (!cook) return "Inget kokbokspack inläst.";
    return cookbookChat(cook, 0);
  }
  if (/^klarhet\s*[:\-]?/i.test(t)) return "Klarhet: sajten är verkstad. Linnea minns meningar du skriver. Tryck Prata.";
  if (/^beslut\s*[:\-]?/i.test(t)) return "Beslut: förhandsvisning. Drive bara på lundgrennisse@gmail.com.";
  if (/^plan\s*[:\-]?/i.test(t)) return "Plan: skriv en mening. Jag sparar den. Tryck Prata.";
  if (/^fokus\s*[:\-]?/i.test(t)) return "Fokus: Prata + minne på iPhone.";
  if (/^granska\s*[:\-]?/i.test(t)) return "Granska: pack.js 200. Ingen nyckel krävs.";
  if (/^risk\s*[:\-]?/i.test(t)) return "Risk: gammal flik i Safari visar gammal sida. Stäng fliken och öppna länken igen.";
  if (/^atlas\s*[:\-]?/i.test(t)) return "Atlas: https://vardet777.github.io/free-plugins/linnea.html";
  if (/^juridiken/i.test(t)) return "IP Vardet777. Inte råd.";
  if (/^(röst|prata)\b/i.test(t)) return "Tryck Prata. Svensk kvinnlig systemröst. Inte EVIE, inte ZELDA.";
  if (/passport|schema/i.test(t)) {
    const pass = packs.find((p) => p.id === "pack-passport-v1");
    return pass ? renderPassportText(pass) : "Passport saknas.";
  }
  const test = t.match(/^(testa|prova)\s*[:\-]?\s*(.+)$/i);
  if (test) {
    const hit = findItem(items, test[2]) || items[0];
    return hit ? "Testupplägg mot " + hit.name + ". Inte kört live." : "Katalogen är tom.";
  }
  addFact({ agent: "linnea", text: t, tags: ["ägaren"] });
  return "Sparat: " + t + "\nSäg minne om du vill se listan.";
}
const STRUCTURED = /./;
export async function answer(text, catalog, packs = []) {
  const local = replyTo(text, catalog, packs);
  rememberChat({ query: text, reply: local, agent: "linnea" });
  return { text: local, source: "local" };
}
