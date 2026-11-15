import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  createBubbleWindowOptions,
  createMainWindowOptions,
  createQuickChatWindowOptions,
  createWindowOptions,
  installWindowPolicy,
} from "../src/main/window-policy.mjs";

const isolatedPreferences = (preload) => ({
  preload,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
});

test("builds the secure full Practice window options and retains the startup alias", () => {
  const expected = {
    width: 1180,
    height: 800,
    minWidth: 760,
    minHeight: 600,
    show: false,
    webPreferences: isolatedPreferences("C:\\mock\\main-preload.cjs"),
  };

  assert.deepEqual(
    createMainWindowOptions({ preloadPath: "C:\\mock\\main-preload.cjs" }),
    expected,
  );
  assert.equal(createWindowOptions, createMainWindowOptions);
});

test("builds the secure compact Teacher bubble options", () => {
  assert.deepEqual(
    createBubbleWindowOptions({ preloadPath: "C:\\mock\\bubble-preload.cjs" }),
    {
      width: 72,
      height: 72,
      show: false,
      frame: false,
      transparent: true,
      resizable: false,
      maximizable: false,
      minimizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      hasShadow: false,
      webPreferences: isolatedPreferences("C:\\mock\\bubble-preload.cjs"),
    },
  );
});

test("builds the secure Teacher quick-chat options", () => {
  assert.deepEqual(
    createQuickChatWindowOptions({ preloadPath: "C:\\mock\\quick-preload.cjs" }),
    {
      width: 360,
      height: 520,
      show: false,
      frame: false,
      transparent: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: isolatedPreferences("C:\\mock\\quick-preload.cjs"),
    },
  );
});

test("applies only explicit rectangle fields to presentation options", () => {
  assert.deepEqual(
    createMainWindowOptions({
      preloadPath: "main.cjs",
      bounds: { x: 12, y: 34, width: 900, height: 700 },
    }),
    {
      x: 12,
      y: 34,
      width: 900,
      height: 700,
      minWidth: 760,
      minHeight: 600,
      show: false,
      webPreferences: isolatedPreferences("main.cjs"),
    },
  );
});

test("blocks navigation and denies all renderer-created windows", async () => {
  const webContents = new EventEmitter();
  let openHandler;
  webContents.setWindowOpenHandler = (handler) => {
    openHandler = handler;
  };
  webContents.getURL = () => "file:///C:/mock/index.html";
  const opened = [];
  installWindowPolicy({ webContents }, {
    openExternal: async (url) => opened.push(url),
  });

  let prevented = false;
  webContents.emit("will-navigate", {
    preventDefault() {
      prevented = true;
    },
  }, "https://evil.example/");
  assert.equal(prevented, true);
  assert.deepEqual(openHandler({ url: "https://evil.example/" }), {
    action: "deny",
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(opened, []);
});

test("opens only allowlisted authentication URLs externally", async () => {
  const webContents = new EventEmitter();
  let openHandler;
  webContents.setWindowOpenHandler = (handler) => {
    openHandler = handler;
  };
  webContents.getURL = () => "file:///C:/mock/index.html";
  const opened = [];
  installWindowPolicy({ webContents }, {
    openExternal: async (url) => opened.push(url),
  });

  assert.deepEqual(openHandler({ url: "https://auth.openai.com/codex" }), {
    action: "deny",
  });
  assert.deepEqual(openHandler({ url: "https://evil.example/" }), {
    action: "deny",
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(opened, ["https://auth.openai.com/codex"]);
});
