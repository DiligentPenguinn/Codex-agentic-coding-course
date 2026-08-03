import assert from "node:assert/strict";
import { EventEmitter, once } from "node:events";
import { PassThrough } from "node:stream";
import test from "node:test";

import { CodexAppServerClient } from "../src/main/codex-app-server-client.mjs";

function createFakeProcess() {
  const stdout = new PassThrough();
  const stdin = new PassThrough();
  const proc = new EventEmitter();
  const outgoing = [];
  let buffer = "";

  stdin.setEncoding("utf8");
  stdin.on("data", (chunk) => {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (line) {
        const message = JSON.parse(line);
        outgoing.push(message);
        proc.emit("request", message);
      }
      newline = buffer.indexOf("\n");
    }
  });

  Object.assign(proc, {
    stdout,
    stdin,
    stderr: new PassThrough(),
    outgoing,
    readIndex: 0,
    exitCode: null,
    kill: () => {
      proc.exitCode = 0;
      proc.emit("exit", 0);
    },
  });
  return proc;
}

async function nextRequest(proc) {
  while (true) {
    let message;
    if (proc.readIndex < proc.outgoing.length) {
      message = proc.outgoing[proc.readIndex++];
    } else {
      [message] = await once(proc, "request");
      proc.readIndex += 1;
    }
    if (Object.hasOwn(message, "id")) return message;
  }
}

async function startClient({ logger } = {}) {
  const processes = [];
  const spawn = () => {
    const proc = createFakeProcess();
    processes.push(proc);
    return proc;
  };
  const client = new CodexAppServerClient({ spawn, logger });
  const starting = client.start();
  const initialize = await nextRequest(processes[0]);
  processes[0].stdout.write(`${JSON.stringify({
    id: initialize.id,
    result: { server: "fixture" },
  })}\n`);
  await starting;
  return { client, processes };
}

test("blocks public requests until initialization and sends initialized second", async () => {
  const proc = createFakeProcess();
  const client = new CodexAppServerClient({ spawn: () => proc });
  await assert.rejects(
    client.request("account/read", { refreshToken: false }),
    { code: "APP_SERVER_NOT_INITIALIZED" },
  );

  const starting = client.start();
  const initialize = await nextRequest(proc);
  assert.equal(initialize.method, "initialize");
  proc.stdout.write(`${JSON.stringify({ id: initialize.id, result: {} })}\n`);
  await starting;

  assert.equal(proc.outgoing[1].method, "initialized");
  assert.equal(proc.outgoing[1].id, undefined);
});

test("correlates out-of-order responses and delivers notifications", async () => {
  const { client, processes } = await startClient();
  const proc = processes[0];
  const notifications = [];
  client.onNotification((message) => notifications.push(message));

  const first = client.request("first", { value: 1 });
  const firstRequest = await nextRequest(proc);
  const second = client.request("second", { value: 2 });
  const secondRequest = await nextRequest(proc);
  proc.stdout.write(`${JSON.stringify({
    method: "account/updated",
    params: { accountType: "chatgpt" },
  })}\n`);
  proc.stdout.write(`${JSON.stringify({
    id: secondRequest.id,
    result: "two",
  })}\n`);
  proc.stdout.write(`${JSON.stringify({
    id: firstRequest.id,
    result: "one",
  })}\n`);

  assert.equal(await first, "one");
  assert.equal(await second, "two");
  assert.equal(notifications[0].method, "account/updated");
});

test("logs malformed JSON without including raw child output", async () => {
  const errors = [];
  const logger = {
    info() {},
    error(event, fields) {
      errors.push({ event, fields });
    },
  };
  const { processes } = await startClient({ logger });

  processes[0].stdout.write("{raw-secret:broken}\n");
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(errors, [{
    event: "app-server-protocol-error",
    fields: { code: "MALFORMED_JSON" },
  }]);
  assert.doesNotMatch(JSON.stringify(errors), /raw-secret/);
});

test("child exit rejects pending requests with a typed error", async () => {
  const { client, processes } = await startClient();
  const pending = client.request("slow/request", {});
  await nextRequest(processes[0]);

  processes[0].emit("exit", 9);

  await assert.rejects(pending, { code: "APP_SERVER_EXITED" });
});

test("restart preserves listeners and initializes a replacement process", async () => {
  const { client, processes } = await startClient();
  const notifications = [];
  const connectionStates = [];
  client.onNotification((message) => notifications.push(message.method));
  client.onConnectionState((state) => connectionStates.push(state));

  const restarting = client.restart();
  await new Promise((resolve) => setImmediate(resolve));
  const initialize = await nextRequest(processes[1]);
  processes[1].stdout.write(`${JSON.stringify({
    id: initialize.id,
    result: {},
  })}\n`);
  await restarting;
  processes[1].stdout.write(`${JSON.stringify({
    method: "account/updated",
    params: {},
  })}\n`);
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(processes.length, 2);
  assert.deepEqual(notifications, ["account/updated"]);
  assert.deepEqual(connectionStates, ["stopped", "connected"]);
});

test("stop rejects pending work and ends the child", async () => {
  const { client, processes } = await startClient();
  const connectionStates = [];
  client.onConnectionState((state) => connectionStates.push(state));
  const pending = client.request("slow/request", {});
  await nextRequest(processes[0]);

  await client.stop();

  await assert.rejects(pending, { code: "APP_SERVER_STOPPED" });
  assert.equal(processes[0].exitCode, 0);
  assert.deepEqual(connectionStates, ["stopped"]);
});

test("emits connected after initialization and disconnected after unexpected exit", async () => {
  const proc = createFakeProcess();
  const client = new CodexAppServerClient({ spawn: () => proc });
  const connectionStates = [];
  client.onConnectionState((state) => connectionStates.push(state));

  const starting = client.start();
  const initialize = await nextRequest(proc);
  proc.stdout.write(`${JSON.stringify({ id: initialize.id, result: {} })}\n`);
  await starting;
  proc.emit("exit", 9);

  assert.deepEqual(connectionStates, ["connected", "disconnected"]);
});

test("connection listener failures do not corrupt lifecycle or block other listeners", async () => {
  const proc = createFakeProcess();
  const errors = [];
  const client = new CodexAppServerClient({
    spawn: () => proc,
    logger: {
      info() {},
      error(event, fields) {
        errors.push({ event, fields });
      },
    },
  });
  const connectionStates = [];
  client.onConnectionState(() => {
    throw new Error("listener secret must not escape");
  });
  client.onConnectionState((state) => connectionStates.push(state));

  const starting = client.start();
  const initialize = await nextRequest(proc);
  proc.stdout.write(`${JSON.stringify({ id: initialize.id, result: {} })}\n`);
  await starting;
  proc.emit("exit", 9);

  assert.deepEqual(connectionStates, ["connected", "disconnected"]);
  assert.equal(client.initialized, false);
  assert.doesNotMatch(JSON.stringify(errors), /listener secret/);
});

test("explicit listener clearing removes connection listeners", async () => {
  const { client, processes } = await startClient();
  const connectionStates = [];
  client.onConnectionState((state) => connectionStates.push(state));

  await client.stop({ clearListeners: true });
  const starting = client.start();
  const initialize = await nextRequest(processes[1]);
  processes[1].stdout.write(`${JSON.stringify({ id: initialize.id, result: {} })}\n`);
  await starting;

  assert.deepEqual(connectionStates, ["stopped"]);
});
