const PREF = "fp.voice.on";

export function voiceWanted() {
  try {
    return localStorage.getItem(PREF) !== "0";
  } catch {
    return true;
  }
}

export function setVoiceWanted(on) {
  localStorage.setItem(PREF, on ? "1" : "0");
  if (!on && "speechSynthesis" in window) speechSynthesis.cancel();
}

function pickVoice() {
  const voices = speechSynthesis.getVoices() || [];
  const scored = voices.map((v) => {
    const blob = `${v.name} ${v.lang}`.toLowerCase();
    let n = 0;
    if (/liora/.test(blob)) n += 8;
    if (/sv(-|_)?se|swedish|svenska/.test(blob)) n += 5;
    if (/alva|eliza|freja|anna/.test(blob)) n += 2;
    if (/female|kvinna|samantha|karen/.test(blob)) n += 1;
    return { v, n };
  });
  scored.sort((a, b) => b.n - a.n);
  return scored[0]?.n ? scored[0].v : voices.find((v) => v.default) || voices[0] || null;
}

export function speak(text) {
  if (!voiceWanted() || !("speechSynthesis" in window)) return false;
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean.slice(0, 900));
  u.lang = "sv-SE";
  u.rate = 1.02;
  u.pitch = 1.05;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
  return true;
}

export function stopSpeak() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

export function canListen() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function listenOnce({ onStart, onResult, onError } = {}) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) {
    onError?.(new Error("Mikrofonlyssning saknas i den här webbläsaren."));
    return { stop() {} };
  }
  const rec = new Rec();
  rec.lang = "sv-SE";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => onStart?.();
  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || "";
    onResult?.(text);
  };
  rec.onerror = (e) => onError?.(e);
  rec.start();
  return { stop() { try { rec.stop(); } catch { /* ignore */ } } };
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
