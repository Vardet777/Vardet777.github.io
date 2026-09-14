const KEY = "fp.shared.memory";
const AGENT_MEMORY_KEYS = {
  linnea: "fp.memory.linnea",
  kent: "fp.memory.kent"
};
export const AGENTS = ["linnea", "kent", "katalog", "skapa", "pack"];
export const ISOLATED_AGENTS = ["linnea", "kent"];
export { AGENT_MEMORY_KEYS };
export const DRIVE_FOLDER = "Gemensamt-AI-minne";
export const DRIVE_OWNER_EMAIL = "lundgrennisse@gmail.com";
export const DRIVE_FOLDER_ID = "";
export const DRIVE_FILE_ID = "";
export const DRIVE_FILE = "gemensamt-ai-minne.json";
export const DRIVE_FILE_URL = "";
export const DRIVE_FOLDER_URL = "";

function now() { return new Date().toISOString(); }

function emptyBank() {
  return {
    version: 3,
    owner: "Vardet777",
    updatedAt: null,
    backend: "local-export",
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
      note: "Lokal cache/export är aktiv. Google Drive blir canonical extern backend först efter faktisk bindning och verifierad synk."
    },
    onedrive: { status: "not-backend", bound: false, lastExport: null, note: "OneDrive är inte backend för delat AI-minne." },
    facts: [],
    events: [],
    works: []
  };
}

function normalizeBank(bank) {
  const next = { ...emptyBank(), ...(bank || {}) };
  next.facts = Array.isArray(next.facts) ? next.facts : [];
  next.events = Array.isArray(next.events) ? next.events : [];
  next.works = Array.isArray(next.works) ? next.works : [];
  next.drive = { ...emptyBank().drive, ...(next.drive || {}) };
  next.onedrive = { ...emptyBank().onedrive, ...(next.onedrive || {}) };
  next.backend = "local-export";
  next.drive.status = next.drive.bound ? "bound" : "pending-owner-drive";
  next.onedrive.status = "not-backend";
  return next;
}

export function loadBank() {
  try {
    const raw = localStorage.getItem(KEY);
    return normalizeBank(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyBank();
  }
}

function persist(bank) {
  const next = normalizeBank({ ...bank, updatedAt: now() });
  next.facts = next.facts.slice(-400);
  next.events = next.events.slice(-500);
  next.works = next.works.slice(-200);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function saveBank(bank) { return persist(bank); }

function stripIsolatedFromShared(bank) {
  const isolated = new Set(ISOLATED_AGENTS);
  const next = {
    ...bank,
    facts: bank.facts.filter((row) => !isolated.has(row?.agent || "")),
    events: bank.events.filter((row) => !isolated.has(row?.agent || "")),
    works: bank.works.filter((row) => !isolated.has(row?.agent || ""))
  };
  return persist(next);
}

function migrateLegacyAgents() {
  const legacy = loadBank();
  try {
    for (const agent of ISOLATED_AGENTS) {
      const key = AGENT_MEMORY_KEYS[agent];
      const marker = `${key}.initialized`;
      if (localStorage.getItem(marker) === "1") continue;
      const migrated = normalizeBank({
        ...legacy,
        facts: legacy.facts.filter((row) => (row.agent || "linnea") === agent),
        events: legacy.events.filter((row) => (row.agent || "linnea") === agent),
        works: legacy.works.filter((row) => (row.agent || "skapa") === agent)
      });
      localStorage.setItem(key, JSON.stringify(migrated));
      localStorage.setItem(marker, "1");
    }
    stripIsolatedFromShared(legacy);
  } catch {
    return;
  }
}

export function loadAgentBank(agent) {
  const name = String(agent || "").toLowerCase();
  if (!AGENT_MEMORY_KEYS[name]) return loadBank();
  try {
    const key = AGENT_MEMORY_KEYS[name];
    if (!localStorage.getItem(`${key}.initialized`)) migrateLegacyAgents();
    return normalizeBank(JSON.parse(localStorage.getItem(key) || "{}"));
  } catch {
    return emptyBank();
  }
}

function persistAgent(agent, bank) {
  const key = AGENT_MEMORY_KEYS[agent];
  if (!key) return persist(bank);
  const next = normalizeBank({ ...bank, updatedAt: now() });
  next.facts = next.facts.slice(-400);
  next.events = next.events.slice(-500);
  next.works = next.works.slice(-200);
  localStorage.setItem(key, JSON.stringify(next));
  localStorage.setItem(`${key}.initialized`, "1");
  return next;
}

export function addEvent({ agent = "linnea", kind = "note", text = "", data = null } = {}) {
  const isolated = ISOLATED_AGENTS.includes(agent);
  const bank = isolated ? loadAgentBank(agent) : loadBank();
  bank.events.push({ id: crypto.randomUUID(), at: now(), agent, kind, text: String(text || "").slice(0, 4000), data });
  return isolated ? persistAgent(agent, bank) : saveBank(bank);
}

export function addFact({ agent = "linnea", text = "", tags = [] } = {}) {
  const isolated = ISOLATED_AGENTS.includes(agent);
  const clean = String(text || "").trim();
  if (!clean) return isolated ? loadAgentBank(agent) : loadBank();
  const bank = isolated ? loadAgentBank(agent) : loadBank();
  if (!bank.facts.some((f) => f.text.toLowerCase() === clean.toLowerCase())) {
    bank.facts.push({ id: crypto.randomUUID(), at: now(), agent, text: clean.slice(0, 500), tags });
  }
  return isolated ? persistAgent(agent, bank) : saveBank(bank);
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
  const bank = ISOLATED_AGENTS.includes(agent) ? loadAgentBank(agent) : loadBank();
  return {
    agent,
    owner: bank.owner,
    factCount: bank.facts.length,
    eventCount: bank.events.length,
    workCount: bank.works.length,
    onedrive: bank.onedrive,
    drive: bank.drive,
    isolatedMemory: ISOLATED_AGENTS.includes(agent),
    facts: bank.facts.slice(-20).map((f) => "- " + f.text).join("\n"),
    recent: bank.events.slice(-8).map((e) => e.agent + ":" + e.kind + " " + e.text).join("\n")
  };
}

export function canBindFolder() { return false; }
export async function bindOneDriveFolder() { throw new Error("OneDrive är inte backend för delat AI-minne."); }
export async function syncBoundFolder() { return { ok: false, status: "pending-owner-drive" }; }

function mergeRows(current, incoming) {
  const map = new Map();
  for (const row of current || []) if (row?.id) map.set(row.id, row);
  for (const row of incoming || []) if (row?.id) map.set(row.id, row);
  return [...map.values()];
}

export function mergeBank(incoming) {
  const src = incoming && typeof incoming === "object" ? incoming : {};
  if (src.agents && typeof src.agents === "object") {
    for (const agent of ISOLATED_AGENTS) {
      if (src.agents[agent]) persistAgent(agent, src.agents[agent]);
    }
  }
  const cur = loadBank();
  return persist({
    ...cur,
    ...src.shared,
    facts: mergeRows(cur.facts, src.shared?.facts || src.facts),
    events: mergeRows(cur.events, src.shared?.events || src.events),
    works: mergeRows(cur.works, src.shared?.works || src.works),
    drive: { ...cur.drive, ...(src.shared?.drive || src.drive || {}), bound: false, status: "pending-owner-drive" },
    onedrive: { ...cur.onedrive, status: "not-backend", bound: false },
    backend: "local-export"
  });
}

export function exportBank() {
  const shared = loadBank();
  shared.drive = { ...shared.drive, lastExport: now() };
  persist(shared);
  const bundle = {
    version: 3,
    exportedAt: now(),
    owner: "Vardet777",
    shared,
    agents: Object.fromEntries(ISOLATED_AGENTS.map((agent) => [agent, loadAgentBank(agent)]))
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = DRIVE_FILE;
  a.click();
  addEvent({ agent: "linnea", kind: "export", text: DRIVE_FILE });
  return bundle;
}

export async function importFile(file) {
  const data = JSON.parse(await file.text());
  const bundle = data?.agents ? data : { shared: data, agents: {} };
  for (const agent of ISOLATED_AGENTS) {
    if (bundle.agents?.[agent]) persistAgent(agent, bundle.agents[agent]);
  }
  const bank = mergeBank({ shared: bundle.shared || {} });
  addEvent({ agent: "linnea", kind: "import", text: file.name || DRIVE_FILE });
  return bank;
}
