/** Merge device and desktop archives without wiping either side. */

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function mergeCards(existing, incoming) {
  const out = (existing || []).filter((c) => c && !c.deleted).map((c) => ({ ...c }));
  const byId = new Map(out.map((c) => [c.id, c]));
  const byText = new Map(out.map((c) => [norm(c.content), c]));
  for (const raw of incoming || []) {
    if (!raw || raw.deleted) continue;
    const card = { ...raw };
    if (card.id && byId.has(card.id)) {
      const live = byId.get(card.id);
      const newer = String(card.updatedAt || card.lastReferencedAt || card.createdAt || "") >
        String(live.updatedAt || live.lastReferencedAt || live.createdAt || "");
      if (newer) Object.assign(live, card);
      continue;
    }
    const key = norm(card.content);
    if (key && byText.has(key)) continue;
    out.push(card);
    if (card.id) byId.set(card.id, card);
    if (key) byText.set(key, card);
  }
  return out;
}

export function mergeDiary(existing, incoming) {
  const out = [...(existing || [])];
  const byId = new Map(out.filter((d) => d?.id).map((d) => [d.id, d]));
  const byKey = new Map(out.map((d) => [`${d.ts}|${d.body}`, d]));
  for (const raw of incoming || []) {
    if (!raw || !raw.body) continue;
    if (raw.id && byId.has(raw.id)) continue;
    const key = `${raw.ts}|${raw.body}`;
    if (byKey.has(key)) continue;
    out.push({ ...raw });
    if (raw.id) byId.set(raw.id, raw);
    byKey.set(key, raw);
  }
  return out.sort((a, b) => String(a.ts).localeCompare(String(b.ts)));
}

export function mergeArchive(local, incoming) {
  return {
    persona: "Linnea",
    mergedAt: new Date().toISOString(),
    cards: mergeCards(local?.cards, incoming?.cards),
    diary: mergeDiary(local?.diary, incoming?.diary)
  };
}
