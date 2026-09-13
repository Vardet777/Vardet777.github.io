export async function loadConnectors() {
  const res = await fetch("./data/connectors.json", { cache: "no-store" });
  if (!res.ok) throw new Error("connectors saknas");
  return res.json();
}
export function pluginCount(data) { return (data.ais || []).reduce((n, ai) => n + (ai.plugins || []).length, 0); }
export function wiredCount(data) { return (data.ais || []).filter((ai) => ai.wired).length; }
function packBody(pack) {
  const lines = [pack.name, pack.id + " · " + pack.version + " · " + pack.kind, pack.does || "", "Licens " + pack.license + ". Källa " + pack.source + ". Status " + pack.status + ".", "IP Vardet777. Ingen körbar tredjepartskod."];
  if (Array.isArray(pack.innehall)) lines.push(...pack.innehall.map((x) => "- " + x));
  if (Array.isArray(pack.items)) {
    for (const item of pack.items) {
      lines.push("", item.title);
      for (const ing of item.ingredients || []) lines.push("- " + (ing.amount || "") + " " + (ing.name || ""));
      (item.steps || []).forEach((s, i) => lines.push(i + 1 + ". " + s));
    }
  }
  return lines.filter(Boolean).join("\n");
}
export function exportFor(aiId, pack) {
  const body = packBody(pack);
  if (aiId === "chatgpt") return { filename: pack.id + ".gpt.txt", text: "Custom GPT instructions\nName: " + pack.name + "\n\n" + body };
  if (aiId === "claude") return { filename: pack.id + ".skill.md", text: "---\nname: " + pack.id + "\ndescription: " + (pack.does || pack.name) + "\n---\n\n" + body };
  if (aiId === "gemini") return { filename: pack.id + ".gem.txt", text: "Gemini Gem\n" + body };
  if (aiId === "xai" || aiId === "grok") return { filename: pack.id + ".grok-bot.txt", text: "Grok Bot profile\nName: " + pack.name + "\n\n" + body };
  if (aiId === "cursor") return { filename: pack.id + ".mdc", text: "---\ndescription: " + pack.name + "\nglobs:\nalwaysApply: false\n---\n\n" + body };
  return { filename: pack.id + "." + aiId + ".txt", text: body };
}
export function downloadText(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  a.download = filename;
  a.click();
}
