import {
  linnea,
  MemoryStore,
  handleTurn,
  loadOrCreateSession,
  loadSettings,
  saveSettings,
  exportArchive,
  importArchive,
  listDiary,
  appendDiary
} from "./linnea-runtime.js";

const memory = new MemoryStore();
let session = loadOrCreateSession();
let settings = loadSettings();
let listening = false;

const logEl = document.getElementById("log");
const form = document.getElementById("f");
const input = document.getElementById("t");
const micBtn = document.getElementById("mic");
const statusEl = document.getElementById("status");
const installEl = document.getElementById("install");
const sheet = document.getElementById("sheet");

function add(role, text, meta) {
  const d = document.createElement("div");
  d.className = "msg " + (role === "user" ? "user" : "linnea");
  d.textContent = text;
  if (meta) {
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = meta;
    d.appendChild(m);
  }
  logEl.appendChild(d);
  d.scrollIntoView({ behavior: "smooth", block: "end" });
}
function setStatus(text) { statusEl.textContent = text; }
function pickVoice() {
  const list = window.speechSynthesis?.getVoices?.() || [];
  return list.find((v) => /sv/i.test(v.lang)) || null;
}
function speak(text) {
  if (!settings.voiceOn || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "sv-SE";
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}
function showInstallHint() {
  if (isStandalone()) { installEl.hidden = true; return; }
  installEl.hidden = false;
  installEl.textContent = "Dela → Lägg till på hemskärmen.";
}
async function boot() {
  setStatus("lokal · " + linnea.name);
  showInstallHint();
  if (!session.greetingSent) {
    const r = await handleTurn({ text: "", memory, session, settings, wantGreeting: true });
    add("linnea", r.reply, "hälsning");
    speak("Hej. Jag är Linnea.");
  } else if (session.turns.length) {
    for (const t of session.turns.slice(-16)) add(t.role === "user" ? "user" : "linnea", t.content, t.provider || "");
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}
async function send(text) {
  const value = String(text || "").trim();
  if (!value) return;
  input.value = "";
  add("user", value);
  setStatus("skriver…");
  const r = await handleTurn({ text: value, memory, session, settings });
  add("linnea", r.reply, r.providerLabel || r.provider);
  speak(r.reply);
  setStatus(r.providerLabel || "lokal");
}
form.addEventListener("submit", (e) => { e.preventDefault(); send(input.value); });
micBtn.addEventListener("click", () => {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { add("linnea", "Använd tangentbordets mikrofon och tryck Skicka."); return; }
  if (listening) return;
  window.speechSynthesis?.cancel();
  const rec = new Rec();
  rec.lang = "sv-SE";
  rec.interimResults = false;
  listening = true;
  micBtn.classList.add("hot");
  setStatus("lyssnar…");
  rec.onresult = (ev) => { input.value = ev.results[0][0].transcript; send(input.value); };
  rec.onerror = () => setStatus("mikrofonen stoppade");
  rec.onend = () => { listening = false; micBtn.classList.remove("hot"); };
  try { rec.start(); } catch { listening = false; micBtn.classList.remove("hot"); }
});
function openSettings() { renderSheet(); sheet.hidden = false; }
document.getElementById("open-sheet").addEventListener("click", openSettings);
document.getElementById("open-sheet-2").addEventListener("click", openSettings);
document.getElementById("close-sheet").addEventListener("click", () => { sheet.hidden = true; });
function escapeHtml(s) {
  return String(s).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}
function renderSheet() {
  const cards = memory.cards().filter((c) => !c.deleted);
  document.getElementById("mem-list").innerHTML = cards.length
    ? cards.map((c) => `<li>${escapeHtml(c.content)}</li>`).join("")
    : "<li class='empty'>Inga sparade minnen.</li>";
  const diary = listDiary();
  document.getElementById("diary-list").innerHTML = diary.length
    ? diary.slice(-10).reverse().map((d) => `<li>${escapeHtml(d.ts.slice(0, 10))} — ${escapeHtml(d.body)}</li>`).join("")
    : "<li class='empty'>Ingen dagbok än.</li>";
  document.getElementById("groq-key").value = settings.groqKey || "";
  document.getElementById("or-key").value = settings.orKey || "";
  document.getElementById("llm-base").value = settings.llmBase || "";
  document.getElementById("llm-model").value = settings.llmModel || "grok-4.6";
  document.getElementById("llm-key").value = settings.llmKey || "";
  document.getElementById("use-xai").checked = settings.useXai === true;
  document.getElementById("voice-on").checked = settings.voiceOn !== false;
  document.getElementById("pair-url").value = settings.pairUrl || "";
  document.getElementById("pair-token").value = settings.pairToken || "";
}
document.getElementById("mem-add").addEventListener("click", () => {
  const field = document.getElementById("mem-new");
  const value = field.value.trim();
  if (!value) return;
  memory.remember({ content: value, source: "explicit" });
  field.value = "";
  renderSheet();
});
document.getElementById("diary-add").addEventListener("click", () => {
  const field = document.getElementById("diary-new");
  const value = field.value.trim();
  if (!value) return;
  appendDiary(value);
  field.value = "";
  renderSheet();
});
document.getElementById("save-settings").addEventListener("click", () => {
  settings = saveSettings({
    groqKey: document.getElementById("groq-key").value.trim(),
    orKey: document.getElementById("or-key").value.trim(),
    llmBase: document.getElementById("llm-base").value.trim(),
    llmModel: document.getElementById("llm-model").value.trim() || "grok-4.6",
    llmKey: document.getElementById("llm-key").value.trim(),
    useXai: document.getElementById("use-xai").checked,
    voiceOn: document.getElementById("voice-on").checked,
    pairUrl: document.getElementById("pair-url").value.trim().replace(/\/$/, ""),
    pairToken: document.getElementById("pair-token").value.trim()
  });
  setStatus("lokal");
  sheet.hidden = true;
});
document.getElementById("sync-pull").addEventListener("click", () => setStatus("sync kräver dator — skippas här"));
document.getElementById("sync-push").addEventListener("click", () => setStatus("sync kräver dator — skippas här"));
document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(exportArchive(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "linnea-arkiv.json";
  a.click();
});
document.getElementById("import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try { importArchive(JSON.parse(await file.text())); renderSheet(); } catch { setStatus("kunde inte läsa arkivet"); }
});
boot();
