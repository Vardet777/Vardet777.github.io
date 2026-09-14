import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("..", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), "utf8");

test("Skapa uses canonical addWork and not a missing addLearning export", () => {
  const html = read("skapa.html");
  assert.match(html, /import\s*\{\s*addWork\s*\}\s*from\s*[\"']\.\/js\/memory\.js[\"']/);
  assert.doesNotMatch(html, /addLearning/);
  assert.match(html, /addWork\(work\)/);
});

test("Linnea answer path has an explicit provider fallback contract", () => {
  const source = read("js/linnea.js");
  assert.match(source, /generateFromQueue/);
  assert.match(source, /source:\s*result\.provider/);
  assert.match(source, /source:\s*\"local\"/);
});

test("Memory does not expose a fake OneDrive path as a Google Drive path", () => {
  const source = read("js/memory.js");
  assert.doesNotMatch(source, /ONEDRIVE_PATH\s*=\s*[\"']Google Drive\//);
  assert.match(source, /backend:\s*\"google-drive\"/);
});
