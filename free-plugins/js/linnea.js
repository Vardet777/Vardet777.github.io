const LOG_KEY = "fp.linnea.learnings";

function now() {
  return new Date().toISOString();
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLog(rows) {
  localStorage.setItem(LOG_KEY, JSON.stringify(rows.slice(-500)));
}

export function addLearning(row) {
  const rows = readLog();
  rows.push({ id: crypto.randomUUID(), at: now(), owner: "Vardet777", ...row });
  writeLog(rows);
}

export function exportLearnings() {
  const rows = readLog();
  const blob = new Blob([rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : "")], {
    type: "application/jsonl"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "linnea-learnings.jsonl";
  a.click();
}

export function replyTo(text, catalog) {
  const t = String(text || "").trim();
  const items = catalog?.items || [];
  if (/^(vad kan du|plugins|hjälp)\s*\??$/i.test(t)) {
    return [
      "Linnea på Free-Plugins-sajten. Kent är ersatt.",
      "Jag gör: katalog, testupplägg, skapa-verkstad, pack, reklamplatser, lärdomsexport, bevakning.",
      "Jag gör inte: publicera sajten, hitta på live-tester, sälja andras plugins, vara Viccy eller Kingen.",
      "iPhone-appen är en annan yta. Den rör jag inte här."
    ].join("\n");
  }
  if (/free[\s-]?plugins[\s-]?hem|var är sajten|vilket repo/i.test(t)) {
    return [
      "Free-Plugins hem:",
      "Sajt: inte publicerad som produkt. Förhandsvisning under /free-plugins/.",
      "Lokalt: artifacts/free-plugins-site — öppna login.html, sedan index.html.",
      "Repo sajt: github.com/Vardet777/Free-Plugins-4-all",
      "Kent-repo (ersatt agent, lärdomar kvar): github.com/Vardet777/Kent",
      "KM2 är separat: github.com/Vardet777/KM2",
      "Inloggningsvägg på."
    ].join("\n");
  }
  const test = t.match(/^(testa|prova)\s*[:\-]?\s*(.+)$/i);
  if (test) {
    const q = test[2].toLowerCase();
    const hit = items.find((it) => `${it.name} ${it.id}`.toLowerCase().includes(q)) || items[0];
    if (!hit) {
      return "Katalogen är nästan tom. Inget att testa live. Det här är bara ett upplägg.";
    }
    return [
      `Testupplägg mot ${hit.name} (${hit.id}).`,
      "1. Läs posten i katalogen.",
      "2. Välj en gratis AI som passar kategorin — bara om du själv har den öppen.",
      "3. Följ officiell länk om den finns. Den här posten har ingen publik adress.",
      "Inte kört live härifrån. Jag hittar inte på att ChatGPT redan testat det."
    ].join("\n");
  }
  if (/^klarhet\s*[:\-]?/i.test(t)) {
    return "Klarhet:\n1. Sajten är verkstad.\n2. Linnea ersätter Kent här.\n3. Appen väntar.\nNästa handling: håll inloggningsväggen.";
  }
  if (/^juridiken/i.test(t)) {
    return "Bevakning, inte råd: IP Vardet777. Sälj lärdomar, inte andras plugins. Publicera inte utan ägarbeslut. Avtal före första försäljning.";
  }
  return "Produkt först: katalog, skapa, pack. Säg testa: plus namn, eller free-plugins hem. Jag hittar inte på en live-URL.";
}
