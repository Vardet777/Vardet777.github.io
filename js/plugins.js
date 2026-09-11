import { legalDisclaimer, projectLegal, standingRules } from "./legal.js";

export const PLUGIN_VERSION = "1.0.0";

export const plugins = [
  {
    id: "plugins.list",
    re: /^(plugins|tillägg|färdigheter|vad kan du)\s*\??$/i,
    run() {
      return {
        ok: true,
        pluginText:
          "Tillägg som faktiskt körs här:\n" +
          "- klarhet: … — tre punkter + en handling\n" +
          "- beslut: … — alternativ och ägarrisk\n" +
          "- plan: … — idag / veckan / inte nu\n" +
          "- fokus: … — en sak\n" +
          "- granska: … — faktum / gissning / påhitt\n" +
          "- risk: … — hög/medel/låg mot bevakningen\n" +
          "- juridiken / revidera / vilka projekt har vi\n" +
          "- gratis ai / läge — vilka vägar som faktiskt finns\n" +
          "Jag hittar inte på mejl, pengar eller repo-rader."
      };
    }
  },
  {
    id: "plugins.klarhet",
    re: /^(klarhet|skärp|tydliggör)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      const parts = splitBits(raw);
      return {
        ok: true,
        pluginText: [
          "Klarhet:",
          ...parts.slice(0, 3).map((p, i) => `${i + 1}. ${p}`),
          `Nästa handling: ${nextAction(raw)}`,
          "Jag har inte lagt till fakta du inte skrev."
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.beslut",
    re: /^(beslut|välj|ska jag)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      return {
        ok: true,
        pluginText: [
          "Beslut (ägare först, inte advokat):",
          `Läget: ${raw}`,
          "A — gör det nu om kostnaden är låg och det går att ångra.",
          "B — vänta om det kräver Outlook, pengar, OSS-licens, varumärke eller andras kod.",
          "C — skriv avtal först om en utomstående ska in.",
          "Standarddrag: minsta säkra steg som inte ger bort IP eller fel From.",
          legalDisclaimer
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.plan",
    re: /^(plan|planera)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      return {
        ok: true,
        pluginText: [
          "Plan:",
          `Idag: ${clip(raw, 80)} — ett synligt steg.`,
          "Veckan: samma sak färdig nog att testa.",
          "Inte nu: App Store, lur, dold mic, OSS-släpp, patentansökan utan underlag."
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.fokus",
    re: /^(fokus|en sak)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      return {
        ok: true,
        pluginText: `Fokus: ${clip(raw, 140)}\nResten väntar. Ingen andra grej förrän den här är antingen klar eller medvetet parkerad.`
      };
    }
  },
  {
    id: "plugins.granska",
    re: /^(granska|sanning|stämmer det)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      const invented = /(har skickat|är live|är publicerad|är patenterad|är ohackbar|app store klar)/i.test(raw);
      return {
        ok: true,
        pluginText: [
          "Granskning:",
          `Påstått: ${raw}`,
          invented
            ? "Påhitt-risk: meningen låter som ett avslutat faktum. I den här runtime:n är mejl utkast, telefon simulator och App Store inte påbörjad."
            : "Jag ser inget uppenbart påhitt i orden. Det betyder inte att det är sant utanför det du just skrev.",
          "Faktum här: tester och lokala filer. Gissning: allt som kräver andras servrar."
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.risk",
    re: /^(risk|flagga risk|vad är risken)\s*[:\-]?\s*(.+)$/i,
    run(_ctx, args) {
      const raw = String(args[1] || args[0] || "").trim();
      const hits = projectLegal.filter((p) =>
        raw.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );
      const highs = (hits[0]?.highs || standingRules.slice(0, 3)).slice(0, 3);
      return {
        ok: true,
        pluginText: [
          hits[0] ? `Risk mot ${hits[0].name} (${hits[0].headline})` : "Risk (generell bevakning):",
          ...highs.map((h) => `- Hög/Bevaka: ${h}`),
          legalDisclaimer
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.gratisai",
    re: /^(gratis ai|vilka ai|ai-tjänster|vilka ai-tjänster|läge|status)\s*\??$/i,
    run(ctx) {
      const s = ctx.settings || {};
      const groq = s.groqKey ? "Groq — nyckel finns, provas före lokal." : "Groq — saknar nyckel.";
      const or = s.orKey ? "OpenRouter free — nyckel finns, provas före lokal." : "OpenRouter — saknar nyckel.";
      const xai = s.useXai && s.llmKey ? "xAI — påslagen sist, kräver kredit." : "xAI — av som default.";
      return {
        ok: true,
        pluginText: [
          "Gratis AI-vägar i den här appen:",
          "1. Lokal composer + plugins + minne — alltid på, kostnad 0.",
          "2. " + groq,
          "3. " + or,
          "4. " + xai,
          "Saknar väg: Copilot, Gemini, Claude, deep search.",
          "Jag påstår inte att jag äger alla AI på nätet."
        ].join("\n")
      };
    }
  },
  {
    id: "plugins.sammanfatta",
    re: /^(sammanfatta|recap|vad sa vi)\s*\??$/i,
    run(ctx) {
      const turns = ctx.session?.turns || [];
      if (!turns.length) {
        return { ok: true, pluginText: "Ingen tråd att sammanfatta än." };
      }
      const last = turns.slice(-6).map((t) => `${t.role === "user" ? "Du" : "Linnea"}: ${clip(t.content, 90)}`);
      return { ok: true, pluginText: "Senaste tråden:\n" + last.join("\n") };
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

function splitBits(raw) {
  const bySep = raw.split(/\s*(?:\.|;| och | plus )\s*/i).map((s) => s.trim()).filter(Boolean);
  if (bySep.length >= 2) return bySep;
  return [raw, "Vad som saknas är fortfarande osagt.", "Nästa mening ska vara ett verb."];
}

function nextAction(raw) {
  if (/mail|outlook|mej/i.test(raw)) return "Koppla Outlook som Linneabot99, skicka inte från Gmail.";
  if (/iphone|app/i.test(raw)) return "Öppna https://vardet777.github.io/ i Safari och lägg till på hemskärmen.";
  if (/patent|varumärke/i.test(raw)) return "Sök skydd innan offentlig text. Inte råd, en bevakningsflagga.";
  return "Gör det minsta steget som går att testa idag.";
}

function clip(s, n) {
  const t = String(s || "").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}
