import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rendererUrl = new URL("../src/renderer/", import.meta.url);
const expectedCsp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

async function readRenderer(name) {
  return readFile(new URL(name, rendererUrl), "utf8");
}

function cspFrom(html) {
  return html.match(/http-equiv="Content-Security-Policy"[\s\S]*?content="([^"]+)"/)?.[1];
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

test("compact HTML keeps main-renderer CSP parity and exact accessible landmarks", async () => {
  const [main, bubble, quickChat] = await Promise.all([
    readRenderer("index.html"),
    readRenderer("bubble.html"),
    readRenderer("quick-chat.html"),
  ]);

  assert.equal(cspFrom(main), expectedCsp);
  assert.equal(cspFrom(bubble), expectedCsp);
  assert.equal(cspFrom(quickChat), expectedCsp);

  assert.match(bubble, /<main class="bubble-shell" aria-label="Teacher companion">/);
  assert.equal((bubble.match(/<button\b/g) ?? []).length, 1);
  assert.match(bubble, /id="teacher-bubble"[^>]*aria-label="Open Teacher quick chat"/);
  assert.match(bubble, /class="drag-ring"[^>]*aria-hidden="true"/);
  assert.match(bubble, /id="executor-symbol"[^>]*>○<\/span>/);
  assert.match(bubble, /id="unread-badge"[^>]*hidden[^>]*>0<\/span>/);
  assert.match(bubble, /id="bubble-status"[^>]*role="status"[^>]*>Executor ready<\/span>/);
  assert.match(bubble, /<script type="module" src="\.\/bubble\.js"><\/script>/);

  assert.match(quickChat, /<header class="quick-header">/);
  assert.match(quickChat, /id="quick-status"/);
  assert.match(quickChat, /id="quick-freshness"[^>]*role="status"/);
  assert.match(quickChat, /id="quick-messages"[^>]*role="log"[^>]*aria-label="Teacher conversation"[^>]*aria-live="polite"/);
  assert.match(quickChat, /<label for="quick-message">Message Teacher<\/label>/);
  assert.match(quickChat, /<textarea id="quick-message" maxlength="4000" rows="3"><\/textarea>/);
  assert.match(quickChat, /<button type="submit"[^>]*>Send<\/button>/);
  assert.match(quickChat, /<button type="button" data-action="expand">Expand Practice<\/button>/);
  assert.match(quickChat, /<script type="module" src="\.\/quick-chat\.js"><\/script>/);
});

test("compact CSS preserves the 72px bubble, drag boundaries, and resilient accessibility", async () => {
  const [bubbleCss, compactCss] = await Promise.all([
    readRenderer("bubble.css"),
    readRenderer("compact.css"),
  ]);
  const css = `${bubbleCss}\n${compactCss}`;

  assert.match(bubbleCss, /\.bubble-shell\s*\{[^}]*-webkit-app-region:\s*drag/s);
  assert.match(bubbleCss, /#teacher-bubble\s*\{[^}]*-webkit-app-region:\s*no-drag/s);
  assert.doesNotMatch(bubbleCss, /body\s*\{[^}]*min-(?:width|height):\s*(?:7[3-9]|[89]\d|\d{3,})px/s);
  assert.match(css, /min-width:\s*44px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(css, /@import|https?:\/\//);
});

test("compact renderer sources use only narrow bridges and DOM-safe incremental rendering", async () => {
  const [bubble, quickChat] = await Promise.all([
    readRenderer("bubble.js"),
    readRenderer("quick-chat.js"),
  ]);
  const source = `${bubble}\n${quickChat}`;

  assert.match(bubble, /window\.practiceBubble/);
  assert.match(quickChat, /window\.practiceQuickChat/);
  assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(source, /ipcRenderer|require\(|process\.env|node:fs|child_process/);
  assert.doesNotMatch(source, /mission|changedFiles|threadId|eligibleTasks|credential|rawProtocol/i);
  assert.doesNotMatch(quickChat, /result\??\.value|result\[\s*["']value["']\s*\]/);
  assert.match(quickChat, /textContent/);
  assert.match(quickChat, /dataset\.messageKey/);
  assert.match(quickChat, /document\.createElement/);
  assert.doesNotMatch(quickChat, /quickMessages\.replaceChildren|quickMessages\.textContent\s*=/);
  for (const renderer of [bubble, quickChat]) {
    assert.match(renderer, /addEventListener\("unload"/);
    assert.match(renderer, /removeStateListener/);
  }
});

test("bubble counts only distinct observed unseen Teacher ID transitions", async () => {
  const { createBubbleController } = await import(new URL("bubble.js", rendererUrl));
  let listener;
  let removeCalls = 0;
  const unread = [];
  const statuses = [];
  const bridge = {
    getState: async () => ({
      ok: true,
      value: {
        executor: { status: "working", freshness: "fresh" },
        newestTeacherMessageId: "teacher-a",
      },
    }),
    onStateChanged(next) {
      listener = next;
      return () => { removeCalls += 1; };
    },
    openQuickChat: async () => ({ ok: true }),
    expand: async () => ({ ok: true }),
    openMenu: async () => ({ ok: true }),
  };
  const controller = createBubbleController({
    bridge,
    view: {
      renderStatus: (status) => statuses.push(status),
      renderUnread: (count) => unread.push(count),
    },
  });

  await controller.initialize();
  assert.deepEqual(statuses.at(-1), {
    key: "working",
    symbol: "◌",
    label: "Executor working",
    freshness: "fresh",
  });
  assert.equal(unread.at(-1), 1);

  listener({
    executor: { status: "response-ready", freshness: "fresh" },
    newestTeacherMessageId: "teacher-b",
  });
  listener({
    executor: { status: "response-ready", freshness: "fresh" },
    newestTeacherMessageId: "teacher-b",
  });
  listener({
    executor: { status: "response-ready", freshness: "fresh" },
    newestTeacherMessageId: "teacher-a",
  });
  assert.equal(unread.at(-1), 2, "replayed IDs must not inflate observed unread transitions");

  listener({
    executor: { status: "working", freshness: "stale" },
    newestTeacherMessageId: "teacher-c",
  });
  assert.deepEqual(statuses.at(-1), {
    key: "stale",
    symbol: "~",
    label: "Executor context stale",
    freshness: "stale",
  });
  assert.equal(unread.at(-1), 3);

  controller.dispose();
  controller.dispose();
  assert.equal(removeCalls, 1);
});

test("bubble arbitrates click, double-click, keyboard Expand, and context menu without duplicate actions", async () => {
  const { createBubbleController } = await import(new URL("bubble.js", rendererUrl));
  const calls = [];
  const scheduled = new Map();
  let timerId = 0;
  const controller = createBubbleController({
    bridge: {
      getState: async () => ({ ok: true, value: {} }),
      onStateChanged: () => () => {},
      openQuickChat: async () => { calls.push("open"); return { ok: true }; },
      expand: async () => { calls.push("expand"); return { ok: true }; },
      openMenu: async () => { calls.push("menu"); return { ok: true }; },
    },
    view: { renderStatus() {}, renderUnread() {} },
    schedule(callback) {
      const id = ++timerId;
      scheduled.set(id, callback);
      return id;
    },
    cancel(id) {
      scheduled.delete(id);
    },
  });
  const runTimers = () => {
    for (const [id, callback] of [...scheduled]) {
      scheduled.delete(id);
      callback();
    }
  };
  const event = () => ({ preventDefault() {}, repeat: false });

  controller.handleClick();
  assert.deepEqual(calls, []);
  runTimers();
  await flushPromises();
  assert.deepEqual(calls, ["open"]);

  controller.handleClick();
  controller.handleClick();
  controller.handleDoubleClick(event());
  runTimers();
  await flushPromises();
  assert.deepEqual(calls, ["open", "expand"]);

  controller.handleKeyDown({ key: "Enter", ...event() });
  controller.handleKeyDown({ key: " ", ...event() });
  controller.handleKeyDown({ key: "Enter", ...event(), repeat: true });
  await flushPromises();
  assert.deepEqual(calls, ["open", "expand", "expand", "expand"]);

  controller.handleClick();
  controller.handleContextMenu(event());
  runTimers();
  await flushPromises();
  assert.deepEqual(calls, ["open", "expand", "expand", "expand", "menu"]);
});

test("bubble initialization never overwrites a newer pushed state with a stale snapshot", async () => {
  const { createBubbleController } = await import(new URL("bubble.js", rendererUrl));
  const initial = deferred();
  let listener;
  const statuses = [];
  const controller = createBubbleController({
    bridge: {
      getState: () => initial.promise,
      onStateChanged(next) { listener = next; return () => {}; },
      openQuickChat: async () => ({ ok: true }),
      expand: async () => ({ ok: true }),
      openMenu: async () => ({ ok: true }),
    },
    view: {
      renderStatus: (status) => statuses.push(status.key),
      renderUnread() {},
    },
  });

  const initializing = controller.initialize();
  listener({
    executor: { status: "response-ready", freshness: "fresh" },
    newestTeacherMessageId: "teacher-current",
  });
  initial.resolve({
    ok: true,
    value: {
      executor: { status: "ready", freshness: "fresh" },
      newestTeacherMessageId: "teacher-stale",
    },
  });
  await initializing;
  assert.equal(statuses.at(-1), "response-ready");
});

test("bubble fails closed on initial state or open failure", async () => {
  const { createBubbleController } = await import(new URL("bubble.js", rendererUrl));
  const statuses = [];
  const unread = [];
  const scheduled = [];
  const controller = createBubbleController({
    bridge: {
      getState: async () => ({ ok: false }),
      onStateChanged: () => () => {},
      openQuickChat: async () => ({ ok: false }),
      expand: async () => ({ ok: true }),
      openMenu: async () => ({ ok: true }),
    },
    view: {
      renderStatus: (status) => statuses.push(status.key),
      renderUnread: (count) => unread.push(count),
    },
    schedule(callback) { scheduled.push(callback); return scheduled.length; },
    cancel() {},
  });

  await controller.initialize();
  assert.equal(statuses.at(-1), "disconnected");
  controller.handleClick();
  scheduled.shift()();
  await flushPromises();
  assert.equal(unread.at(-1), 0);

  const listenerController = createBubbleController({
    bridge: {
      getState: async () => ({
        ok: true,
        value: {
          executor: { status: "ready", freshness: "fresh" },
          newestTeacherMessageId: "teacher-unseen",
        },
      }),
      onStateChanged: () => () => {},
      openQuickChat: async () => ({ ok: false }),
      expand: async () => ({ ok: true }),
      openMenu: async () => ({ ok: true }),
    },
    view: {
      renderStatus() {},
      renderUnread: (count) => unread.push(count),
    },
    schedule(callback) { scheduled.push(callback); return scheduled.length; },
    cancel() {},
  });
  await listenerController.initialize();
  assert.equal(unread.at(-1), 1);
  listenerController.handleClick();
  scheduled.shift()();
  await flushPromises();
  assert.equal(unread.at(-1), 1);
});

test("quick chat normalizes a bounded recent role/text/timestamp log", async () => {
  const { normalizeQuickMessages } = await import(new URL("quick-chat.js", rendererUrl));
  const messages = Array.from({ length: 30 }, (_, index) => ({
    id: `message-${index}`,
    role: index % 2 ? "teacher" : "learner",
    text: "x".repeat(4_200),
    createdAt: "2026-08-03T10:00:00.000Z",
  }));
  messages.push({ id: "unsafe", role: "system", text: "do not render", createdAt: "now" });

  const normalized = normalizeQuickMessages(messages);
  assert.equal(normalized.length, 24);
  assert.equal(normalized[0].id, "message-6");
  assert.equal([...normalized.at(-1).text].length, 4_000);
  assert.deepEqual(Object.keys(normalized[0]).sort(), ["createdAt", "id", "role", "text"]);
  assert.equal(normalized.some(({ role }) => role === "system"), false);
});

test("quick chat updates only the composer while typing and fails closed on duplicate Send", async () => {
  const { createQuickChatController } = await import(new URL("quick-chat.js", rendererUrl));
  const sendResult = deferred();
  let listener;
  let sendCalls = 0;
  const snapshots = [];
  const composers = [];
  const errors = [];
  let focusCalls = 0;
  const controller = createQuickChatController({
    bridge: {
      getState: async () => ({
        ok: true,
        value: {
          executor: { status: "ready", freshness: "fresh", observedAt: null },
          teacherChat: [],
          error: null,
        },
      }),
      onStateChanged(next) { listener = next; return () => {}; },
      sendTeacherMessage() { sendCalls += 1; return sendResult.promise; },
      closeQuickChat: async () => ({ ok: true }),
      expand: async () => ({ ok: true }),
    },
    view: {
      renderSnapshot: (snapshot) => snapshots.push(snapshot),
      renderComposer: (composer) => composers.push({ ...composer }),
      renderLocalError: (message) => errors.push(message),
      focusComposer: () => { focusCalls += 1; },
    },
  });

  await controller.initialize();
  const snapshotCount = snapshots.length;
  controller.changeDraft("  Keep this draft  ");
  assert.equal(snapshots.length, snapshotCount, "typing must not replay the chat log");
  assert.equal(composers.at(-1).draft, "  Keep this draft  ");

  const firstSend = controller.send();
  const duplicateSend = controller.send();
  assert.equal(sendCalls, 1);
  assert.equal(composers.at(-1).sending, true);
  await duplicateSend;

  listener({
    executor: { status: "working", freshness: "fresh", observedAt: "2026-08-03T10:00:00.000Z" },
    teacherChat: [{ id: "learner-1", role: "learner", text: "Keep this draft", createdAt: "2026-08-03T10:00:00.000Z" }],
    error: null,
  });
  assert.equal(composers.at(-1).draft, "  Keep this draft  ");

  sendResult.resolve({ ok: false, error: { message: "RAW private failure" } });
  await firstSend;
  assert.equal(composers.at(-1).draft, "  Keep this draft  ");
  assert.equal(composers.at(-1).sending, false);
  assert.equal(errors.at(-1), "Your message was not sent. Check the connection and try again.");
  assert.equal(errors.some((message) => /RAW|private/.test(message)), false);
  assert.equal(focusCalls, 1);
});

test("quick chat request identity prevents a closed stale send from clearing or focusing over a newer request", async () => {
  const { createQuickChatController } = await import(new URL("quick-chat.js", rendererUrl));
  const first = deferred();
  const second = deferred();
  const results = [first, second];
  const calls = [];
  const composers = [];
  let focusCalls = 0;
  const controller = createQuickChatController({
    bridge: {
      getState: async () => ({ ok: true, value: {} }),
      onStateChanged: () => () => {},
      sendTeacherMessage(text) { calls.push(["send", text]); return results.shift().promise; },
      closeQuickChat: async () => { calls.push(["close"]); return { ok: true }; },
      expand: async () => { calls.push(["expand"]); return { ok: true }; },
    },
    view: {
      renderSnapshot() {},
      renderComposer: (composer) => composers.push({ ...composer }),
      renderLocalError() {},
      focusComposer: () => { focusCalls += 1; },
    },
  });
  await controller.initialize();

  controller.changeDraft("first");
  const staleSend = controller.send();
  controller.handleKeyDown({ key: "Escape", preventDefault() {} });
  await flushPromises();
  assert.deepEqual(calls.slice(0, 2), [["send", "first"], ["close"]]);
  assert.equal(calls.some(([name]) => name === "expand"), false);

  controller.changeDraft("newer");
  const currentSend = controller.send();
  first.resolve({ ok: true, value: { private: "must be ignored" } });
  await staleSend;
  assert.equal(composers.at(-1).draft, "newer");
  assert.equal(composers.at(-1).sending, true);
  assert.equal(focusCalls, 0);

  second.resolve({ ok: true, value: { private: "must be ignored" } });
  await currentSend;
  assert.equal(composers.at(-1).draft, "");
  assert.equal(composers.at(-1).sending, false);
  assert.equal(focusCalls, 1);
});

test("quick chat Expand is explicit and listener cleanup is idempotent", async () => {
  const { createQuickChatController } = await import(new URL("quick-chat.js", rendererUrl));
  const calls = [];
  let removeCalls = 0;
  const controller = createQuickChatController({
    bridge: {
      getState: async () => ({ ok: true, value: {} }),
      onStateChanged: () => () => { removeCalls += 1; },
      sendTeacherMessage: async () => ({ ok: true }),
      closeQuickChat: async () => { calls.push("close"); return { ok: true }; },
      expand: async () => { calls.push("expand"); return { ok: true }; },
    },
    view: {
      renderSnapshot() {},
      renderComposer() {},
      renderLocalError() {},
      focusComposer() {},
    },
  });
  await controller.initialize();

  controller.handleKeyDown({ key: "Escape", preventDefault() {} });
  await flushPromises();
  assert.deepEqual(calls, ["close"]);
  controller.expand();
  await flushPromises();
  assert.deepEqual(calls, ["close", "expand"]);

  controller.dispose();
  controller.dispose();
  assert.equal(removeCalls, 1);
});

test("quick chat fails closed to disconnected when its initial snapshot is unavailable", async () => {
  const { createQuickChatController } = await import(new URL("quick-chat.js", rendererUrl));
  const snapshots = [];
  const errors = [];
  const controller = createQuickChatController({
    bridge: {
      getState: async () => ({ ok: false }),
      onStateChanged: () => () => {},
      sendTeacherMessage: async () => ({ ok: true }),
      closeQuickChat: async () => ({ ok: true }),
      expand: async () => ({ ok: true }),
    },
    view: {
      renderSnapshot: (snapshot) => snapshots.push(snapshot),
      renderComposer() {},
      renderLocalError: (message) => errors.push(message),
      focusComposer() {},
    },
  });

  await controller.initialize();
  assert.equal(snapshots.at(-1).executor.key, "disconnected");
  assert.equal(errors.at(-1), "Teacher chat is unavailable. Try expanding Practice.");
});
