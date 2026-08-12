import assert from "node:assert/strict";
import test from "node:test";

import {
  formatVisibleTransferProbeResult,
  runVisibleTransferProbe,
  verifyVisibleTransferSchemas,
} from "../scripts/visible-transfer-probe.mjs";

const ROOT = "C:\\course";

function schemaFixture() {
  return {
    start: {
      title: "ThreadStartParams",
      properties: { cwd: {}, ephemeral: {}, sandbox: {} },
    },
    read: {
      title: "ThreadReadParams",
      required: ["threadId"],
      properties: { includeTurns: { type: "boolean" } },
    },
    inject: {
      title: "ThreadInjectItemsParams",
      required: ["items", "threadId"],
      properties: {
        items: { type: "array", description: "Items appended to model-visible history." },
      },
    },
  };
}

function harness({ persistTarget = true } = {}) {
  const calls = [];
  const threads = new Map();
  let next = 0;
  const client = {
    async request(method, params) {
      calls.push([method, structuredClone(params)]);
      if (method === "thread/start") {
        const thread = { id: `thread-${++next}`, cwd: ROOT, ephemeral: false, turns: [] };
        threads.set(thread.id, thread);
        return { thread: structuredClone(thread) };
      }
      if (method === "thread/name/set") {
        threads.get(params.threadId).name = params.name;
        return {};
      }
      if (method === "thread/inject_items") {
        const thread = threads.get(params.threadId);
        if (persistTarget || params.threadId !== "thread-3") {
          thread.turns.push({ id: `turn-${thread.turns.length + 1}`, items: structuredClone(params.items) });
        }
        return {};
      }
      if (method === "thread/read") {
        return { thread: structuredClone(threads.get(params.threadId)) };
      }
      throw new Error("unexpected request");
    },
  };
  return { calls, client };
}

test("accepts only the installed visible-transfer schema shape", () => {
  assert.equal(verifyVisibleTransferSchemas(schemaFixture()), true);
  const invalid = schemaFixture();
  invalid.inject.properties.items.description = "Opaque storage";
  assert.throws(
    () => verifyVisibleTransferSchemas(invalid),
    (error) => error?.stage === "schema",
  );
});

test("proves one exact source, excluded decoy, unchanged history, and visible target", async () => {
  const testHarness = harness();
  const output = [];
  const result = await runVisibleTransferProbe({
    client: testHarness.client,
    workspaceRoot: ROOT,
    verifySchema: async () => verifyVisibleTransferSchemas(schemaFixture()),
    clock: () => new Date("2026-08-08T01:02:03.000Z"),
    writeLine: (line) => output.push(line),
  });

  assert.equal(result.ok, true);
  assert.equal(result.targetThreadId, "thread-3");
  assert.equal(output[0], "PASS schema-visible-transfer");
  assert.equal(output[1], "PASS runtime-visible-transfer");
  assert.match(output[2], /^TARGET_THREAD_ID=thread-3$/);
  assert.match(output[4], /^HANDOFF_MARKER=\[CBA_HANDOFF_V1:[a-f0-9]{64}\]$/);
  assert.equal(testHarness.calls.filter(([method]) => method === "thread/start").length, 3);
  assert.equal(testHarness.calls.filter(([method]) => method === "thread/inject_items").length, 3);
  assert.equal(testHarness.calls.every(([, params]) => !JSON.stringify(params).includes("CBA_DECOY_")
    || params.threadId === "thread-2"), true);
});

test("fails closed when the installed runtime does not expose the target item", async () => {
  const testHarness = harness({ persistTarget: false });
  const output = [];
  const result = await runVisibleTransferProbe({
    client: testHarness.client,
    workspaceRoot: ROOT,
    clock: () => new Date("2026-08-08T01:02:03.000Z"),
    writeLine: (line) => output.push(line),
  });

  assert.deepEqual(result, { ok: false, stage: "visibility" });
  assert.deepEqual(output, ["FAIL visible-transfer stage=visibility"]);
});

test("formats no raw values for a failed result", () => {
  assert.deepEqual(
    formatVisibleTransferProbeResult({ ok: false, stage: "private path" }),
    ["FAIL visible-transfer stage=runtime"],
  );
});
