import { execFile, spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import { CodexAppServerClient } from "../src/main/codex-app-server-client.mjs";
import {
  buildSelectiveHandoff,
  threadContainsHandoffMarker,
} from "../src/main/selective-handoff.mjs";

const execFileAsync = promisify(execFile);
const THREAD_ID = /^[A-Za-z0-9_-]+$/;
const FAILURE_STAGES = new Set([
  "schema",
  "runtime",
  "visibility",
  "source-mutated",
  "decoy-leak",
]);

function fail(stage) {
  throw Object.assign(new Error("Visible transfer probe failed."), {
    code: "VISIBLE_TRANSFER_PROBE_FAILED",
    stage,
  });
}

function exactRequired(schema, required) {
  return Array.isArray(schema?.required)
    && required.every((field) => schema.required.includes(field));
}

export function verifyVisibleTransferSchemas({ start, read, inject }) {
  const startProperties = start?.properties ?? {};
  const readProperties = read?.properties ?? {};
  const injectProperties = inject?.properties ?? {};
  if (start?.title !== "ThreadStartParams"
    || !Object.hasOwn(startProperties, "cwd")
    || !Object.hasOwn(startProperties, "ephemeral")
    || !Object.hasOwn(startProperties, "sandbox")
    || read?.title !== "ThreadReadParams"
    || !exactRequired(read, ["threadId"])
    || readProperties.includeTurns?.type !== "boolean"
    || inject?.title !== "ThreadInjectItemsParams"
    || !exactRequired(inject, ["threadId", "items"])
    || injectProperties.items?.type !== "array"
    || !String(injectProperties.items?.description ?? "").includes("model-visible history")) {
    fail("schema");
  }
  return true;
}

export async function verifyGeneratedVisibleTransferSchemas(schemaRoot) {
  const load = async (name) => JSON.parse(await readFile(
    path.join(schemaRoot, "v2", `${name}.json`),
    "utf8",
  ));
  try {
    return verifyVisibleTransferSchemas({
      start: await load("ThreadStartParams"),
      read: await load("ThreadReadParams"),
      inject: await load("ThreadInjectItemsParams"),
    });
  } catch (error) {
    if (error?.code === "VISIBLE_TRANSFER_PROBE_FAILED") throw error;
    fail("schema");
  }
}

function validThread(value) {
  if (!value || typeof value !== "object" || !THREAD_ID.test(value.id ?? "")) {
    fail("runtime");
  }
  return value;
}

function probeName(role, stamp) {
  return `CBA transfer probe · ${role} · ${stamp}`;
}

async function startNamedThread(client, workspaceRoot, role, stamp) {
  const result = await client.request("thread/start", {
    cwd: workspaceRoot,
    ephemeral: false,
    sandbox: "read-only",
    approvalPolicy: "on-request",
    serviceName: "content_builder_academy_transfer_probe",
  });
  const thread = validThread(result?.thread);
  const name = probeName(role, stamp);
  await client.request("thread/name/set", { threadId: thread.id, name });
  return { id: thread.id, name };
}

async function readWithTurns(client, threadId) {
  const result = await client.request("thread/read", {
    threadId,
    includeTurns: true,
  });
  const thread = validThread(result?.thread);
  if (thread.id !== threadId || !Array.isArray(thread.turns)) fail("runtime");
  return thread;
}

function assistantItem(text) {
  return {
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text }],
  };
}

function safeFailureStage(error) {
  return FAILURE_STAGES.has(error?.stage) ? error.stage : "runtime";
}

export function formatVisibleTransferProbeResult(result) {
  if (result?.ok === true
    && THREAD_ID.test(result.targetThreadId ?? "")
    && typeof result.targetName === "string"
    && /^\[CBA_HANDOFF_V1:[a-f0-9]{64}\]$/.test(result.marker ?? "")) {
    return [
      "PASS schema-visible-transfer",
      "PASS runtime-visible-transfer",
      `TARGET_THREAD_ID=${result.targetThreadId}`,
      `TARGET_NAME=${result.targetName}`,
      `HANDOFF_MARKER=${result.marker}`,
    ];
  }
  return [`FAIL visible-transfer stage=${safeFailureStage(result)}`];
}

export async function runVisibleTransferProbe({
  client,
  workspaceRoot,
  verifySchema = async () => true,
  clock = () => new Date(),
  writeLine = (line) => process.stdout.write(`${line}\n`),
}) {
  let result;
  try {
    await verifySchema();
    const stamp = clock().toISOString().replaceAll(/[:.]/g, "-");
    const source = await startNamedThread(client, workspaceRoot, "source", stamp);
    const decoy = await startNamedThread(client, workspaceRoot, "decoy", stamp);
    const target = await startNamedThread(client, workspaceRoot, "target", stamp);
    const sourceSeed = `CBA_SOURCE_${stamp}: giữ một Practice đang hoạt động và tiếp tục từ bằng chứng đã xác minh.`;
    const decoySeed = `CBA_DECOY_${stamp}: nội dung này không được chuyển sang Practice mới.`;

    await client.request("thread/inject_items", {
      threadId: source.id,
      items: [assistantItem(sourceSeed)],
    });
    await client.request("thread/inject_items", {
      threadId: decoy.id,
      items: [assistantItem(decoySeed)],
    });
    const sourceBefore = await readWithTurns(client, source.id);
    const handoff = buildSelectiveHandoff({
      sourceThreadId: source.id,
      sourceDisplayName: source.name,
      selection: {
        goals: ["Tiếp tục bài thực hành từ bối cảnh đã được xác minh."],
        decisions: ["Chỉ giữ một Practice đang hoạt động tại một thời điểm."],
        constraints: ["Không mang nội dung từ chat không liên quan sang Practice mới."],
        blockers: [],
        outcomes: ["Luồng chuyển bối cảnh có chọn lọc đã sẵn sàng để kiểm tra."],
      },
      createdAt: clock().toISOString(),
    });
    await client.request("thread/inject_items", {
      threadId: target.id,
      items: [structuredClone(handoff.item)],
    });

    const [targetAfter, sourceAfter, decoyAfter] = await Promise.all([
      readWithTurns(client, target.id),
      readWithTurns(client, source.id),
      readWithTurns(client, decoy.id),
    ]);
    if (!threadContainsHandoffMarker(targetAfter, handoff.marker)) fail("visibility");
    if (JSON.stringify(sourceBefore.turns) !== JSON.stringify(sourceAfter.turns)) {
      fail("source-mutated");
    }
    if (handoff.text.includes(decoySeed)
      || threadContainsHandoffMarker(decoyAfter, handoff.marker)) {
      fail("decoy-leak");
    }
    result = Object.freeze({
      ok: true,
      targetThreadId: target.id,
      targetName: target.name,
      marker: handoff.marker,
    });
  } catch (error) {
    result = Object.freeze({ ok: false, stage: safeFailureStage(error) });
  }

  for (const line of formatVisibleTransferProbeResult(result)) {
    try {
      writeLine(line);
    } catch {
      // Output ownership cannot change the bounded probe result.
    }
  }
  return result;
}

async function main() {
  const schemaRoot = await mkdtemp(path.join(os.tmpdir(), "cba-visible-transfer-schema-"));
  const client = new CodexAppServerClient({ spawn });
  const workspaceRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
  );
  let started = false;
  try {
    await execFileAsync("codex", [
      "app-server",
      "generate-json-schema",
      "--experimental",
      "--out",
      schemaRoot,
    ], { windowsHide: true });
    await client.start();
    started = true;
    const result = await runVisibleTransferProbe({
      client,
      workspaceRoot,
      verifySchema: () => verifyGeneratedVisibleTransferSchemas(schemaRoot),
    });
    process.exitCode = result.ok ? 0 : 1;
  } catch {
    process.stdout.write("FAIL visible-transfer stage=runtime\n");
    process.exitCode = 1;
  } finally {
    if (started) await client.stop().catch(() => {});
    await rm(schemaRoot, { recursive: true, force: true }).catch(() => {});
  }
}

const isDirect = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirect) main();
