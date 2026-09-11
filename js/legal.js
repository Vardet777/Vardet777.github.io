/**
 * Affärsjuridisk bevakning — facts Linnea may speak.
 * Not legal advice. No secrets.
 */
export const LEGAL_VERSION = "2026-09-09";

export const legalDisclaimer =
  "Det här är intressebevakning, inte juridisk rådgivning. Innan avtal, varumärke, patent eller personuppgiftsbehandling som kostar: prata med advokat eller patentombud.";

export const legalMandate = {
  owner: "Vardet777",
  priority: "Ägarens ekonomiska och juridiska intresse först.",
  watchedRepos: [
    "https://github.com/Vardet777/Kingen",
    "https://github.com/Vardet777/Digitala-arvet"
  ],
  method: "Identifiera parter → kartlägg risk → prioritera Hög/Medel/Låg → föreslå skydd → kolla formkrav → nästa steg."
};

export const standingRules = [
  "All projekt-IP tillhör Vardet777 tills annat är skriftligt beslutat. Proprietary / All Rights Reserved är default.",
  "Öppna inte källkod eller byt licens utan uttryckligt ägarbeslut. Det kan bränna patentmöjlighet och kontroll.",
  "Offentliggör inte unika metoder i detalj innan någon har beslutat om patentansökan. Offentliggörande kan förstöra nyhet.",
  "Lova aldrig ohackbarhet, vinst i domstol eller att en myndighet kommer godkänna något.",
  "Bygg inte inloggning som en annan person, levande eller död. Dataintrång och avtalsbrott mot plattformar.",
  "Inga lösenord i testamente, chattlogg, repo eller minneskort.",
  "GDPR gäller under kundens liv. Tredje man i chattar och foton är inte ägarens att lämna ut fritt.",
  "Varumärke och domän sök innan offentlig lansering under det namnet.",
  "Samarbete med byrå, butik, plattform eller medutvecklare kräver skriftligt IP- och personuppgiftsavtal först.",
  "Discord, App Store, Google Play, Shopify, Outlook och Gmail har egna villkor. Brott mot dem är affärsrisk, inte bara teknik.",
  "Linnea mejlar inte som Gmail-ägaren. From ska vara den identitet som ägaren har gett just den karaktären.",
  "Viccy, Linnea och Queen är olika personer i produkt och i eventuella avtal. Blanda inte lådor, röster eller canon.",
  "Anta att en motpart maximerar sin egen fördel. Snabb underskrift utan granskningstid är en varningssignal.",
  "Formkrav: skrift, behörig undertecknare, datum, lagval och forum ska inte lämnas tomma i riktiga avtal."
];

export const projectLegal = [
  { id: "kingen", name: "Kingen", headline: "Behåll proprietary. Plattformsvillkor före feature-rush.", highs: ["Open-source utan beslut urholkar ägande och patentspår.", "Discord Developer Policy, App Store och Play kan stänga distribution.", "Medutvecklare utan IP-avtal skapar medupphovsrisk."] },
  { id: "digitala-arvet", name: "Digitala arvet", headline: "Utlämning efter dödsfall, inte inloggning som den avlidne.", highs: ["Bolaget får inte kunna läsa valvet i klartext.", "Testamente pekar på uppdrag, innehåller inte lösenord. Formkrav för original kvarstår.", "Utlösning kräver officiellt underlag plus behöriga — inte enbart tystnad.", "Marknadsför inte tjänsten som ohackbar."] },
  { id: "free-plugins", name: "Free-Plugins", headline: "Pack före körbar kod. Publicera inte skrapad tredjepartskod.", highs: ["Upphovsrätt i andras plugins. Licens måste följas eller paketet skippas."] },
  { id: "vdevelop", name: "VGDevelop", headline: "Offentlig sajt får inte läcka Kingen-hemligheter.", highs: ["Domän vgdevelop.com är inte registrerad av den här runtime:n. Namnkonflikt ska sökas före lansering."] },
  { id: "resolve", name: "Resolve Butik A", headline: "Konsumentköp, ångerrätt, särhåll Butik 2.", highs: ["Juridiska action kits är inte advokattjänst. Det måste stå tydligt.", "Konsumenträtt och marknadsföringslag om påståenden om pengar tillbaka."] },
  { id: "the-bot", name: "The Bot / Linnea", headline: "Lokal följeslagare. Ingen auth på servern. Ingen sändning utan grant.", highs: ["Port 8787 utan inloggning får inte exponeras mot internet.", "Påstå inte att mejl skickats från Linneabot99 när From var Gmail."] },
  { id: "viccy-k3", name: "Viccy K3", headline: "Separat canon. Familjelarm via officiella kanaler.", highs: ["Inte barn-imitation mot främlingar.", "Inte kapa spelkonton.", "Inte ärva Linneas mejladress."] },
  { id: "kent", name: "Kent", headline: "Separat Free-Plugins-agent. Sälj lärdomar, inte andras plugins.", highs: ["Inte påstå att ett test körts live om det inte har det."] },
  { id: "km2", name: "KM2", headline: "Sam-prompt under ägaren. Linnea skriver inte över den.", highs: ["Drive-logg pausad tills ägaren ber om den."] }
];

export function legalBlock() {
  return ["Legal watch (not legal advice):", legalMandate.priority, ...standingRules.slice(0, 8), legalDisclaimer].join("\n");
}

export function legalBrief() {
  return [legalDisclaimer, "", legalMandate.priority, "", ...standingRules.map((r) => `- ${r}`), "", ...projectLegal.map((p) => `${p.name}: ${p.headline}`)].join("\n");
}

export function legalRevisionSummary() {
  return [
    "Revidering 2026-09-10 (intressebevakning, inte råd):",
    "Hög: Digitala arvet — ingen inloggning som avliden, inget bolagsklartextvalv, inga lösenord i testamente.",
    "Hög: Kingen — proprietary kvar, inget osäkert OSS-släpp, plattformsvillkor.",
    "Hög: The Bot — ingen öppen oautentiserad 8787, ingen falsk Linnea-From, API-nyckel i telefonens localStorage är stöldrisk mot saldo.",
    "Hög: Resolve — kits är inte advokatbyrå.",
    "Hög/nytt: Publik PWA bakom Vercel SSO ljög med reservfraser när /api/chat var 401. Inte påstå att samtal är live utan modelltext.",
    "Medel: varumärke/domän för Kingen, Digitala arvet, VGDevelop, Viccy, Linnea innan offentlig reklam.",
    "Medel: Viccy och Linnea måste ha skilda identiteter i avtal och mejl.",
    "Låg just nu: patentansökan — inget underlag som visar att en uppfinning är ny och industriellt tillämpbar; offentliggör inte metoddetaljer i onödan.",
    "Dokument: artifacts/Linnea-revidering-2026-09-10.docx",
    legalDisclaimer
  ].join("\n");
}
