const ALLOWED_SOURCE = ["original", "cc-licensed", "licensed-contract"];
const REQUIRED = ["id", "name", "version", "kind", "license", "language", "status", "source"];
export function validatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== "object") return ["pack saknas"];
  for (const key of REQUIRED) if (!pack[key]) errors.push("saknar " + key);
  if (pack.source && !ALLOWED_SOURCE.includes(pack.source)) errors.push("otillåten source: " + pack.source);
  if (pack.kind === "cookbook") {
    if (!Array.isArray(pack.items) || pack.items.length === 0) errors.push("cookbook kräver minst ett recept");
    else pack.items.forEach((item, i) => {
      if (!item.id || !item.title) errors.push(`recept ${i} saknar id/title`);
      if (!Array.isArray(item.ingredients)) errors.push(`recept ${i} saknar ingredients`);
      if (!Array.isArray(item.steps)) errors.push(`recept ${i} saknar steps`);
    });
  }
  return errors;
}
export function isPublishable(pack) {
  const errors = validatePack(pack);
  if (errors.length || pack.status === "draft") return false;
  return pack.status === "owner-locked" || pack.status === "ready-for-review" || pack.status === "publicerbar";
}
export async function loadPack(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error("pack saknas: " + path);
  return res.json();
}
export async function loadAllPacks(catalog) {
  const items = (catalog?.items || []).filter((it) => it.pack);
  const rows = [];
  for (const it of items) {
    try {
      const pack = await loadPack(it.pack);
      rows.push({ item: it, pack, errors: validatePack(pack) });
    } catch (err) {
      rows.push({ item: it, pack: null, errors: [String(err.message || err)] });
    }
  }
  return rows;
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
export function cookbookChat(pack, itemIndex = 0) {
  const item = pack?.items?.[itemIndex];
  if (!item) return renderPassportText(pack);
  const ings = (item.ingredients || []).map((i) => `- ${i.amount || ""} ${i.name || ""}`.trim()).join("\n");
  const steps = (item.steps || []).map((s, n) => `${n + 1}. ${s}`).join("\n");
  return [item.title, "", "Ingredienser", ings, "", "Steg", steps].join("\n");
}
export function renderPassportText(pack) {
  if (!pack) return "Pack saknas.";
  return [pack.name, `${pack.id} · ${pack.version}`, pack.does || "", `Status ${pack.status}.`].filter(Boolean).join("\n");
}
export function renderCookbookPage() { return ""; }
export function renderPassport() { return ""; }
export function emptyCookbook({ name, id }) {
  return { id, name, version: "0.1.0", kind: "cookbook", license: "AllRightsReserved", language: "sv", status: "draft", source: "original", owner: "Vardet777", items: [] };
}
