import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createInitialPracticeRendererState,
  reducePracticeRenderer,
} from "../src/renderer/practice-state.mjs";

function viewModel(overrides = {}) {
  return {
    session: {
      sessionId: "safe-session",
      lifecycle: "needs-binding",
      mission: {
        title: "Read-only repository inspection",
        description: "Inspect the fixture before proposing changes.",
        learningOutcomes: ["Write a bounded inspection prompt"],
        instructions: ["Open the dedicated task", "Write your own prompt"],
        allowedActions: ["Read files", "Summarize findings"],
        prohibitedActions: ["Edit files", "Use the network"],
        expectedEvidence: ["A structured inspection report"],
        contentKind: "mock-adaptation",
      },
      executor: {
        bound: false,
        taskName: null,
        status: "not-bound",
        freshness: "disconnected",
        observedAt: null,
        handoff: null,
      },
      contextReceipt: null,
      teacherChat: [],
      error: null,
    },
    presentation: { mode: "full", lastFullTab: "exercise" },
    ...overrides,
  };
}

test("starts in Course with an immutable renderer-only state", () => {
  const state = createInitialPracticeRendererState();
  assert.deepEqual(state, {
    screen: "course",
    viewModel: null,
    busyAction: null,
    eligibleTasks: [],
    pickerOpen: false,
    teacherDraft: "",
    error: null,
    fallbackNotice: null,
  });
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.eligibleTasks), true);
});

test("loads Course without a session and Practice Exercise with a session", () => {
  const initial = createInitialPracticeRendererState();
  const course = reducePracticeRenderer(initial, {
    type: "VIEW_MODEL_LOADED",
    viewModel: viewModel({ session: null }),
  });
  assert.equal(course.screen, "course");

  const practice = reducePracticeRenderer(course, {
    type: "VIEW_MODEL_LOADED",
    viewModel: viewModel(),
  });
  assert.equal(practice.screen, "practice");
  assert.equal(practice.viewModel.presentation.lastFullTab, "exercise");
});

test("tracks automatic start and dedicated task binding without a fallback notice", () => {
  let state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "START_REQUESTED",
  });
  assert.equal(state.busyAction, "entering");

  state = reducePracticeRenderer(state, {
    type: "VIEW_MODEL_LOADED",
    viewModel: viewModel(),
  });
  assert.equal(state.screen, "practice");

  state = reducePracticeRenderer(state, { type: "CREATE_TASK_REQUESTED" });
  assert.equal(state.busyAction, "binding");

  const bound = viewModel();
  bound.session.lifecycle = "ready";
  bound.session.executor = {
    bound: true,
    taskName: "Practice · Module 0 · Read-only inspection",
    status: "ready",
    freshness: "fresh",
    observedAt: "2026-08-04T02:03:04.000Z",
    handoff: { opened: true, fallbackName: "Practice task" },
  };
  state = reducePracticeRenderer(state, {
    type: "TASK_CREATED",
    viewModel: bound,
    opened: true,
  });
  assert.equal(state.screen, "practice");
  assert.equal(state.busyAction, null);
  assert.equal(state.viewModel.presentation.lastFullTab, "exercise");
  assert.equal(state.fallbackNotice, null);
});

test("shows a named-task fallback without storing a task ID", () => {
  const state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "TASK_CREATED",
    viewModel: viewModel(),
    opened: false,
    fallbackName: "Practice · Module 0 · Read-only inspection",
  });
  assert.match(state.fallbackNotice, /Practice · Module 0 · Read-only inspection/);
  assert.doesNotMatch(state.fallbackNotice, /thread|task-id|thr-/i);
});

test("opens the picker and retains only safe eligible task choices", () => {
  let state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "OPEN_PICKER",
  });
  assert.equal(state.pickerOpen, true);

  state = reducePracticeRenderer(state, {
    type: "ELIGIBLE_TASKS_LOADED",
    tasks: [
      {
        threadId: "thr-safe",
        displayName: "Existing inspection",
        updatedAt: "2026-08-04T02:03:04.000Z",
        status: "idle",
        preview: "must not cross the boundary",
      },
      { threadId: {}, displayName: "Malformed" },
    ],
  });
  assert.equal(state.pickerOpen, true);
  assert.deepEqual(state.eligibleTasks, [{
    threadId: "thr-safe",
    displayName: "Existing inspection",
    updatedAt: "2026-08-04T02:03:04.000Z",
    status: "idle",
  }]);
  assert.equal(Object.isFrozen(state.eligibleTasks[0]), true);
});

test("selects Teacher by changing only the safe presentation copy", () => {
  const loaded = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "VIEW_MODEL_LOADED",
    viewModel: viewModel(),
  });
  const selected = reducePracticeRenderer(loaded, {
    type: "TAB_SELECTED",
    tab: "teacher",
  });
  assert.equal(selected.viewModel.presentation.lastFullTab, "teacher");
  assert.equal(selected.viewModel.session, loaded.viewModel.session);
  assert.equal(loaded.viewModel.presentation.lastFullTab, "exercise");
});

test("retains the Teacher draft until the bridge accepts it", () => {
  let state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "TEACHER_DRAFT_CHANGED",
    text: "What did the Executor inspect?",
  });
  state = reducePracticeRenderer(state, { type: "TEACHER_SEND_REQUESTED" });
  assert.equal(state.busyAction, "teacher");
  assert.equal(state.teacherDraft, "What did the Executor inspect?");

  state = reducePracticeRenderer(state, {
    type: "TEACHER_SEND_ACCEPTED",
    viewModel: viewModel(),
  });
  assert.equal(state.busyAction, null);
  assert.equal(state.teacherDraft, "");
});

test("keeps the Teacher composer busy across subscription state pushes", () => {
  let state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "TEACHER_DRAFT_CHANGED",
    text: "Keep this draft",
  });
  state = reducePracticeRenderer(state, { type: "TEACHER_SEND_REQUESTED" });
  state = reducePracticeRenderer(state, {
    type: "STATE_PUSHED",
    viewModel: viewModel(),
  });
  assert.equal(state.screen, "practice");
  assert.equal(state.busyAction, "teacher");
  assert.equal(state.teacherDraft, "Keep this draft");
});

test("maps failures to fixed alerts and explicit recovery actions", () => {
  const state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "ERROR",
    kind: "observation",
    raw: new Error("RAW protocol and C:\\private\\path"),
  });
  assert.deepEqual(state.error, {
    message: "Executor observation could not be refreshed.",
    recoveryAction: "retry-observation",
  });
  assert.doesNotMatch(JSON.stringify(state), /RAW|private|protocol/i);
});

test("unknown events preserve object identity", () => {
  const state = createInitialPracticeRendererState();
  assert.equal(
    reducePracticeRenderer(state, { type: "UNKNOWN", raw: "do not copy" }),
    state,
  );
});

test("renderer shell keeps Course and Practice in one accessible window", async () => {
  const rendererRoot = new URL("../src/renderer/", import.meta.url);
  const [html, script, css] = await Promise.all([
    readFile(new URL("index.html", rendererRoot), "utf8"),
    readFile(new URL("app.js", rendererRoot), "utf8"),
    readFile(new URL("styles.css", rendererRoot), "utf8"),
  ]);

  assert.match(html, /data-screen="destination"/);
  assert.match(html, /Work safely with an Executor/);
  assert.match(html, /data-practice-action="start"/);
  assert.match(html, /id="course-practice-error"[^>]*role="alert"/);
  assert.match(html, /id="practice-shell"[^>]*data-screen="practice"/);
  assert.match(html, /class="practice-header"/);
  assert.match(html, /id="executor-status"[^>]*role="status"/);
  assert.match(html, /data-practice-action="compact"[^>]*>\s*Compact to Teacher/);

  assert.match(html, /role="tablist"[^>]*aria-label="Practice Mode"/);
  assert.match(html, /id="exercise-tab"[^>]*role="tab"[^>]*aria-controls="exercise-panel"/);
  assert.match(html, /id="teacher-tab"[^>]*role="tab"[^>]*aria-controls="teacher-panel"/);
  assert.match(html, /id="exercise-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="exercise-tab"/);
  assert.match(html, /id="teacher-panel"[^>]*role="tabpanel"[^>]*aria-labelledby="teacher-tab"/);
  assert.ok(html.indexOf("practice-header") < html.indexOf("exercise-panel"));
  assert.ok(html.indexOf("executor-status") < html.indexOf("teacher-panel"));

  for (const id of [
    "exercise-description",
    "exercise-outcomes",
    "exercise-instructions",
    "allowed-actions",
    "prohibited-actions",
    "expected-evidence",
    "bound-task-name",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /data-practice-action="open-task"[^>]*>\s*Open in Codex/);

  assert.match(html, /id="teacher-messages"[^>]*role="log"/);
  assert.match(html, /id="context-receipt"/);
  assert.match(html, /id="teacher-form"/);
  assert.match(html, /id="freshness-disclosure"/);
  assert.doesNotMatch(html, /complete (?:exercise|practice)|mark (?:as )?complete/i);

  assert.match(html, /data-practice-action="retry"[^>]*>\s*Retry observation/);
  assert.match(html, /data-practice-action="rebind"[^>]*>\s*Rebind task/);
  assert.match(html, /<dialog id="task-picker"/);
  assert.match(html, /id="eligible-task-list"/);

  assert.doesNotMatch(script, /node:|from\s+["']electron|require\s*\(|App Server|credentials|process\.env|filesystem/i);
  assert.doesNotMatch(script, /innerHTML/);
  assert.doesNotMatch(script, /native.*minimi|minimi.*addEventListener/i);
  assert.match(script, /practice\.onStateChanged/);
  assert.match(script, /removePracticeListener/);
  assert.match(script, /practice\.start\(\)/);
  assert.match(script, /practice\.createTask\(\)/);
  assert.match(script, /lifecycle === "needs-binding"[\s\S]{0,120}createDedicatedTask\(\)/);
  assert.match(script, /practice\.retry\(\)/);
  assert.match(script, /practice\.rebind\(\)/);
  assert.match(script, /observation cursor will reset/i);
  assert.match(script, /Intl\.DateTimeFormat/);
  assert.match(script, /\.textContent\s*=/);

  assert.match(css, /@media\s*\(min-width:\s*921px\)/);
  assert.match(css, /grid-template-columns:/);
  assert.match(css, /72ch/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /border-style:\s*dashed/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
