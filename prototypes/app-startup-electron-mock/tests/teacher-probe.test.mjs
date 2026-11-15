import assert from "node:assert/strict";
import test from "node:test";

import { createTeacherFailure } from "../src/main/teacher-adapter.mjs";
import {
  formatTeacherProbeResult,
  runTeacherProbe,
} from "../scripts/teacher-adapter-probe.mjs";

const TEACHER_CWD = "C:\\safe-probe-directory";

function createHarness({ response = "Safe bounded answer", startError = null } = {}) {
  const calls = [];
  const client = {
    async start() {
      calls.push("client-start");
      if (startError) throw startError;
    },
    async stop() { calls.push("client-stop"); },
  };
  const adapter = {
    async respond(value) {
      calls.push(["respond", value]);
      if (response instanceof Error) throw response;
      return response;
    },
    async dispose() { calls.push("adapter-dispose"); },
  };
  const output = [];
  const removed = [];
  return {
    calls,
    client,
    output,
    removed,
    createAdapter(options) {
      calls.push(["create-adapter", options.teacherCwd]);
      return adapter;
    },
    writeLine(line) { output.push(line); },
    async removeDirectory(path, options) { removed.push([path, options]); },
  };
}

test("formats only the fixed Teacher probe result contract", () => {
  assert.equal(
    formatTeacherProbeResult({ ok: true }),
    "PASS teacher-roundtrip",
  );
  assert.equal(
    formatTeacherProbeResult({
      ok: false,
      operation: "turn-start",
      category: "runtime-failure",
    }),
    "FAIL operation=turn-start category=runtime-failure",
  );
  assert.equal(
    formatTeacherProbeResult({
      ok: false,
      operation: "RAW private path",
      category: "credential failure",
    }),
    "FAIL operation=turn-completion category=runtime-failure",
  );
});

test("runs one bounded response and cleans up every owned resource", async () => {
  const harness = createHarness();
  const result = await runTeacherProbe({
    client: harness.client,
    teacherCwd: TEACHER_CWD,
    createAdapter: harness.createAdapter,
    writeLine: harness.writeLine,
    removeDirectory: harness.removeDirectory,
  });

  assert.deepEqual(result, { ok: true });
  assert.deepEqual(harness.output, ["PASS teacher-roundtrip"]);
  assert.deepEqual(harness.removed, [[
    TEACHER_CWD,
    { recursive: true, force: true },
  ]]);
  assert.equal(harness.calls[0], "client-start");
  assert.deepEqual(harness.calls[1], ["create-adapter", TEACHER_CWD]);
  assert.equal(harness.calls[2][0], "respond");
  assert.equal(harness.calls[2][1].learnerMessage, "Confirm the bounded Teacher connection.");
  assert.equal(harness.calls[2][1].envelope.privacy.scope, "bound-thread-only");
  assert.deepEqual(harness.calls.slice(-2), ["adapter-dispose", "client-stop"]);
});

test("reports only safe adapter failure fields and still cleans up", async () => {
  const harness = createHarness({
    response: createTeacherFailure("turn-start", "runtime-failure"),
  });
  const result = await runTeacherProbe({
    client: harness.client,
    teacherCwd: TEACHER_CWD,
    createAdapter: harness.createAdapter,
    writeLine: harness.writeLine,
    removeDirectory: harness.removeDirectory,
  });

  assert.deepEqual(result, {
    ok: false,
    operation: "turn-start",
    category: "runtime-failure",
  });
  assert.deepEqual(harness.output, [
    "FAIL operation=turn-start category=runtime-failure",
  ]);
  assert.doesNotMatch(JSON.stringify({ result, output: harness.output }), /RAW|credential|path/i);
  assert.deepEqual(harness.calls.slice(-2), ["adapter-dispose", "client-stop"]);
  assert.equal(harness.removed.length, 1);
});

test("sanitizes client startup failure as thread-start and cleans the directory", async () => {
  const harness = createHarness({
    startError: new Error("RAW executable path and private environment"),
  });
  const result = await runTeacherProbe({
    client: harness.client,
    teacherCwd: TEACHER_CWD,
    createAdapter: harness.createAdapter,
    writeLine: harness.writeLine,
    removeDirectory: harness.removeDirectory,
  });

  assert.deepEqual(result, {
    ok: false,
    operation: "thread-start",
    category: "runtime-failure",
  });
  assert.deepEqual(harness.output, [
    "FAIL operation=thread-start category=runtime-failure",
  ]);
  assert.doesNotMatch(JSON.stringify({ result, output: harness.output }), /RAW|private|environment/i);
  assert.deepEqual(harness.calls, ["client-start", "client-stop"]);
  assert.equal(harness.removed.length, 1);
});
