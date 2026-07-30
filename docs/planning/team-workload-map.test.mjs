import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const mapPath = path.join(here, "team-workload-map.html");
const quickReferencePath = path.join(here, "team-workload-quick-reference.md");
const agreementPath = path.join(here, "team-workload-boundaries.md");

async function loadRequired(filePath) {
  assert.equal(existsSync(filePath), true, `${path.basename(filePath)} must exist`);
  return readFile(filePath, "utf8");
}

function extractScript(html, id, type = "text/javascript") {
  const pattern = new RegExp(
    `<script\\s+id="${id}"(?:\\s+type="${type}")?[^>]*>([\\s\\S]*?)<\\/script>`,
    "i",
  );
  const match = html.match(pattern);
  assert.ok(match, `script #${id} must exist`);
  return match[1].trim();
}

function flatten(nodes) {
  return nodes.flatMap((node) => [node, ...flatten(node.children ?? [])]);
}

function compact(nodes) {
  return nodes.map(({ title, owner, children = [] }) => [
    title,
    owner,
    compact(children),
  ]);
}

function createDomHarness(html) {
  const workflowJson = extractScript(
    html,
    "workflow-data",
    "application/json",
  );
  const logic = extractScript(html, "graph-logic");
  const app = extractScript(html, "graph-app");

  class FakeButton {
    constructor(attributes, document) {
      this.attributes = attributes;
      this.dataset = {
        kind: attributes["data-kind"],
        id: attributes["data-id"],
      };
      this.document = document;
      this.listeners = new Map();
    }

    addEventListener(type, listener) {
      this.listeners.set(type, listener);
    }

    click() {
      this.listeners.get("click")?.();
    }

    focus() {
      this.document.activeElement = this;
    }

    getAttribute(name) {
      return this.attributes[name] ?? null;
    }
  }

  class FakeGraph {
    constructor(document) {
      this.document = document;
      this.html = "";
      this.buttons = [];
    }

    set innerHTML(value) {
      this.html = value;
      this.buttons = [...value.matchAll(/<button([\s\S]*?)<\/button>/g)].map(
        ([, opening]) => {
          const attributes = {};
          for (const [, name, attributeValue] of opening.matchAll(
            /([\w-]+)="([^"]*)"/g,
          )) {
            attributes[name] = attributeValue;
          }
          return new FakeButton(attributes, this.document);
        },
      );
    }

    get innerHTML() {
      return this.html;
    }

    querySelectorAll(selector) {
      assert.equal(selector, ".expand");
      return this.buttons;
    }

    querySelector(selector) {
      const match = selector.match(
        /\.expand\[data-kind="([^"]+)"\]\[data-id="([^"]+)"\]/,
      );
      if (!match) return null;
      return this.buttons.find(
        ({ dataset }) => dataset.kind === match[1] && dataset.id === match[2],
      );
    }
  }

  const document = {
    activeElement: null,
    createElement() {
      return {
        value: "",
        set textContent(value) {
          this.value = String(value);
        },
        get innerHTML() {
          return this.value
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;");
        },
      };
    },
    getElementById(id) {
      if (id === "workflow-data") return { textContent: workflowJson };
      if (id === "graph") return this.graph;
      return null;
    },
  };
  document.graph = new FakeGraph(document);

  const context = vm.createContext({ document });
  vm.runInContext(logic, context);
  context.WorkloadMap = context.WorkloadMap;
  vm.runInContext(app, context);

  return { document, graph: document.graph };
}

test("ships a self-contained, theme-aware local HTML map", async () => {
  const html = await loadRequired(mapPath);

  assert.match(html, /<!doctype html>/i);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+href=/i);
  assert.doesNotMatch(html, /https?:\/\//i);
  assert.doesNotMatch(
    html,
    /@import|url\s*\(|fetch\s*\(|XMLHttpRequest|WebSocket/i,
  );
  assert.match(html, /color-scheme:\s*light dark/i);
  assert.match(html, /prefers-color-scheme:\s*dark/i);
  assert.match(html, /team-workload-boundaries\.md/);
});

test("keeps the complete seven-step learner journey visible in order", async () => {
  const html = await loadRequired(mapPath);
  const workflow = JSON.parse(
    extractScript(html, "workflow-data", "application/json"),
  );

  assert.deepEqual(
    workflow.map(({ title }) => title),
    [
      "Get the repo",
      "Start the app",
      "First-time setup",
      "Learn theory",
      "Enter practice",
      "Build with help",
      "Return progress",
    ],
  );

  assert.deepEqual(
    workflow.map(({ owner }) => owner),
    ["Duy", "Duy", "Split", "Triết", "Talk first", "Split", "Talk first"],
  );
});

test("matches the complete approved responsibility tree", async () => {
  const html = await loadRequired(mapPath);
  const workflow = JSON.parse(
    extractScript(html, "workflow-data", "application/json"),
  );

  assert.deepEqual(compact(workflow), [
    [
      "Get the repo",
      "Duy",
      [
        [
          "README steps",
          "Duy",
          [
            ["Copy clone command", "Duy", []],
            ["Open the repo", "Duy", []],
          ],
        ],
      ],
    ],
    [
      "Start the app",
      "Duy",
      [
        [
          "Check tools",
          "Duy",
          [
            ["Check Node", "Duy", []],
            ["Check Codex", "Duy", []],
            ["Check app files", "Duy", []],
          ],
        ],
        [
          "Ask permission",
          "Duy",
          [
            ["Show exact commands", "Duy", []],
            ["Wait for Yes", "Duy", []],
          ],
        ],
        [
          "Open the app",
          "Duy",
          [
            ["Launch Electron", "Duy", []],
            ["Resume saved state", "Duy", []],
          ],
        ],
      ],
    ],
    [
      "First-time setup",
      "Split",
      [
        [
          "Connect Codex",
          "Duy",
          [
            ["Read login status", "Duy", []],
            ["Open official login", "Duy", []],
            ["Never store tokens", "Duy", []],
          ],
        ],
        [
          "Ask questions",
          "Split",
          [
            ["Build the form", "Duy", []],
            ["Write the words", "Triết", []],
            ["Choose the order", "Triết", []],
          ],
        ],
        [
          "Save answers",
          "Duy",
          [
            ["Check answers", "Duy", []],
            ["Save non-secret data", "Duy", []],
          ],
        ],
      ],
    ],
    [
      "Learn theory",
      "Triết",
      [
        [
          "Course App",
          "Triết",
          [
            ["App navigation", "Triết", []],
            ["Course UI/UX", "Triết", []],
          ],
        ],
        [
          "Lesson content",
          "Triết",
          [
            ["Slides", "Triết", []],
            ["Explanations", "Triết", []],
            ["Examples", "Triết", []],
          ],
        ],
      ],
    ],
    [
      "Enter practice",
      "Talk first",
      [
        [
          "Send the task",
          "Triết",
          [
            ["Lesson ID", "Triết", []],
            ["Exercise brief", "Triết", []],
            ["Success rules", "Triết", []],
          ],
        ],
        [
          "Start session",
          "Duy",
          [
            ["Check the request", "Duy", []],
            ["Bind the Executor", "Duy", []],
            ["Open Practice Mode", "Duy", []],
          ],
        ],
      ],
    ],
    [
      "Build with help",
      "Split",
      [
        [
          "Exercise",
          "Triết",
          [
            ["Instructions", "Triết", []],
            ["Examples", "Triết", []],
            ["Success rules", "Triết", []],
          ],
        ],
        [
          "Teacher",
          "Duy",
          [
            ["Chat", "Duy", []],
            ["Hints", "Duy", []],
            ["Memory", "Duy", []],
          ],
        ],
        [
          "Executor",
          "Duy",
          [
            ["Bind one thread", "Duy", []],
            ["Read activity", "Duy", []],
            ["Keep scope narrow", "Duy", []],
          ],
        ],
        [
          "Progress",
          "Duy",
          [
            ["Track evidence", "Duy", []],
            ["Check completion", "Duy", []],
            ["Resume later", "Duy", []],
          ],
        ],
      ],
    ],
    [
      "Return progress",
      "Talk first",
      [
        [
          "Send result",
          "Duy",
          [
            ["Status", "Duy", []],
            ["Evidence summary", "Duy", []],
            ["Mastery summary", "Duy", []],
          ],
        ],
        [
          "Show result",
          "Triết",
          [
            ["Update course", "Triết", []],
            ["Choose next lesson", "Triết", []],
          ],
        ],
      ],
    ],
  ]);
});

test("keeps every graph node short and explicitly owned", async () => {
  const html = await loadRequired(mapPath);
  const workflow = JSON.parse(
    extractScript(html, "workflow-data", "application/json"),
  );
  const nodes = flatten(workflow);

  for (const node of nodes) {
    assert.ok(node.owner, `${node.title} must name an owner`);
    assert.ok(
      node.title.trim().split(/\s+/).length <= 5,
      `${node.title} must use no more than five words`,
    );
  }
});

test("opens one branch per layer and clears deeper detail when needed", async () => {
  const html = await loadRequired(mapPath);
  const logic = extractScript(html, "graph-logic");
  const context = vm.createContext({});
  vm.runInContext(logic, context);
  const { nextGraphState } = context.WorkloadMap;

  let state = { openStep: null, openChild: null };
  state = nextGraphState(state, "step", "setup");
  assert.deepEqual({ ...state }, { openStep: "setup", openChild: null });

  state = nextGraphState(state, "child", "login");
  assert.deepEqual({ ...state }, { openStep: "setup", openChild: "login" });

  state = nextGraphState(state, "child", "questions");
  assert.deepEqual({ ...state }, { openStep: "setup", openChild: "questions" });

  state = nextGraphState(state, "step", "practice");
  assert.deepEqual({ ...state }, { openStep: "practice", openChild: null });

  state = nextGraphState(state, "step", "practice");
  assert.deepEqual({ ...state }, { openStep: null, openChild: null });
});

test("renders expanded state, closes siblings, clears deeper detail, and restores focus", async () => {
  const html = await loadRequired(mapPath);
  const { document, graph } = createDomHarness(html);

  const setupButton = graph.querySelector(
    '.expand[data-kind="step"][data-id="setup"]',
  );
  assert.equal(setupButton.getAttribute("aria-expanded"), "false");

  setupButton.click();
  assert.match(graph.innerHTML, /Layer 2 · Inside “First-time setup”/);
  assert.equal(
    graph
      .querySelector('.expand[data-kind="step"][data-id="setup"]')
      .getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(document.activeElement.dataset.id, "setup");

  graph
    .querySelector('.expand[data-kind="child"][data-id="questions"]')
    .click();
  assert.match(graph.innerHTML, /Layer 3 · Inside “Ask questions”/);
  assert.equal(
    graph
      .querySelector('.expand[data-kind="child"][data-id="questions"]')
      .getAttribute("aria-expanded"),
    "true",
  );
  assert.equal(document.activeElement.dataset.id, "questions");

  graph
    .querySelector('.expand[data-kind="child"][data-id="login"]')
    .click();
  assert.match(graph.innerHTML, /Layer 3 · Inside “Connect Codex”/);
  assert.equal(
    graph
      .querySelector('.expand[data-kind="child"][data-id="questions"]')
      .getAttribute("aria-expanded"),
    "false",
  );

  graph
    .querySelector('.expand[data-kind="step"][data-id="practice"]')
    .click();
  assert.match(graph.innerHTML, /Layer 2 · Inside “Build with help”/);
  assert.doesNotMatch(graph.innerHTML, /Layer 3 · Inside/);
  assert.equal(
    graph
      .querySelector('.expand[data-kind="step"][data-id="setup"]')
      .getAttribute("aria-expanded"),
    "false",
  );
});

test("uses accessible controls and explicit complexity-layer labels", async () => {
  const html = await loadRequired(mapPath);

  assert.match(html, /<button/i);
  assert.match(html, /aria-label=/i);
  assert.match(html, /aria-expanded=/i);
  assert.match(html, /Layer 2 · Inside/);
  assert.match(html, /Layer 3 · Inside/);
  assert.doesNotMatch(html, /class="down"/);
});

test("preserves node width until horizontal scrolling begins", async () => {
  const html = await loadRequired(mapPath);

  assert.match(html, /\.graph\s*\{[^}]*width:\s*max-content/s);
  assert.match(html, /\.node\s*\{[^}]*flex:\s*0 0 auto/s);
  assert.match(html, /\.workflow-arrow\s*\{[^}]*flex:\s*0 0 auto/s);
});

test("turns the Markdown quick reference into a tiny entry point", async () => {
  const markdown = await loadRequired(quickReferencePath);
  const nonEmptyLines = markdown
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  assert.ok(nonEmptyLines.length <= 24, "quick reference must stay short");
  assert.match(markdown, /team-workload-map\.html/);
  assert.match(markdown, /team-workload-boundaries\.md/);
  assert.match(markdown, /Learner content.*Triết/i);
  assert.match(markdown, /System mechanism.*Duy/i);
  assert.match(markdown, /Both sides.*talk first/i);
});

test("links the full agreement back to the interactive map", async () => {
  const agreement = await loadRequired(agreementPath);

  assert.match(agreement, /team-workload-map\.html/);
});
