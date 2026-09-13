import { requireWorkshop, leaveWorkshop } from "./auth.js";
const PAGES = [
  ["index.html", "Hem"],
  ["katalog.html", "Katalog"],
  ["skapa.html", "Skapa"],
  ["linnea.html", "Linnea"],
  ["minne.html", "Minne"],
  ["pack.html", "Pack"],
  ["ai.html", "AI"],
  ["azure.html", "Azure"],
  ["kopplingar.html", "Kopplingar"],
  ["bevakning.html", "Bevakning"],
  ["om.html", "Om"]
];
requireWorkshop();
const here = location.pathname.split("/").pop() || "index.html";
const nav = PAGES.map(([href, label]) => {
  const on = here === href || (here === "kent.html" && href === "linnea.html") ? " on" : "";
  return `<a class="${on.trim()}" href="./${href}">${label}</a>`;
}).join("");
const header = document.getElementById("site-header");
if (header) {
  header.innerHTML = `<div class="av" role="img" aria-label="Linnea"></div><div><strong>Free-Plugins</strong><span>Linnea · delat minne · verkstad</span></div><nav class="main" aria-label="Sajt">${nav}</nav>`;
}
const footer = document.getElementById("site-footer");
if (footer) {
  footer.innerHTML = `Inloggningsvägg på. IP Vardet777. Inte publicerad som produkt. <a href="./ai.html">AI</a> · <a href="./azure.html">Azure</a> · <a href="./losenord.html">Lösenord</a> <button type="button" class="ghost" id="leave-ws">Lås</button>`;
  document.getElementById("leave-ws")?.addEventListener("click", leaveWorkshop);
}
