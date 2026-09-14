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

test("Memory keeps local cache as the actual backend until Drive is really bound", () => {
  const source = read("js/memory.js");
  assert.doesNotMatch(source, /ONEDRIVE_PATH\s*=\s*[\"']Google Drive\//);
  assert.match(source, /backend:\s*\"local-export\"/);
  assert.match(source, /Google Drive blir canonical extern backend först efter faktisk bindning/);
  assert.match(source, /OneDrive är inte backend för delat AI-minne/);
});

test("Linnea and Kent are separate first-class agents", () => {
  const shell = read("js/shell.js");
  const kent = read("kent.html");
  const memory = read("js/memory.js");
  assert.match(shell, /\[\"linnea\.html\",\s*\"Linnea\"\]/);
  assert.match(shell, /\[\"kent\.html\",\s*\"Kent\"\]/);
  assert.doesNotMatch(kent, /meta http-equiv=\"refresh\"/i);
  assert.match(kent, /Kent/);
  assert.match(kent, /js\/kent\.js/);
  assert.match(memory, /\"linnea\"/);
  assert.match(memory, /\"kent\"/);
});

test("Linnea and Kent use isolated memory stores", () => {
  const memory = read("js/memory.js");
  assert.match(memory, /AGENT_MEMORY_KEYS/);
  assert.match(memory, /fp\.memory\.linnea/);
  assert.match(memory, /fp\.memory\.kent/);
  assert.match(memory, /loadAgentBank\(agent\)/);
  assert.match(memory, /contextForAgent\(agent\)[\s\S]*loadAgentBank\(agent\)/);
  assert.match(memory, /addFact\(\{ agent/);
  assert.match(memory, /addEvent\(\{ agent/);
  assert.match(memory, /stripIsolatedFromShared/);
});

test("Private-memory UI stays explicit and points to the correct agent store", () => {
  const index = read("index.html");
  const linnea = read("linnea.html");
  const kent = read("kent.html");
  const shell = read("js/shell.js");
  assert.match(index, /separata privata minnesgrunder/);
  assert.match(index, /Linnea[\s\S]*egen privat minnesgrund/);
  assert.match(index, /Kent[\s\S]*egen privat minnesgrund/);
  assert.match(linnea, /loadAgentBank\("linnea"\)/);
  assert.match(kent, /loadAgentBank\("kent"\)/);
  assert.match(kent, /Kents privata minne/);
  assert.match(shell, /Linnea · Kent · separata minnen · verkstad/);
});

test("Kent must not describe Linnea's private memory as shared", () => {
  const source = read("js/kent.js");
  assert.match(source, /Kents egen minneskontext/);
  assert.match(source, /olika privata minnesgrunder/);
  assert.doesNotMatch(source, /samma delade minneskontext/);
});
