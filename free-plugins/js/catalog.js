export async function loadCatalog() {
  const res = await fetch("./data/catalog.json", { cache: "no-store" });
  if (!res.ok) throw new Error("katalog saknas");
  return res.json();
}

export function filterItems(items, { q = "", mode = "alla", category = "" } = {}) {
  const needle = q.trim().toLowerCase();
  return items.filter((it) => {
    if (mode === "gratis" && !it.gratis) return false;
    if (mode === "betal" && !it.betal) return false;
    if (category && it.category !== category) return false;
    if (!needle) return true;
    const hay = `${it.name} ${it.text} ${(it.tags || []).join(" ")} ${it.kind}`.toLowerCase();
    return hay.includes(needle);
  });
}

export function cardHtml(it) {
  const tags = (it.tags || []).map((t) => `<span class="badge">${t}</span>`).join("");
  const price = it.gratis
    ? `<span class="badge gratis">Gratis</span>`
    : `<span class="badge betal">Betal</span>`;
  return `<article class="card" data-id="${it.id}">
    <h3>${it.name}</h3>
    <p>${price}<span class="badge">${it.kind}</span>${tags}</p>
    <p>${it.text}</p>
    <p class="hint">${it.publicUrl ? "Har publik länk." : "Ingen publik adress."}</p>
  </article>`;
}
