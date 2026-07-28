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

const workflowIds = [
  "overview",
  "launch",
  "executor",
  "teacher",
  "evidence",
  "share",
  "recovery",
];

const nodeIds = [
  "learner",
  "companion-ui",
  "orchestrator",
  "thread-binder",
  "context-broker",
  "consent-gate",
  "state-store",
  "teacher-service",
  "codex-adapter",
  "codex-executor",
  "workspace",
  "evidence-collector",
  "capture-adapter",
];

const edgeIds = [
  "learner-ui",
  "ui-orchestrator",
  "orchestrator-binder",
  "binder-adapter",
  "adapter-executor",
  "executor-workspace",
  "workspace-evidence",
  "evidence-broker",
  "adapter-broker",
  "broker-teacher",
  "teacher-ui",
  "capture-consent",
  "consent-broker",
];

for (const id of workflowIds) {
  assert.match(
    html,
    new RegExp(`data-flow="${id}"`),
    `Missing workflow control: ${id}`,
  );
  assert.match(
    js,
    new RegExp(`\\b${id}:\\s*\\{`),
    `Missing workflow configuration: ${id}`,
  );
}

for (const id of nodeIds) {
  assert.match(
    html,
    new RegExp(`data-node="${id}"`),
    `Missing architecture node: ${id}`,
  );
}

for (const id of edgeIds) {
  assert.match(
    html,
    new RegExp(`data-edge="${id}"`),
    `Missing architecture edge: ${id}`,
  );
}

for (const boundary of [
  "LEARNER DEVICE",
  "TEACHER SERVICE",
  "OPENAI / CODEX",
]) {
  assert.match(html, new RegExp(boundary), `Missing trust boundary: ${boundary}`);
}

assert.match(html, /TEACHER CONTEXT RECEIPT/);
assert.match(html, /TEACHER NEVER GETS/);
assert.match(html, /TECHNICAL SPIKE/);
assert.match(html, /PROPOSED/);
assert.match(html, /explicit(?:ly)? bound/i);
assert.match(html, /threadId/);
assert.match(html, /secrets/i);
assert.match(html, /unrelated (?:applications|apps)/i);
assert.match(html, /screen capture/i);
assert.match(html, /aria-live="polite"/);
assert.match(html, /technical-architecture\.css/);
assert.match(html, /technical-architecture\.js/);

assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);
assert.match(css, /\.is-active/);
assert.match(css, /@media \(max-width:/);

assert.match(js, /Object\.freeze/);
assert.match(js, /aria-selected/);
assert.match(js, /activeNodeCount/);
assert.match(js, /activeEdgeCount/);

const workflowBlocks = [...js.matchAll(/\b(\w+):\s*\{\s*label:[\s\S]*?nodes:\s*\[([^\]]+)\],[\s\S]*?edges:\s*\[([^\]]+)\]/g)];
assert.equal(
  workflowBlocks.length,
  workflowIds.length,
  "Each workflow must define nodes and edges.",
);

for (const [, id, nodes, edges] of workflowBlocks) {
  assert.match(nodes, /"/, `${id} must highlight at least one node.`);
  assert.match(edges, /"/, `${id} must highlight at least one edge.`);
}

console.log(
  `Architecture smoke test passed: ${workflowIds.length} workflows, ${nodeIds.length} nodes, ${edgeIds.length} edges.`,
);
