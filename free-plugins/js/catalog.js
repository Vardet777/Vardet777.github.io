import { escapeHtml } from "./util.js";

export async function loadCatalog() {
  const res = await fetch("./data/catalog.json", { cache: "no-store" });
  if (!res.ok) throw new Error("katalog saknas");
  const data = await res.json();
  data.items = Array.isArray(data.items)
    ? [...data.items].sort((a, b) => (a.position || 99) - (b.position || 99))
    : [];
  return data;
}

export function categoriesOf(items) {
  return [...new Set((items || []).map((it) => it.category).filter(Boolean))];
}

export function filterItems(items, { q = "", mode = "alla", category = "" } = {}) {
  const needle = q.trim().toLowerCase();
  return (items || []).filter((it) => {
    if (mode === "gratis" && !it.gratis) return false;
    if (mode === "betal" && !it.betal) return false;
    if (category && it.category !== category) return false;
    if (!needle) return true;
    const hay = `${it.name} ${it.text} ${(it.tags || []).join(" ")} ${it.kind} ${it.id}`.toLowerCase();
    return hay.includes(needle);
  });
}

export function cardHtml(it) {
  const tags = (it.tags || []).map((t) => `<span class="badge">${escapeHtml(t)}</span>`).join("");
  const price = it.gratis
    ? `<span class="badge gratis">Gratis</span>`
    : `<span class="badge betal">Betal</span>`;
  const href = it.pack ? `./pack.html?id=${encodeURIComponent(it.id)}` : "";
  const open = href ? `<p><a href="${href}">Öppna pack</a></p>` : "";
  return `<article class="card" data-id="${escapeHtml(it.id)}">
    <h3>${escapeHtml(it.name)}</h3>
    <p>${price}<span class="badge">${escapeHtml(it.kind)}</span>${tags}</p>
    <p>${escapeHtml(it.text)}</p>
    <p class="hint">${it.publicUrl ? "Har publik länk." : "Ingen publik produktadress."}</p>
    ${open}
  </article>`;
}
