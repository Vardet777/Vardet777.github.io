const CLIENT_KEY = "fp.azure.clientId";
const ACCOUNT_KEY = "fp.azure.account";
export const REDIRECT_URI = "https://vardet777.github.io/free-plugins/azure.html";
export const REGISTER_URL = "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateApplicationBlade";
export const APP_LIST_URL = "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade";
export const DOCS_URL = "https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app";
export const SCOPES = ["User.Read", "Files.ReadWrite", "offline_access"];
const GRAPH = "https://graph.microsoft.com/v1.0";
const FILE_PATH = "/me/drive/root:/Apps/Linnea/shared-memory.json:/content";
export function getClientId() {
  try { return localStorage.getItem(CLIENT_KEY) || ""; } catch { return ""; }
}
export function setClientId(id) {
  const clean = String(id || "").trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(clean)) {
    throw new Error("Client-id ska vara ett GUID från Azure-portalen.");
  }
  localStorage.setItem(CLIENT_KEY, clean);
  return clean;
}
export function clearAzure() {
  localStorage.removeItem(CLIENT_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
}
export function savedAccount() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "null"); } catch { return null; }
}
function loadMsal() {
  if (window.msal?.PublicClientApplication) return Promise.resolve(window.msal);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://alcdn.msauth.net/browser/3.28.1/js/msal-browser.min.js";
    s.onload = () => resolve(window.msal);
    s.onerror = () => reject(new Error("Kunde inte ladda MSAL från Microsoft."));
    document.head.appendChild(s);
  });
}
let pca = null;
function rememberAccount(account) {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
    username: account.username, name: account.name, homeAccountId: account.homeAccountId
  }));
}
async function app() {
  const clientId = getClientId();
  if (!clientId) throw new Error("Klistra in Application (client) ID först.");
  const msal = await loadMsal();
  if (!pca) {
    pca = new msal.PublicClientApplication({
      auth: { clientId, authority: "https://login.microsoftonline.com/common", redirectUri: REDIRECT_URI },
      cache: { cacheLocation: "localStorage" }
    });
    await pca.initialize();
    const result = await pca.handleRedirectPromise();
    if (result?.account) rememberAccount(result.account);
  }
  return pca;
}
export async function connectAzure() {
  const instance = await app();
  const login = await instance.loginPopup({ scopes: SCOPES, prompt: "select_account" });
  rememberAccount(login.account);
  return login.account;
}
export async function disconnectAzure() {
  try {
    const instance = await app();
    const accounts = instance.getAllAccounts();
    if (accounts[0]) await instance.logoutPopup({ account: accounts[0] });
  } catch {}
  localStorage.removeItem(ACCOUNT_KEY);
}
async function token() {
  const instance = await app();
  const accounts = instance.getAllAccounts();
  const account = accounts[0];
  if (!account) throw new Error("Inte inloggad i Azure än.");
  try {
    const silent = await instance.acquireTokenSilent({ scopes: SCOPES, account });
    return silent.accessToken;
  } catch {
    const pop = await instance.acquireTokenPopup({ scopes: SCOPES, account });
    return pop.accessToken;
  }
}
export async function pushMemoryToOneDrive(bank) {
  const access = await token();
  const res = await fetch(GRAPH + FILE_PATH, {
    method: "PUT",
    headers: { Authorization: "Bearer " + access, "Content-Type": "application/json" },
    body: JSON.stringify(bank, null, 2)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Graph avvisade skrivningen: " + res.status + " " + text.slice(0, 180));
  }
  return res.json().catch(() => ({ ok: true }));
}
export async function pullMemoryFromOneDrive() {
  const access = await token();
  const res = await fetch(GRAPH + FILE_PATH, { headers: { Authorization: "Bearer " + access } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Graph läsning misslyckades: " + res.status);
  return res.json();
}
