import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createInitialPracticeRendererState,
  reducePracticeRenderer,
} from "../src/renderer/practice-state.mjs";
import * as practiceRendererModule from "../src/renderer/practice-state.mjs";

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

function ok(value) {
  return { ok: true, value };
}

function failed(message = "RAW bridge failure") {
  return { ok: false, error: { message } };
}

function boundViewModel(overrides = {}) {
  const value = viewModel();
  value.session.lifecycle = "ready";
  value.session.executor = {
    bound: true,
    taskName: "Practice · Module 0 · Read-only inspection",
    status: "ready",
    freshness: "fresh",
    observedAt: "2026-08-04T02:03:04.000Z",
    handoff: { opened: true, fallbackName: "Practice task" },
  };
  value.session.contextReceipt = {
    missionTitle: value.session.mission.title,
    taskName: value.session.executor.taskName,
    scopeLabel: "Bound task only",
    freshness: "fresh",
    observedAt: "2026-08-04T02:03:04.000Z",
  };
  return { ...value, ...overrides };
}

function pendingResult() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function createInteractionHarness(operationOverrides = {}, options = {}) {
  const calls = [];
  let stateListener = null;
  let listenerRemovals = 0;
  const operations = {
    getState: () => ok(boundViewModel()),
    start: () => ok(viewModel()),
    createTask: () => ok(boundViewModel()),
    listTasks: () => ok([]),
    bindTask: () => ok(boundViewModel()),
    rebind: () => ok(viewModel()),
    openTask: () => ok(boundViewModel()),
    retry: () => ok(boundViewModel()),
    sendTeacherMessage: () => ok(boundViewModel()),
    selectTab: () => ok(boundViewModel()),
    compact: () => ok(undefined),
    ...operationOverrides,
  };
  const bridge = {};
  for (const name of Object.keys(operations)) {
    bridge[name] = (...args) => {
      calls.push([name, ...args]);
      return operations[name](...args);
    };
  }
  bridge.onStateChanged = (listener) => {
    calls.push(["onStateChanged"]);
    stateListener = listener;
    return () => {
      listenerRemovals += 1;
      stateListener = null;
    };
  };

  const messageNodes = new Map();
  const statusNode = { value: null };
  const view = {
    state: createInitialPracticeRendererState(),
    renderCount: 0,
    composerUpdateCount: 0,
    messageAnnouncementCount: 0,
    practiceHeadingFocusCount: 0,
    composerFocusCount: 0,
    pickerAlertFocusCount: 0,
    pickerTriggerFocusCount: 0,
    boundTaskFocusCount: 0,
    focusedChoice: null,
    pickerMode: "closed",
    choicesDisabled: false,
    statusNode,
    messageNodes,
    render(next) {
      this.state = next;
      this.renderCount += 1;
      statusNode.value = next.viewModel?.session?.executor?.status ?? "not-bound";
      for (const message of next.viewModel?.session?.teacherChat ?? []) {
        if (!messageNodes.has(message.id)) {
          messageNodes.set(message.id, { id: message.id });
          this.messageAnnouncementCount += 1;
        }
      }
      this.pickerMode = !next.pickerOpen
        ? "closed"
        : next.error
          ? "error"
          : next.busyAction === "listing"
            ? "loading"
            : next.busyAction === "binding"
              ? "binding"
              : next.eligibleTasks.length > 0
                ? "choices"
                : "empty";
      this.choicesDisabled = next.pickerOpen && next.busyAction === "binding";
    },
    updateComposer(next) {
      this.state = next;
      this.composerUpdateCount += 1;
    },
    focusPracticeHeading() { this.practiceHeadingFocusCount += 1; },
    focusComposer() { this.composerFocusCount += 1; },
    focusPickerAlert() { this.pickerAlertFocusCount += 1; },
    focusPickerTrigger() { this.pickerTriggerFocusCount += 1; },
    focusBoundTask() { this.boundTaskFocusCount += 1; },
    focusPickerChoice(taskId) { this.focusedChoice = taskId; },
  };
  const confirmations = [];
  const createController = practiceRendererModule.createPracticeRendererController;
  const controller = createController({
    bridge,
    view,
    confirmRebind(message) {
      confirmations.push(message);
      return options.confirmRebind ?? true;
    },
  });
  return {
    bridge,
    calls,
    confirmations,
    controller,
    emit(value) { stateListener?.(value); },
    get listenerRemovals() { return listenerRemovals; },
    view,
  };
}

test("interaction: start focuses Practice once after resolution despite an earlier subscription push", async () => {
  let harness;
  const needsBinding = viewModel();
  harness = createInteractionHarness({
    start() {
      harness.emit(needsBinding);
      return ok(needsBinding);
    },
    createTask: () => ok(boundViewModel()),
  });
  const firstRemoval = harness.controller.subscribe();
  const secondRemoval = harness.controller.subscribe();

  await harness.controller.startPractice();

  assert.equal(harness.calls.filter(([name]) => name === "start").length, 1);
  assert.equal(harness.calls.filter(([name]) => name === "createTask").length, 1);
  assert.equal(harness.view.practiceHeadingFocusCount, 1);
  assert.equal(harness.controller.getState().screen, "practice");
  assert.equal(firstRemoval, secondRemoval);
  firstRemoval();
  assert.equal(harness.listenerRemovals, 1);
});

test("interaction: start skips task creation when a committed binding already exists", async () => {
  const harness = createInteractionHarness({
    start: () => ok(boundViewModel()),
  });
  harness.controller.subscribe();

  await harness.controller.startPractice();

  assert.equal(harness.calls.filter(([name]) => name === "createTask").length, 0);
  assert.equal(harness.view.practiceHeadingFocusCount, 1);
});

test("interaction: typing updates only the composer and preserves status and message identity", async () => {
  const initial = boundViewModel();
  initial.session.teacherChat = [{
    id: "teacher-one",
    role: "teacher",
    text: "Existing answer",
    createdAt: "2026-08-04T02:03:04.000Z",
  }];
  const harness = createInteractionHarness({ getState: () => ok(initial) });
  await harness.controller.initialize();
  const renderCount = harness.view.renderCount;
  const statusNode = harness.view.statusNode;
  const messageNode = harness.view.messageNodes.get("teacher-one");
  const announcements = harness.view.messageAnnouncementCount;

  harness.controller.changeTeacherDraft("W");
  harness.controller.changeTeacherDraft("Wh");
  harness.controller.changeTeacherDraft("What happened?");

  assert.equal(harness.view.renderCount, renderCount);
  assert.equal(harness.view.statusNode, statusNode);
  assert.equal(harness.view.messageNodes.get("teacher-one"), messageNode);
  assert.equal(harness.view.messageAnnouncementCount, announcements);
  assert.equal(harness.view.composerUpdateCount, 3);
  assert.equal(harness.controller.getState().teacherDraft, "What happened?");
});

test("interaction: key actions route through their named bridge operations", async () => {
  const tasks = [{
    threadId: "thr-eligible",
    displayName: "Eligible task",
    updatedAt: "2026-08-04T02:03:04.000Z",
    status: "idle",
  }];
  const harness = createInteractionHarness({ listTasks: () => ok(tasks) });
  await harness.controller.initialize();
  await harness.controller.selectTab("teacher");
  await harness.controller.openBoundTask();
  await harness.controller.retryObservation();
  await harness.controller.compact();
  await harness.controller.openTaskPicker();
  await harness.controller.bindSelectedTask("thr-eligible");
  harness.controller.changeTeacherDraft("What happened?");
  await harness.controller.sendTeacherMessage();

  for (const [name, expectedArgs] of [
    ["selectTab", ["teacher"]],
    ["openTask", []],
    ["retry", []],
    ["compact", []],
    ["listTasks", []],
    ["bindTask", ["thr-eligible"]],
    ["sendTeacherMessage", ["What happened?"]],
  ]) {
    const matching = harness.calls.filter(([called]) => called === name);
    assert.equal(matching.length, 1, `${name} should be called once`);
    assert.deepEqual(matching[0].slice(1), expectedArgs);
  }
});

test("interaction: a failed start renders a fixed visible Course error", async () => {
  const harness = createInteractionHarness({
    start: () => failed("RAW C:\\private\\protocol failure"),
  });

  await harness.controller.startPractice();

  assert.equal(harness.controller.getState().screen, "course");
  assert.deepEqual(harness.view.state.error, {
    message: "Practice Mode could not be started.",
    recoveryAction: "retry-start",
  });
  assert.doesNotMatch(JSON.stringify(harness.view.state), /RAW|private|protocol/i);
});

test("interaction: picker list failures stay in-modal and can be retried", async () => {
  let attempts = 0;
  const tasks = [{
    threadId: "thr-eligible",
    displayName: "Eligible task",
    updatedAt: "2026-08-04T02:03:04.000Z",
    status: "idle",
  }];
  const harness = createInteractionHarness({
    getState: () => ok(viewModel()),
    listTasks() {
      attempts += 1;
      return attempts === 1 ? failed() : ok(tasks);
    },
  });
  await harness.controller.initialize();

  await harness.controller.openTaskPicker();
  assert.equal(harness.controller.getState().pickerOpen, true);
  assert.equal(harness.view.pickerMode, "error");
  assert.equal(harness.view.pickerAlertFocusCount, 1);

  await harness.controller.openTaskPicker();
  assert.equal(harness.view.pickerMode, "choices");
  assert.equal(harness.controller.getState().eligibleTasks.length, 1);
});

test("interaction: pending and rejected binds stay in the picker without duplicates", async () => {
  const bindPending = pendingResult();
  let bindAttempt = 0;
  const tasks = [{
    threadId: "thr-eligible",
    displayName: "Eligible task",
    updatedAt: "2026-08-04T02:03:04.000Z",
    status: "idle",
  }];
  const rejected = viewModel();
  rejected.session.error = "A selected Codex task could not be bound. Choose another eligible task.";
  const harness = createInteractionHarness({
    getState: () => ok(viewModel()),
    listTasks: () => ok(tasks),
    bindTask() {
      bindAttempt += 1;
      return bindAttempt === 1 ? bindPending.promise : ok(boundViewModel());
    },
  });
  await harness.controller.initialize();
  await harness.controller.openTaskPicker();

  const first = harness.controller.bindSelectedTask("thr-eligible");
  const duplicate = harness.controller.bindSelectedTask("thr-eligible");
  assert.equal(harness.calls.filter(([name]) => name === "bindTask").length, 1);
  assert.equal(harness.view.pickerMode, "binding");
  assert.equal(harness.view.choicesDisabled, true);
  bindPending.resolve(ok(rejected));
  await Promise.all([first, duplicate]);

  assert.equal(harness.controller.getState().pickerOpen, true);
  assert.equal(harness.view.pickerMode, "error");
  assert.equal(harness.view.focusedChoice, "thr-eligible");
  assert.equal(harness.view.boundTaskFocusCount, 0);

  await harness.controller.bindSelectedTask("thr-eligible");
  assert.equal(harness.controller.getState().pickerOpen, false);
  assert.equal(harness.view.boundTaskFocusCount, 1);
});

test("interaction: Teacher send survives subscription ordering and restores focus", async () => {
  const pending = pendingResult();
  const initial = boundViewModel();
  initial.session.teacherChat = [];
  const pushed = boundViewModel();
  pushed.session.teacherChat = [{
    id: "learner-one",
    role: "learner",
    text: "What happened?",
    createdAt: "2026-08-04T02:03:04.000Z",
  }];
  const answered = boundViewModel();
  answered.session.teacherChat = [
    ...pushed.session.teacherChat,
    { id: "teacher-one", role: "teacher", text: "A bounded answer", createdAt: "2026-08-04T02:04:04.000Z" },
  ];
  const harness = createInteractionHarness({
    getState: () => ok(initial),
    sendTeacherMessage: () => pending.promise,
  });
  harness.controller.subscribe();
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("What happened?");

  const sending = harness.controller.sendTeacherMessage();
  harness.emit(pushed);
  assert.equal(harness.controller.getState().busyAction, "teacher");
  assert.equal(harness.controller.getState().teacherDraft, "What happened?");
  pending.resolve(ok(answered));
  await sending;

  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.view.composerFocusCount, 1);
  assert.equal(harness.view.messageAnnouncementCount, 2);
});

test("interaction: rebind explains cursor reset and unbound retry is suppressed", async () => {
  const harness = createInteractionHarness({
    getState: () => ok(viewModel()),
    rebind: () => ok(viewModel()),
    listTasks: () => ok([]),
  });
  await harness.controller.initialize();

  await harness.controller.retryObservation();
  assert.equal(harness.calls.filter(([name]) => name === "retry").length, 0);
  await harness.controller.rebindTask();
  assert.equal(harness.calls.filter(([name]) => name === "rebind").length, 1);
  assert.equal(harness.calls.filter(([name]) => name === "listTasks").length, 1);
  assert.match(harness.confirmations[0], /observation cursor will reset/i);
});

test("renderer shell keeps Course and Practice in one accessible window", async () => {
  const rendererRoot = new URL("../src/renderer/", import.meta.url);
  const [html, script, css, controllerSource] = await Promise.all([
    readFile(new URL("index.html", rendererRoot), "utf8"),
    readFile(new URL("app.js", rendererRoot), "utf8"),
    readFile(new URL("styles.css", rendererRoot), "utf8"),
    readFile(new URL("practice-state.mjs", rendererRoot), "utf8"),
  ]);

  assert.match(html, /data-screen="destination"/);
  assert.match(html, /Work safely with an Executor/);
  assert.match(html, /data-practice-action="start"/);
  assert.match(html, /id="course-practice-error"[^>]*role="alert"/);
  assert.match(html, /id="practice-shell"[^>]*data-screen="practice"/);
  assert.match(html, /class="practice-header"/);
  assert.match(html, /id="practice-title"[^>]*tabindex="-1"/);
  assert.doesNotMatch(html, /<main id="app"[^>]*aria-live/);
  assert.match(html, /id="picker-error"[^>]*role="alert"/);
  assert.match(html, /data-practice-action="retry-picker"/);
  assert.match(html, /id="picker-status"[^>]*role="status"/);
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

  const rendererSource = `${script}\n${controllerSource}`;
  assert.doesNotMatch(rendererSource, /node:|from\s+["']electron|require\s*\(|App Server|credentials|process\.env|filesystem/i);
  assert.doesNotMatch(rendererSource, /innerHTML/);
  assert.doesNotMatch(rendererSource, /native.*minimi|minimi.*addEventListener/i);
  assert.match(script, /createPracticeRendererController/);
  assert.match(script, /practiceController\.subscribe\(\)/);
  assert.match(script, /removePracticeListener/);
  assert.match(controllerSource, /observation cursor will reset/i);
  assert.match(script, /Intl\.DateTimeFormat/);
  assert.match(script, /\.textContent\s*=/);
  assert.doesNotMatch(script, /function renderTeacherMessages[\s\S]{0,500}replaceChildren/);
  assert.match(script, /choice\.disabled\s*=/);

  assert.match(css, /@media\s*\(min-width:\s*921px\)/);
  assert.match(css, /grid-template-columns:/);
  assert.match(css, /72ch/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /border-style:\s*dashed/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
});
