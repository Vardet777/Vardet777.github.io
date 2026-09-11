export const plugins = [
  {
    id: "plugins.list",
    re: /^(plugins|tillägg|färdigheter|vad kan du)\s*\??$/i,
    run() {
      return { ok: true, pluginText: "Tillägg: klarhet, beslut, plan, fokus, granska, risk, juridiken, gratis ai / läge, kom ihåg, dagbok." };
    }
  },
  {
    id: "plugins.gratisai",
    re: /^(gratis ai|vilka ai|läge|status)\s*\??$/i,
    run(ctx) {
      const s = ctx.settings || {};
      return { ok: true, pluginText: [
        "Gratis AI-vägar:",
        "1. Lokal composer — alltid på.",
        s.groqKey ? "2. Groq — nyckel finns." : "2. Groq — saknar nyckel.",
        s.orKey ? "3. OpenRouter — nyckel finns." : "3. OpenRouter — saknar nyckel.",
        s.useXai && s.llmKey ? "4. xAI — påslagen sist." : "4. xAI — av.",
        "Saknar väg: Copilot, Gemini, Claude, deep search."
      ].join("\n") };
    }
  },
  {
    id: "plugins.klarhet",
    re: /^(klarhet|skärp|tydliggör)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      return { ok: true, pluginText: `Klarhet:\n1. ${raw}\nNästa handling: gör det minsta steget som går att testa idag.` };
    }
  },
  {
    id: "plugins.fokus",
    re: /^(fokus|en sak)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      return { ok: true, pluginText: `Fokus: ${String(args[1] || args[0] || "").trim()}\nResten väntar.` };
    }
  }
];
export function parsePlugin(text) {
  const t = String(text || "").trim();
  for (const p of plugins) {
    const m = t.match(p.re);
    if (m) return { plugin: p, args: m.slice(1) };
  }
  return null;
}
export function runPlugin(parsed, ctx) {
  return parsed.plugin.run(ctx || {}, parsed.args);
}
