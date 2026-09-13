const KEY = "fp.shared.memory";
export const AGENTS = ["linnea", "katalog", "skapa", "pack"];
export const ONEDRIVE_PATH = "OneDrive/Apps/Linnea/shared-memory.json";

function now() {
  return new Date().toISOString();
}

function emptyBank() {
  return {
    version: 1,
    owner: "Vardet777",
    updatedAt: null,
    onedrive: {
      target: ONEDRIVE_PATH,
      status: "local-only",
      lastExport: null,
      bound: false,
      note: "Koppla OneDrive-mappen på datorn, eller exportera filen till Files → OneDrive/Apps/Linnea. Live Graph/Azure är inte inkopplat."
    },
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
    bank.onedrive = { ...emptyBank().onedrive, ...(bank.onedrive || {}) };
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

export function saveBank(bank) {
  const next = persist(bank);
  queueMicrotask(() => {
    syncBoundFolder().catch(() => {});
  });
  return next;
}

export function addEvent({ agent = "linnea", kind = "note", text = "", data = null } = {}) {
  const bank = loadBank();
  bank.events.push({
    id: crypto.randomUUID(),
    at: now(),
    agent,
    kind,
    text: String(text || "").slice(0, 4000),
    data
  });
  return saveBank(bank);
}

export function addFact({ agent = "linnea", text = "", tags = [] } = {}) {
  const clean = String(text || "").trim();
  if (!clean) return loadBank();
  const bank = loadBank();
  const exists = bank.facts.some((f) => f.text.toLowerCase() === clean.toLowerCase());
  if (!exists) {
    bank.facts.push({
      id: crypto.randomUUID(),
      at: now(),
      agent,
      text: clean.slice(0, 500),
      tags
    });
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
  const facts = bank.facts.slice(-20).map((f) => `- ${f.text}`).join("\n");
  const recent = bank.events.slice(-8).map((e) => `${e.agent}:${e.kind} ${e.text}`).join("\n");
  return {
    agent,
    owner: bank.owner,
    factCount: bank.facts.length,
    eventCount: bank.events.length,
    workCount: bank.works.length,
    onedrive: bank.onedrive,
    facts,
    recent
  };
}

export function canBindFolder() {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("fp.linnea.fs", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putHandle(handle) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(handle, "onedrive");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getHandle() {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get("onedrive");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function writeToHandle(handle, bank) {
  const file = await handle.getFileHandle("shared-memory.json", { create: true });
  const writable = await file.createWritable();
  await writable.write(JSON.stringify(bank, null, 2));
  await writable.close();
}

async function readFromHandle(handle) {
  try {
    const file = await handle.getFileHandle("shared-memory.json");
    const blob = await file.getFile();
    return JSON.parse(await blob.text());
  } catch {
    return null;
  }
}

export async function bindOneDriveFolder() {
  if (!canBindFolder()) {
    throw new Error("Den här webbläsaren kan inte koppla en mapp. Exportera filen i stället.");
  }
  const handle = await window.showDirectoryPicker({
    id: "linnea-onedrive",
    mode: "readwrite",
    startIn: "documents"
  });
  await putHandle(handle);
  const incoming = await readFromHandle(handle);
  if (incoming) mergeBank(incoming);
  const bank = loadBank();
  bank.onedrive.status = "folder-bound";
  bank.onedrive.bound = true;
  bank.onedrive.lastExport = now();
  persist(bank);
  await writeToHandle(handle, bank);
  addEvent({ agent: "linnea", kind: "onedrive", text: "Mapp kopplad för shared-memory.json" });
  return loadBank();
}

export async function syncBoundFolder() {
  const handle = await getHandle();
  if (!handle) return { ok: false, status: loadBank().onedrive.status };
  const perm = await handle.queryPermission({ mode: "readwrite" });
  const allowed = perm === "granted" ? "granted" : await handle.requestPermission({ mode: "readwrite" });
  if (allowed !== "granted") return { ok: false, status: "permission" };
  const incoming = await readFromHandle(handle);
  if (incoming) mergeBank(incoming);
  const bank = loadBank();
  bank.onedrive.status = "folder-bound";
  bank.onedrive.bound = true;
  bank.onedrive.lastExport = now();
  persist(bank);
  await writeToHandle(handle, bank);
  return { ok: true, status: "folder-bound" };
}

export function exportBank() {
  const bank = loadBank();
  bank.onedrive = {
    ...bank.onedrive,
    status: bank.onedrive.bound ? "folder-bound" : "exported",
    lastExport: now()
  };
  persist(bank);
  const blob = new Blob([JSON.stringify(bank, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "shared-memory.json";
  a.click();
  addEvent({ agent: "linnea", kind: "export", text: `Exporterad fil för ${ONEDRIVE_PATH}` });
  return bank;
}

export function mergeBank(incoming) {
  const cur = loadBank();
  const src = incoming && typeof incoming === "object" ? incoming : {};
  const byId = (rows) => {
    const map = new Map();
    for (const row of rows || []) if (row && row.id) map.set(row.id, row);
    return map;
  };
  const facts = byId(cur.facts);
  for (const row of src.facts || []) if (row?.id) facts.set(row.id, row);
  const events = byId(cur.events);
  for (const row of src.events || []) if (row?.id) events.set(row.id, row);
  const works = byId(cur.works);
  for (const row of src.works || []) if (row?.id) works.set(row.id, row);
  return persist({
    ...cur,
    ...src,
    facts: [...facts.values()],
    events: [...events.values()],
    works: [...works.values()],
    onedrive: { ...cur.onedrive, ...(src.onedrive || {}) }
  });
}

export async function importFile(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  const bank = mergeBank(data);
  addEvent({ agent: "linnea", kind: "import", text: file.name || "shared-memory.json" });
  return bank;
}
