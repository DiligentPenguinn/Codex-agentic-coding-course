import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const files = {
  html: join(root, "technical-architecture.html"),
  css: join(root, "technical-architecture.css"),
  js: join(root, "technical-architecture.js"),
};

for (const [kind, path] of Object.entries(files)) {
  assert.equal(existsSync(path), true, `Missing architecture ${kind}: ${path}`);
}

const html = readFileSync(files.html, "utf8");
const css = readFileSync(files.css, "utf8");
const js = readFileSync(files.js, "utf8");

const actorIds = ["learner", "course", "teacher", "codex", "files"];
const scenarioIds = ["start", "work", "ask", "finish", "share", "disconnect"];
const visibilityGroups = [
  "Teacher sees automatically",
  "Teacher sees only when you share",
  "Teacher never sees",
];

for (const id of actorIds) {
  assert.match(
    html,
    new RegExp(`data-actor="${id}"`),
    `Missing simple actor: ${id}`,
  );
}

for (const id of scenarioIds) {
  assert.match(
    html,
    new RegExp(`data-scenario="${id}"`),
    `Missing scenario control: ${id}`,
  );
  assert.match(
    js,
    new RegExp(`\\b${id}:\\s*\\{`),
    `Missing scenario configuration: ${id}`,
  );
}

for (const label of visibilityGroups) {
  assert.match(html, new RegExp(label), `Missing visibility group: ${label}`);
}

assert.match(html, /class="simple-overview"/);
assert.match(html, /Ask and learn/);
assert.match(html, /Build and verify/);
assert.match(html, /Follows one specific Codex conversation/);
assert.match(html, /Teacher[\s\S]{0,120}explains and checks understanding/i);
assert.match(html, /Executor[\s\S]{0,120}edits, runs, and verifies/i);
assert.match(html, /Learner[\s\S]{0,120}decides and approves/i);

const overview =
  html.match(
    /<section[^>]*class="[^"]*simple-overview[^"]*"[\s\S]*?<\/section>/,
  )?.[0] ?? "";
assert.notEqual(overview, "", "Missing simple overview section.");
assert.doesNotMatch(
  overview,
  /threadId|App Server|Hooks|Context Broker|lifecycle|trust boundary/i,
  "Default overview exposes infrastructure jargon.",
);

assert.match(html, /<details[^>]*class="technical-details"/);
assert.doesNotMatch(
  html,
  /<details[^>]*class="technical-details"[^>]*\sopen(?:\s|>)/,
  "Technical details must be collapsed by default.",
);
assert.match(html, /<summary>[\s\S]*Show technical details[\s\S]*<\/summary>/);
assert.match(html, /missionId[\s\S]*threadId/);
assert.match(html, /App Server/);
assert.match(html, /trusted Hooks/);
assert.match(html, /Context Broker/);
assert.match(html, /Evidence Collector/);
assert.match(html, /technical check needed/i);

assert.match(html, /passwords, tokens/i);
assert.match(html, /unrelated applications/i);
assert.match(html, /continuous hidden screen capture/i);
assert.match(html, /aria-live="polite"/);
assert.match(html, /technical-architecture\.css/);
assert.match(html, /technical-architecture\.js/);

assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);
assert.match(css, /\.is-active/);
assert.match(css, /@media \(max-width:/);

assert.match(js, /Object\.freeze/);
assert.match(js, /aria-selected/);
assert.match(js, /setScenario/);
assert.match(js, /activeActorCount/);
assert.match(js, /flowOutcome/);

const scenarioBlocks = [
  ...js.matchAll(
    /\b(\w+):\s*\{\s*label:[\s\S]*?actors:\s*\[([^\]]+)\],[\s\S]*?connections:\s*\[([^\]]+)\],[\s\S]*?steps:\s*\[([\s\S]*?)\],\s*outcome:\s*"([^"]+)"/g,
  ),
];

assert.equal(
  scenarioBlocks.length,
  scenarioIds.length,
  "Each scenario must define actors, connections, steps, and an outcome.",
);

for (const [, id, actors, connections, steps, outcome] of scenarioBlocks) {
  const actorCount = [...actors.matchAll(/"[^"]+"/g)].length;
  const connectionCount = [...connections.matchAll(/"[^"]+"/g)].length;
  const stepCount = [...steps.matchAll(/\["[^"]+",\s*"[^"]+"\]/g)].length;

  assert.ok(actorCount >= 2 && actorCount <= 5, `${id} must use 2–5 actors.`);
  assert.ok(connectionCount >= 1, `${id} must use at least one connection.`);
  assert.ok(stepCount >= 3 && stepCount <= 4, `${id} must have 3–4 steps.`);
  assert.ok(outcome.length > 20, `${id} must have a useful outcome.`);
}

console.log(
  `Simplified architecture smoke test passed: ${actorIds.length} actors, ${scenarioIds.length} scenarios, ${visibilityGroups.length} visibility groups.`,
);
