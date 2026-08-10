import assert from "node:assert/strict";
import test from "node:test";

import {
  parseActivitySnapshot,
  parseExecutorBinding,
  parsePracticeMissionFixture,
  parsePracticeStartRequest,
  parseTeacherChatMessage,
  parseTeacherContextEnvelope,
} from "../src/shared/practice-contracts.mjs";
import { loadPracticeStartRequest } from "../src/main/mission-repository.mjs";

const mission = {
  schemaVersion: 1,
  courseRunId: "fixture-course-run",
  lessonId: "module-0",
  missionId: "module-0-read-only-inspection-awareness-fixture",
  checkpointId: "executor-awareness",
  fixtureMetadata: {
    contentKind: "mock-adaptation",
    source: "existing Module 0 ContentPilot Lite inspection exercise",
    sourceOwner: "Triết",
    mechanismOwner: "Duy",
    productionApproved: false,
  },
  content: {
    version: "mock-1",
    locale: "vi-VN",
    title: "Inspect ContentPilot Lite ở chế độ chỉ đọc",
    description: "Fixture dùng để kiểm tra cơ chế Practice Mode.",
    learningOutcomes: [
      "Viết yêu cầu inspect repo ở chế độ chỉ đọc trước khi sửa file",
    ],
    instructions: [
      "Tự viết prompt cho Executor trong Codex",
      "Yêu cầu report giúp quyết định bước tiếp theo",
      "Đọc report trước khi hỏi Teacher",
    ],
    allowedActions: ["read files", "list files", "summarize"],
    prohibitedActions: ["edit files", "install packages", "use network"],
    expectedEvidence: ["structured inspection report"],
  },
  workspace: {
    exercisePath: "prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite",
  },
};

const binding = {
  schemaVersion: 1,
  sessionId: "session-1",
  threadId: "thr-bound",
  displayName: "Practice · Module 0 · Read-only inspection",
  workspaceRoot: "C:\\course",
  sourceKind: "created-by-practice",
  boundAt: "2026-08-03T00:00:00.000Z",
  verifiedAt: "2026-08-03T00:00:01.000Z",
};

const activity = {
  schemaVersion: 1,
  threadId: "thr-bound",
  status: "response-ready",
  cursor: "turn-1:item-1",
  learnerPromptSummary: "Inspect the repository without changes.",
  executorResponseSummary: "The report is ready.",
  activityKinds: ["prompt", "read", "response"],
  changedFiles: [],
  observedAt: "2026-08-03T00:00:02.000Z",
};

const envelope = {
  schemaVersion: 1,
  course: {
    courseRunId: "fixture-course-run",
    lessonId: "module-0",
    missionId: "module-0-read-only-inspection-awareness-fixture",
    checkpointId: "executor-awareness",
    contentVersion: "mock-1",
  },
  mission: {
    title: "Inspect ContentPilot Lite safely",
    description: "Inspect the fixture before proposing changes.",
    learningOutcomes: ["Write a bounded inspection prompt"],
    instructions: ["Open the dedicated task", "Write your own prompt"],
    allowedActions: ["Read files", "Summarize findings"],
    prohibitedActions: ["Edit files", "Use the network"],
    expectedEvidence: ["A structured inspection report"],
    contentKind: "mock-adaptation",
    contentVersion: "mock-1",
  },
  executor: { threadId: "thr-bound", status: "response-ready", activity },
  freshness: { observedAt: "2026-08-03T00:00:02.000Z", state: "fresh" },
  privacy: { scope: "bound-thread-only", redactionsApplied: true },
  provenance: { sources: ["practice-start-request", "bound-executor-task"] },
};

test("accepts only the pinned non-production Module 0 adaptation", () => {
  assert.deepEqual(parsePracticeMissionFixture(mission), mission);
  assert.throws(
    () => parsePracticeMissionFixture({
      ...mission,
      fixtureMetadata: { ...mission.fixtureMetadata, productionApproved: true },
    }),
    /productionApproved must equal false/,
  );
});

test("loads a request with an absolute in-repository exercise path", async () => {
  const reads = [];
  const result = await loadPracticeStartRequest({
    fixturePath: "C:\\course\\content\\practice.json",
    repositoryRoot: "C:\\course",
    fs: {
      readFile: async (file, encoding) => {
        reads.push([file, encoding]);
        return JSON.stringify(mission);
      },
      stat: async (file) => ({ isDirectory: () => file.endsWith("contentpilot-lite") }),
    },
  });
  assert.equal(result.workspace.expectedRepositoryRoot, "C:\\course");
  assert.equal(result.workspace.exercisePath, mission.workspace.exercisePath);
  assert.deepEqual(reads, [["C:\\course\\content\\practice.json", "utf8"]]);
});

test("rejects path escape and missing exercise directories", async () => {
  const escaped = structuredClone(mission);
  escaped.workspace.exercisePath = "../outside";
  await assert.rejects(
    loadPracticeStartRequest({
      fixturePath: "C:\\course\\content\\practice.json",
      repositoryRoot: "C:\\course",
      fs: { readFile: async () => JSON.stringify(escaped), stat: async () => ({ isDirectory: () => true }) },
    }),
    /inside the repository/,
  );
  await assert.rejects(
    loadPracticeStartRequest({
      fixturePath: "C:\\course\\content\\practice.json",
      repositoryRoot: "C:\\course",
      fs: { readFile: async () => JSON.stringify(mission), stat: async () => ({ isDirectory: () => false }) },
    }),
    /directory is unavailable/,
  );
});

test("parsePracticeStartRequest accepts the derived request and rejects unknown nested fields", () => {
  const request = {
    schemaVersion: 1, courseRunId: mission.courseRunId, lessonId: mission.lessonId,
    missionId: mission.missionId, checkpointId: mission.checkpointId,
    content: { ...mission.content, kind: "mock-adaptation", owner: "Triết" },
    workspace: { expectedRepositoryRoot: "C:\\course", exercisePath: mission.workspace.exercisePath },
  };
  assert.deepEqual(parsePracticeStartRequest(request), request);
  assert.throws(() => parsePracticeStartRequest({ ...request, content: { ...request.content, extra: true } }), /Unknown Practice start content field/);
});

test("parseExecutorBinding accepts the verified binding and rejects a relative workspaceRoot", () => {
  assert.deepEqual(parseExecutorBinding(binding), binding);
  assert.throws(() => parseExecutorBinding({ ...binding, workspaceRoot: "relative" }), /workspaceRoot must be absolute/);
});

test("parseExecutorBinding rejects credential-shaped and unknown fields", () => {
  assert.throws(() => parseExecutorBinding({ ...binding, apiKey: "secret" }), /Unknown Executor binding field|Forbidden field/);
  assert.throws(() => parseExecutorBinding({ ...binding, extra: true }), /Unknown Executor binding field/);
});

test("parseActivitySnapshot accepts a bounded bound-task snapshot", () => {
  assert.deepEqual(parseActivitySnapshot(activity), activity);
});

test("parseActivitySnapshot rejects a 2,001-code-point summary and 51 changed files", () => {
  assert.throws(() => parseActivitySnapshot({ ...activity, learnerPromptSummary: "a".repeat(2_001) }), /learnerPromptSummary exceeds 2000/);
  assert.throws(() => parseActivitySnapshot({ ...activity, changedFiles: Array.from({ length: 51 }, (_, index) => `file-${index}.txt`) }), /changedFiles cannot exceed 50/);
});

test("parseActivitySnapshot accepts only normalized repository-relative changed files", () => {
  assert.deepEqual(
    parseActivitySnapshot({ ...activity, changedFiles: ["src/main/mission-repository.mjs"] }).changedFiles,
    ["src/main/mission-repository.mjs"],
  );
  for (const invalidPath of [
    "/absolute/file.mjs", "C:\\course\\file.mjs", "\\\\server\\share\\file.mjs",
    "../outside.mjs", "src/../file.mjs", "src/./file.mjs", "src//file.mjs",
    "src\\file.mjs", ".", "",
  ]) {
    assert.throws(
      () => parseActivitySnapshot({ ...activity, changedFiles: [invalidPath] }),
      /normalized repository-relative path/,
      invalidPath,
    );
  }
});

test("timestamp parsers reject locale-style and noncanonical ISO values", () => {
  assert.throws(
    () => parseExecutorBinding({ ...binding, boundAt: "August 3, 2026 00:00:00 UTC" }),
    /boundAt must be an ISO timestamp/,
  );
  assert.throws(
    () => parseTeacherChatMessage({ id: "message-1", role: "learner", text: "Hello", createdAt: "2026-08-03T00:00:03Z" }),
    /message.createdAt must be an ISO timestamp/,
  );
});

test("parseTeacherContextEnvelope accepts bound-thread-only provenance", () => {
  assert.deepEqual(parseTeacherContextEnvelope(envelope), envelope);
});

test("parseTeacherContextEnvelope rejects another privacy scope or mismatched activity threadId", () => {
  assert.throws(() => parseTeacherContextEnvelope({ ...envelope, privacy: { ...envelope.privacy, scope: "course" } }), /bound-thread-only/);
  assert.throws(() => parseTeacherContextEnvelope({ ...envelope, executor: { ...envelope.executor, activity: { ...activity, threadId: "thr-other" } } }), /must match executor.threadId/);
});

test("parseTeacherChatMessage accepts learner and teacher roles", () => {
  const learner = { id: "message-1", role: "learner", text: "What should I inspect?", createdAt: "2026-08-03T00:00:03.000Z" };
  assert.deepEqual(parseTeacherChatMessage(learner), learner);
  assert.deepEqual(parseTeacherChatMessage({ ...learner, id: "message-2", role: "teacher" }), { ...learner, id: "message-2", role: "teacher" });
});

test("parseTeacherChatMessage rejects another role and 4,001 code points", () => {
  const message = { id: "message-1", role: "learner", text: "Hello", createdAt: "2026-08-03T00:00:03.000Z" };
  assert.throws(() => parseTeacherChatMessage({ ...message, role: "system" }), /Invalid Teacher chat role/);
  assert.throws(() => parseTeacherChatMessage({ ...message, text: "a".repeat(4_001) }), /message.text must be a non-empty bounded string/);
});

test("every parser rejects schemaVersion 2 where schemaVersion is part of its contract", () => {
  assert.throws(() => parsePracticeMissionFixture({ ...mission, schemaVersion: 2 }), /schemaVersion must equal 1/);
  assert.throws(() => parsePracticeStartRequest({ schemaVersion: 2 }), /schemaVersion must equal 1/);
  assert.throws(() => parseExecutorBinding({ ...binding, schemaVersion: 2 }), /schemaVersion must equal 1/);
  assert.throws(() => parseActivitySnapshot({ ...activity, schemaVersion: 2 }), /schemaVersion must equal 1/);
  assert.throws(() => parseTeacherContextEnvelope({ ...envelope, schemaVersion: 2 }), /schemaVersion must equal 1/);
});

test("all parsers reject unknown fields at every contract object boundary", () => {
  assert.throws(() => parsePracticeMissionFixture({ ...mission, extra: true }), /Unknown Practice mission fixture field/);
  assert.throws(() => parsePracticeMissionFixture({ ...mission, workspace: { ...mission.workspace, extra: true } }), /Unknown workspace field/);
  assert.throws(() => parseActivitySnapshot({ ...activity, extra: true }), /Unknown Activity snapshot field/);
  assert.throws(() => parseTeacherContextEnvelope({ ...envelope, course: { ...envelope.course, extra: true } }), /Unknown course field/);
  assert.throws(() => parseTeacherContextEnvelope({ ...envelope, privacy: { ...envelope.privacy, extra: true } }), /Unknown privacy field/);
});

test("parseTeacherContextEnvelope preserves a complete bounded mission snapshot", () => {
  const parsed = parseTeacherContextEnvelope(envelope);
  assert.deepEqual(parsed.mission, envelope.mission);

  for (const invalid of [
    { ...envelope, mission: { ...envelope.mission, extra: true } },
    { ...envelope, mission: { ...envelope.mission, title: "" } },
    { ...envelope, mission: { ...envelope.mission, allowedActions: [] } },
    (() => { const { mission, ...withoutMission } = envelope; return withoutMission; })(),
  ]) {
    assert.throws(() => parseTeacherContextEnvelope(invalid), /Teacher mission|Teacher envelope/);
  }
});