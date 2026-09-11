/** Local talk composer. Cost 0. */
export function classify(text) {
  const t = String(text || "").toLowerCase();
  if (/\b(vem är du|vad heter du|who are you)\b/.test(t)) return "identity";
  if (/(hur är läget|hur mår du|hur går det|läget\s*\??$)/.test(t)) return "checkin";
  if (/(kommer du ihåg|what do you remember|minns du)/.test(t)) return "memory_question";
  if (/(jag vet inte om du|vet du vad jag)/.test(t)) return "memory_question";
  if (/\b(älskar|saknar|känner)\b/.test(t)) return "feeling";
  if (/\?$/.test(t.trim()) && /(när|vilket år|paragraf|lag|hur många)/.test(t)) return "unknown_fact";
  if (/(hej|hallå|tjena|hi\b|hello)/.test(t)) return "hello";
  if (/(trött|jobbigt|ledsen|stress)/.test(t)) return "support";
  if (/(roblox|minecraft|counter-strike|\bcs2\b|\bcs\b)/.test(t)) return "games";
  if (/(vad ska jag göra|vad gör vi nu|vad nu)/.test(t)) return "next";
  return "chat";
}

export function formatCommand(result) {
  if (!result || !result.ok) {
    if (result?.reason === "refused_sensitive") {
      return "Det där liknar en hemlighet. Jag sparar inte lösenord, nycklar eller personnummer.";
    }
    return `Jag kunde inte göra det (${result?.reason || "okänt"}).`;
  }
  if (result.cards) {
    if (!result.cards.length) return "Jag har inga sparade minnen just nu.";
    return "Så här ser minneskorten ut:\n" + result.cards.map((c) => `- ${c.content}`).join("\n");
  }
  if (result.hit !== undefined) return result.hit ? "Okej. Jag har tagit bort det." : "Jag hittade inget att glömma.";
  if (result.deduped) return "Det hade jag redan. Jag har fräschat upp kortet.";
  if (result.card) return `Okej. Jag kommer ihåg det: ${result.card.content}`;
  if (result.diaryEntry) {
    const day = result.diaryEntry.ts ? String(result.diaryEntry.ts).slice(0, 10) : "";
    return `Antecknat i dagboken lokalt (${day}). Inte mejlat.`;
  }
  if (result.diary) {
    if (!result.diary.length) return "Dagboken är tom.";
    return "Lokal dagbok:\n" + result.diary.slice(-7).map((d) => `- ${String(d.ts).slice(0, 10)}: ${d.body || d.text || ""}`).join("\n");
  }
  if (result.atlasList) {
    return "Jag är Linnea. Det här är ägarens projekt som jag har läst in, på översiktsnivå:\n" + result.atlasList.map((p) => `- ${p.name}: ${p.fact}`).join("\n") + "\nViccy är en annan följeslagare. Jag är inte hon.";
  }
  if (result.atlasViccy) return `Viccy är inte jag. ${result.atlasViccy.role} ${result.atlasViccy.accessRule}`;
  if (result.atlasKent) return `Kent är inte jag. ${result.atlasKent.role}`;
  if (result.atlasHits) {
    if (!result.atlasHits.length) {
      return `Jag har ingen träff på “${result.query}”. Projekten jag känner till är: ${result.allNames}. Jag hittar inte på resten.`;
    }
    return result.atlasHits.map((p) => `${p.name}: ${p.fact}`).join("\n");
  }
  if (result.legalText) return result.legalText;
  if (result.pluginText) return result.pluginText;
  return "Okej.";
}

export function composeTalk({ userText, memories = [], name = "Linnea", authenticity = "" }) {
  const intent = classify(userText);
  if (intent === "identity") {
    return `Jag är ${name}. Jag är inte Viccy och inte Queen. Vuxen följeslagare i The Bot. ${authenticity}`.trim();
  }
  if (intent === "memory_question" && !memories.length) {
    return "Det har jag inte i minnet. Jag hittar inte på saker jag inte har sparat.";
  }
  if (intent === "memory_question" && memories.length) {
    return "Jag kollar bara det jag faktiskt har sparat. " + memories.slice(0, 3).map((m) => m.content).join("; ");
  }
  const bits = [adultReply(intent, userText)];
  if (memories.length) {
    bits.push(`Jag har med mig att ${lcFirst(memories.slice(0, 3).map((m) => m.content).join("; "))}.`);
  }
  if (intent === "unknown_fact") bits.push("Jag är inte säker på det som ett faktum — jag gissar inte.");
  return bits.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function adultReply(intent, userText) {
  switch (intent) {
    case "hello":
      return "Hej. Jag är här — du behöver inte släppa det du håller på med.";
    case "checkin":
      return "Jag är här och vaken på den här enheten. Molnet behövs inte för det. Vad håller du på med just nu?";
    case "feeling":
      return "Jag tar emot det. Säg så mycket eller så lite du vill; jag följer efter.";
    case "support":
      return "Det låter tungt. Jag är kvar. Vill du bara dumpa det, eller vill du ha hjälp att sortera?";
    case "games":
      return "Jag kan prata spel och säkerhet — scams, konstiga vuxna i chatten, hur man lämnar en server. Jag kliver inte själv in på barnets konto.";
    case "next":
      return "Minsta gratis steget: säg vad som ska hända i en mening. Jag kan spara det, lägga det i dagboken eller ta det som ett plugin (klarhet, plan, fokus).";
    case "memory_question":
      return "Jag kollar bara det jag faktiskt har sparat.";
    default:
      return reflect(userText);
  }
}

function reflect(userText) {
  const clipped = String(userText || "").trim().replace(/\s+/g, " ").slice(0, 180);
  return `På den här enheten är jag Linnea, lokal. Du sa: “${clipped}”. Jag kan hålla tråden, spara med “kom ihåg …”, eller ta det som dagbok. Vad vill du göra med det?`;
}

function lcFirst(s) {
  const t = String(s || "");
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : t;
}
