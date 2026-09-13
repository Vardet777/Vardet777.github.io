import { contextForAgent, rememberChat, addFact } from "./memory.js";

const XAI_KEY = "fp.xai.key";

export function getXaiKey() {
  try {
    return localStorage.getItem(XAI_KEY) || "";
  } catch {
    return "";
  }
}

export function setXaiKey(value) {
  const v = String(value || "").trim();
  if (!v) localStorage.removeItem(XAI_KEY);
  else localStorage.setItem(XAI_KEY, v);
}

export function replyTo(text, catalog) {
  const t = String(text || "").trim();
  const items = catalog?.items || [];
  const ctx = contextForAgent("linnea");
  const memoryLine = ctx.factCount
    ? `\nDelat minne: ${ctx.factCount} fakta, ${ctx.eventCount} händelser, OneDrive ${ctx.onedrive.status}.`
    : "\nDelat minne är tomt än. Säg kom ihåg: plus en mening.";

  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) {
    return [
      "Linnea på Free-Plugins-sajten. Kent är ersatt.",
      "Jag gör: katalog, testupplägg, skapa, pack, delat minne, röst.",
      "Jag gör inte: publicera sajten, sälja andras plugins, vara Viccy eller Kingen.",
      "Säg prata för röst. Säg kom ihåg: för externt minne.",
      memoryLine.trim()
    ].join("\n");
  }
  if (/^(var är sajten|vilket repo|free[\s-]?plugins[\s-]?hem)\s*\??$/i.test(t)) {
    return [
      "Free-Plugins hem:",
      "Sajt: verkstad. Inloggningsvägg på. Inte publicerad som produkt.",
      "Lokalt: artifacts/free-plugins-site — login.html sedan index.html.",
      "Repo sajt: github.com/Vardet777/Free-Plugins-4-all",
      "Kent-repo: github.com/Vardet777/Kent",
      "KM2 är separat.",
      "iPhone-appen är en annan yta."
    ].join("\n");
  }
  const remember = t.match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (remember) {
    addFact({ agent: "linnea", text: remember[2], tags: ["ägaren"] });
    return `Sparat i det delade minnet: ${remember[2]}\nAlla agenter på sajten ser det. OneDrive-filen uppdateras när du exporterar.`;
  }
  if (/^minne\b/i.test(t)) {
    return [
      `Delat minne · ägare ${ctx.owner}`,
      `Fakta ${ctx.factCount} · händelser ${ctx.eventCount} · verk ${ctx.workCount}`,
      `OneDrive-mål: ${ctx.onedrive.target}`,
      `Status: ${ctx.onedrive.status}`,
      ctx.facts || "Inga fakta än."
    ].join("\n");
  }
  const test = t.match(/^(testa|prova)\s*[:\-]?\s*(.+)$/i);
  if (test) {
    const q = test[2].toLowerCase();
    const hit = items.find((it) => `${it.name} ${it.id}`.toLowerCase().includes(q)) || items[0];
    if (!hit) return "Katalogen är nästan tom. Inget att testa live. Det här är bara ett upplägg.";
    return [
      `Testupplägg mot ${hit.name} (${hit.id}).`,
      "1. Läs posten i katalogen.",
      "2. Välj en gratis AI som passar kategorin — bara om du själv har den öppen.",
      "3. Följ officiell länk om den finns. Den här posten har ingen publik adress.",
      "Inte kört live härifrån."
    ].join("\n");
  }
  if (/^klarhet\s*[:\-]?/i.test(t)) {
    return "Klarhet:\n1. Sajten är verkstad.\n2. Linnea ersätter Kent här.\n3. Minnet är delat mellan sajtens agenter.\n4. Appen väntar.\nNästa handling: håll inloggningsväggen.";
  }
  if (/^juridiken/i.test(t)) {
    return "Bevakning, inte råd: IP Vardet777. Sälj lärdomar, inte andras plugins. Publicera inte utan ägarbeslut. Avtal före första försäljning. OneDrive-minnet är ägarens fil.";
  }
  if (/^(röst|prata)\b/i.test(t)) {
    return "Röst: webbläsarens svenska röst, Liora om den finns. Ingen moln-TTS. Tryck Prata eller Lyssna. Mikrofon kräver ditt tillstånd.";
  }
  return `Produkt först: katalog, skapa, pack, minne. Säg testa: plus namn, kom ihåg:, eller free-plugins hem.${memoryLine}`;
}

export async function answer(text, catalog) {
  const local = replyTo(text, catalog);
  rememberChat({ query: text, reply: local, agent: "linnea" });
  const key = getXaiKey();
  if (!key) return { text: local, source: "local" };
  try {
    const ctx = contextForAgent("linnea");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "grok-4-1-fast-non-reasoning",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `Du är Linnea på Free-Plugins-sajten. Inte Viccy. Inte Queen. Inte Kingen. Inte Kent. Svenska. Kort. Hitta inte på live-URL:er eller att tester körts. IP Vardet777. Delat minne:\n${ctx.facts || "(tomt)"}`
          },
          { role: "user", content: text }
        ]
      })
    });
    if (!res.ok) return { text: local + "\n\n(xAI svarade inte. Lokal linje ovan.)", source: "local" };
    const data = await res.json();
    const cloud = data.choices?.[0]?.message?.content?.trim();
    if (!cloud) return { text: local, source: "local" };
    rememberChat({ query: text, reply: cloud, agent: "linnea" });
    return { text: cloud, source: "xai" };
  } catch {
    return { text: local + "\n\n(xAI nåddes inte. Lokal linje ovan.)", source: "local" };
  }
}
