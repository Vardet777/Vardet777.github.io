import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("..", import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("Skapa uses canonical addWork and not a missing addLearning export", () => {
  const html = read("../skapa.html");
  assert.match(html, /import\s*\{\s*addWork\s*\}\s*from\s*[\"']\.\/js\/memory\.js[\"']/);
  assert.doesNotMatch(html, /addLearning/);
  assert.match(html, /addWork\(work\)/);
});

test("Linnea answer path has an explicit provider fallback contract", () => {
  const source = read("../js/linnea.js");
  assert.match(source, /generateFromQueue/);
  assert.match(source, /source:\s*result\.provider/);
  assert.match(source, /source:\s*\"local\"/);
});

test("Memory keeps local cache as the actual backend until Drive is really bound", () => {
  const source = read("../js/memory.js");
  assert.doesNotMatch(source, /ONEDRIVE_PATH\s*=\s*[\"']Google Drive\//);
  assert.match(source, /backend:\s*\"local-export\"/);
  assert.match(source, /Google Drive blir canonical extern backend först efter faktisk bindning/);
  assert.match(source, /OneDrive är inte backend för delat AI-minne/);
});
