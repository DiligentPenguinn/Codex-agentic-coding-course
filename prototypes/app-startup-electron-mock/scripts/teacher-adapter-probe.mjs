import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { CodexAppServerClient } from "../src/main/codex-app-server-client.mjs";
import {
  createAppServerTeacherAdapter,
  createTeacherFailure,
  teacherFailureDetails,
} from "../src/main/teacher-adapter.mjs";

const OPERATIONS = new Set(["thread-start", "turn-start", "turn-completion"]);
const CATEGORIES = new Set([
  "timeout",
  "disconnected",
  "boundary-violation",
  "runtime-failure",
]);
const DISCONNECTED_CODES = new Set([
  "APP_SERVER_NOT_INITIALIZED",
  "APP_SERVER_EXITED",
  "APP_SERVER_STOPPED",
  "APP_SERVER_DISCONNECTED",
  "APP_SERVER_WRITE_FAILED",
]);

const observedAt = "2026-08-04T00:00:00.000Z";
const activity = Object.freeze({
  schemaVersion: 1,
  threadId: "teacher-probe-bound-task",
  status: "response-ready",
  cursor: "teacher-probe-turn:teacher-probe-item",
  learnerPromptSummary: "A bounded diagnostic task was observed.",
  executorResponseSummary: "The diagnostic observation is ready.",
  activityKinds: ["prompt", "response"],
  changedFiles: [],
  observedAt,
});
const envelope = Object.freeze({
  schemaVersion: 1,
  course: {
    courseRunId: "teacher-probe-course",
    lessonId: "teacher-probe-lesson",
    missionId: "teacher-probe-mission",
    checkpointId: "teacher-probe-checkpoint",
    contentVersion: "teacher-probe-1",
  },
  executor: {
    threadId: activity.threadId,
    status: activity.status,
    activity,
  },
  freshness: { observedAt, state: "fresh" },
  privacy: { scope: "bound-thread-only", redactionsApplied: true },
  provenance: { sources: ["practice-start-request", "bound-executor-task"] },
});

function safeResult(value) {
  if (value?.ok === true) return Object.freeze({ ok: true });
  return Object.freeze({
    ok: false,
    operation: OPERATIONS.has(value?.operation)
      ? value.operation
      : "turn-completion",
    category: CATEGORIES.has(value?.category)
      ? value.category
      : "runtime-failure",
  });
}

export function formatTeacherProbeResult(value) {
  const result = safeResult(value);
  return result.ok
    ? "PASS teacher-roundtrip"
    : `FAIL operation=${result.operation} category=${result.category}`;
}

function startupFailure(error) {
  return createTeacherFailure(
    "thread-start",
    DISCONNECTED_CODES.has(error?.code) ? "disconnected" : "runtime-failure",
  );
}

export async function runTeacherProbe({
  client,
  teacherCwd,
  createAdapter = createAppServerTeacherAdapter,
  writeLine = (line) => process.stdout.write(`${line}\n`),
  removeDirectory = rm,
}) {
  let adapter = null;
  let clientStarted = false;
  let result;
  try {
    await client.start();
    clientStarted = true;
    adapter = createAdapter({ client, teacherCwd });
    const answer = await adapter.respond({
      envelope,
      chat: [],
      learnerMessage: "Confirm the bounded Teacher connection.",
    });
    if (typeof answer !== "string" || answer.trim() === "") {
      throw createTeacherFailure("turn-completion", "runtime-failure");
    }
    result = safeResult({ ok: true });
  } catch (error) {
    const failure = clientStarted
      ? teacherFailureDetails(error)
      : teacherFailureDetails(startupFailure(error));
    result = safeResult({ ok: false, ...failure });
  } finally {
    try {
      await adapter?.dispose();
    } catch {
      // Probe cleanup never changes or expands the safe diagnostic result.
    }
    try {
      await client.stop();
    } catch {
      // Probe cleanup never changes or expands the safe diagnostic result.
    }
    try {
      await removeDirectory(teacherCwd, { recursive: true, force: true });
    } catch {
      // The bounded result must not reveal cleanup paths or filesystem errors.
    }
  }

  try {
    writeLine(formatTeacherProbeResult(result));
  } catch {
    // Output ownership is external and cannot alter the probe result.
  }
  return result;
}

async function main() {
  const teacherCwd = await mkdtemp(path.join(os.tmpdir(), "course-teacher-probe-"));
  const client = new CodexAppServerClient({ spawn });
  const result = await runTeacherProbe({ client, teacherCwd });
  process.exitCode = result.ok ? 0 : 1;
}

const isDirect = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirect) {
  main().catch(() => {
    process.stdout.write(
      "FAIL operation=thread-start category=runtime-failure\n",
    );
    process.exitCode = 1;
  });
}
