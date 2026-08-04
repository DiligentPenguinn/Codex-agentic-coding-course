import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import path from "node:path";
import test from "node:test";

import { CHANNELS } from "../src/shared/channels.mjs";
import {
  clampBounds,
  createWindowCoordinator,
} from "../src/main/window-coordinator.mjs";

const primary = {
  id: "primary",
  workArea: { x: 0, y: 0, width: 1000, height: 800 },
};
const secondary = {
  id: "secondary",
  workArea: { x: 1000, y: 0, width: 1200, height: 900 },
};

function createScheduler() {
  let nextId = 1;
  const tasks = new Map();
  return {
    setTimeout(callback, delay) {
      assert.equal(delay, 150);
      const id = nextId++;
      tasks.set(id, callback);
      return id;
    },
    clearTimeout(id) {
      tasks.delete(id);
    },
    get size() {
      return tasks.size;
    },
    async flush() {
      const pending = [...tasks.values()];
      tasks.clear();
      for (const callback of pending) await callback();
    },
  };
}

class FakeWebContents extends EventEmitter {
  constructor(owner) {
    super();
    this.owner = owner;
    this.openHandler = null;
    this.sent = [];
    this.url = "about:blank";
  }

  setWindowOpenHandler(handler) {
    this.openHandler = handler;
  }

  getURL() {
    return this.url;
  }

  send(channel, payload) {
    this.sent.push([channel, structuredClone(payload)]);
  }

  isDestroyed() {
    return this.owner.isDestroyed();
  }
}

class FakeWindow extends EventEmitter {
  constructor(options) {
    super();
    this.options = structuredClone(options);
    this.bounds = {
      x: options.x ?? 0,
      y: options.y ?? 0,
      width: options.width,
      height: options.height,
    };
    this.visible = false;
    this.destroyed = false;
    this.loadedFile = null;
    this.showCalls = 0;
    this.hideCalls = 0;
    this.restoreCalls = 0;
    this.focusCalls = 0;
    this.closeCalls = 0;
    this.webContents = new FakeWebContents(this);
  }

  async loadFile(file) {
    this.loadedFile = file;
    this.webContents.url = `file:///${file.replaceAll("\\", "/")}`;
  }

  show() {
    if (this.destroyed) return;
    this.visible = true;
    this.showCalls += 1;
  }

  hide() {
    if (this.destroyed) return;
    this.visible = false;
    this.hideCalls += 1;
  }

  restore() {
    if (this.destroyed) return;
    this.restoreCalls += 1;
  }

  focus() {
    if (this.destroyed) return;
    this.focusCalls += 1;
  }

  getBounds() {
    return { ...this.bounds };
  }

  setBounds(bounds) {
    this.bounds = { ...bounds };
  }

  isDestroyed() {
    return this.destroyed;
  }

  close() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.visible = false;
    this.closeCalls += 1;
    this.emit("closed");
  }
}

function createHarness(overrides = {}) {
  const windows = [];
  const loadResolvers = [];
  class BrowserWindow extends FakeWindow {
    constructor(options) {
      super(options);
      windows.push(this);
      if (overrides.delayLoads) {
        this.loadFile = async (file) => {
          this.loadedFile = file;
          this.webContents.url = `file:///${file.replaceAll("\\", "/")}`;
          await new Promise((resolve) => loadResolvers.push(resolve));
        };
      }
    }

    static fromWebContents(sender) {
      return windows.find((window) => window.webContents === sender) ?? null;
    }
  }

  let displays = [primary, secondary].map((display) => structuredClone(display));
  const screen = new EventEmitter();
  screen.getAllDisplays = () => displays.map((display) => structuredClone(display));
  screen.getPrimaryDisplay = () => structuredClone(displays[0]);
  screen.setDisplays = (next) => {
    displays = next.map((display) => structuredClone(display));
  };

  const scheduler = createScheduler();
  const updates = [];
  const presentation = {
    mode: "full",
    lastFullTab: "exercise",
    mainBounds: null,
    bubbleBounds: null,
    popoverBounds: null,
    ...structuredClone(overrides.presentation ?? {}),
  };
  const updatePresentation = overrides.updatePresentation ?? (async (patch) => {
    updates.push(structuredClone(patch));
    Object.assign(presentation, structuredClone(patch));
  });
  const selectedTabs = [];
  const paused = [];
  const quitCalls = [];
  const builtTemplates = [];
  const popupCalls = [];
  const Menu = {
    buildFromTemplate(template) {
      builtTemplates.push(template);
      return {
        popup(options) {
          popupCalls.push(options);
        },
      };
    },
  };

  const coordinator = createWindowCoordinator({
    BrowserWindow,
    Menu,
    screen,
    openExternal: async () => {},
    rendererPaths: {
      main: "C:\\mock\\renderer\\index.html",
      bubble: "C:\\mock\\renderer\\bubble.html",
      quickChat: "C:\\mock\\renderer\\quick-chat.html",
    },
    preloadPaths: {
      main: "C:\\mock\\preload\\preload.cjs",
      bubble: "C:\\mock\\preload\\bubble-preload.cjs",
      quickChat: "C:\\mock\\preload\\quick-chat-preload.cjs",
    },
    presentation,
    updatePresentation,
    selectTab: async (tab) => selectedTabs.push(tab),
    pausePractice: async () => paused.push(true),
    quitApp: () => quitCalls.push(true),
    toBubbleViewModel: (full) => ({ surface: "bubble", marker: full.marker }),
    toQuickChatViewModel: (full) => ({ surface: "quick", marker: full.marker }),
    timers: scheduler,
  });

  return {
    coordinator,
    windows,
    screen,
    scheduler,
    updates,
    presentation,
    selectedTabs,
    paused,
    quitCalls,
    builtTemplates,
    popupCalls,
    releaseLoads() {
      for (const resolve of loadResolvers.splice(0)) resolve();
    },
  };
}

test("clamps an off-screen saved bubble to the nearest display work area", () => {
  assert.deepEqual(
    clampBounds(
      { x: 2300, y: 100, width: 72, height: 72 },
      [primary, secondary],
      { x: 10, y: 10, width: 72, height: 72 },
    ),
    { x: 2112, y: 100, width: 72, height: 72 },
  );
  assert.deepEqual(
    clampBounds(null, [primary], { x: -100, y: -100, width: 1200, height: 900 }),
    { x: 16, y: 16, width: 968, height: 768 },
  );
});

test("create builds and secures all three windows exactly once, showing only main", async () => {
  const harness = createHarness();
  const main = await harness.coordinator.create();
  assert.equal(main, harness.windows[0]);
  await harness.coordinator.create();

  assert.equal(harness.windows.length, 3);
  assert.deepEqual(
    harness.windows.map((window) => path.basename(window.loadedFile)),
    ["index.html", "bubble.html", "quick-chat.html"],
  );
  assert.deepEqual(harness.windows.map((window) => window.visible), [true, false, false]);
  for (const window of harness.windows) {
    assert.equal(window.webContents.listenerCount("will-navigate"), 1);
    assert.equal(typeof window.webContents.openHandler, "function");
  }
  assert.equal(main.listenerCount("minimize"), 0);
  main.emit("minimize");
  assert.equal(main.visible, true);
});

test("a compact request during delayed creation wins without main being shown later", async () => {
  const harness = createHarness({ delayLoads: true });
  const creating = harness.coordinator.create();
  await new Promise((resolve) => setImmediate(resolve));
  const compacting = harness.coordinator.compact();
  await new Promise((resolve) => setImmediate(resolve));

  harness.releaseLoads();
  await Promise.all([creating, compacting]);

  const [main, bubble, quickChat] = harness.windows;
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [false, true, false]);
  assert.equal(main.showCalls, 0);
  assert.deepEqual(harness.updates.at(-1), { mode: "compact" });
});

test("compact, quick chat, close, and expand keep one prominent course surface", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  const [main, bubble, quickChat] = harness.windows;

  await assert.rejects(
    harness.coordinator.openQuickChat(),
    /compact mode/i,
  );

  await harness.coordinator.compact();
  assert.deepEqual(harness.updates, [
    { mainBounds: { x: 16, y: 16, width: 968, height: 768 } },
    { mode: "compact" },
  ]);
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [false, true, false]);

  await harness.coordinator.openQuickChat();
  assert.deepEqual(harness.updates.at(-1), { mode: "quick-chat" });
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [false, true, true]);
  assert.equal(quickChat.bounds.x + quickChat.bounds.width + 16, bubble.bounds.x);

  await harness.coordinator.closeQuickChat();
  assert.deepEqual(harness.updates.at(-1), { mode: "compact" });
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [false, true, false]);

  await harness.coordinator.expandTeacher();
  assert.deepEqual(harness.updates.at(-1), { mode: "full" });
  assert.deepEqual(harness.selectedTabs, ["teacher"]);
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [true, false, false]);
  assert.equal(main.restoreCalls, 1);
  assert.equal(main.focusCalls, 1);
});

test("quick chat ignores stale persisted coordinates and reanchors beside the bubble", async () => {
  const harness = createHarness({
    presentation: {
      bubbleBounds: { x: 912, y: 680, width: 72, height: 72 },
      popoverBounds: { x: 16, y: 16, width: 360, height: 520 },
    },
  });
  await harness.coordinator.create();
  await harness.coordinator.compact();
  harness.updates.length = 0;
  await harness.coordinator.openQuickChat();
  const [, bubble, quickChat] = harness.windows;

  assert.equal(quickChat.bounds.x + quickChat.bounds.width + 16, bubble.bounds.x);
  assert.ok(quickChat.bounds.x + quickChat.bounds.width <= bubble.bounds.x);
  assert.deepEqual(harness.updates, [
    { popoverBounds: quickChat.getBounds() },
    { mode: "quick-chat" },
  ]);
});

test("same-tick compact, open, and close applies the final compact invariant", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  await Promise.all([
    harness.coordinator.compact(),
    harness.coordinator.openQuickChat(),
    harness.coordinator.closeQuickChat(),
  ]);
  assert.deepEqual(harness.windows.map((window) => window.visible), [false, true, false]);
  assert.deepEqual(harness.updates.at(-1), { mode: "compact" });
});

test("quick-chat blur closes only the popover", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  await harness.coordinator.compact();
  await harness.coordinator.openQuickChat();
  const [main, bubble, quickChat] = harness.windows;

  quickChat.emit("blur");
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(harness.updates.at(-1), { mode: "compact" });
  assert.deepEqual([main.visible, bubble.visible, quickChat.visible], [false, true, false]);
});

test("move and resize events debounce and persist clamped bounds per window", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  const [main, bubble, quickChat] = harness.windows;
  const samples = [
    [main, "mainBounds", { x: -100, y: -50, width: 900, height: 700 }],
    [bubble, "bubbleBounds", { x: 2300, y: 100, width: 72, height: 72 }],
    [quickChat, "popoverBounds", { x: 2050, y: 700, width: 360, height: 520 }],
  ];

  for (const [window, , bounds] of samples) {
    window.setBounds(bounds);
    window.emit("move");
    window.emit("resize");
  }
  assert.equal(harness.scheduler.size, 3);
  await harness.scheduler.flush();

  assert.deepEqual(main.getBounds(), { x: 16, y: 16, width: 900, height: 700 });
  assert.deepEqual(bubble.getBounds(), { x: 2112, y: 100, width: 72, height: 72 });
  assert.deepEqual(quickChat.getBounds(), { x: 1824, y: 364, width: 360, height: 520 });
  assert.deepEqual(harness.updates, samples.map(([window, key]) => ({
    [key]: window.getBounds(),
  })));
});

test("display removal reclamps and persists both compact surfaces", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  await harness.coordinator.compact();
  await harness.coordinator.openQuickChat();
  const [, bubble, quickChat] = harness.windows;
  bubble.setBounds({ x: 2100, y: 700, width: 72, height: 72 });
  quickChat.setBounds({ x: 1700, y: 350, width: 360, height: 520 });
  harness.updates.length = 0;

  harness.screen.setDisplays([primary]);
  harness.screen.emit("display-removed", {}, secondary);
  assert.deepEqual(bubble.getBounds(), { x: 912, y: 700, width: 72, height: 72 });
  assert.deepEqual(quickChat.getBounds(), { x: 536, y: 252, width: 360, height: 520 });
  assert.equal(quickChat.bounds.x + quickChat.bounds.width + 16, bubble.bounds.x);
  assert.ok(quickChat.bounds.x + quickChat.bounds.width <= bubble.bounds.x);
  await harness.scheduler.flush();
  assert.deepEqual(harness.updates, [
    { bubbleBounds: bubble.getBounds() },
    { popoverBounds: quickChat.getBounds() },
  ]);
  assert.deepEqual(harness.presentation.popoverBounds, quickChat.getBounds());
});

test("broadcast maps a distinct safe ViewModel to each live presentation", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  const [main, bubble, quickChat] = harness.windows;

  harness.coordinator.broadcast({ marker: "safe" });
  assert.deepEqual(main.webContents.sent, [
    [CHANNELS.PRACTICE_STATE_CHANGED, { marker: "safe" }],
  ]);
  assert.deepEqual(bubble.webContents.sent, [
    [CHANNELS.PRACTICE_STATE_CHANGED, { surface: "bubble", marker: "safe" }],
  ]);
  assert.deepEqual(quickChat.webContents.sent, [
    [CHANNELS.PRACTICE_STATE_CHANGED, { surface: "quick", marker: "safe" }],
  ]);

  bubble.close();
  harness.coordinator.broadcast({ marker: "next" });
  assert.equal(bubble.webContents.sent.length, 1);
  assert.equal(main.webContents.sent.length, 2);
  assert.equal(quickChat.webContents.sent.length, 2);
});

test("bubble menu exposes only the four approved entries and routes actions", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  const [main, bubble] = harness.windows;
  harness.coordinator.openBubbleMenu(bubble.webContents);
  const [template] = harness.builtTemplates;

  assert.deepEqual(template.map(({ label, type }) => label ?? type), [
    "Open Practice",
    "Pause Practice",
    "separator",
    "Quit Course App",
  ]);
  assert.deepEqual(harness.popupCalls, [{ window: bubble }]);
  template[0].click();
  template[1].click();
  template[3].click();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(harness.selectedTabs, ["teacher"]);
  assert.equal(main.restoreCalls, 1);
  assert.equal(harness.paused.length, 1);
  assert.equal(harness.quitCalls.length, 1);
});

test("dispose is idempotent, removes owned listeners, and does not quit or close main", async () => {
  const harness = createHarness();
  await harness.coordinator.create();
  const [main, bubble, quickChat] = harness.windows;
  bubble.emit("move");
  assert.equal(harness.scheduler.size, 1);
  assert.equal(harness.screen.listenerCount("display-removed"), 1);

  harness.coordinator.dispose();
  harness.coordinator.dispose();

  assert.equal(harness.scheduler.size, 0);
  assert.equal(harness.screen.listenerCount("display-removed"), 0);
  assert.equal(main.closeCalls, 0);
  assert.equal(bubble.closeCalls, 1);
  assert.equal(quickChat.closeCalls, 1);
  assert.equal(harness.quitCalls.length, 0);
  for (const window of harness.windows) {
    assert.equal(window.listenerCount("move"), 0);
    assert.equal(window.listenerCount("resize"), 0);
  }
  assert.equal(quickChat.listenerCount("blur"), 0);
});

test("superseded or disposed asynchronous transitions never mutate window visibility", async () => {
  let releaseCompact;
  const harness = createHarness({
    updatePresentation: async (patch) => {
      harness.updates.push(structuredClone(patch));
      if (patch.mode === "compact") {
        await new Promise((resolve) => {
          releaseCompact = resolve;
        });
      }
    },
  });
  await harness.coordinator.create();
  const [main, bubble] = harness.windows;
  const compacting = harness.coordinator.compact();
  while (!releaseCompact) await new Promise((resolve) => setImmediate(resolve));
  const expanding = harness.coordinator.expandTeacher();
  releaseCompact();
  await Promise.all([compacting, expanding]);

  assert.equal(bubble.showCalls, 0);
  assert.equal(main.visible, true);
  assert.equal(main.restoreCalls, 1);

  let releasePending;
  const disposedHarness = createHarness({
    updatePresentation: async (patch) => {
      disposedHarness.updates.push(structuredClone(patch));
      await new Promise((resolve) => {
        releasePending = resolve;
      });
    },
  });
  await disposedHarness.coordinator.create();
  const pendingCompact = disposedHarness.coordinator.compact();
  while (!releasePending) await new Promise((resolve) => setImmediate(resolve));
  disposedHarness.coordinator.dispose();
  releasePending();
  await pendingCompact;
  assert.equal(disposedHarness.windows[0].visible, true);
  assert.equal(disposedHarness.windows[1].showCalls, 0);
  assert.equal(disposedHarness.updates.length, 1);
});
