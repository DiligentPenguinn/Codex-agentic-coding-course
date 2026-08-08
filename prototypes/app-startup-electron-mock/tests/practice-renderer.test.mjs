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

test("clears the Teacher draft on Send and restores it only after rejection", () => {
  let state = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "TEACHER_DRAFT_CHANGED",
    text: "What did the Executor inspect?",
  });
  state = reducePracticeRenderer(state, { type: "TEACHER_SEND_REQUESTED" });
  assert.equal(state.busyAction, "teacher");
  assert.equal(state.teacherDraft, "");

  state = reducePracticeRenderer(state, {
    type: "TEACHER_SEND_ACCEPTED",
    viewModel: viewModel(),
  });
  assert.equal(state.busyAction, null);
  assert.equal(state.teacherDraft, "");

  let rejected = reducePracticeRenderer(createInitialPracticeRendererState(), {
    type: "TEACHER_SEND_REQUESTED",
  });
  rejected = reducePracticeRenderer(rejected, {
    type: "TEACHER_SEND_REJECTED",
    text: "Retry this exact question",
  });
  assert.equal(rejected.busyAction, null);
  assert.equal(rejected.teacherDraft, "Retry this exact question");
  assert.deepEqual(rejected.error, {
    message: "The Teacher could not answer right now. Your draft is still here.",
    recoveryAction: "retry-teacher",
  });
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
  assert.equal(state.teacherDraft, "");
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

test("interaction: closing the picker supersedes late task-list success and failure", async (t) => {
  for (const outcome of ["success", "failure"]) {
    await t.test(outcome, async () => {
      const listingPending = pendingResult();
      const harness = createInteractionHarness({
        getState: () => ok(viewModel()),
        listTasks: () => listingPending.promise,
      });
      await harness.controller.initialize();

      const listing = harness.controller.openTaskPicker();
      assert.equal(harness.controller.getState().busyAction, "listing");
      harness.controller.closePicker();
      const closedState = harness.controller.getState();
      const alertFocusCount = harness.view.pickerAlertFocusCount;
      const triggerFocusCount = harness.view.pickerTriggerFocusCount;
      listingPending.resolve(outcome === "success"
        ? ok([{
          threadId: "thr-late",
          displayName: "Late task",
          updatedAt: "2026-08-04T02:12:04.000Z",
          status: "idle",
        }])
        : failed("RAW late listing failure"));
      await listing;

      assert.equal(harness.controller.getState(), closedState);
      assert.equal(harness.controller.getState().pickerOpen, false);
      assert.deepEqual(harness.controller.getState().eligibleTasks, []);
      assert.equal(harness.controller.getState().error, null);
      assert.equal(harness.view.pickerMode, "closed");
      assert.equal(harness.view.pickerAlertFocusCount, alertFocusCount);
      assert.equal(harness.view.pickerTriggerFocusCount, triggerFocusCount);
    });
  }
});

test("interaction: an older task-list result cannot affect a newer listing owner", async () => {
  const oldListingPending = pendingResult();
  const newListingPending = pendingResult();
  let listCount = 0;
  const harness = createInteractionHarness({
    getState: () => ok(viewModel()),
    listTasks() {
      listCount += 1;
      return listCount === 1 ? oldListingPending.promise : newListingPending.promise;
    },
  });
  await harness.controller.initialize();

  const oldListing = harness.controller.openTaskPicker();
  const newListing = harness.controller.openTaskPicker();
  const newListingState = harness.controller.getState();
  oldListingPending.resolve(ok([{
    threadId: "thr-old-list",
    displayName: "Old listing task",
    updatedAt: "2026-08-04T02:13:04.000Z",
    status: "idle",
  }]));
  await oldListing;

  assert.equal(harness.controller.getState(), newListingState);
  assert.equal(harness.controller.getState().busyAction, "listing");
  assert.deepEqual(harness.controller.getState().eligibleTasks, []);
  assert.equal(harness.view.pickerAlertFocusCount, 0);

  newListingPending.resolve(ok([{
    threadId: "thr-new-list",
    displayName: "New listing task",
    updatedAt: "2026-08-04T02:14:04.000Z",
    status: "idle",
  }]));
  await newListing;
  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.controller.getState().eligibleTasks.length, 1);
  assert.equal(harness.controller.getState().eligibleTasks[0].threadId, "thr-new-list");
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
  harness.controller.changeTeacherDraft("Draft retained while binding");
  const bindingState = harness.controller.getState();
  const bindingFocusCount = harness.view.composerFocusCount;
  await harness.controller.sendTeacherMessage();
  assert.equal(harness.calls.filter(([name]) => name === "sendTeacherMessage").length, 0);
  assert.equal(harness.controller.getState(), bindingState);
  assert.equal(harness.controller.getState().teacherDraft, "Draft retained while binding");
  assert.equal(harness.view.composerFocusCount, bindingFocusCount);
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
  assert.equal(harness.controller.getState().teacherDraft, "");
  pending.resolve(ok(answered));
  await sending;

  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.view.composerFocusCount, 1);
  assert.equal(harness.view.messageAnnouncementCount, 2);
});

test("interaction: rejected Teacher send retains the full-window draft and fails closed", async () => {
  const harness = createInteractionHarness({
    sendTeacherMessage: () => failed("RAW provider credential and protocol error"),
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Retry this question");

  await harness.controller.sendTeacherMessage();

  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.controller.getState().teacherDraft, "Retry this question");
  assert.deepEqual(harness.controller.getState().error, {
    message: "The Teacher could not answer right now. Your draft is still here.",
    recoveryAction: "retry-teacher",
  });
  assert.equal(harness.view.composerFocusCount, 1);
  assert.doesNotMatch(
    JSON.stringify(harness.controller.getState()),
    /RAW|credential|protocol|provider/i,
  );
});

test("interaction: tab success and compact failure cannot steal Teacher ownership", async () => {
  const teacherPending = pendingResult();
  const initial = boundViewModel();
  initial.session.mission.title = "Current owned mission";
  const stalePresentationResult = boundViewModel();
  stalePresentationResult.session.mission.title = "Stale presentation mission";
  stalePresentationResult.presentation.lastFullTab = "teacher";
  const harness = createInteractionHarness({
    getState: () => ok(initial),
    sendTeacherMessage: () => teacherPending.promise,
    selectTab: () => ok(stalePresentationResult),
    compact: () => failed("RAW compact failure"),
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Teacher-owned draft");
  const sending = harness.controller.sendTeacherMessage();

  await harness.controller.selectTab("teacher");
  const afterTab = harness.controller.getState();
  assert.equal(afterTab.busyAction, "teacher");
  assert.equal(afterTab.teacherDraft, "");
  assert.equal(afterTab.error, null);
  assert.equal(afterTab.viewModel.presentation.lastFullTab, "teacher");
  assert.equal(afterTab.viewModel.session.mission.title, "Current owned mission");
  assert.equal(harness.view.composerFocusCount, 0);
  await harness.controller.compact();

  assert.equal(harness.calls.filter(([name]) => name === "selectTab").length, 1);
  assert.equal(harness.calls.filter(([name]) => name === "compact").length, 1);
  assert.equal(harness.controller.getState(), afterTab);
  assert.equal(harness.controller.getState().busyAction, "teacher");
  assert.equal(harness.controller.getState().error, null);
  assert.equal(harness.view.composerFocusCount, 0);

  teacherPending.resolve(ok(boundViewModel()));
  await sending;
});

test("interaction: tab and compact failures preserve Retry and Rebind owners", async (t) => {
  for (const scenario of [
    {
      name: "Retry",
      busyAction: "retrying",
      bridgeMethod: "retry",
      start: (controller) => controller.retryObservation(),
      result: () => ok(boundViewModel()),
    },
    {
      name: "Rebind",
      busyAction: "rebinding",
      bridgeMethod: "rebind",
      start: (controller) => controller.rebindTask(),
      result: () => ok(viewModel()),
    },
  ]) {
    await t.test(scenario.name, async () => {
      const transitionPending = pendingResult();
      const initial = boundViewModel();
      initial.session.mission.title = `${scenario.name} owned mission`;
      const harness = createInteractionHarness({
        getState: () => ok(initial),
        [scenario.bridgeMethod]: () => transitionPending.promise,
        selectTab: () => failed("RAW tab failure"),
        compact: () => failed("RAW compact failure"),
        listTasks: () => ok([]),
      });
      await harness.controller.initialize();
      const transition = scenario.start(harness.controller);
      harness.controller.changeTeacherDraft(`${scenario.name} retained draft`);

      await harness.controller.selectTab("teacher");
      const afterTabFailure = harness.controller.getState();
      assert.equal(afterTabFailure.busyAction, scenario.busyAction);
      assert.equal(afterTabFailure.error, null);
      assert.equal(afterTabFailure.teacherDraft, `${scenario.name} retained draft`);
      assert.equal(afterTabFailure.viewModel.presentation.lastFullTab, "teacher");
      assert.equal(afterTabFailure.viewModel.session.mission.title, `${scenario.name} owned mission`);
      await harness.controller.compact();

      assert.equal(harness.controller.getState(), afterTabFailure);
      assert.equal(harness.calls.filter(([name]) => name === "selectTab").length, 1);
      assert.equal(harness.calls.filter(([name]) => name === "compact").length, 1);
      assert.equal(harness.view.composerFocusCount, 0);
      transitionPending.resolve(scenario.result());
      await transition;
    });
  }
});

test("interaction: rebind supersedes a late Teacher success without disturbing the picker or newer draft", async () => {
  const teacherPending = pendingResult();
  const tasks = [{
    threadId: "thr-rebound",
    displayName: "Rebound task",
    updatedAt: "2026-08-04T02:05:04.000Z",
    status: "idle",
  }];
  const staleAnswer = boundViewModel();
  staleAnswer.session.teacherChat = [{
    id: "stale-teacher",
    role: "teacher",
    text: "This answer belongs to the old binding.",
    createdAt: "2026-08-04T02:06:04.000Z",
  }];
  const harness = createInteractionHarness({
    sendTeacherMessage: () => teacherPending.promise,
    rebind: () => ok(viewModel()),
    listTasks: () => ok(tasks),
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Question for the old task");
  const oldSend = harness.controller.sendTeacherMessage();
  assert.equal(harness.controller.getState().busyAction, "teacher");

  const rebinding = harness.controller.rebindTask();
  assert.equal(harness.controller.getState().busyAction, "rebinding");
  await rebinding;
  assert.equal(harness.controller.getState().pickerOpen, true);
  assert.equal(harness.view.pickerMode, "choices");

  harness.controller.changeTeacherDraft("Question for whichever task I bind next");
  const beforeLateSuccess = harness.controller.getState();
  const renderCount = harness.view.renderCount;
  const composerFocusCount = harness.view.composerFocusCount;
  teacherPending.resolve(ok(staleAnswer));
  await oldSend;

  assert.equal(harness.controller.getState(), beforeLateSuccess);
  assert.equal(harness.controller.getState().teacherDraft, "Question for whichever task I bind next");
  assert.equal(harness.controller.getState().pickerOpen, true);
  assert.equal(harness.controller.getState().error, null);
  assert.equal(harness.view.pickerMode, "choices");
  assert.equal(harness.view.renderCount, renderCount);
  assert.equal(harness.view.composerFocusCount, composerFocusCount);
});

test("interaction: a stale Teacher rejection cannot unlock or clear a newer Teacher request", async () => {
  const oldTeacherPending = pendingResult();
  const newTeacherPending = pendingResult();
  let sendCount = 0;
  const tasks = [{
    threadId: "thr-new-context",
    displayName: "New context task",
    updatedAt: "2026-08-04T02:07:04.000Z",
    status: "idle",
  }];
  const newAnswer = boundViewModel();
  newAnswer.session.teacherChat = [{
    id: "current-teacher",
    role: "teacher",
    text: "This answer belongs to the new binding.",
    createdAt: "2026-08-04T02:08:04.000Z",
  }];
  const harness = createInteractionHarness({
    sendTeacherMessage() {
      sendCount += 1;
      return sendCount === 1 ? oldTeacherPending.promise : newTeacherPending.promise;
    },
    rebind: () => ok(viewModel()),
    listTasks: () => ok(tasks),
    bindTask: () => ok(boundViewModel()),
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Old question");
  const oldSend = harness.controller.sendTeacherMessage();
  await harness.controller.rebindTask();
  await harness.controller.bindSelectedTask("thr-new-context");

  harness.controller.changeTeacherDraft("New question");
  const newSend = harness.controller.sendTeacherMessage();
  const beforeLateRejection = harness.controller.getState();
  const renderCount = harness.view.renderCount;
  oldTeacherPending.resolve(failed("RAW stale Teacher failure"));
  await oldSend;

  assert.equal(harness.controller.getState(), beforeLateRejection);
  assert.equal(harness.controller.getState().busyAction, "teacher");
  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.controller.getState().error, null);
  assert.equal(harness.controller.getState().pickerOpen, false);
  assert.equal(harness.view.renderCount, renderCount);
  assert.equal(harness.view.composerFocusCount, 0);

  newTeacherPending.resolve(ok(newAnswer));
  await newSend;
  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.view.composerFocusCount, 1);
});

test("interaction: Retry supersedes a late Teacher success while retaining retry ownership and a newer draft", async () => {
  const oldTeacherPending = pendingResult();
  const retryPending = pendingResult();
  const staleAnswer = boundViewModel();
  staleAnswer.session.teacherChat = [{
    id: "stale-retry-teacher",
    role: "teacher",
    text: "This answer predates Retry observation.",
    createdAt: "2026-08-04T02:09:04.000Z",
  }];
  const retried = boundViewModel();
  retried.session.executor.observedAt = "2026-08-04T02:10:04.000Z";
  const harness = createInteractionHarness({
    sendTeacherMessage: () => oldTeacherPending.promise,
    retry: () => retryPending.promise,
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Question before Retry");
  const oldSend = harness.controller.sendTeacherMessage();

  const retrying = harness.controller.retryObservation();
  assert.equal(harness.controller.getState().busyAction, "retrying");
  assert.equal(harness.calls.filter(([name]) => name === "retry").length, 1);
  harness.controller.changeTeacherDraft("Question retained during Retry");
  const beforeLateSuccess = harness.controller.getState();
  const renderCount = harness.view.renderCount;
  const composerFocusCount = harness.view.composerFocusCount;
  oldTeacherPending.resolve(ok(staleAnswer));
  await oldSend;

  assert.equal(harness.controller.getState(), beforeLateSuccess);
  assert.equal(harness.controller.getState().busyAction, "retrying");
  assert.equal(harness.controller.getState().teacherDraft, "Question retained during Retry");
  assert.equal(harness.controller.getState().error, null);
  assert.equal(harness.view.renderCount, renderCount);
  assert.equal(harness.view.composerFocusCount, composerFocusCount);

  retryPending.resolve(ok(retried));
  await retrying;
  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.controller.getState().teacherDraft, "Question retained during Retry");
  assert.equal(harness.controller.getState().viewModel.session.executor.observedAt, "2026-08-04T02:10:04.000Z");
});

test("interaction: a Teacher rejection superseded by Retry cannot unlock a newer Teacher request", async () => {
  const oldTeacherPending = pendingResult();
  const newTeacherPending = pendingResult();
  let sendCount = 0;
  const currentAnswer = boundViewModel();
  currentAnswer.session.teacherChat = [{
    id: "current-retry-teacher",
    role: "teacher",
    text: "This answer follows Retry observation.",
    createdAt: "2026-08-04T02:11:04.000Z",
  }];
  const harness = createInteractionHarness({
    sendTeacherMessage() {
      sendCount += 1;
      return sendCount === 1 ? oldTeacherPending.promise : newTeacherPending.promise;
    },
    retry: () => ok(boundViewModel()),
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Old question");
  const oldSend = harness.controller.sendTeacherMessage();
  await harness.controller.retryObservation();

  harness.controller.changeTeacherDraft("New question after Retry");
  const newSend = harness.controller.sendTeacherMessage();
  const beforeLateRejection = harness.controller.getState();
  const renderCount = harness.view.renderCount;
  oldTeacherPending.resolve(failed("RAW stale Teacher failure after Retry"));
  await oldSend;

  assert.equal(harness.controller.getState(), beforeLateRejection);
  assert.equal(harness.controller.getState().busyAction, "teacher");
  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.controller.getState().error, null);
  assert.equal(harness.view.renderCount, renderCount);
  assert.equal(harness.view.composerFocusCount, 0);

  newTeacherPending.resolve(ok(currentAnswer));
  await newSend;
  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.controller.getState().teacherDraft, "");
  assert.equal(harness.view.composerFocusCount, 1);
});

test("interaction: Teacher draft stays editable but Send is inert during Retry and Rebind", async (t) => {
  for (const scenario of [
    {
      name: "Retry",
      busyAction: "retrying",
      bridgeMethod: "retry",
      start: (controller) => controller.retryObservation(),
      result: () => ok(boundViewModel()),
    },
    {
      name: "Rebind",
      busyAction: "rebinding",
      bridgeMethod: "rebind",
      start: (controller) => controller.rebindTask(),
      result: () => ok(viewModel()),
    },
  ]) {
    await t.test(scenario.name, async () => {
      const transitionPending = pendingResult();
      const harness = createInteractionHarness({
        [scenario.bridgeMethod]: () => transitionPending.promise,
        listTasks: () => ok([]),
      });
      await harness.controller.initialize();

      const transition = scenario.start(harness.controller);
      assert.equal(harness.controller.getState().busyAction, scenario.busyAction);
      harness.controller.changeTeacherDraft(`Draft retained during ${scenario.name}`);
      const transitionState = harness.controller.getState();
      const composerFocusCount = harness.view.composerFocusCount;
      await harness.controller.sendTeacherMessage();

      assert.equal(harness.calls.filter(([name]) => name === "sendTeacherMessage").length, 0);
      assert.equal(harness.controller.getState(), transitionState);
      assert.equal(harness.controller.getState().busyAction, scenario.busyAction);
      assert.equal(harness.controller.getState().teacherDraft, `Draft retained during ${scenario.name}`);
      assert.equal(harness.view.composerFocusCount, composerFocusCount);

      transitionPending.resolve(scenario.result());
      await transition;
      assert.equal(harness.controller.getState().teacherDraft, `Draft retained during ${scenario.name}`);
    });
  }
});

test("interaction: Open in Codex is inert while Teacher owns the controller", async () => {
  const teacherPending = pendingResult();
  const harness = createInteractionHarness({
    sendTeacherMessage: () => teacherPending.promise,
  });
  await harness.controller.initialize();
  harness.controller.changeTeacherDraft("Question before Open attempt");
  const sending = harness.controller.sendTeacherMessage();
  const teacherState = harness.controller.getState();

  await harness.controller.openBoundTask();

  assert.equal(harness.calls.filter(([name]) => name === "openTask").length, 0);
  assert.equal(harness.controller.getState(), teacherState);
  assert.equal(harness.controller.getState().busyAction, "teacher");
  assert.equal(harness.controller.getState().teacherDraft, "");

  teacherPending.resolve(ok(boundViewModel()));
  await sending;
  assert.equal(harness.controller.getState().busyAction, null);
  assert.equal(harness.view.composerFocusCount, 1);
});

test("interaction: Open in Codex rejects duplicate attempts while its first request owns state", async () => {
  const openPending = pendingResult();
  const harness = createInteractionHarness({ openTask: () => openPending.promise });
  await harness.controller.initialize();

  const opening = harness.controller.openBoundTask();
  const openingState = harness.controller.getState();
  const duplicate = harness.controller.openBoundTask();
  assert.equal(harness.calls.filter(([name]) => name === "openTask").length, 1);
  assert.equal(harness.controller.getState(), openingState);
  assert.equal(harness.controller.getState().busyAction, "opening");

  openPending.resolve(ok(boundViewModel()));
  await Promise.all([opening, duplicate]);
  assert.equal(harness.controller.getState().busyAction, null);
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
  assert.match(html, /id="practice-objective"/);
  assert.match(html, /id="practice-expected-outcome"/);
  assert.match(html, /data-workspace-action="start-new"/);
  assert.match(html, /data-workspace-action="resume"/);
  assert.match(html, /id="practice-loading"[^>]*aria-live="polite"/);
  assert.match(html, /<dialog id="transfer-dialog"/);
  assert.match(html, /Chuyển ngữ cảnh có chọn lọc/);
  assert.match(html, /Tạm thời không khả dụng/);
  assert.match(script, /const SELECTIVE_TRANSFER_AVAILABLE = false/);
  assert.match(html, /id="course-practice-error"[^>]*role="alert"/);
  assert.match(html, /id="practice-shell"[^>]*data-screen="practice"/);
  assert.match(html, /class="practice-header"/);
  assert.match(html, /id="practice-title"[^>]*tabindex="-1"/);
  assert.doesNotMatch(html, /<main id="app"[^>]*aria-live/);
  assert.match(html, /id="picker-error"[^>]*role="alert"/);
  assert.match(html, /data-practice-action="retry-picker"/);
  assert.match(html, /id="picker-status"[^>]*role="status"/);
  assert.match(html, /id="executor-status"[^>]*role="status"/);
  assert.match(html, /data-practice-action="compact"[^>]*aria-label="Thu nhỏ thành bong bóng Teacher"/);

  assert.match(html, /role="tablist"[^>]*aria-label="Teacher và tiến độ Practice"/);
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
  assert.match(html, /id="practice-checklist"[^>]*aria-label="Các bước Practice"/);
  assert.match(html, /data-workspace-action="retry-switch"/);
  assert.match(html, /data-workspace-action="cancel-switch"/);
  assert.match(html, /class="legacy-practice-details"/);

  const rendererSource = `${script}\n${controllerSource}`;
  assert.doesNotMatch(rendererSource, /node:|from\s+["']electron|require\s*\(|App Server|credentials|process\.env|filesystem/i);
  assert.doesNotMatch(rendererSource, /innerHTML/);
  assert.doesNotMatch(rendererSource, /native.*minimi|minimi.*addEventListener/i);
  assert.match(script, /createPracticeRendererController/);
  assert.match(script, /practiceController\.subscribe\(\)/);
  assert.match(script, /createPracticeWorkspaceRendererController/);
  assert.match(script, /workspaceController\.requestStartNew\(\)/);
  assert.match(script, /getPracticeWorkspaceLoadingLabel/);
  assert.match(script, /removePracticeListener/);
  assert.match(script, /getPracticeActionPolicy/);
  assert.match(script, /function renderPracticeActionControls\(\)[\s\S]{0,240}getPracticeActionPolicy/);
  assert.match(script, /updateComposer\(next\)[\s\S]{0,160}renderPracticeActionControls\(\)/);
  assert.match(controllerSource, /observation cursor will reset/i);
  assert.match(script, /Intl\.DateTimeFormat/);
  assert.match(script, /\.textContent\s*=/);
  assert.match(script, /Teacher is thinking/);
  assert.match(script, /practiceState\.busyAction === "teacher"/);
  assert.match(script, /teacher-thinking-text/);
  assert.doesNotMatch(script, /function renderTeacherMessages[\s\S]{0,500}replaceChildren/);
  assert.match(script, /choice\.disabled\s*=/);

  assert.match(css, /@media\s*\(min-width:\s*921px\)/);
  assert.match(css, /grid-template-columns:/);
  assert.match(css, /72ch/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /border-style:\s*dashed/);
  assert.match(css, /position:\s*sticky/);
  assert.match(css, /dialog\s*\{[^}]*overscroll-behavior:\s*contain/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*no-preference/);
  assert.match(css, /teacher-thinking-pulse/);
  assert.match(css, /\.practice-brief-panel/);
  assert.match(css, /\.practice-checklist/);
  assert.match(css, /\.practice-loading/);
  assert.match(css, /\.transfer-choice/);
});
