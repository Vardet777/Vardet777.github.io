const KEY = "fp.workshop";

export function signedIn() {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function enterWorkshop() {
  sessionStorage.setItem(KEY, "1");
  location.href = "./index.html";
}

export function leaveWorkshop() {
  sessionStorage.removeItem(KEY);
  location.href = "./login.html";
}

export function requireWorkshop() {
  const page = location.pathname.split("/").pop() || "index.html";
  if (page === "login.html" || page === "" || page === "free-plugins") return;
  if (!signedIn()) location.replace("./login.html");
}
