const SESSION = "fp.workshop.v2";
const HASH_KEY = "fp.workshop.hash.v1";
const SALT = "fp.linnea.gate.v1";
const MIN = 8;

export function signedIn() {
  try {
    return sessionStorage.getItem(SESSION) === "1";
  } catch {
    return false;
  }
}

export function hasPassword() {
  try {
    return Boolean(localStorage.getItem(HASH_KEY));
  } catch {
    return false;
  }
}

export async function hashPassword(pass) {
  const raw = String(pass || "");
  const data = new TextEncoder().encode(SALT + "\n" + raw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function passwordRules(pass, confirm) {
  const p = String(pass || "");
  if (p.length < MIN) return "Minst " + MIN + " tecken.";
  if (/\s/.test(p)) return "Inga mellanslag.";
  if (confirm != null && p !== String(confirm)) return "Lösenorden är inte lika.";
  return "";
}

export async function setPassword(pass, confirm) {
  const err = passwordRules(pass, confirm);
  if (err) throw new Error(err);
  const hash = await hashPassword(pass);
  localStorage.setItem(HASH_KEY, hash);
  sessionStorage.setItem(SESSION, "1");
}

export async function unlock(pass) {
  const stored = localStorage.getItem(HASH_KEY);
  if (!stored) throw new Error("Inget lösenord valt än.");
  const hash = await hashPassword(pass);
  if (hash !== stored) throw new Error("Fel lösenord.");
  sessionStorage.setItem(SESSION, "1");
}

export async function changePassword(oldPass, nextPass, confirm) {
  await unlock(oldPass);
  await setPassword(nextPass, confirm);
}

export function enterWorkshop() {
  sessionStorage.setItem(SESSION, "1");
  location.href = "./index.html";
}

export function leaveWorkshop() {
  sessionStorage.removeItem(SESSION);
  location.href = "./login.html";
}

export function requireWorkshop() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "login.html") return;
  if (!signedIn()) location.replace("./login.html");
}
