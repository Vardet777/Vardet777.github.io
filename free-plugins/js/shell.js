import { requireWorkshop, leaveWorkshop } from "./auth.js";

const PAGES = [
  ["index.html", "Hem"],
  ["katalog.html", "Katalog"],
  ["skapa.html", "Skapa"],
  ["linnea.html", "Linnea"],
  ["pack.html", "Pack"],
  ["reklam.html", "Reklam"],
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
  header.innerHTML = `
    <img class="av" alt="Linnea" src="./img/linnea.jpg"/>
    <div>
      <strong>Free-Plugins</strong>
      <span>Linnea · verkstad · förhandsvisning</span>
    </div>
    <nav class="main" aria-label="Sajt">${nav}</nav>
  `;
}

const footer = document.getElementById("site-footer");
if (footer) {
  footer.innerHTML = `
    Förhandsvisning. Inloggningsvägg på. IP Vardet777.
    <a href="./villkor.html">Villkor</a> ·
    <a href="./integritet.html">Integritet</a> ·
    <button type="button" class="ghost" id="leave-ws" style="margin-left:8px;padding:4px 10px">Lås</button>
  `;
  document.getElementById("leave-ws")?.addEventListener("click", leaveWorkshop);
}
