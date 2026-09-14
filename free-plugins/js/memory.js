const KEY = "fp.shared.memory";
export const AGENTS = ["linnea", "katalog", "skapa", "pack"];
export const DRIVE_FOLDER = "Gemensamt-AI-minne";
export const DRIVE_OWNER_EMAIL = "lundgrennisse@gmail.com";
export const DRIVE_FOLDER_ID = "";
export const DRIVE_FILE_ID = "";
export const DRIVE_FILE = "gemensamt-ai-minne.json";
export const DRIVE_FILE_URL = "";
export const DRIVE_FOLDER_URL = "";
export const ONEDRIVE_PATH = "Google Drive/Gemensamt-AI-minne/gemensamt-ai-minne.json";

function now() { return new Date().toISOString(); }

function emptyBank() {
  return {
    version: 2,
    owner: "Vardet777",
    updatedAt: null,
    backend: "google-drive",
    drive: {
      folder: DRIVE_FOLDER,
      ownerEmail: DRIVE_OWNER_EMAIL,
      folderId: DRIVE_FOLDER_ID,
      fileId: DRIVE_FILE_ID,
      fileName: DRIVE_FILE,
      fileUrl: DRIVE_FILE_URL,
      folderUrl: DRIVE_FOLDER_URL,
      status: "pending-owner-drive",
      bound: false,
      note: "Väntar på Drive-konto lundgrennisse@gmail.com. Enheten cachar lokalt."
    },
    onedrive: { target: ONEDRIVE_PATH, status: "replaced-by-drive", lastExport: null, bound: false, note: "OneDrive är inte backend." },
    facts: [],
    events: [],
    works: []
  };
}

export function loadBank() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyBank();
    const bank = { ...emptyBank(), ...JSON.parse(raw) };
    bank.facts = Array.isArray(bank.facts) ? bank.facts : [];
    bank.events = Array.isArray(bank.events) ? bank.events : [];
    bank.works = Array.isArray(bank.works) ? bank.works : [];
    bank.drive = { ...emptyBank().drive, ...(bank.drive || {}) };
    bank.onedrive = { ...emptyBank().onedrive, ...(bank.onedrive || {}) };
    bank.backend = "google-drive";
    return bank;
  } catch {
    return emptyBank();
  }
}

function persist(bank) {
  const next = { ...emptyBank(), ...bank, updatedAt: now() };
  next.facts = (next.facts || []).slice(-400);
  next.events = (next.events || []).slice(-500);
  next.works = (next.works || []).slice(-200);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function saveBank(bank) { return persist(bank); }

export function addEvent({ agent = "linnea", kind = "note", text = "", data = null } = {}) {
  const bank = loadBank();
  bank.events.push({ id: crypto.randomUUID(), at: now(), agent, kind, text: String(text || "").slice(0, 4000), data });
  return saveBank(bank);
}

export function addFact({ agent = "linnea", text = "", tags = [] } = {}) {
  const clean = String(text || "").trim();
  if (!clean) return loadBank();
  const bank = loadBank();
  if (!bank.facts.some((f) => f.text.toLowerCase() === clean.toLowerCase())) {
    bank.facts.push({ id: crypto.randomUUID(), at: now(), agent, text: clean.slice(0, 500), tags });
  }
  return saveBank(bank);
}

export function addWork(work) {
  const bank = loadBank();
  bank.works.push({ id: crypto.randomUUID(), at: now(), agent: "skapa", ...work });
  return saveBank(bank);
}

export function rememberChat({ query, reply, agent = "linnea" }) {
  addEvent({ agent, kind: "chat", text: query, data: { reply } });
  const factish = String(query || "").match(/^(kom ihåg|minns|spara)\s*[:\-]?\s*(.+)$/i);
  if (factish) addFact({ agent, text: factish[2], tags: ["ägaren"] });
}

export function contextForAgent(agent) {
  const bank = loadBank();
  return {
    agent,
    owner: bank.owner,
    factCount: bank.facts.length,
    eventCount: bank.events.length,
    workCount: bank.works.length,
    onedrive: bank.onedrive,
    drive: bank.drive,
    facts: bank.facts.slice(-20).map((f) => "- " + f.text).join("\n"),
    recent: bank.events.slice(-8).map((e) => e.agent + ":" + e.kind + " " + e.text).join("\n")
  };
}

export function canBindFolder() { return false; }
export async function bindOneDriveFolder() { throw new Error("OneDrive är ersatt av Google Drive."); }
export async function syncBoundFolder() { return { ok: false, status: "pending-owner-drive" }; }

export function mergeBank(incoming) {
  const cur = loadBank();
  const src = incoming && typeof incoming === "object" ? incoming : {};
  const byId = (rows) => { const map = new Map(); for (const row of rows || []) if (row && row.id) map.set(row.id, row); return map; };
  const facts = byId(cur.facts); for (const row of src.facts || []) if (row?.id) facts.set(row.id, row);
  const events = byId(cur.events); for (const row of src.events || []) if (row?.id) events.set(row.id, row);
  const works = byId(cur.works); for (const row of src.works || []) if (row?.id) works.set(row.id, row);
  return persist({ ...cur, ...src, facts: [...facts.values()], events: [...events.values()], works: [...works.values()], drive: { ...cur.drive, ...(src.drive || {}) }, backend: "google-drive" });
}

export function exportBank() {
  const bank = loadBank();
  bank.drive = { ...bank.drive, lastExport: now() };
  persist(bank);
  const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = DRIVE_FILE;
  a.click();
  addEvent({ agent: "linnea", kind: "export", text: DRIVE_FILE });
  return bank;
}

export async function importFile(file) {
  const data = JSON.parse(await file.text());
  const bank = mergeBank(data);
  addEvent({ agent: "linnea", kind: "import", text: file.name || DRIVE_FILE });
  return bank;
}
