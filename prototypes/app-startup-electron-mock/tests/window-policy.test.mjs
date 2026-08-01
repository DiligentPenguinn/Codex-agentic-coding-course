import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import {
  createWindowOptions,
  installWindowPolicy,
} from "../src/main/window-policy.mjs";

test("uses an isolated, sandboxed renderer", () => {
  assert.deepEqual(
    createWindowOptions({ preloadPath: "C:\\mock\\preload.mjs" }).webPreferences,
    {
      preload: "C:\\mock\\preload.mjs",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  );
  assert.equal(createWindowOptions({ preloadPath: "x" }).show, false);
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
