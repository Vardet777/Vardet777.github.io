import { generateFromQueue, statusLabel } from "./providers.js";
import { composeTalk, formatCommand } from "./composer.js";
import { parsePlugin, runPlugin } from "./plugins.js";
import { mergeArchive } from "./sync-merge.js";

export const linnea = {
  version: "0.3.1",
  name: "Linnea",
  project: "The Bot",
  firstOwnerMessage: "Hej. Jag är Linnea — jag är här, även om du gör något annat samtidigt. Vad håller du på med just nu?",
  authenticity: "Linnea säger vad hon menar och menar vad hon säger."
};

const SECRETISH = /(api[_-]?key|lösenord|password|secret|token|personnummer)/i;
const KEYS = { cards: "linnea.cards", ledger: "linnea.ledger", session: "linnea.session", settings: "linnea.settings", diary: "linnea.diary" };
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
function readJson(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalize(s) {
  return String(s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
}

export class MemoryStore {
  cards() { return readJson(KEYS.cards, []); }
  saveCards(cards) { writeJson(KEYS.cards, cards); }
  appendEvent(event) {
    const ledger = readJson(KEYS.ledger, []);
    ledger.push({ id: uid(), ts: now(), ...event });
    writeJson(KEYS.ledger, ledger.slice(-2000));
  }
  remember({ content, source = "explicit", sessionId }) {
    if (!content || !String(content).trim()) return { ok: false, reason: "empty" };
    if (SECRETISH.test(content)) return { ok: false, reason: "refused_sensitive" };
    const cards = this.cards();
    const existing = cards.find((c) => !c.deleted && normalize(c.content) === normalize(content));
    if (existing) { existing.updatedAt = now(); this.saveCards(cards); return { ok: true, card: existing, deduped: true }; }
    const card = { id: uid(), content: String(content).trim(), source, status: "confirmed", createdAt: now(), updatedAt: now(), deleted: false };
    cards.push(card); this.saveCards(cards);
    this.appendEvent({ type: "memory.remember", sessionId, payload: { cardId: card.id } });
    return { ok: true, card, deduped: false };
  }
  forget(idOrText) {
    const cards = this.cards(); const needle = normalize(idOrText); let hit = 0;
    for (const c of cards) {
      if (c.deleted) continue;
      if (c.id === idOrText || normalize(c.content).includes(needle)) { c.deleted = true; hit += 1; }
    }
    this.saveCards(cards); return { ok: true, hit };
  }
  retrieve({ query, limit = 6 }) {
    const q = normalize(query); const scored = [];
    for (const c of this.cards()) {
      if (c.deleted) continue;
      const text = normalize(c.content);
      let score = q && text.includes(q) ? 5 : 0;
      if (score > 0 || !q) scored.push({ score: score || 0.1, card: c });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((t) => t.card);
  }
}

export function listDiary() { return readJson(KEYS.diary, []); }
export function appendDiary(body) {
  const text = String(body || "").trim();
  if (!text) return { ok: false, reason: "empty" };
  const items = listDiary();
  const entry = { id: uid(), ts: now(), body: text, status: "local" };
  items.push(entry); writeJson(KEYS.diary, items.slice(-365));
  return { ok: true, diaryEntry: entry };
}
export function loadSettings() {
  return { llmBase: "", llmKey: "", llmModel: "grok-4.6", groqKey: "", orKey: "", useXai: false, voiceOn: true, ...readJson(KEYS.settings, {}) };
}
export function saveSettings(partial) {
  const next = { ...loadSettings(), ...partial }; writeJson(KEYS.settings, next); return next;
}
export function loadOrCreateSession() {
  let session = readJson(KEYS.session, null);
  if (!session || !session.id) {
    session = { id: uid(), sessionClass: "owner_adult", channel: "iphone", createdAt: now(), updatedAt: now(), greetingSent: false, turns: [] };
    writeJson(KEYS.session, session);
  }
  return session;
}
function persistSession(session) {
  session.updatedAt = now();
  if (session.turns.length > 40) session.turns = session.turns.slice(-40);
  writeJson(KEYS.session, session);
}

function parseCommand(text) {
  const t = String(text || "").trim();
  const plugin = parsePlugin(t);
  if (plugin) return { name: "plugin.run", plugin };
  let m;
  if ((m = t.match(/^(kom ihåg detta|kom ihåg|remember(?: this)?)\s*[:\-]?\s*(.+)$/i))) return { name: "memory.remember", args: m.slice(1) };
  if ((m = t.match(/^(glöm|forget)\s*[:\-]?\s*(.+)$/i))) return { name: "memory.forget", args: m.slice(1) };
  if ((m = t.match(/^(visa minnen|vad kommer du ihåg|vad minns du|minne)\s*\??$/i))) return { name: "memory.list" };
  if ((m = t.match(/^(dagbok|skriv dagbok)\s*[:\-]?\s*(.+)$/i))) return { name: "diary.append", args: m.slice(1) };
  if ((m = t.match(/^(visa dagbok|visa dagboken|dagbok)\s*\??$/i))) return { name: "diary.list" };
  return null;
}

export async function handleTurn({ text, memory, session, settings = {}, wantGreeting = false }) {
  const userText = String(text || "").trim();
  if (wantGreeting && !session.greetingSent && !userText) {
    const reply = linnea.firstOwnerMessage;
    session.greetingSent = true;
    session.turns.push({ role: "assistant", content: reply, ts: now(), provider: "persona" });
    persistSession(session);
    return { reply, provider: "persona", providerLabel: "lokal", retrievedIds: [] };
  }
  const cmd = parseCommand(userText);
  let commandResult = null;
  if (cmd?.name === "plugin.run") commandResult = runPlugin(cmd.plugin, { memory, session, settings });
  else if (cmd?.name === "memory.remember") commandResult = memory.remember({ content: cmd.args[1] || cmd.args[0], source: "explicit" });
  else if (cmd?.name === "memory.forget") commandResult = memory.forget(cmd.args[1] || cmd.args[0]);
  else if (cmd?.name === "memory.list") commandResult = { ok: true, cards: memory.cards().filter((c) => !c.deleted) };
  else if (cmd?.name === "diary.append") commandResult = appendDiary(cmd.args[1] || cmd.args[0]);
  else if (cmd?.name === "diary.list") commandResult = { ok: true, diary: listDiary() };

  const retrieved = memory.retrieve({ query: userText, limit: 6 });
  let provider = "local"; let reply;
  if (commandResult) { reply = formatCommand(commandResult); provider = "tool"; }
  else {
    const llm = await generateFromQueue({
      system: `You are Linnea, adult companion in The Bot. Not Viccy, not Queen. ${linnea.authenticity} Reply in Swedish unless the user writes another language.`,
      messages: [...session.turns.slice(-12).map((t) => ({ role: t.role, content: t.content })), { role: "user", content: userText }],
      settings
    });
    if (llm.text) { reply = llm.text; provider = llm.provider; }
    else { reply = composeTalk({ userText, memories: retrieved, name: linnea.name, authenticity: linnea.authenticity }); provider = "local"; }
  }
  if (userText) session.turns.push({ role: "user", content: userText, ts: now() });
  session.turns.push({ role: "assistant", content: reply, ts: now(), provider });
  persistSession(session);
  return { reply, provider, providerLabel: statusLabel(provider, null), retrievedIds: retrieved.map((c) => c.id) };
}
export function exportArchive() {
  return { persona: linnea.name, exportedAt: now(), cards: new MemoryStore().cards(), session: readJson(KEYS.session, null), diary: listDiary() };
}
export function importArchive(data) {
  if (!data || typeof data !== "object") throw new Error("bad_archive");
  const merged = mergeArchive({ cards: readJson(KEYS.cards, []), diary: listDiary() }, data);
  writeJson(KEYS.cards, merged.cards);
  writeJson(KEYS.diary, merged.diary);
  return merged;
}
