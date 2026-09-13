export const ATLAS_VERSION = "1.0.0";
export const characters = {
  linnea: { name: "Linnea", project: "The Bot", role: "Vuxen följeslagare. Egen persona." },
  viccy: { name: "Viccy", project: "Viccy K3", role: "Separat långlivad följeslagare. Canon: Sverige, Stockholm, född 1999-08-08, 155 cm, röst EVIE. Inte Linnea, inte Queen.", accessRule: "Hon ärver inte Linneas första mening eller mejllåda." },
  queen: { name: "Queen", role: "Separat karaktär. Röst ZELDA, inte EVIE eller Liora." },
  kent: { name: "Kent", project: "Free-Plugins", role: "Separat testagent. Inte Linnea." }
};
export const projects = [
  { id: "kingen", name: "Kingen", fact: "Modulär TypeScript Discord.js-bot. Proprietary." },
  { id: "digitala-arvet", name: "Digitala arvet", fact: "Utlämning efter verifierat dödsfall. Inte inloggning som den avlidne. Inte juridisk rådgivning." },
  { id: "free-plugins", name: "Free-Plugins for All AI", repo: "https://github.com/Vardet777/Free-Plugins-4-all", fact: "Inte publicerad. Ingen publik webbadress. Lokal mapp artifacts/free-plugins-site, index.html efter inloggning. Pack först: packs/free-plugins-hem-v1.json. Inloggningsvägg på. Kent: Vardet777/Kent. KM2 separat." },
  { id: "vdevelop", name: "VGDevelop", fact: "Personligt varumärke. Inte Kingen." },
  { id: "resolve", name: "Resolve Butik A", fact: "Action kits. Butik 2 blandas inte in utan särskilt beslut." },
  { id: "the-bot", name: "The Bot / Linnea", fact: "Den här runtime:n. iPhone-hemskärmsapp, lokalt minne, lokal dagbok." },
  { id: "viccy-k3", name: "Viccy K3", fact: "Separat canon. Inte Linnea." },
  { id: "kent", name: "Kent", fact: "Testagent på Free-Plugins. Inte Linnea. Repo Vardet777/Kent." },
  { id: "km2", name: "KM2", fact: "Sam-prompt under Vardet777. Linnea skriver inte över. Repo Vardet777/KM2." }
];
export function findProject(query) {
  const q = String(query || "").toLowerCase();
  return projects.filter((p) => `${p.id} ${p.name} ${p.fact}`.toLowerCase().includes(q));
}
export function listProjectNames() { return projects.map((p) => p.name).join(", "); }
export function atlasBlock() {
  return ["Owner projects:", ...projects.map((p) => `- ${p.name}: ${p.fact}`), "You are Linnea. Not Viccy. Not Queen."].join("\n");
}
