const PREF = "fp.voice.on";
const URI_KEY = "fp.voice.uri";
export const LOCKED_ID = "liora";
export const LANG = "sv-SE";
const BLOCKED = /oskar|ingmar|erik|magnus|daniel|maged|rishi|xander|male|manlig|evie|zelda|samantha|karen|moira|tessa|victoria|anna \(germany\)|google uk/i;
const PREFERRED = ["elin", "klara", "alva", "ebba", "sofie", "freja", "eliza"];
export function voiceWanted() { try { return localStorage.getItem(PREF) !== "0"; } catch { return true; } }
export function setVoiceWanted(on) { try { localStorage.setItem(PREF, on ? "1" : "0"); } catch {} if (!on) stopSpeak(); }
export function scoreVoice(v) {
  const name = String(v?.name || "");
  const lang = String(v?.lang || "").toLowerCase();
  if (!/^sv/.test(lang)) return -100;
  if (BLOCKED.test(name)) return -50;
  let score = 20;
  const lower = name.toLowerCase();
  PREFERRED.forEach((p, i) => { if (lower.includes(p)) score += 40 - i * 4; });
  if (/enhanced|premium|siri|neural|compact/.test(lower) && /elin|klara/.test(lower)) score += 6;
  return score;
}
function list() { try { return window.speechSynthesis?.getVoices?.() || []; } catch { return []; } }
export function pickVoice() {
  const voices = list();
  let lockedUri = "";
  try { lockedUri = localStorage.getItem(URI_KEY) || ""; } catch { lockedUri = ""; }
  if (lockedUri) {
    const locked = voices.find((v) => v.voiceURI === lockedUri && scoreVoice(v) > 0);
    if (locked) return locked;
  }
  const ranked = voices.map((v) => ({ v, s: scoreVoice(v) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  return ranked[0]?.v || voices.find((v) => /^sv/i.test(v.lang || "")) || null;
}
export function voiceLabel() {
  const v = pickVoice();
  if (v) return v.name + " · " + (v.lang || LANG);
  if (list().length) return "ingen svensk kvinnlig röst i enheten";
  return "väntar på röster";
}
let unlocked = false, keepTimer = 0, speakTimer = 0;
function resumeEngine() { try { window.speechSynthesis?.resume(); } catch {} }
export function unlockSpeech() {
  if (!window.speechSynthesis) return;
  resumeEngine();
  window.speechSynthesis.getVoices();
  unlocked = true;
}
export function holdAudioSession() {
  if (!voiceWanted() || !window.speechSynthesis) return;
  unlockSpeech();
  resumeEngine();
  try {
    const hold = new SpeechSynthesisUtterance(".");
    hold.lang = LANG;
    hold.volume = 0;
    window.speechSynthesis.speak(hold);
  } catch {}
}
function chunkText(text) {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return [];
  if (raw.length <= 220) return [raw];
  const parts = []; let buf = "";
  for (const sentence of raw.split(/(?<=[.!?])\s+/)) {
    if ((buf + " " + sentence).trim().length > 220 && buf) { parts.push(buf.trim()); buf = sentence; }
    else buf = (buf + " " + sentence).trim();
  }
  if (buf) parts.push(buf);
  return parts.slice(0, 8);
}
function makeUtterance(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANG; u.rate = 0.98; u.pitch = 1.03;
  const v = pickVoice();
  if (v) { u.voice = v; u.lang = v.lang || LANG; }
  return u;
}
function keepAlive() {
  clearTimeout(keepTimer);
  if (!window.speechSynthesis?.speaking) return;
  resumeEngine();
  keepTimer = setTimeout(keepAlive, 4000);
}
export function speak(text) {
  if (!voiceWanted() || !window.speechSynthesis) return false;
  const chunks = chunkText(text);
  if (!chunks.length) return false;
  unlockSpeech(); resumeEngine(); clearTimeout(speakTimer);
  try { window.speechSynthesis.cancel(); } catch {}
  const queue = () => { resumeEngine(); chunks.forEach((part) => window.speechSynthesis.speak(makeUtterance(part))); keepAlive(); };
  queue();
  speakTimer = setTimeout(queue, 250);
  return true;
}
export function stopSpeak() {
  clearTimeout(speakTimer); clearTimeout(keepTimer);
  try { window.speechSynthesis?.cancel(); } catch {}
}
export function canListen() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }
export function listenOnce({ onStart, onResult, onError } = {}) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) { onError?.(new Error("Mikrofonlyssning saknas i den här webbläsaren.")); return { stop() {} }; }
  holdAudioSession(); stopSpeak();
  const rec = new Rec();
  rec.lang = LANG; rec.interimResults = false; rec.maxAlternatives = 1;
  rec.onstart = () => onStart?.();
  rec.onresult = (e) => onResult?.(e.results?.[0]?.[0]?.transcript || "");
  rec.onerror = (e) => onError?.(e);
  try { rec.start(); } catch (err) { onError?.(err); }
  return { stop() { try { rec.stop(); } catch {} } };
}
export function whenVoicesReady() {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve([]);
    window.speechSynthesis.getVoices();
    if (list().some((v) => /^sv/i.test(v.lang || ""))) return resolve(list());
    const done = () => resolve(list());
    window.speechSynthesis.addEventListener("voiceschanged", done, { once: true });
    setTimeout(done, 1600);
  });
}
