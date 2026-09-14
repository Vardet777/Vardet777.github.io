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
  } catch {
    return "";
  }
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
  const memoryLine = ctx.factCount
    ? `\nDelat minne: ${ctx.factCount} fakta, ${ctx.eventCount} händelser. Drive ${ctx.drive?.status || "lokalt"}.`
    : "\nDelat minne är tomt än. Säg kom ihåg: plus en mening.";

  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) {
    return [
      "Linnea på Free-Plugins-sajten. Kent är ersatt.",
      "Jag gör: katalog, testupplägg, skapa, pack, kokbokssidor, delat minne, röst, bevakning, AI-kö.",
      "Jag gör inte: publicera sajten, sälja andras plugins, skrapa kokböcker, vara Viccy eller Kingen.",
      "Säg prata, kom ihåg:, testa:, recept, azure, ai, eller free-plugins hem.",
      memoryLine.trim()
    ].join("\n");
  }
  if (/^(var är sajten|vilket repo|free[\s-]?plugins[\s-]?hem)\s*\??$/i.test(t)) {
    return [
      "Free-Plugins hem:",
      "Sajt: verkstad. Inloggningsvägg på. Inte publicerad som produkt.",
      "Förhandsvisning (inte produkt): vardet777.github.io/free-plugins/login.html",
      "KM2 är separat."
    ].join("\n");
  }
  if (/^(ai|koppla|providers|nycklar)\b/i.test(t)) {
    const live = liveQueue().map((p) => p.label + " · " + p.model).join(", ") || "ingen nyckel än";
    return [
      "Gratis AI kopplas på ai.html.",
      "Live i den här webbläsaren: " + live,
      "Utan nyckel: lokal Linnea."
    ].join("\n");
  }
  const remember = t.match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (remember) {
    addFact({ agent: "linnea", text: remember[2], tags: ["ägaren"] });
    return `Sparat i det delade minnet: ${remember[2]}\nDrive-filen skapas när kontot är lundgrennisse@gmail.com.`;
  }
  if (/^minne\b/i.test(t)) {
    return [
      `Delat minne · ägare ${ctx.owner}`,
      `Fakta ${ctx.factCount} · händelser ${ctx.eventCount}`,
      `Drive-status: ${ctx.drive?.status || "pending-owner-drive"}`,
      ctx.facts || "Inga fakta än."
    ].join("\n");
  }
  const recipeAsk = t.match(/^(recept|visa|kokbok|laga)\s*[:\-]?\s*(.*)$/i);
  if (recipeAsk) {
    const cook = packs.find((p) => p.kind === "cookbook") || packs.find((p) => p.id === "husmanskost-v1");
    if (!cook) return "Inget kokbokspack inläst. Öppna Pack-sidan.";
    const q = recipeAsk[2].toLowerCase();
    let idx = 0;
    if (q) {
      const found = (cook.items || []).findIndex((it) => `${it.title} ${it.id}`.toLowerCase().includes(q));
      if (found >= 0) idx = found;
    }
    return cookbookChat(cook, idx);
  }
  const test = t.match(/^(testa|prova)\s*[:\-]?\s*(.+)$/i);
  if (test) {
    const hit = findItem(items, test[2]) || items[0];
    if (!hit) return "Katalogen är tom.";
    return `Testupplägg mot ${hit.name}. Inte kört live härifrån.`;
  }
  if (/^klarhet\s*[:\-]?/i.test(t)) {
    return "Klarhet:\n1. Sajten är verkstad bakom lösenord.\n2. Linnea ersätter Kent här.\n3. Pack är data + mall.\n4. Ingen nyckel krävs för Prata.";
  }
  if (/^beslut\s*[:\-]?/i.test(t)) {
    return "Beslut:\n1. Förhandsvisning tills du säger publicera.\n2. Drive bara på lundgrennisse@gmail.com.\n3. Moln-AI bara om du klistrar nyckel.";
  }
  if (/^plan\s*[:\-]?/i.test(t)) {
    return "Plan:\n1. Öppna Linnea. Tryck Prata.\n2. Säg kom ihåg: plus en mening.\n3. Koppla Drive som lundgrennisse@gmail.com.";
  }
  if (/^fokus\s*[:\-]?/i.test(t)) {
    return "Fokus: Prata på iPhone, Linnea synlig, lösenordsvägg på. Inte fel Drive-konto.";
  }
  if (/^granska\s*[:\-]?/i.test(t)) {
    return "Granska: pack.js 200. Ingen nyckel krävs för lokal Linnea. IP Vardet777.";
  }
  if (/^risk\s*[:\-]?/i.test(t)) {
    return "Risk: fel Google-konto äger minnet. Tyst läge tystar Prata. Nyckel i localStorage om du klistrar en.";
  }
  if (/^atlas\s*[:\-]?/i.test(t)) {
    return "Atlas: Login → Hem → Linnea / Katalog / Pack / Minne / AI.\nLive: vardet777.github.io/free-plugins/";
  }
  if (/^juridiken/i.test(t)) {
    return "Bevakning, inte råd: IP Vardet777. Publicera inte utan ägarbeslut. Drive-minnet är ägarens fil.";
  }
  if (/^(röst|prata)\b/i.test(t)) {
    return "Röst: webbläsarens svenska kvinnliga röst. Inte EVIE, inte ZELDA. Tryck Prata.";
  }
  if (/passport|schema/i.test(t)) {
    const pass = packs.find((p) => p.id === "pack-passport-v1");
    return pass ? renderPassportText(pass) : "Passport-pack saknas.";
  }
  return `Produkt först: katalog, skapa, pack, minne. Säg testa:, recept, kom ihåg: eller free-plugins hem.${memoryLine}`;
}

const STRUCTURED = /^(vad kan du|plugins|hjälp|var är sajten|vilket repo|free[\s-]?plugins|ai\b|koppla|providers|nycklar|azure|graph|onedrive|kom ihåg|minns|spara|minne\b|recept|visa|kokbok|laga|testa|prova|klarhet|beslut|plan|fokus|granska|risk|atlas|juridiken|röst|prata|passport|schema)/i;

export async function answer(text, catalog, packs = []) {
  const local = replyTo(text, catalog, packs);
  rememberChat({ query: text, reply: local, agent: "linnea" });
  if (STRUCTURED.test(String(text || "").trim()) || !liveQueue().length) {
    return { text: local, source: "local" };
  }
  const ctx = contextForAgent("linnea");
  const system = `Du är Linnea på Free-Plugins-sajten. Inte Viccy. Inte Queen. Inte Kingen. Inte Kent. Svenska. Kort. IP Vardet777. Delat minne:\n${ctx.facts || "(tomt)"}`;
  const cloud = await generateFromQueue(system, String(text || ""));
  if (!cloud.text) return { text: local, source: "local", attempts: cloud.attempts };
  rememberChat({ query: text, reply: cloud.text, agent: "linnea" });
  return { text: cloud.text, source: cloud.provider, model: cloud.model, attempts: cloud.attempts };
}
