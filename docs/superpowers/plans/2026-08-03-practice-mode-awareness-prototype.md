# Practice Mode Awareness Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Windows-first Electron startup mock into a Practice Mode vertical slice whose Teacher accurately reports activity from one explicitly bound Codex Executor task and excludes every unbound task.

**Architecture:** Keep one Electron application with a trusted main process and three sandboxed presentations: the full Course/Practice window, a floating Teacher bubble, and a Teacher quick-chat popover. Main-process services own the versioned mission, explicit App Server task binding, bound-task-only activity snapshots, Teacher context and inference, atomic local persistence, and window coordination; renderers receive only typed, display-safe ViewModels through narrow preloads.

**Tech Stack:** Node.js 22+ ESM, Electron 43.2.0, Codex App Server JSONL protocol, Node's built-in test runner, Playwright 1.62.0, HTML, CSS, and browser JavaScript. Add no runtime or development dependency.

**Approved design:** [`../specs/2026-08-03-practice-mode-awareness-prototype-design.md`](../specs/2026-08-03-practice-mode-awareness-prototype-design.md)

**Current protocol references:** [Codex App Server](https://learn.chatgpt.com/docs/app-server) and [ChatGPT desktop deep links](https://learn.chatgpt.com/docs/reference/commands#deep-links). The request shapes below were also checked against `codex app-server generate-json-schema` from the installed Codex version during planning; generated schemas are diagnostic artifacts and are not committed.

## Global Constraints

- Extend `prototypes/app-startup-electron-mock`; do not create a second Electron package or modify the older Course Companion prototype.
- Target Windows first and preserve Node.js `>=22`, Electron `43.2.0`, and Playwright `1.62.0`.
- Preserve the completed startup, authentication, onboarding, launcher, and restart behavior; the current baseline is 58 passing unit tests.
- Treat the committed Practice Mode design as authoritative over stale module mechanics.
- Keep the Module 0 exercise visibly labeled `mock-adaptation`, `productionApproved: false`, source-owned by Triết, and mechanism-owned by Duy.
- Use one explicit `threadId` binding. Never infer, replace, or broaden that binding from recency, title, workspace activity, or another task's events.
- Create the primary Executor task with `thread/start`, name it with `thread/name/set`, verify it with `thread/read`, and persist only after every step succeeds.
- Create an empty Executor task. Practice Mode must not prefill, inject, or submit the learner's first prompt.
- Open the bound task with the documented `codex://threads/<thread-id>` deep link, constructed only from a verified ID and opened only in the main process.
- Use a recent eligible-task picker only as an explicit secondary path; require exact workspace equality.
- Observe `thread/status/changed`, `turn/started`, `turn/completed`, `item/started`, `item/completed`, `thread/closed`, and `thread/archived`; ignore notifications whose `threadId` is not the bound Executor ID.
- Treat `item/completed` as authoritative for final item content. Never persist reasoning items, command output, file diffs, raw protocol payloads, or unrestricted transcripts.
- Bound every stored prompt or response summary to 2,000 Unicode code points, changed-file lists to 50 normalized relative paths, Teacher messages to 4,000 code points each, and active Teacher chat to the newest 40 messages.
- Mark Executor context stale after 15 seconds without a verified event or successful `thread/read`; poll every 3 seconds as the compatibility/recovery path.
- Awareness does not imply mastery, evidence grading, or mission completion. Do not add a `Completed` Practice lifecycle state.
- Use a real Teacher adapter backed by a separate ephemeral App Server thread and a deterministic fake adapter for tests. The Teacher task uses an isolated empty directory, read-only sandbox, no approvals, and rejects any attempted command, file, MCP, web, image, or collaboration tool item.
- The Teacher receives only the versioned context envelope, bounded active Teacher chat, and current learner message. It never receives Executor control methods, credentials, raw environment data, or unrelated task content.
- Preserve `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, denied renderer-created windows, and validated main-process external URLs for every BrowserWindow.
- Keep the native minimize button's normal behavior. Compact mode is a dedicated **Compact to Teacher** action.
- Show only one prominent Course surface: full window, or bubble with optional quick-chat popover.
- Use text/symbol plus color for state, visible keyboard focus, semantic tabs, 44px minimum actionable controls, and reduced-motion behavior.
- Persist Practice state only under Electron `userData`, with schema validation, atomic replacement, corrupt-state quarantine, and startup revalidation.
- Never read `~/.codex/auth.json`; never expose or persist access tokens, refresh tokens, API keys, auth URLs, raw App Server messages, raw environment variables, unrelated task content, or hidden reasoning.
- Use test-driven development: run each focused test and observe the expected failure before writing its implementation.
- Keep each commit limited to the task's listed files and preserve unrelated user changes.

## File and Responsibility Map

### Versioned mission and shared contracts

- `content/practice.module-0.fixture.json` — Triết-sourced, Duy-mechanism mock adaptation only.
- `src/shared/practice-contracts.mjs` — strict parsers and safe constructors for mission, binding, activity snapshot, Teacher envelope, and chat messages.
- `src/main/mission-repository.mjs` — load the packaged fixture, resolve the repository root, and reject path escape or missing exercise directories.

### Persistence and state

- `src/main/atomic-json-store.mjs` — reusable atomic JSON read/write/quarantine primitive.
- `src/main/setup-store.mjs` — existing setup store delegated to the shared primitive without changing its public API.
- `src/shared/practice-state-schema.mjs` — persisted Practice state schema and safe defaults.
- `src/main/practice-store.mjs` — `practice-state.json` adapter over the shared primitive.
- `src/shared/practice-session-reducer.mjs` — pure lifecycle and presentation transitions; no I/O.

### Executor and Teacher services

- `src/main/executor-conversation-service.mjs` — create, name, deep-link, list, verify, and bind task identities.
- `src/main/executor-activity-reader.mjs` — strict bound-ID event reduction, bounded snapshots, polling, and freshness.
- `src/main/teacher-context-broker.mjs` — bounded context envelope, context receipt, and Teacher prompt construction.
- `src/main/teacher-adapter.mjs` — deterministic fake plus guarded ephemeral App Server Teacher inference.
- `src/main/practice-orchestrator.mjs` — compose mission, binding, activity, Teacher chat, persistence, restart, pause, retry, and safe ViewModels.

### Electron boundaries and presentations

- `src/shared/channels.mjs` — add the exact Practice IPC/event channel contract.
- `src/main/practice-ipc-handlers.mjs` — validate renderer input and route only named Practice operations.
- `src/main/window-coordinator.mjs` — main/bubble/popover lifecycle, display clamping, and focus restoration.
- `src/main/window-policy.mjs` — add secure options for main, bubble, and quick-chat windows.
- `src/main/main.mjs` — composition root only.
- `src/preload/preload.cjs` — retain `courseSetup` and add the full-window `practice` bridge.
- `src/preload/bubble-preload.cjs` — bubble status/open/expand bridge only.
- `src/preload/quick-chat-preload.cjs` — quick-chat status/message/expand bridge only.
- `src/renderer/practice-state.mjs` — pure full-window Practice ViewModel reducer.
- `src/renderer/index.html` — add mock Course entry and full Practice tabs.
- `src/renderer/app.js` — preserve startup orchestration and add full Practice rendering/actions.
- `src/renderer/styles.css` — approved full Practice visual system and accessible states.
- `src/renderer/bubble.html`, `bubble.js`, `bubble.css` — floating Teacher chat head.
- `src/renderer/quick-chat.html`, `quick-chat.js`, `compact.css` — compact Teacher conversation.

### Tests and documentation

- `tests/practice-contracts.test.mjs`
- `tests/practice-store.test.mjs`
- `tests/practice-session-reducer.test.mjs`
- `tests/executor-conversation-service.test.mjs`
- `tests/executor-activity-reader.test.mjs`
- `tests/teacher-context-broker.test.mjs`
- `tests/teacher-adapter.test.mjs`
- `tests/practice-orchestrator.test.mjs`
- `tests/practice-ipc-contract.test.mjs`
- `tests/window-coordinator.test.mjs`
- `tests/practice-renderer.test.mjs`
- `tests/compact-renderers.test.mjs`
- `tests/fixtures/fake-app-server.mjs` — extend the current fake with Executor, decoy, and ephemeral Teacher behavior.
- `tests/electron-smoke.test.mjs` — preserve startup coverage and add the integrated Practice flow.
- `package.json` — include every new unit test in `test:unit`; retain the current commands.
- `README.md` — replace deferred Practice claims with an accurate implemented/simulated boundary and manual real-Codex checklist.

---

### Task 1: Lock the Practice mission and safe cross-boundary contracts

**Files:**
- Create: `prototypes/app-startup-electron-mock/content/practice.module-0.fixture.json`
- Create: `prototypes/app-startup-electron-mock/src/shared/practice-contracts.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/mission-repository.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/practice-contracts.test.mjs`

**Interfaces:**
- Consumes: a repository root and the packaged fixture path.
- Produces: `parsePracticeMissionFixture(input): PracticeMissionFixture`.
- Produces: `parsePracticeStartRequest(input): PracticeStartRequest`.
- Produces: `parseExecutorBinding(input): ExecutorBinding`.
- Produces: `parseActivitySnapshot(input): ActivitySnapshot`.
- Produces: `parseTeacherContextEnvelope(input): TeacherContextEnvelope`.
- Produces: `parseTeacherChatMessage(input): TeacherChatMessage`.
- Produces: `loadPracticeStartRequest({ fixturePath, repositoryRoot, fs? }): Promise<PracticeStartRequest>`.

- [ ] **Step 1: Write the failing contract and mission-repository tests**

Create tests with these exact fixtures and assertions:

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  parseActivitySnapshot,
  parseExecutorBinding,
  parsePracticeMissionFixture,
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
  assert.equal(
    result.workspace.exercisePath,
    "prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite",
  );
  assert.deepEqual(reads, [["C:\\course\\content\\practice.json", "utf8"]]);
});

test("rejects path escape and missing exercise directories", async () => {
  const escaped = structuredClone(mission);
  escaped.workspace.exercisePath = "../outside";
  await assert.rejects(
    loadPracticeStartRequest({
      fixturePath: "C:\\course\\content\\practice.json",
      repositoryRoot: "C:\\course",
      fs: {
        readFile: async () => JSON.stringify(escaped),
        stat: async () => ({ isDirectory: () => true }),
      },
    }),
    /inside the repository/,
  );
});
```

Add these named parser cases using the verbatim valid shapes from the approved design:

```text
parseExecutorBinding accepts the verified binding and rejects a relative workspaceRoot
parseExecutorBinding rejects credential-shaped and unknown fields
parseActivitySnapshot accepts a bounded bound-task snapshot
parseActivitySnapshot rejects a 2,001-code-point summary and 51 changed files
parseTeacherContextEnvelope accepts bound-thread-only provenance
parseTeacherContextEnvelope rejects another privacy scope or mismatched activity threadId
parseTeacherChatMessage accepts learner and teacher roles
parseTeacherChatMessage rejects another role and 4,001 code points
every parser rejects schemaVersion 2 where schemaVersion is part of its contract
```

- [ ] **Step 2: Run the focused test and verify failure**

Run from `prototypes/app-startup-electron-mock`:

```powershell
node --test tests/practice-contracts.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/shared/practice-contracts.mjs`.

- [ ] **Step 3: Create the exact mock mission fixture**

Write `content/practice.module-0.fixture.json` as the JSON representation of the `mission` object in Step 1, with two-space indentation and a final newline. Do not add production lesson copy or evaluation criteria.

- [ ] **Step 4: Implement strict parsers and the repository loader**

Use one shared validation core and return deep clones:

```js
// src/shared/practice-contracts.mjs
import path from "node:path";

const FORBIDDEN_KEY = /^(access.?token|refresh.?token|api.?key|authorization|auth.?url|environment|env|reasoning)$/i;
const MAX_SUMMARY = 2_000;
const MAX_CHANGED_FILES = 50;
const MAX_TEACHER_MESSAGE = 4_000;

function plainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  return value;
}

function requiredString(value, label, maximum = 500) {
  if (typeof value !== "string" || value.trim() === "" || [...value].length > maximum) {
    throw new TypeError(`${label} must be a non-empty bounded string.`);
  }
  return value;
}

function stringArray(value, label, maximumItems = 20) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximumItems) {
    throw new TypeError(`${label} must be a non-empty bounded array.`);
  }
  value.forEach((item, index) => requiredString(item, `${label}[${index}]`, 500));
  return value;
}

function rejectForbiddenKeys(value, location = "value") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) throw new TypeError(`Forbidden field: ${location}.${key}`);
    rejectForbiddenKeys(item, `${location}.${key}`);
  }
}

export function parsePracticeMissionFixture(input) {
  const value = plainObject(input, "Practice mission fixture");
  rejectForbiddenKeys(value);
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId"]) {
    requiredString(value[key], key);
  }
  const metadata = plainObject(value.fixtureMetadata, "fixtureMetadata");
  if (metadata.contentKind !== "mock-adaptation") throw new TypeError("contentKind must equal mock-adaptation.");
  if (metadata.sourceOwner !== "Triết") throw new TypeError("sourceOwner must equal Triết.");
  if (metadata.mechanismOwner !== "Duy") throw new TypeError("mechanismOwner must equal Duy.");
  if (metadata.productionApproved !== false) throw new TypeError("productionApproved must equal false.");
  requiredString(metadata.source, "fixtureMetadata.source");
  const content = plainObject(value.content, "content");
  for (const key of ["version", "locale", "title", "description"]) requiredString(content[key], `content.${key}`, 1_000);
  for (const key of ["learningOutcomes", "instructions", "allowedActions", "prohibitedActions", "expectedEvidence"]) {
    stringArray(content[key], `content.${key}`);
  }
  const workspace = plainObject(value.workspace, "workspace");
  requiredString(workspace.exercisePath, "workspace.exercisePath", 1_000);
  if (path.isAbsolute(workspace.exercisePath)) throw new TypeError("exercisePath must be repository-relative.");
  return structuredClone(value);
}

export function parsePracticeStartRequest(input) {
  const value = plainObject(input, "Practice start request");
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId"]) requiredString(value[key], key);
  plainObject(value.content, "content");
  for (const key of ["version", "kind", "owner", "locale", "title", "description"]) {
    requiredString(value.content[key], `content.${key}`, 1_000);
  }
  if (value.content.kind !== "mock-adaptation" || value.content.owner !== "Triết") {
    throw new TypeError("Practice start content must remain a Triết-sourced mock adaptation.");
  }
  stringArray(value.content.learningOutcomes, "content.learningOutcomes");
  stringArray(value.content.instructions, "content.instructions");
  stringArray(value.content.allowedActions, "content.allowedActions");
  stringArray(value.content.prohibitedActions, "content.prohibitedActions");
  stringArray(value.content.expectedEvidence, "content.expectedEvidence");
  const workspace = plainObject(value.workspace, "workspace");
  if (!path.isAbsolute(workspace.expectedRepositoryRoot)) throw new TypeError("expectedRepositoryRoot must be absolute.");
  requiredString(workspace.exercisePath, "workspace.exercisePath", 1_000);
  if (path.isAbsolute(workspace.exercisePath)) throw new TypeError("exercisePath must remain repository-relative.");
  rejectForbiddenKeys(value);
  return structuredClone(value);
}
```

Complete the module with these parsers:

```js
function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${label} field: ${key}.`);
  }
}

function isoTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be an ISO timestamp.`);
  }
  return new Date(value).toISOString();
}

export function parseExecutorBinding(input) {
  const value = plainObject(input, "Executor binding");
  exactKeys(value, new Set([
    "schemaVersion", "sessionId", "threadId", "displayName", "workspaceRoot",
    "sourceKind", "boundAt", "verifiedAt",
  ]), "Executor binding");
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  for (const key of ["sessionId", "threadId", "displayName"]) requiredString(value[key], key);
  if (!path.isAbsolute(value.workspaceRoot)) throw new TypeError("workspaceRoot must be absolute.");
  if (!["created-by-practice", "selected-existing"].includes(value.sourceKind)) {
    throw new TypeError("Invalid binding sourceKind.");
  }
  rejectForbiddenKeys(value);
  return {
    ...structuredClone(value),
    boundAt: isoTimestamp(value.boundAt, "boundAt"),
    verifiedAt: isoTimestamp(value.verifiedAt, "verifiedAt"),
  };
}

export function parseActivitySnapshot(input) {
  const value = plainObject(input, "Activity snapshot");
  exactKeys(value, new Set([
    "schemaVersion", "threadId", "status", "cursor", "learnerPromptSummary",
    "executorResponseSummary", "activityKinds", "changedFiles", "observedAt",
  ]), "Activity snapshot");
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  requiredString(value.threadId, "threadId");
  requiredString(value.cursor, "cursor");
  if (!["not-bound", "ready", "working", "waiting-for-learner", "response-ready", "stale", "disconnected"].includes(value.status)) {
    throw new TypeError("Invalid activity status.");
  }
  for (const [key, text] of [
    ["learnerPromptSummary", value.learnerPromptSummary],
    ["executorResponseSummary", value.executorResponseSummary],
  ]) {
    if (typeof text !== "string" || [...text].length > MAX_SUMMARY) {
      throw new TypeError(`${key} exceeds ${MAX_SUMMARY} code points.`);
    }
  }
  if (!Array.isArray(value.activityKinds) || value.activityKinds.some((item) => typeof item !== "string")) {
    throw new TypeError("activityKinds must be strings.");
  }
  if (!Array.isArray(value.changedFiles) || value.changedFiles.length > MAX_CHANGED_FILES) {
    throw new TypeError(`changedFiles cannot exceed ${MAX_CHANGED_FILES} items.`);
  }
  value.changedFiles.forEach((item) => requiredString(item, "changedFiles item", 1_000));
  rejectForbiddenKeys(value);
  return { ...structuredClone(value), observedAt: isoTimestamp(value.observedAt, "observedAt") };
}

export function parseTeacherContextEnvelope(input) {
  const value = plainObject(input, "Teacher context envelope");
  exactKeys(value, new Set(["schemaVersion", "course", "executor", "freshness", "privacy", "provenance"]), "Teacher envelope");
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  const course = plainObject(value.course, "course");
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId", "contentVersion"]) requiredString(course[key], `course.${key}`);
  const executor = plainObject(value.executor, "executor");
  requiredString(executor.threadId, "executor.threadId");
  const activity = parseActivitySnapshot(executor.activity);
  if (executor.threadId !== activity.threadId) throw new TypeError("Teacher activity must match executor.threadId.");
  if (executor.status !== activity.status) throw new TypeError("Teacher executor status must match the activity snapshot.");
  const freshness = plainObject(value.freshness, "freshness");
  if (!["fresh", "stale", "disconnected"].includes(freshness.state)) throw new TypeError("Invalid freshness state.");
  isoTimestamp(freshness.observedAt, "freshness.observedAt");
  if (value.privacy?.scope !== "bound-thread-only" || value.privacy?.redactionsApplied !== true) {
    throw new TypeError("Teacher privacy must be bound-thread-only with redactions.");
  }
  if (JSON.stringify(value.provenance?.sources) !== JSON.stringify(["practice-start-request", "bound-executor-task"])) {
    throw new TypeError("Teacher provenance sources are invalid.");
  }
  rejectForbiddenKeys(value);
  return structuredClone(value);
}

export function parseTeacherChatMessage(input) {
  const value = plainObject(input, "Teacher chat message");
  exactKeys(value, new Set(["id", "role", "text", "createdAt"]), "Teacher chat message");
  requiredString(value.id, "message.id");
  if (!["learner", "teacher"].includes(value.role)) throw new TypeError("Invalid Teacher chat role.");
  requiredString(value.text, "message.text", MAX_TEACHER_MESSAGE);
  rejectForbiddenKeys(value);
  return { ...structuredClone(value), createdAt: isoTimestamp(value.createdAt, "message.createdAt") };
}
```

Implement the loader without trusting fixture paths:

```js
// src/main/mission-repository.mjs
import * as defaultFs from "node:fs/promises";
import path from "node:path";

import {
  parsePracticeMissionFixture,
  parsePracticeStartRequest,
} from "../shared/practice-contracts.mjs";

export async function loadPracticeStartRequest({
  fixturePath,
  repositoryRoot,
  fs = defaultFs,
}) {
  const root = path.resolve(repositoryRoot);
  const source = await fs.readFile(path.resolve(fixturePath), "utf8");
  const fixture = parsePracticeMissionFixture(JSON.parse(source));
  const exerciseAbsolute = path.resolve(root, fixture.workspace.exercisePath);
  const relative = path.relative(root, exerciseAbsolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new TypeError("Practice exercise must stay inside the repository.");
  }
  const stat = await fs.stat(exerciseAbsolute);
  if (!stat.isDirectory()) throw new TypeError("Practice exercise directory is unavailable.");
  return parsePracticeStartRequest({
    schemaVersion: 1,
    courseRunId: fixture.courseRunId,
    lessonId: fixture.lessonId,
    missionId: fixture.missionId,
    checkpointId: fixture.checkpointId,
    content: {
      ...fixture.content,
      kind: fixture.fixtureMetadata.contentKind,
      owner: fixture.fixtureMetadata.sourceOwner,
    },
    workspace: {
      expectedRepositoryRoot: root,
      exercisePath: fixture.workspace.exercisePath,
    },
  });
}
```

- [ ] **Step 5: Run the focused tests and commit**

Run:

```powershell
node --test tests/practice-contracts.test.mjs
git diff --check
```

Expected: all Practice contract tests PASS and `git diff --check` exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/content/practice.module-0.fixture.json prototypes/app-startup-electron-mock/src/shared/practice-contracts.mjs prototypes/app-startup-electron-mock/src/main/mission-repository.mjs prototypes/app-startup-electron-mock/tests/practice-contracts.test.mjs
git commit -m "feat: define practice mission contracts"
```

---

### Task 2: Add atomic Practice persistence without regressing setup state

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/atomic-json-store.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/setup-store.mjs`
- Create: `prototypes/app-startup-electron-mock/src/shared/practice-state-schema.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/practice-store.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/setup-store.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/practice-store.test.mjs`

**Interfaces:**
- Consumes: strict parsers from Task 1.
- Produces: `createAtomicJsonStore({ directory, fileName, parse, createDefault, recoveryMessage, fs?, clock? })` with `read()`, `write(value)`, `reset()`, and `lastRecovery`.
- Produces: `createDefaultPracticeState(clock?): PracticeState`.
- Produces: `parsePracticeState(input): PracticeState`.
- Produces: `createPracticeStore({ userDataPath, fs?, clock? })` with the same store API.
- Preserves: `createSetupStore(options)` public behavior and recovery text.

- [ ] **Step 1: Write failing Practice-store and setup-regression tests**

Add tests that assert this exact safe default:

```js
{
  schemaVersion: 1,
  activeSession: null,
  presentation: {
    mode: "full",
    lastFullTab: "exercise",
    mainBounds: null,
    bubbleBounds: null,
    popoverBounds: null,
  },
  teacherChat: [],
  updatedAt: "2026-08-03T00:00:00.000Z",
}
```

The valid active session shape is:

```js
{
  sessionId: "practice-session-1",
  lifecycle: "active",
  startRequest,
  binding,
  activity,
  observationCursor: "turn-1:item-4",
  boundAt: "2026-08-03T00:00:01.000Z",
}
```

Test atomic write/resume, 40-message truncation, bounds validation, corrupt-state quarantine to `practice-state.corrupt-<timestamp>.json`, rejection of credential-shaped keys at any depth, rejection of lifecycle `completed`, and rejection of an activity snapshot whose `threadId` differs from the binding. Extend the setup-store tests to assert that extraction to `atomic-json-store.mjs` preserves the existing file name, recovery message, default, and quarantine behavior.

- [ ] **Step 2: Run the two store test files and verify failure**

Run:

```powershell
node --test tests/setup-store.test.mjs tests/practice-store.test.mjs
```

Expected: setup tests PASS and Practice tests FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Extract the atomic JSON primitive and keep setup-store API stable**

Implement:

```js
// src/main/atomic-json-store.mjs
import * as defaultFs from "node:fs/promises";
import path from "node:path";

function safeTimestamp(date) {
  return date.toISOString().replaceAll(":", "-");
}

export function createAtomicJsonStore({
  directory,
  fileName,
  parse,
  createDefault,
  recoveryMessage,
  fs = defaultFs,
  clock = () => new Date(),
}) {
  const statePath = path.join(directory, fileName);
  const tempPath = `${statePath}.tmp`;
  let lastRecovery = null;

  return {
    get lastRecovery() { return lastRecovery; },
    async read() {
      try {
        return parse(JSON.parse(await fs.readFile(statePath, "utf8")));
      } catch (error) {
        if (error?.code === "ENOENT") return createDefault(clock);
        const extension = path.extname(fileName);
        const stem = path.basename(fileName, extension);
        const quarantinePath = path.join(
          directory,
          `${stem}.corrupt-${safeTimestamp(clock())}${extension}`,
        );
        await fs.rename(statePath, quarantinePath);
        lastRecovery = Object.freeze({ code: "STATE_RESET", message: recoveryMessage });
        return createDefault(clock);
      }
    },
    async write(value) {
      const state = parse(value);
      await fs.mkdir(directory, { recursive: true });
      const handle = await fs.open(tempPath, "w");
      try {
        await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(tempPath, statePath);
      return structuredClone(state);
    },
    async reset() {
      await fs.rm(statePath, { force: true });
      await fs.rm(tempPath, { force: true });
      lastRecovery = null;
      return createDefault(clock);
    },
  };
}
```

Rewrite `createSetupStore` as a thin call to this primitive using `setup-state.json`, `parseSetupState`, `createDefaultSetupState`, and the exact existing recovery message.

- [ ] **Step 4: Implement the Practice state parser and store**

Use the Task 1 parsers and enforce cross-field identity:

```js
// src/shared/practice-state-schema.mjs
import {
  parseActivitySnapshot,
  parseExecutorBinding,
  parsePracticeStartRequest,
  parseTeacherChatMessage,
} from "./practice-contracts.mjs";

const LIFECYCLES = new Set(["entering", "needs-binding", "ready", "active", "paused"]);
const MODES = new Set(["full", "compact", "quick-chat"]);
const TABS = new Set(["exercise", "teacher"]);
const FORBIDDEN_STATE_KEY = /^(access.?token|refresh.?token|api.?key|authorization|auth.?url|environment|env|reasoning)$/i;

function rejectForbiddenState(value, location = "practiceState") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenState(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_STATE_KEY.test(key)) throw new TypeError(`Forbidden Practice state field: ${location}.${key}`);
    rejectForbiddenState(item, `${location}.${key}`);
  }
}

export function createDefaultPracticeState(clock = () => new Date()) {
  return {
    schemaVersion: 1,
    activeSession: null,
    presentation: {
      mode: "full",
      lastFullTab: "exercise",
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: clock().toISOString(),
  };
}

function parseBounds(value, label) {
  if (value === null) return null;
  const keys = ["x", "y", "width", "height"];
  if (!value || typeof value !== "object" || keys.some((key) => !Number.isInteger(value[key]))) {
    throw new TypeError(`${label} must contain integer x, y, width, and height.`);
  }
  if (value.width < 1 || value.height < 1) throw new TypeError(`${label} dimensions must be positive.`);
  return structuredClone(value);
}

export function parsePracticeState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Practice state must be an object.");
  rejectForbiddenState(input);
  const stateKeys = new Set(["schemaVersion", "activeSession", "presentation", "teacherChat", "updatedAt"]);
  for (const key of Object.keys(input)) {
    if (!stateKeys.has(key)) throw new TypeError(`Unknown Practice state field: ${key}.`);
  }
  if (input.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  const presentation = input.presentation;
  if (!MODES.has(presentation?.mode)) throw new TypeError("Invalid presentation mode.");
  if (!TABS.has(presentation?.lastFullTab)) throw new TypeError("Invalid Practice tab.");
  const activeSession = input.activeSession === null ? null : structuredClone(input.activeSession);
  if (activeSession) {
    const sessionKeys = new Set([
      "sessionId", "lifecycle", "startRequest", "binding", "activity",
      "observationCursor", "boundAt", "error", "updatedAt",
    ]);
    for (const key of Object.keys(activeSession)) {
      if (!sessionKeys.has(key)) throw new TypeError(`Unknown Practice session field: ${key}.`);
    }
    if (!LIFECYCLES.has(activeSession.lifecycle)) throw new TypeError("Invalid Practice lifecycle.");
    if (typeof activeSession.sessionId !== "string" || activeSession.sessionId.trim() === "") throw new TypeError("Practice sessionId is required.");
    if (activeSession.observationCursor !== null && typeof activeSession.observationCursor !== "string") throw new TypeError("Invalid observation cursor.");
    if (activeSession.boundAt !== null && Number.isNaN(Date.parse(activeSession.boundAt))) throw new TypeError("Invalid boundAt timestamp.");
    if (activeSession.error !== null && typeof activeSession.error !== "string") throw new TypeError("Invalid Practice error.");
    if (Number.isNaN(Date.parse(activeSession.updatedAt))) throw new TypeError("Invalid session updatedAt timestamp.");
    activeSession.startRequest = parsePracticeStartRequest(activeSession.startRequest);
    activeSession.binding = activeSession.binding === null ? null : parseExecutorBinding(activeSession.binding);
    activeSession.activity = activeSession.activity === null ? null : parseActivitySnapshot(activeSession.activity);
    if (["ready", "active", "paused"].includes(activeSession.lifecycle) && !activeSession.binding) {
      throw new TypeError("Bound Practice lifecycle requires an Executor binding.");
    }
    if (activeSession.binding && activeSession.activity && activeSession.binding.threadId !== activeSession.activity.threadId) {
      throw new TypeError("Activity must belong to the bound Executor task.");
    }
  }
  const teacherChat = (input.teacherChat ?? []).map(parseTeacherChatMessage).slice(-40);
  if (typeof input.updatedAt !== "string" || Number.isNaN(Date.parse(input.updatedAt))) {
    throw new TypeError("Practice updatedAt must be an ISO timestamp.");
  }
  return {
    schemaVersion: 1,
    activeSession,
    presentation: {
      mode: presentation.mode,
      lastFullTab: presentation.lastFullTab,
      mainBounds: parseBounds(presentation.mainBounds, "mainBounds"),
      bubbleBounds: parseBounds(presentation.bubbleBounds, "bubbleBounds"),
      popoverBounds: parseBounds(presentation.popoverBounds, "popoverBounds"),
    },
    teacherChat,
    updatedAt: new Date(input.updatedAt).toISOString(),
  };
}
```

Create `practice-store.mjs` by passing `practice-state.json`, `parsePracticeState`, `createDefaultPracticeState`, and `Local Practice progress was reset because it could not be read.` to `createAtomicJsonStore`.

- [ ] **Step 5: Run store tests, the current unit suite, and commit**

Run:

```powershell
node --test tests/setup-store.test.mjs tests/practice-store.test.mjs
npm run test:unit
git diff --check
```

Expected: focused tests PASS, all existing 58 baseline tests still PASS, and the diff check exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/main/atomic-json-store.mjs prototypes/app-startup-electron-mock/src/main/setup-store.mjs prototypes/app-startup-electron-mock/src/shared/practice-state-schema.mjs prototypes/app-startup-electron-mock/src/main/practice-store.mjs prototypes/app-startup-electron-mock/tests/setup-store.test.mjs prototypes/app-startup-electron-mock/tests/practice-store.test.mjs
git commit -m "feat: persist safe practice state"
```

---

### Task 3: Create, name, open, discover, and verify Executor tasks

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/executor-conversation-service.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/executor-conversation-service.test.mjs`

**Interfaces:**
- Consumes: initialized `CodexAppServerClient`, `PracticeStartRequest`, a main-process `openExternal(url)` function, and a clock.
- Produces: `createExecutorConversationService({ client, openExternal, clock? })`.
- Produces: `createDedicatedTask(startRequest, sessionId): Promise<{ binding, handoff }>`.
- Produces: `listEligibleTasks(startRequest): Promise<EligibleTask[]>`.
- Produces: `bindExistingTask(startRequest, sessionId, threadId): Promise<ExecutorBinding>`.
- Produces: `revalidateBinding(startRequest, binding): Promise<{ binding, thread }>`.
- Produces: `openBoundTask(binding): Promise<{ opened: boolean, fallbackName: string }>`.

- [ ] **Step 1: Write failing service tests with an exact request transcript**

Use a fake client whose `request` records method and params. Assert the primary path sends:

```js
[
  ["thread/start", {
    cwd: "C:\\course",
    sandbox: "read-only",
    approvalPolicy: "on-request",
    serviceName: "content_builder_academy_practice",
  }],
  ["thread/name/set", {
    threadId: "thr-practice-1",
    name: "Practice · Module 0 · Read-only inspection",
  }],
  ["thread/read", {
    threadId: "thr-practice-1",
    includeTurns: false,
  }],
]
```

Return a start response with `cwd` and `thread.cwd` equal to `C:\course`. Verify the binding uses `sourceKind: "created-by-practice"`, contains no raw thread object, and the handoff opens exactly `codex://threads/thr-practice-1`.

Add tests for:

- naming failure returns no binding;
- `thread/read` returning a different `cwd` rejects the task;
- a malicious ID such as `thr/../../settings` is rejected before deep-link construction;
- `openExternal` failure returns `{ opened: false, fallbackName }` without deleting the binding;
- `thread/list` sends `cwd: ["C:\\course"]`, `archived: false`, `limit: 25`, `sortKey: "updated_at"`, `sortDirection: "desc"`, and `sourceKinds: ["cli", "vscode", "appServer"]`;
- the picker returns only exact-workspace, non-ephemeral tasks with display-safe fields;
- binding an existing task calls `thread/read`, validates it, and returns `sourceKind: "selected-existing"`; the activity reader owns `thread/resume` and event subscription in Task 4;
- revalidation never substitutes another task when `thread/read` fails.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```powershell
node --test tests/executor-conversation-service.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement normalization, verification, and safe deep links**

Start the module with:

```js
import path from "node:path";

import { parseExecutorBinding } from "../shared/practice-contracts.mjs";

const THREAD_ID = /^[A-Za-z0-9_-]+$/;

function samePath(left, right) {
  const normalize = (value) => path.resolve(value).replaceAll("/", "\\").toLocaleLowerCase("en-US");
  return normalize(left) === normalize(right);
}

function taskName(startRequest) {
  return `Practice · ${startRequest.lessonId.replace("module-", "Module ")} · Read-only inspection`;
}

function verifyThread(thread, expectedRoot) {
  if (!thread || typeof thread.id !== "string" || !THREAD_ID.test(thread.id)) {
    throw new TypeError("Executor task ID is invalid.");
  }
  if (!samePath(thread.cwd, expectedRoot)) throw new TypeError("Executor task workspace does not match the mission.");
  if (thread.ephemeral) throw new TypeError("Executor task must be persistent.");
  return thread;
}
```

Implement `openBoundTask` with:

```js
const url = `codex://threads/${encodeURIComponent(binding.threadId)}`;
const parsed = new URL(url);
if (parsed.protocol !== "codex:" || parsed.hostname !== "threads" || parsed.pathname !== `/${binding.threadId}`) {
  throw new TypeError("Executor deep link is invalid.");
}
try {
  await openExternal(url);
  return { opened: true, fallbackName: binding.displayName };
} catch {
  return { opened: false, fallbackName: binding.displayName };
}
```

- [ ] **Step 4: Implement the four service operations**

Use the exact App Server calls below:

```js
export function createExecutorConversationService({
  client,
  openExternal,
  clock = () => new Date(),
}) {
  async function readAndVerify(startRequest, threadId) {
    if (!THREAD_ID.test(threadId)) throw new TypeError("Executor task ID is invalid.");
    const result = await client.request("thread/read", { threadId, includeTurns: false });
    return verifyThread(result.thread, startRequest.workspace.expectedRepositoryRoot);
  }

  async function createDedicatedTask(startRequest, sessionId) {
    const started = await client.request("thread/start", {
      cwd: startRequest.workspace.expectedRepositoryRoot,
      sandbox: "read-only",
      approvalPolicy: "on-request",
      serviceName: "content_builder_academy_practice",
    });
    verifyThread(started.thread, startRequest.workspace.expectedRepositoryRoot);
    const displayName = taskName(startRequest);
    await client.request("thread/name/set", { threadId: started.thread.id, name: displayName });
    await readAndVerify(startRequest, started.thread.id);
    const now = clock().toISOString();
    const binding = parseExecutorBinding({
      schemaVersion: 1,
      sessionId,
      threadId: started.thread.id,
      displayName,
      workspaceRoot: startRequest.workspace.expectedRepositoryRoot,
      sourceKind: "created-by-practice",
      boundAt: now,
      verifiedAt: now,
    });
    return { binding, handoff: await openBoundTask(binding) };
  }

  async function listEligibleTasks(startRequest) {
    const result = await client.request("thread/list", {
      cwd: [startRequest.workspace.expectedRepositoryRoot],
      archived: false,
      limit: 25,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "vscode", "appServer"],
    });
    return result.data
      .filter((thread) => !thread.ephemeral && samePath(thread.cwd, startRequest.workspace.expectedRepositoryRoot))
      .map((thread) => ({
        threadId: thread.id,
        displayName: thread.name || thread.preview || `Codex task ${thread.id.slice(-6)}`,
        updatedAt: new Date(thread.updatedAt * 1_000).toISOString(),
        status: thread.status?.type ?? "notLoaded",
      }));
  }

  async function bindExistingTask(startRequest, sessionId, threadId) {
    const thread = await readAndVerify(startRequest, threadId);
    const now = clock().toISOString();
    return parseExecutorBinding({
      schemaVersion: 1,
      sessionId,
      threadId,
      displayName: thread.name || thread.preview || `Codex task ${threadId.slice(-6)}`,
      workspaceRoot: startRequest.workspace.expectedRepositoryRoot,
      sourceKind: "selected-existing",
      boundAt: now,
      verifiedAt: now,
    });
  }

  async function revalidateBinding(startRequest, binding) {
    const thread = await readAndVerify(startRequest, binding.threadId);
    return {
      thread,
      binding: parseExecutorBinding({ ...binding, verifiedAt: clock().toISOString() }),
    };
  }

  async function openBoundTask(binding) {
    if (!THREAD_ID.test(binding.threadId)) throw new TypeError("Executor task ID is invalid.");
    const url = `codex://threads/${encodeURIComponent(binding.threadId)}`;
    const parsed = new URL(url);
    if (parsed.protocol !== "codex:" || parsed.hostname !== "threads" || parsed.pathname !== `/${binding.threadId}`) {
      throw new TypeError("Executor deep link is invalid.");
    }
    try {
      await openExternal(url);
      return { opened: true, fallbackName: binding.displayName };
    } catch {
      return { opened: false, fallbackName: binding.displayName };
    }
  }

  return Object.freeze({
    createDedicatedTask,
    listEligibleTasks,
    bindExistingTask,
    revalidateBinding,
    openBoundTask,
  });
}
```

- [ ] **Step 5: Run the focused tests and commit**

Run:

```powershell
node --test tests/executor-conversation-service.test.mjs
git diff --check
```

Expected: all conversation-service tests PASS and the diff check exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/main/executor-conversation-service.mjs prototypes/app-startup-electron-mock/tests/executor-conversation-service.test.mjs
git commit -m "feat: bind dedicated executor tasks"
```

---

### Task 4: Reduce only bound Executor activity into bounded snapshots

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/executor-activity-reader.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/executor-activity-reader.test.mjs`

**Interfaces:**
- Consumes: initialized `CodexAppServerClient` and one validated `ExecutorBinding`.
- Produces: `client.onConnectionState(listener): unsubscribe` with states `connected | disconnected | stopped`.
- Produces: `createInitialActivitySnapshot(binding, clock?): ActivitySnapshot`.
- Produces: `reduceExecutorNotification(snapshot, notification, binding, clock?): ActivitySnapshot`.
- Produces: `snapshotFromThread(thread, binding, clock?): ActivitySnapshot` for `thread/read` polling.
- Produces: `createExecutorActivityReader({ client, clock?, setIntervalFn?, clearIntervalFn?, pollEveryMs?, staleAfterMs? })` with async `bind(binding)`, `refresh()`, `pause()`, `onSnapshot(listener)`, and `dispose()`.

- [ ] **Step 1: Write failing client-state and activity-reducer tests**

Extend the App Server client tests to assert `connected` after initialization, `disconnected` after unexpected child exit, `stopped` after expected stop, and listener preservation across restart.

Create reducer tests with these notifications:

```js
const bound = {
  schemaVersion: 1,
  sessionId: "practice-session-1",
  threadId: "thr-bound",
  displayName: "Practice · Module 0 · Read-only inspection",
  workspaceRoot: "C:\\course",
  sourceKind: "created-by-practice",
  boundAt: "2026-08-03T00:00:00.000Z",
  verifiedAt: "2026-08-03T00:00:00.000Z",
};

const boundUser = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 1,
    item: {
      id: "item-user",
      type: "userMessage",
      content: [{
        type: "text",
        text: "Inspect ContentPilot Lite. Read only; do not edit, install, or use network.",
      }],
    },
  },
};

const boundRead = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 2,
    item: {
      id: "item-command",
      type: "commandExecution",
      command: "Get-ChildItem",
      cwd: "C:\\course",
      status: "completed",
      commandActions: [{ type: "listFiles", command: "Get-ChildItem", path: "." }],
      aggregatedOutput: "RAW OUTPUT MUST NOT BE STORED",
    },
  },
};

const boundAnswer = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 3,
    item: {
      id: "item-answer",
      type: "agentMessage",
      phase: "final_answer",
      text: "The folder contains Brand Brain, Idea Lab, Draft Studio, and Calendar Board. No files changed.",
    },
  },
};
```

Assert the final snapshot has `status: "response-ready"`, cursor `turn-1:item-answer`, bounded prompt and response summaries, `activityKinds: ["prompt", "read", "response"]`, `changedFiles: []`, and no occurrence of `RAW OUTPUT`. Send the same item sequence under `thr-decoy`; assert strict deep equality with the pre-decoy snapshot and no decoy text. Add cases for:

- `turn/started` → `working`;
- `thread/status/changed` with `activeFlags: ["waitingOnApproval"]` → `waiting-for-learner`;
- `fileChange` → unique normalized relative changed paths without diff text;
- reasoning, plan, delta, MCP result, and command output content are ignored;
- overlong prompt/response text is truncated to 2,000 code points with `…`;
- 51 changed files retain only the first 50 normalized paths;
- a successful poll refreshes `observedAt`;
- no verified observation for 15 seconds produces `stale`;
- client disconnect produces `disconnected`;
- `thread/read` recovery returns to the derived current state.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```powershell
node --test tests/app-server-client.test.mjs tests/executor-activity-reader.test.mjs
```

Expected: existing client tests PASS; new tests FAIL because the connection-state API and reader do not exist.

- [ ] **Step 3: Add display-safe App Server connection notifications**

Add a private `#connectionListeners = new Set()` and these methods to `CodexAppServerClient`:

```js
onConnectionState(listener) {
  this.#connectionListeners.add(listener);
  return () => this.#connectionListeners.delete(listener);
}

#emitConnectionState(state) {
  for (const listener of this.#connectionListeners) listener(state);
}
```

Call `#emitConnectionState("connected")` immediately after successful initialization, `#emitConnectionState("disconnected")` in unexpected `#handleExit`, and `#emitConnectionState("stopped")` in `stop`. Clear connection listeners only when `stop({ clearListeners: true })` is used; preserve them through `restart()`.

- [ ] **Step 4: Implement pure activity reduction and the polling reader**

Use these exact helpers and status rules:

```js
// src/main/executor-activity-reader.mjs
import path from "node:path";

import { parseActivitySnapshot } from "../shared/practice-contracts.mjs";

const TOOL_KINDS = new Set(["read", "listFiles", "search"]);

function bounded(text, maximum = 2_000) {
  const normalized = String(text ?? "").replaceAll(/\s+/g, " ").trim();
  const points = [...normalized];
  return points.length <= maximum ? normalized : `${points.slice(0, maximum - 1).join("")}…`;
}

function relativeChangedPath(filePath, workspaceRoot) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(workspaceRoot, filePath);
  const relative = path.relative(workspaceRoot, absolute).replaceAll("\\", "/");
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return relative;
}

function mergeKinds(current, additions) {
  return [...new Set([...current, ...additions])];
}

export function createInitialActivitySnapshot(binding, clock = () => new Date()) {
  return parseActivitySnapshot({
    schemaVersion: 1,
    threadId: binding.threadId,
    status: "ready",
    cursor: "initial",
    learnerPromptSummary: "",
    executorResponseSummary: "",
    activityKinds: [],
    changedFiles: [],
    observedAt: clock().toISOString(),
  });
}

export function reduceExecutorNotification(snapshot, notification, binding, clock = () => new Date()) {
  if (notification?.params?.threadId !== binding.threadId) return snapshot;
  const next = structuredClone(snapshot);
  const { method, params } = notification;
  if (method === "turn/started") next.status = "working";
  if (method === "turn/completed") next.status = params.turn?.status === "completed" ? "response-ready" : "ready";
  if (method === "thread/closed" || method === "thread/archived") next.status = "disconnected";
  if (method === "thread/status/changed") {
    const status = params.status;
    next.status = status?.type === "active"
      ? status.activeFlags?.some((flag) => ["waitingOnApproval", "waitingOnUserInput"].includes(flag))
        ? "waiting-for-learner"
        : "working"
      : status?.type === "systemError"
        ? "disconnected"
        : next.status;
  }
  if (method === "item/completed") {
    const item = params.item;
    next.cursor = `${params.turnId}:${item.id}`;
    if (item.type === "userMessage") {
      next.learnerPromptSummary = bounded(item.content?.filter(({ type }) => type === "text").map(({ text }) => text).join(" "));
      next.activityKinds = mergeKinds(next.activityKinds, ["prompt"]);
    }
    if (item.type === "agentMessage" && item.phase !== "commentary") {
      next.executorResponseSummary = bounded(item.text);
      next.activityKinds = mergeKinds(next.activityKinds, ["response"]);
      next.status = "response-ready";
    }
    if (item.type === "commandExecution") {
      const kinds = (item.commandActions ?? []).map(({ type }) => type).filter((type) => TOOL_KINDS.has(type));
      if (kinds.length > 0) next.activityKinds = mergeKinds(next.activityKinds, ["read"]);
    }
    if (item.type === "fileChange") {
      const additions = (item.changes ?? [])
        .map(({ path: filePath }) => relativeChangedPath(filePath, binding.workspaceRoot))
        .filter(Boolean);
      next.changedFiles = [...new Set([...next.changedFiles, ...additions])].slice(0, 50);
      next.activityKinds = mergeKinds(next.activityKinds, ["file-change"]);
    }
  }
  next.observedAt = clock().toISOString();
  return parseActivitySnapshot(next);
}
```

Complete the module with the shared polling path:

```js
export function snapshotFromThread(thread, binding, clock = () => new Date()) {
  let snapshot = createInitialActivitySnapshot(binding, clock);
  for (const turn of thread.turns ?? []) {
    snapshot = reduceExecutorNotification(snapshot, {
      method: "turn/started",
      params: { threadId: binding.threadId, turn },
    }, binding, clock);
    for (const item of turn.items ?? []) {
      snapshot = reduceExecutorNotification(snapshot, {
        method: "item/completed",
        params: {
          threadId: binding.threadId,
          turnId: turn.id,
          item,
          completedAtMs: Date.parse(turn.completedAt ?? clock().toISOString()),
        },
      }, binding, clock);
    }
    snapshot = reduceExecutorNotification(snapshot, {
      method: "turn/completed",
      params: { threadId: binding.threadId, turn },
    }, binding, clock);
  }
  return parseActivitySnapshot({ ...snapshot, observedAt: clock().toISOString() });
}

export function createExecutorActivityReader({
  client,
  clock = () => new Date(),
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  pollEveryMs = 3_000,
  staleAfterMs = 15_000,
}) {
  let binding = null;
  let snapshot = null;
  let interval = null;
  const listeners = new Set();

  function emit(next) {
    snapshot = parseActivitySnapshot(next);
    for (const listener of listeners) listener(structuredClone(snapshot));
  }

  const removeNotification = client.onNotification((notification) => {
    if (!binding || !snapshot) return;
    const next = reduceExecutorNotification(snapshot, notification, binding, clock);
    if (next !== snapshot) emit(next);
  });

  const removeConnection = client.onConnectionState((state) => {
    if (!snapshot || state !== "disconnected") return;
    emit({ ...snapshot, status: "disconnected", observedAt: clock().toISOString() });
  });

  async function refresh() {
    if (!binding) return null;
    try {
      const result = await client.request("thread/read", {
        threadId: binding.threadId,
        includeTurns: true,
      });
      emit(snapshotFromThread(result.thread, binding, clock));
    } catch {
      const age = clock().getTime() - Date.parse(snapshot.observedAt);
      if (age >= staleAfterMs && snapshot.status !== "disconnected") {
        emit({ ...snapshot, status: "stale" });
      }
    }
    return snapshot ? structuredClone(snapshot) : null;
  }

  async function bind(nextBinding) {
    binding = structuredClone(nextBinding);
    snapshot = createInitialActivitySnapshot(binding, clock);
    emit(snapshot);
    await client.request("thread/resume", { threadId: binding.threadId });
    await refresh();
    if (!interval) interval = setIntervalFn(() => void refresh(), pollEveryMs);
    return structuredClone(snapshot);
  }

  function onSnapshot(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function pause() {
    if (interval) clearIntervalFn(interval);
    interval = null;
  }

  function dispose() {
    removeNotification();
    removeConnection();
    if (interval) clearIntervalFn(interval);
    interval = null;
    binding = null;
    snapshot = null;
    listeners.clear();
  }

  return Object.freeze({ bind, refresh, pause, onSnapshot, dispose });
}
```

The reducer never copies `reasoning`, `aggregatedOutput`, `diff`, or tool results.

- [ ] **Step 5: Run focused and regression tests, then commit**

Run:

```powershell
node --test tests/app-server-client.test.mjs tests/executor-activity-reader.test.mjs
npm run test:unit
git diff --check
```

Expected: all focused tests PASS, the existing unit suite remains green, and the diff check exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs prototypes/app-startup-electron-mock/src/main/executor-activity-reader.mjs prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs prototypes/app-startup-electron-mock/tests/executor-activity-reader.test.mjs
git commit -m "feat: observe bound executor activity"
```

---

### Task 5: Build bounded Teacher context and guarded real inference

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/teacher-context-broker.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/teacher-context-broker.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs`

**Interfaces:**
- Consumes: `PracticeStartRequest`, `ExecutorBinding`, `ActivitySnapshot`, bounded Teacher messages, and initialized App Server client.
- Produces: `createTeacherContextEnvelope({ startRequest, binding, activity, clock?, staleAfterMs? }): TeacherContextEnvelope`.
- Produces: `createContextReceipt(envelope, { missionTitle, taskName }): ContextReceipt`.
- Produces: `buildTeacherTurnInput({ envelope, chat, learnerMessage }): string`.
- Produces: `createFakeTeacherAdapter(): { respond(input): Promise<string>, dispose(): Promise<void> }`.
- Produces: `createAppServerTeacherAdapter({ client, teacherCwd, clock?, timeoutMs? })` with the same adapter API.

- [ ] **Step 1: Write failing context and adapter tests**

For the context broker, assert the envelope contains only:

```js
{
  schemaVersion: 1,
  course: {
    courseRunId: "fixture-course-run",
    lessonId: "module-0",
    missionId: "module-0-read-only-inspection-awareness-fixture",
    checkpointId: "executor-awareness",
    contentVersion: "mock-1",
  },
  executor: {
    threadId: "thr-bound",
    status: "response-ready",
    activity,
  },
  freshness: {
    observedAt: activity.observedAt,
    state: "fresh",
  },
  privacy: {
    scope: "bound-thread-only",
    redactionsApplied: true,
  },
  provenance: {
    sources: ["practice-start-request", "bound-executor-task"],
  },
}
```

Set the clock 16 seconds after `observedAt` and assert `freshness.state === "stale"`. Assert `createContextReceipt` returns only mission title, task name, observation time, freshness, and `Bound task only`. Assert `buildTeacherTurnInput` contains the envelope, newest 40 bounded chat messages, and current learner message but no credentials, raw command output, raw diffs, or unbound text.

For the real adapter, use a fake client and assert the first response call sends:

```js
["thread/start", {
  cwd: "C:\\teacher-sandbox",
  ephemeral: true,
  sandbox: "read-only",
  approvalPolicy: "never",
  serviceName: "content_builder_academy_teacher",
  developerInstructions: [
    "You are the Practice Mode Teacher.",
    "Answer only from the supplied Teacher context envelope and Teacher chat.",
    "Do not use tools, inspect files, control Executor tasks, or claim fresh context when freshness is stale or disconnected.",
    "If context is insufficient, say exactly what is unavailable.",
  ].join(" "),
}]
```

Then assert `turn/start` receives only text input and the returned promise resolves from the completed `agentMessage` on the Teacher thread. Add tests that:

- ignore reasoning and commentary items;
- reject and call `turn/interrupt` when any `commandExecution`, `fileChange`, `mcpToolCall`, `dynamicToolCall`, `collabAgentToolCall`, `webSearch`, `imageView`, or `imageGeneration` item starts or completes;
- ignore items and turns from all other thread IDs;
- fail with a sanitized timeout after 60 seconds;
- reuse the same ephemeral Teacher thread for later chat turns;
- `dispose()` unsubscribes listeners and calls `thread/unsubscribe` for the Teacher thread;
- the fake adapter deterministically reports prompt, constraints, response, changed-file count, and freshness from the supplied envelope.

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```powershell
node --test tests/teacher-context-broker.test.mjs tests/teacher-adapter.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for both new modules.

- [ ] **Step 3: Implement the context broker and receipt**

Implement:

```js
// src/main/teacher-context-broker.mjs
import { parseTeacherContextEnvelope } from "../shared/practice-contracts.mjs";

export function createTeacherContextEnvelope({
  startRequest,
  binding,
  activity,
  clock = () => new Date(),
  staleAfterMs = 15_000,
}) {
  const age = clock().getTime() - Date.parse(activity.observedAt);
  const freshness = activity.status === "disconnected"
    ? "disconnected"
    : age > staleAfterMs || activity.status === "stale"
      ? "stale"
      : "fresh";
  return parseTeacherContextEnvelope({
    schemaVersion: 1,
    course: {
      courseRunId: startRequest.courseRunId,
      lessonId: startRequest.lessonId,
      missionId: startRequest.missionId,
      checkpointId: startRequest.checkpointId,
      contentVersion: startRequest.content.version,
    },
    executor: {
      threadId: binding.threadId,
      status: activity.status,
      activity,
    },
    freshness: { observedAt: activity.observedAt, state: freshness },
    privacy: { scope: "bound-thread-only", redactionsApplied: true },
    provenance: { sources: ["practice-start-request", "bound-executor-task"] },
  });
}

export function createContextReceipt(envelope, { missionTitle, taskName }) {
  return Object.freeze({
    missionTitle,
    taskName,
    observedAt: envelope.freshness.observedAt,
    freshness: envelope.freshness.state,
    scopeLabel: "Bound task only",
  });
}

export function buildTeacherTurnInput({ envelope, chat, learnerMessage }) {
  const recent = chat.slice(-40).map(({ role, text, createdAt }) => ({ role, text, createdAt }));
  return [
    "TEACHER_CONTEXT_ENVELOPE",
    JSON.stringify(envelope),
    "RECENT_TEACHER_CHAT",
    JSON.stringify(recent),
    "CURRENT_LEARNER_MESSAGE",
    learnerMessage,
    "Answer the learner using only this material. Disclose stale or disconnected context.",
  ].join("\n");
}
```

- [ ] **Step 4: Implement fake and App Server Teacher adapters**

Use a guarded item set and one completion promise per turn:

```js
// src/main/teacher-adapter.mjs
const FORBIDDEN_TOOL_ITEMS = new Set([
  "commandExecution",
  "fileChange",
  "mcpToolCall",
  "dynamicToolCall",
  "collabAgentToolCall",
  "webSearch",
  "imageView",
  "imageGeneration",
]);

const DEVELOPER_INSTRUCTIONS = [
  "You are the Practice Mode Teacher.",
  "Answer only from the supplied Teacher context envelope and Teacher chat.",
  "Do not use tools, inspect files, control Executor tasks, or claim fresh context when freshness is stale or disconnected.",
  "If context is insufficient, say exactly what is unavailable.",
].join(" ");

export function createFakeTeacherAdapter() {
  return Object.freeze({
    async respond({ envelope }) {
      const activity = envelope.executor.activity;
      return [
        `Freshness: ${envelope.freshness.state}.`,
        `Learner prompt: ${activity.learnerPromptSummary || "not observed"}.`,
        `Executor report: ${activity.executorResponseSummary || "not observed"}.`,
        `Changed files: ${activity.changedFiles.length}.`,
      ].join(" ");
    },
    async dispose() {},
  });
}
```

Complete the module with:

```js
import { buildTeacherTurnInput } from "./teacher-context-broker.mjs";

export function createAppServerTeacherAdapter({
  client,
  teacherCwd,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  timeoutMs = 60_000,
}) {
  let threadId = null;
  let pending = null;

  async function ensureThread() {
    if (threadId) return threadId;
    const started = await client.request("thread/start", {
      cwd: teacherCwd,
      ephemeral: true,
      sandbox: "read-only",
      approvalPolicy: "never",
      serviceName: "content_builder_academy_teacher",
      developerInstructions: DEVELOPER_INSTRUCTIONS,
    });
    threadId = started.thread.id;
    return threadId;
  }

  function finish(error, value) {
    if (!pending) return;
    const current = pending;
    pending = null;
    clearTimeoutFn(current.timeout);
    if (error) current.reject(error);
    else current.resolve(value);
  }

  const unsubscribe = client.onNotification((notification) => {
    if (!pending || notification?.params?.threadId !== threadId) return;
    if (notification.params.turnId && notification.params.turnId !== pending.turnId) return;
    if (["item/started", "item/completed"].includes(notification.method)) {
      const item = notification.params.item;
      if (FORBIDDEN_TOOL_ITEMS.has(item?.type)) {
        void client.request("turn/interrupt", { threadId, turnId: pending.turnId }).catch(() => {});
        finish(new Error("Teacher inference violated the no-tools boundary."));
        return;
      }
      if (notification.method === "item/completed" && item?.type === "agentMessage" && item.phase !== "commentary") {
        pending.answer = item.text;
      }
    }
    if (notification.method === "turn/completed") {
      if (notification.params.turn?.status === "completed" && pending.answer) {
        finish(null, pending.answer);
      } else {
        finish(new Error("Teacher inference did not complete."));
      }
    }
  });

  async function respond({ envelope, chat, learnerMessage }) {
    if (pending) throw new Error("Teacher is already responding.");
    const activeThreadId = await ensureThread();
    const started = await client.request("turn/start", {
      threadId: activeThreadId,
      input: [{
        type: "text",
        text: buildTeacherTurnInput({ envelope, chat, learnerMessage }),
      }],
    });
    return new Promise((resolve, reject) => {
      pending = {
        turnId: started.turn.id,
        answer: null,
        resolve,
        reject,
        timeout: setTimeoutFn(() => {
          finish(new Error("Teacher response timed out."));
        }, timeoutMs),
      };
    });
  }

  async function dispose() {
    unsubscribe();
    finish(new Error("Teacher adapter stopped."));
    if (threadId) {
      await client.request("thread/unsubscribe", { threadId }).catch(() => {});
      threadId = null;
    }
  }

  return Object.freeze({ respond, dispose });
}
```

- [ ] **Step 5: Run focused tests and commit**

Run:

```powershell
node --test tests/teacher-context-broker.test.mjs tests/teacher-adapter.test.mjs
git diff --check
```

Expected: all context and adapter tests PASS and the diff check exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/main/teacher-context-broker.mjs prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs prototypes/app-startup-electron-mock/tests/teacher-context-broker.test.mjs prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs
git commit -m "feat: add scoped teacher awareness"
```

---

### Task 6: Compose the resumable Practice session orchestrator

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/shared/practice-session-reducer.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/practice-orchestrator.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/practice-session-reducer.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/practice-orchestrator.test.mjs`

**Interfaces:**
- Consumes: mission repository, Practice store, Executor conversation service, activity reader, Teacher context broker, Teacher adapter, `crypto.randomUUID`, and clock.
- Produces: `createInitialPracticeSession(startRequest, sessionId, clock?): PracticeSession`.
- Produces: `reducePracticeSession(session, event): PracticeSession`.
- Produces: `createPracticeOrchestrator(dependencies)` with `initialize()`, `startPractice()`, `createDedicatedTask()`, `listEligibleTasks()`, `bindExistingTask(threadId)`, `requestRebind()`, `openBoundTask()`, `retryObservation()`, `sendTeacherMessage(text)`, `selectTab(tab)`, `setPresentation(mode)`, main-process-only `updatePresentation(patch)`, `pause()`, `getViewModel()`, `onChange(listener)`, and `dispose()`.

- [ ] **Step 1: Write failing reducer tests for every approved lifecycle**

Assert these exact transitions:

```text
null + ENTER(startRequest, sessionId) → entering
entering + MISSION_READY → needs-binding
needs-binding + BINDING_VERIFIED(binding) → ready
ready + ACTIVITY_OBSERVED(prompt) → active
active + PAUSE → paused
paused + RESUME → active
any bound state + BINDING_LOST → same binding retained, activity disconnected
any state + REBIND_REQUESTED → needs-binding with binding/activity/cursor cleared
```

Unknown events return the original object. Any attempted `COMPLETE` event returns the original object because this slice has no completion state. Presentation events update only `presentation.mode` or `lastFullTab`; they never mutate mission, binding, activity, or Teacher chat.

- [ ] **Step 2: Write failing orchestrator tests for atomic binding and restart**

Use in-memory fakes and assert:

1. `startPractice()` loads and pins the mission, creates a UUID session, persists `needs-binding`, and emits a safe ViewModel.
2. `createDedicatedTask()` persists no binding when conversation creation rejects after `thread/start` or `thread/name/set`.
3. Successful creation persists the complete binding once, starts the activity reader, and exposes the handoff result.
4. Existing-task binding is explicit and clears the old observation cursor only after the new binding verifies.
5. An activity update whose `threadId` differs from the binding is discarded even if a faulty reader emits it.
6. `sendTeacherMessage()` rejects empty or over-4,000-code-point text, persists the learner message before inference, builds context from the current bound activity, persists the Teacher response, and retains only 40 messages.
7. A Teacher failure keeps the learner message and exposes a sanitized retryable error.
8. `initialize()` revalidates a persisted binding before starting observation; failed revalidation retains the binding but exposes `disconnected` and never chooses another task.
9. `pause()` stops observation without clearing mission, binding, chat, or presentation.
10. `getViewModel()` contains no raw thread objects, raw App Server messages, filesystem paths beyond the display-safe workspace label, credentials, environment, command output, diffs, or reasoning.

- [ ] **Step 3: Run reducer and orchestrator tests and verify failure**

Run:

```powershell
node --test tests/practice-session-reducer.test.mjs tests/practice-orchestrator.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for both modules.

- [ ] **Step 4: Implement the pure reducer and orchestrator composition**

Start the reducer with an explicit allowed event table:

```js
// src/shared/practice-session-reducer.mjs
export function createInitialPracticeSession(startRequest, sessionId, clock = () => new Date()) {
  return Object.freeze({
    sessionId,
    lifecycle: "entering",
    startRequest: structuredClone(startRequest),
    binding: null,
    activity: null,
    observationCursor: null,
    boundAt: null,
    error: null,
    updatedAt: clock().toISOString(),
  });
}

export function reducePracticeSession(session, event) {
  if (!session && event.type !== "ENTER") return session;
  if (event.type === "ENTER") return createInitialPracticeSession(event.startRequest, event.sessionId, event.clock);
  const update = (fields) => Object.freeze({ ...session, ...fields, updatedAt: event.at ?? session.updatedAt });
  switch (event.type) {
    case "MISSION_READY": return update({ lifecycle: "needs-binding", error: null });
    case "BINDING_VERIFIED": return update({ lifecycle: "ready", binding: event.binding, activity: event.activity, observationCursor: event.activity.cursor, boundAt: event.binding.boundAt, error: null });
    case "ACTIVITY_OBSERVED":
      if (!session.binding || event.activity.threadId !== session.binding.threadId) return session;
      return update({ lifecycle: session.lifecycle === "paused" ? "paused" : event.activity.activityKinds.includes("prompt") ? "active" : session.lifecycle, activity: event.activity, observationCursor: event.activity.cursor });
    case "PAUSE": return update({ lifecycle: "paused" });
    case "RESUME": return update({ lifecycle: session.binding ? "active" : "needs-binding" });
    case "BINDING_LOST": return update({ activity: { ...session.activity, status: "disconnected" }, error: event.error });
    case "REBIND_REQUESTED": return update({ lifecycle: "needs-binding", binding: null, activity: null, observationCursor: null, boundAt: null, error: null });
    case "ERROR": return update({ error: event.error });
    default: return session;
  }
}
```

Return this exact top-level ViewModel shape:

```js
{
  session: null | {
    sessionId,
    lifecycle,
    mission: {
      lessonId,
      missionId,
      title,
      description,
      learningOutcomes,
      instructions,
      allowedActions,
      prohibitedActions,
      expectedEvidence,
      contentKind,
      contentVersion,
    },
    executor: {
      bound,
      taskName,
      sourceKind,
      status,
      freshness,
      observedAt,
      handoff,
    },
    contextReceipt,
    teacherChat,
    error,
  },
  presentation: {
    mode,
    lastFullTab,
  },
}
```

Do not include `workspaceRoot`, raw `threadId`, observation cursor, raw App Server status objects, or protocol errors in the renderer ViewModel. The main process keeps the ID for operations; the renderer uses no arbitrary task identifier except eligible picker entries returned by the dedicated listing operation.

Implement the orchestrator with this composition. Helper `persist()` always validates through `parsePracticeState` before the single store write:

```js
// src/main/practice-orchestrator.mjs
import { randomUUID as defaultRandomUUID } from "node:crypto";

import { parsePracticeState } from "../shared/practice-state-schema.mjs";
import { parseTeacherChatMessage } from "../shared/practice-contracts.mjs";
import {
  createInitialPracticeSession,
  reducePracticeSession,
} from "../shared/practice-session-reducer.mjs";
import {
  createContextReceipt,
  createTeacherContextEnvelope,
} from "./teacher-context-broker.mjs";

export function createPracticeOrchestrator({
  startRequest,
  store,
  conversationService,
  activityReader,
  teacherAdapter,
  randomUUID = defaultRandomUUID,
  clock = () => new Date(),
}) {
  let persisted = null;
  let handoff = null;
  let operationError = null;
  const listeners = new Set();

  function at() { return clock().toISOString(); }

  function context() {
    const session = persisted?.activeSession;
    if (!session?.binding || !session.activity) return null;
    return createTeacherContextEnvelope({
      startRequest: session.startRequest,
      binding: session.binding,
      activity: session.activity,
      clock,
    });
  }

  function getViewModel() {
    const session = persisted?.activeSession ?? null;
    const envelope = context();
    return structuredClone({
      session: session ? {
        sessionId: session.sessionId,
        lifecycle: session.lifecycle,
        mission: {
          lessonId: session.startRequest.lessonId,
          missionId: session.startRequest.missionId,
          title: session.startRequest.content.title,
          description: session.startRequest.content.description,
          learningOutcomes: session.startRequest.content.learningOutcomes,
          instructions: session.startRequest.content.instructions,
          allowedActions: session.startRequest.content.allowedActions,
          prohibitedActions: session.startRequest.content.prohibitedActions,
          expectedEvidence: session.startRequest.content.expectedEvidence,
          contentKind: session.startRequest.content.kind,
          contentVersion: session.startRequest.content.version,
        },
        executor: {
          bound: Boolean(session.binding),
          taskName: session.binding?.displayName ?? null,
          sourceKind: session.binding?.sourceKind ?? null,
          status: session.activity?.status ?? "not-bound",
          freshness: envelope?.freshness.state ?? "disconnected",
          observedAt: envelope?.freshness.observedAt ?? null,
          handoff,
        },
        contextReceipt: envelope ? createContextReceipt(envelope, {
          missionTitle: session.startRequest.content.title,
          taskName: session.binding.displayName,
        }) : null,
        teacherChat: persisted.teacherChat,
        error: operationError ?? session.error ?? null,
      } : null,
      presentation: {
        mode: persisted?.presentation.mode ?? "full",
        lastFullTab: persisted?.presentation.lastFullTab ?? "exercise",
      },
    });
  }

  function emit() {
    const value = getViewModel();
    for (const listener of listeners) listener(value);
    return value;
  }

  async function persist(patch = {}) {
    persisted = parsePracticeState({
      ...persisted,
      ...patch,
      updatedAt: at(),
    });
    persisted = await store.write(persisted);
    return emit();
  }

  const removeActivityListener = activityReader.onSnapshot((activity) => {
    const session = persisted?.activeSession;
    if (!session?.binding || activity.threadId !== session.binding.threadId) return;
    const activeSession = reducePracticeSession(session, {
      type: "ACTIVITY_OBSERVED",
      activity,
      at: at(),
    });
    void persist({ activeSession });
  });

  async function initialize() {
    persisted = await store.read();
    const session = persisted.activeSession;
    if (!session?.binding) return emit();
    try {
      const { binding } = await conversationService.revalidateBinding(
        session.startRequest,
        session.binding,
      );
      const activity = await activityReader.bind(binding);
      persisted.activeSession = reducePracticeSession(session, {
        type: "BINDING_VERIFIED",
        binding,
        activity,
        at: at(),
      });
      operationError = null;
    } catch {
      persisted.activeSession = reducePracticeSession(session, {
        type: "BINDING_LOST",
        error: "The bound Codex task is disconnected. Retry or rebind explicitly.",
        at: at(),
      });
    }
    return persist();
  }

  async function startPractice() {
    if (persisted.activeSession) return emit();
    let session = createInitialPracticeSession(startRequest, randomUUID(), clock);
    session = reducePracticeSession(session, { type: "MISSION_READY", at: at() });
    operationError = null;
    return persist({ activeSession: session, teacherChat: [] });
  }

  async function applyBinding(binding, nextHandoff = null) {
    const activity = await activityReader.bind(binding);
    const activeSession = reducePracticeSession(persisted.activeSession, {
      type: "BINDING_VERIFIED",
      binding,
      activity,
      at: at(),
    });
    handoff = nextHandoff;
    operationError = null;
    return persist({ activeSession });
  }

  async function createDedicatedTask() {
    const session = persisted.activeSession;
    try {
      const result = await conversationService.createDedicatedTask(
        session.startRequest,
        session.sessionId,
      );
      return await applyBinding(result.binding, result.handoff);
    } catch {
      operationError = "A dedicated Codex task could not be created. Retry or choose an eligible task.";
      return emit();
    }
  }

  async function listEligibleTasks() {
    return conversationService.listEligibleTasks(persisted.activeSession.startRequest);
  }

  async function bindExistingTask(threadId) {
    const session = persisted.activeSession;
    try {
      const binding = await conversationService.bindExistingTask(
        session.startRequest,
        session.sessionId,
        threadId,
      );
      return await applyBinding(binding);
    } catch {
      operationError = "That Codex task is unavailable or belongs to a different workspace.";
      return emit();
    }
  }

  async function openBoundTask() {
    const binding = persisted.activeSession?.binding;
    if (!binding) throw new Error("No Executor task is bound.");
    handoff = await conversationService.openBoundTask(binding);
    return emit();
  }

  async function requestRebind() {
    activityReader.pause();
    handoff = null;
    operationError = null;
    return persist({
      activeSession: reducePracticeSession(persisted.activeSession, {
        type: "REBIND_REQUESTED",
        at: at(),
      }),
    });
  }

  async function retryObservation() {
    const binding = persisted.activeSession?.binding;
    if (!binding) return emit();
    const activity = await activityReader.bind(binding);
    operationError = null;
    const resumed = reducePracticeSession(persisted.activeSession, {
      type: "RESUME",
      at: at(),
    });
    return persist({
      activeSession: reducePracticeSession(resumed, {
        type: "ACTIVITY_OBSERVED",
        activity,
        at: at(),
      }),
    });
  }

  async function sendTeacherMessage(text) {
    const session = persisted.activeSession;
    const envelope = context();
    if (!session?.binding || !envelope) throw new Error("Bind an Executor task before messaging Teacher.");
    const learnerMessage = parseTeacherChatMessage({
      id: randomUUID(), role: "learner", text, createdAt: at(),
    });
    await persist({ teacherChat: [...persisted.teacherChat, learnerMessage].slice(-40) });
    try {
      const answer = await teacherAdapter.respond({
        envelope,
        chat: persisted.teacherChat,
        learnerMessage: learnerMessage.text,
      });
      const teacherMessage = parseTeacherChatMessage({
        id: randomUUID(), role: "teacher", text: answer, createdAt: at(),
      });
      operationError = null;
      return persist({ teacherChat: [...persisted.teacherChat, teacherMessage].slice(-40) });
    } catch {
      operationError = "Teacher could not answer from the current context. Retry your message.";
      return emit();
    }
  }

  async function selectTab(tab) {
    return persist({ presentation: { ...persisted.presentation, lastFullTab: tab } });
  }

  async function setPresentation(mode) {
    return updatePresentation({ mode });
  }

  async function updatePresentation(patch) {
    return persist({ presentation: { ...persisted.presentation, ...patch } });
  }

  async function pause() {
    activityReader.pause();
    return persist({
      activeSession: reducePracticeSession(persisted.activeSession, {
        type: "PAUSE",
        at: at(),
      }),
    });
  }

  function onChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function dispose() {
    removeActivityListener();
    activityReader.dispose();
    await teacherAdapter.dispose();
    listeners.clear();
  }

  return Object.freeze({
    initialize,
    startPractice,
    createDedicatedTask,
    listEligibleTasks,
    bindExistingTask,
    requestRebind,
    openBoundTask,
    retryObservation,
    sendTeacherMessage,
    selectTab,
    setPresentation,
    updatePresentation,
    pause,
    getViewModel,
    onChange,
    dispose,
  });
}
```

`createDedicatedTask` and `bindExistingTask` do not modify stored binding until the conversation service returns a fully parsed binding and the activity reader binds successfully. The orchestrator verifies the snapshot ID again before persistence.

- [ ] **Step 5: Run focused and full unit tests, then commit**

Run:

```powershell
node --test tests/practice-session-reducer.test.mjs tests/practice-orchestrator.test.mjs
npm run test:unit
git diff --check
```

Expected: reducer and orchestrator tests PASS, the current suite remains green, and the diff check exits `0`.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/shared/practice-session-reducer.mjs prototypes/app-startup-electron-mock/src/main/practice-orchestrator.mjs prototypes/app-startup-electron-mock/tests/practice-session-reducer.test.mjs prototypes/app-startup-electron-mock/tests/practice-orchestrator.test.mjs
git commit -m "feat: orchestrate resumable practice sessions"
```

---

### Task 7: Expose a narrow Practice IPC and preload boundary

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/shared/channels.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/practice-ipc-handlers.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/preload/preload.cjs`
- Create: `prototypes/app-startup-electron-mock/src/preload/bubble-preload.cjs`
- Create: `prototypes/app-startup-electron-mock/src/preload/quick-chat-preload.cjs`
- Create: `prototypes/app-startup-electron-mock/tests/practice-ipc-contract.test.mjs`

**Interfaces:**
- Consumes: Practice orchestrator and a window-actions object supplied by Task 8.
- Produces: `registerPracticeIpcHandlers({ ipcMain, orchestrator, windowActions }): unregister`.
- Produces: `window.practice` for the full renderer.
- Produces: `window.practiceBubble` for the bubble renderer.
- Produces: `window.practiceQuickChat` for the quick-chat renderer.
- Produces: one display-safe `practice:state-changed` event shared across presentations.

- [ ] **Step 1: Write the failing channel, handler, and preload contract tests**

Assert `CHANNELS` contains the existing setup/auth keys unchanged plus these exact keys and values:

```js
{
  PRACTICE_GET_STATE: "practice:get-state",
  PRACTICE_GET_BUBBLE_STATE: "practice:get-bubble-state",
  PRACTICE_GET_QUICK_STATE: "practice:get-quick-state",
  PRACTICE_START: "practice:start",
  PRACTICE_CREATE_TASK: "practice:create-task",
  PRACTICE_LIST_TASKS: "practice:list-tasks",
  PRACTICE_BIND_TASK: "practice:bind-task",
  PRACTICE_REBIND: "practice:rebind",
  PRACTICE_OPEN_TASK: "practice:open-task",
  PRACTICE_RETRY: "practice:retry",
  PRACTICE_SEND_TEACHER: "practice:send-teacher",
  PRACTICE_SELECT_TAB: "practice:select-tab",
  PRACTICE_COMPACT: "practice:compact",
  PRACTICE_OPEN_QUICK_CHAT: "practice:open-quick-chat",
  PRACTICE_CLOSE_QUICK_CHAT: "practice:close-quick-chat",
  PRACTICE_EXPAND: "practice:expand",
  PRACTICE_PAUSE: "practice:pause",
  PRACTICE_BUBBLE_MENU: "practice:bubble-menu",
  PRACTICE_QUIT: "practice:quit",
  PRACTICE_STATE_CHANGED: "practice:state-changed",
}
```

Use fake `ipcMain`, orchestrator, and window actions. Assert each invoke channel calls exactly one named operation and wraps results as `{ ok: true, value }` or a fixed sanitized error. Test that `PRACTICE_BIND_TASK` accepts only `{ threadId }` matching `/^[A-Za-z0-9_-]+$/`, `PRACTICE_SEND_TEACHER` accepts only non-empty text up to 4,000 code points, and `PRACTICE_SELECT_TAB` accepts only `exercise | teacher`.

Assert `toBubbleViewModel(full)` returns only `{ executor: { status, freshness }, newestTeacherMessageId }`. Assert `toQuickChatViewModel(full)` returns only `{ executor: { status, freshness, observedAt }, teacherChat, error }`. Neither compact mapper may contain mission content, task IDs, task names, changed files, context receipts, eligible tasks, or handoff details.

Read each preload as text and assert:

- no `ipcRenderer.send`, generic `invoke`, local module import, `node:fs`, `child_process`, `process.env`, or raw event object exposure;
- every event subscription returns a working `removeListener` closure;
- `preload.cjs` preserves `window.courseSetup` and adds only the full-window methods;
- bubble preload exposes only `getState`, `openQuickChat`, `expand`, `openMenu`, and `onStateChanged`;
- quick-chat preload exposes only `getState`, `sendTeacherMessage`, `closeQuickChat`, `expand`, and `onStateChanged`.

- [ ] **Step 2: Run the IPC contract and verify failure**

Run:

```powershell
node --test tests/practice-ipc-contract.test.mjs
```

Expected: FAIL because the Practice channels and files do not exist.

- [ ] **Step 3: Add the fixed channel names and safe main-process handlers**

Append the exact constants from Step 1 to `CHANNELS`. Implement handlers with a local `safeHandler` that discards caught error objects and returns only the fixed code/message/recovery text declared for that operation.

Use this operation map:

```js
// src/main/practice-ipc-handlers.mjs
const operations = new Map([
  [CHANNELS.PRACTICE_GET_STATE, () => orchestrator.getViewModel()],
  [CHANNELS.PRACTICE_GET_BUBBLE_STATE, () => toBubbleViewModel(orchestrator.getViewModel())],
  [CHANNELS.PRACTICE_GET_QUICK_STATE, () => toQuickChatViewModel(orchestrator.getViewModel())],
  [CHANNELS.PRACTICE_START, () => orchestrator.startPractice()],
  [CHANNELS.PRACTICE_CREATE_TASK, () => orchestrator.createDedicatedTask()],
  [CHANNELS.PRACTICE_LIST_TASKS, () => orchestrator.listEligibleTasks()],
  [CHANNELS.PRACTICE_REBIND, () => orchestrator.requestRebind()],
  [CHANNELS.PRACTICE_OPEN_TASK, () => orchestrator.openBoundTask()],
  [CHANNELS.PRACTICE_RETRY, () => orchestrator.retryObservation()],
  [CHANNELS.PRACTICE_COMPACT, () => windowActions.compact()],
  [CHANNELS.PRACTICE_OPEN_QUICK_CHAT, () => windowActions.openQuickChat()],
  [CHANNELS.PRACTICE_CLOSE_QUICK_CHAT, () => windowActions.closeQuickChat()],
  [CHANNELS.PRACTICE_EXPAND, () => windowActions.expandTeacher()],
  [CHANNELS.PRACTICE_PAUSE, () => orchestrator.pause()],
  [CHANNELS.PRACTICE_BUBBLE_MENU, (event) => windowActions.openBubbleMenu(event.sender)],
  [CHANNELS.PRACTICE_QUIT, () => windowActions.quit()],
]);
```

Register the three payload handlers separately after validation:

```js
CHANNELS.PRACTICE_BIND_TASK       → orchestrator.bindExistingTask(payload.threadId)
CHANNELS.PRACTICE_SEND_TEACHER    → orchestrator.sendTeacherMessage(payload.text)
CHANNELS.PRACTICE_SELECT_TAB      → orchestrator.selectTab(payload.tab)
```

Return an unregister function that removes every registered handler. Do not accept renderer-supplied mission IDs, workspace paths, bindings, envelopes, activity snapshots, window bounds, or App Server methods.

Export the two compact mappers from `practice-ipc-handlers.mjs`:

```js
export function toBubbleViewModel(full) {
  const session = full.session;
  const newestTeacher = [...(session?.teacherChat ?? [])].reverse().find(({ role }) => role === "teacher");
  return Object.freeze({
    executor: {
      status: session?.executor.status ?? "not-bound",
      freshness: session?.executor.freshness ?? "disconnected",
    },
    newestTeacherMessageId: newestTeacher?.id ?? null,
  });
}

export function toQuickChatViewModel(full) {
  const session = full.session;
  return Object.freeze({
    executor: {
      status: session?.executor.status ?? "not-bound",
      freshness: session?.executor.freshness ?? "disconnected",
      observedAt: session?.executor.observedAt ?? null,
    },
    teacherChat: structuredClone(session?.teacherChat ?? []),
    error: session?.error ?? null,
  });
}
```

- [ ] **Step 4: Implement the three exact preload bridges**

Add this frozen bridge to the existing preload, using the fixed inline channel strings already protected by contract tests:

```js
contextBridge.exposeInMainWorld("practice", Object.freeze({
  getState: () => ipcRenderer.invoke(CHANNELS.PRACTICE_GET_STATE),
  start: () => ipcRenderer.invoke(CHANNELS.PRACTICE_START),
  createTask: () => ipcRenderer.invoke(CHANNELS.PRACTICE_CREATE_TASK),
  listTasks: () => ipcRenderer.invoke(CHANNELS.PRACTICE_LIST_TASKS),
  bindTask: (threadId) => ipcRenderer.invoke(CHANNELS.PRACTICE_BIND_TASK, { threadId }),
  rebind: () => ipcRenderer.invoke(CHANNELS.PRACTICE_REBIND),
  openTask: () => ipcRenderer.invoke(CHANNELS.PRACTICE_OPEN_TASK),
  retry: () => ipcRenderer.invoke(CHANNELS.PRACTICE_RETRY),
  sendTeacherMessage: (text) => ipcRenderer.invoke(CHANNELS.PRACTICE_SEND_TEACHER, { text }),
  selectTab: (tab) => ipcRenderer.invoke(CHANNELS.PRACTICE_SELECT_TAB, { tab }),
  compact: () => ipcRenderer.invoke(CHANNELS.PRACTICE_COMPACT),
  onStateChanged: (listener) => {
    const wrapped = (_event, value) => listener(value);
    ipcRenderer.on(CHANNELS.PRACTICE_STATE_CHANGED, wrapped);
    return () => ipcRenderer.removeListener(CHANNELS.PRACTICE_STATE_CHANGED, wrapped);
  },
}));
```

Create the bubble and quick-chat preloads with only the methods listed in Step 1. Bubble `getState` invokes `PRACTICE_GET_BUBBLE_STATE`; quick-chat `getState` invokes `PRACTICE_GET_QUICK_STATE`. Each duplicates only the exact channel string constants it uses because sandboxed preloads cannot import local modules.

- [ ] **Step 5: Run IPC tests and commit**

Run:

```powershell
node --test tests/ipc-contract.test.mjs tests/practice-ipc-contract.test.mjs
git diff --check
```

Expected: existing setup IPC tests and all Practice IPC tests PASS.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/shared/channels.mjs prototypes/app-startup-electron-mock/src/main/practice-ipc-handlers.mjs prototypes/app-startup-electron-mock/src/preload/preload.cjs prototypes/app-startup-electron-mock/src/preload/bubble-preload.cjs prototypes/app-startup-electron-mock/src/preload/quick-chat-preload.cjs prototypes/app-startup-electron-mock/tests/practice-ipc-contract.test.mjs
git commit -m "feat: expose narrow practice IPC"
```

---

### Task 8: Coordinate the full window, Teacher bubble, and quick-chat popover

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/main/window-policy.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/window-coordinator.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/window-policy.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/window-coordinator.test.mjs`

**Interfaces:**
- Consumes: Electron `BrowserWindow`, `Menu`, `screen`, app quit callback, renderer/preload paths, persisted presentation state, main-process `updatePresentation(patch)`, and the two compact ViewModel mappers from Task 7.
- Produces: `createMainWindowOptions({ preloadPath, bounds? })`.
- Produces: `createBubbleWindowOptions({ preloadPath, bounds? })`.
- Produces: `createQuickChatWindowOptions({ preloadPath, bounds? })`.
- Produces: `clampBounds(bounds, displays, fallback): Rectangle`.
- Produces: `createWindowCoordinator(dependencies)` with `create()`, `getMainWindow()`, `broadcast(viewModel)`, `compact()`, `openQuickChat()`, `closeQuickChat()`, `expandTeacher()`, `openBubbleMenu(sender)`, `quit()`, and `dispose()`.

- [ ] **Step 1: Write failing option, clamping, and transition tests**

Assert the three option factories return these security and presentation fields:

```js
main: {
  width: 1180,
  height: 800,
  minWidth: 760,
  minHeight: 600,
  show: false,
  webPreferences: { preload, nodeIntegration: false, contextIsolation: true, sandbox: true },
}

bubble: {
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
  webPreferences: { preload, nodeIntegration: false, contextIsolation: true, sandbox: true },
}

quickChat: {
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
  webPreferences: { preload, nodeIntegration: false, contextIsolation: true, sandbox: true },
}
```

`clampBounds` tests use two displays and assert an off-screen saved bubble lands 16px inside the nearest work area. Coordinator tests with fake windows assert:

- `create()` creates all three windows, loads `index.html`, `bubble.html`, and `quick-chat.html`, shows only the main window, and installs navigation policy on all three;
- native `minimize` on the main fake is never intercepted;
- `compact()` stores main bounds, hides main and popover, clamps and shows bubble;
- `openQuickChat()` requires compact mode, shows the popover beside the bubble, and keeps main hidden;
- `closeQuickChat()` hides only the popover and leaves the bubble visible;
- `expandTeacher()` hides bubble/popover, restores and focuses main, and calls `selectTab("teacher")`;
- moving or resizing a window persists its clamped bounds after the event;
- display removal reclamps compact windows;
- broadcast sends the full ViewModel to the non-destroyed main window, the bubble mapper result to the bubble, and the quick-chat mapper result to the popover, all over `PRACTICE_STATE_CHANGED`;
- the bubble menu has exactly **Open Practice**, **Pause Practice**, a separator, and **Quit Course App**;
- dispose closes compact windows, removes display listeners, and leaves app shutdown to the injected quit callback.

- [ ] **Step 2: Run window tests and verify failure**

Run:

```powershell
node --test tests/window-policy.test.mjs tests/window-coordinator.test.mjs
```

Expected: existing window-policy tests fail only where the old factory name changes; coordinator tests fail with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Split secure options by presentation and implement clamping**

Keep `installWindowPolicy` unchanged. Add `createMainWindowOptions` and retain `export const createWindowOptions = createMainWindowOptions;` until Task 11 switches the composition root, so the startup app remains runnable at this checkpoint. Implement bubble/quick options exactly as Step 1. Use saved bounds only after `clampBounds` validates them.

Implement:

```js
export function clampBounds(bounds, displays, fallback) {
  const candidate = bounds ?? fallback;
  const center = {
    x: candidate.x + candidate.width / 2,
    y: candidate.y + candidate.height / 2,
  };
  const display = displays.find(({ workArea }) => (
    center.x >= workArea.x && center.x <= workArea.x + workArea.width
    && center.y >= workArea.y && center.y <= workArea.y + workArea.height
  )) ?? displays[0];
  const area = display.workArea;
  const width = Math.min(candidate.width, area.width - 32);
  const height = Math.min(candidate.height, area.height - 32);
  return {
    x: Math.max(area.x + 16, Math.min(candidate.x, area.x + area.width - width - 16)),
    y: Math.max(area.y + 16, Math.min(candidate.y, area.y + area.height - height - 16)),
    width,
    height,
  };
}
```

- [ ] **Step 4: Implement deterministic window coordination**

Use these fallback positions relative to the primary work area:

```js
const mainFallback = { x: area.x + 80, y: area.y + 60, width: 1180, height: 800 };
const bubbleFallback = { x: area.x + area.width - 96, y: area.y + area.height - 120, width: 72, height: 72 };
const quickFallback = { x: bubble.x - 376, y: Math.max(area.y + 16, bubble.y - 448), width: 360, height: 520 };
```

Create all windows once. Use one debounced 150ms bounds-persistence callback per window and call injected `updatePresentation` with only `mainBounds`, `bubbleBounds`, or `popoverBounds`. `compact`, `openQuickChat`, `closeQuickChat`, and `expandTeacher` update persisted presentation mode through the same callback before showing or hiding the destination surface. The popover's blur listener calls `closeQuickChat`. Do not listen for the main window's native `minimize` event. Use `mainWindow.restore()` only when expanding or handling a second app instance.

Build the native bubble menu through injected `Menu.buildFromTemplate`:

```js
[
  { label: "Open Practice", click: () => expandTeacher() },
  { label: "Pause Practice", click: () => pausePractice() },
  { type: "separator" },
  { label: "Quit Course App", click: () => quit() },
]
```

- [ ] **Step 5: Run window tests and commit**

Run:

```powershell
node --test tests/window-policy.test.mjs tests/window-coordinator.test.mjs
git diff --check
```

Expected: all option, policy, clamping, transition, and menu tests PASS.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/main/window-policy.mjs prototypes/app-startup-electron-mock/src/main/window-coordinator.mjs prototypes/app-startup-electron-mock/tests/window-policy.test.mjs prototypes/app-startup-electron-mock/tests/window-coordinator.test.mjs
git commit -m "feat: coordinate compact teacher windows"
```

---

### Task 9: Build the full Course-to-Practice interface

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/renderer/practice-state.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/index.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/app.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/styles.css`
- Create: `prototypes/app-startup-electron-mock/tests/practice-renderer.test.mjs`

**Interfaces:**
- Consumes: `window.practice` from Task 7 and the safe ViewModel from Task 6.
- Produces: `createInitialPracticeRendererState(): PracticeRendererState`.
- Produces: `reducePracticeRenderer(state, event): PracticeRendererState`.
- Produces: one same-window Course → Practice transition with Exercise and Teacher tabs.

- [ ] **Step 1: Write failing reducer and static-boundary tests**

Reducer tests cover:

```text
VIEW_MODEL_LOADED(null session) → course
START_REQUESTED → entering and busy
VIEW_MODEL_LOADED(needs-binding) → practice/exercise
CREATE_TASK_REQUESTED → binding and busy
TASK_CREATED(opened true) → practice/exercise with no fallback notice
TASK_CREATED(opened false) → named-task fallback notice
OPEN_PICKER → task picker visible
ELIGIBLE_TASKS_LOADED → safe task choices
TAB_SELECTED(teacher) → practice/teacher
TEACHER_SEND_REQUESTED → composer busy; local text retained until accepted
TEACHER_SEND_ACCEPTED → composer cleared
ERROR → fixed alert plus recovery action
```

Read the HTML/app source and assert:

- one main window contains Course and Practice sections;
- Practice uses a semantic tablist with `aria-controls` and two tabpanels;
- the persistent mission header and Executor status sit outside both tabpanels;
- the Exercise panel has description, lesson outcome, instructions, allowed/prohibited actions, expected evidence, task name, and **Open in Codex**;
- the Teacher panel has chat log, context receipt, message form, freshness disclosure, and no completion button;
- stale/disconnected status exposes **Retry observation** and explicit **Rebind task** actions;
- **Compact to Teacher** is a dedicated button and no renderer listener targets native minimize;
- task selection uses `<dialog>` and displays only eligible task ViewModels;
- no renderer import references `node:*`, `electron`, filesystem, App Server, credentials, environment, or raw `threadId` outside eligible picker values.

- [ ] **Step 2: Run the renderer test and verify failure**

Run:

```powershell
node --test tests/practice-renderer.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` and missing Practice markup assertions.

- [ ] **Step 3: Implement the pure renderer reducer**

Use this initial state and immutable event handling:

```js
export function createInitialPracticeRendererState() {
  return Object.freeze({
    screen: "course",
    viewModel: null,
    busyAction: null,
    eligibleTasks: [],
    pickerOpen: false,
    teacherDraft: "",
    error: null,
    fallbackNotice: null,
  });
}
```

`VIEW_MODEL_LOADED` sets `screen` to `practice` when `viewModel.session` exists; otherwise it remains `course`. `TAB_SELECTED` changes only `viewModel.presentation.lastFullTab`. Unknown events return the original state. Never copy eligible-task IDs into the persisted ViewModel.

- [ ] **Step 4: Add semantic markup, orchestration, and styling**

Replace the empty mock destination body with a Course fixture entry:

```html
<section class="panel course-panel" data-screen="destination" hidden>
  <p class="section-number">Course fixture · Module 0</p>
  <h2>Work safely with an Executor</h2>
  <p>This mock handoff tests Practice Mode mechanics; it is not production course content.</p>
  <button class="button primary" type="button" data-practice-action="start">Start Practice</button>
</section>
```

Add one Practice shell:

```html
<section id="practice-shell" class="practice-shell" data-screen="practice" hidden>
  <header class="practice-header">
    <div>
      <p id="practice-kicker" class="eyebrow">Practice fixture</p>
      <h2 id="practice-title"></h2>
    </div>
    <div id="executor-status" class="executor-status" role="status"></div>
    <button class="button compact-button" type="button" data-practice-action="compact">Compact to Teacher</button>
  </header>
  <div class="practice-tabs" role="tablist" aria-label="Practice Mode">
    <button id="exercise-tab" role="tab" aria-controls="exercise-panel" data-practice-tab="exercise">Exercise</button>
    <button id="teacher-tab" role="tab" aria-controls="teacher-panel" data-practice-tab="teacher">Teacher chat</button>
  </div>
  <section id="exercise-panel" role="tabpanel" aria-labelledby="exercise-tab"></section>
  <section id="teacher-panel" role="tabpanel" aria-labelledby="teacher-tab" hidden></section>
  <p id="practice-error" role="alert"></p>
</section>
<dialog id="task-picker" aria-labelledby="task-picker-title">
  <h3 id="task-picker-title">Choose an existing Codex task</h3>
  <div id="eligible-task-list"></div>
  <button type="button" data-practice-action="close-picker">Cancel</button>
</dialog>
```

In `app.js`, retain all startup listeners and add one `window.practice.onStateChanged` subscription. Use the existing `unwrap` helper. **Start Practice** first awaits `practice.start()` and then immediately awaits `practice.createTask()` when the returned lifecycle is `needs-binding`; this is the default clean-task path and requires no second learner decision. Every other action calls only one named bridge method and reloads state from the returned ViewModel. Render arrays with `textContent`, never `innerHTML`. Format timestamps with `Intl.DateTimeFormat`. On tab change, set `aria-selected`, `tabindex`, and panel `hidden`, then persist through `selectTab`. Teacher submit keeps focus in the composer after response. Display `Fresh`, `Stale`, or `Disconnected` in text and show the exact observation time. **Retry observation** calls `practice.retry()`; **Rebind task** first displays a confirmation explaining that the observation cursor will reset, then calls `practice.rebind()` and opens the eligible-task choices only after the orchestrator returns `needs-binding`.

Extend the existing palette instead of replacing it. Use a two-column Exercise layout above 920px and one column below; keep readable content at 72 characters; distinguish allowed and prohibited action cards by icon, border pattern, and text as well as color. Add `overflow-wrap: anywhere`, chat bubbles with role labels, sticky Teacher composer, visible `:focus-visible`, and reduced-motion overrides. Do not add decorative gradients to the compact status ring that obscure its state symbol.

- [ ] **Step 5: Run reducer/static tests and commit**

Run:

```powershell
node --test tests/onboarding-state.test.mjs tests/practice-renderer.test.mjs
git diff --check
```

Expected: startup renderer tests remain green and all new Practice reducer/static tests PASS.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/renderer/practice-state.mjs prototypes/app-startup-electron-mock/src/renderer/index.html prototypes/app-startup-electron-mock/src/renderer/app.js prototypes/app-startup-electron-mock/src/renderer/styles.css prototypes/app-startup-electron-mock/tests/practice-renderer.test.mjs
git commit -m "feat: add full practice mode interface"
```

---

### Task 10: Build the Messenger-style Teacher bubble and quick chat

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/renderer/bubble.html`
- Create: `prototypes/app-startup-electron-mock/src/renderer/bubble.js`
- Create: `prototypes/app-startup-electron-mock/src/renderer/bubble.css`
- Create: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.html`
- Create: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.js`
- Create: `prototypes/app-startup-electron-mock/src/renderer/compact.css`
- Create: `prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs`

**Interfaces:**
- Consumes: `window.practiceBubble` and `window.practiceQuickChat` from Task 7.
- Produces: one draggable, always-on-top Teacher chat head with status ring and unread badge.
- Produces: one adjacent quick-chat popover with recent messages, status/freshness, composer, and Expand.

- [ ] **Step 1: Write failing compact-renderer contract tests**

Read all six files and assert:

- both HTML files use the same restrictive CSP as the main renderer;
- bubble has one accessible button named `Open Teacher quick chat`, a non-color status symbol, an unread badge hidden at zero, and a separate drag region;
- bubble outer shell uses `-webkit-app-region: drag`; its button uses `-webkit-app-region: no-drag`;
- click calls `openQuickChat`, double-click and keyboard `Enter`/`Space` can call `expand`, and `contextmenu` calls `openMenu`;
- quick chat shows current Executor status/freshness, newest Teacher chat messages, a labeled text area, **Send**, and **Expand Practice**;
- Escape in quick chat calls `expand` only when explicitly activated through the button; pressing Escape otherwise closes the popover through a dedicated `closeQuickChat` bridge operation added to the channel contract;
- neither renderer receives mission instructions, changed-file details, thread IDs, eligible tasks, credentials, environment, raw protocol, or generic IPC;
- both unregister state listeners on unload;
- CSS includes 44px targets, visible focus, reduced motion, high-contrast state symbols, and no viewport minimum that would enlarge the 72px bubble.

- [ ] **Step 2: Run the compact contract test and verify initial failure**

Run:

```powershell
node --test tests/practice-ipc-contract.test.mjs tests/compact-renderers.test.mjs
```

Expected: IPC tests PASS; compact-renderer tests FAIL because the renderer files do not exist.

- [ ] **Step 3: Implement the bubble markup, behavior, and state mapping**

Use this complete body structure:

```html
<main class="bubble-shell" aria-label="Teacher companion">
  <div class="drag-ring" aria-hidden="true"></div>
  <button id="teacher-bubble" type="button" aria-label="Open Teacher quick chat">
    <span class="teacher-avatar" aria-hidden="true">T</span>
    <span id="executor-symbol" class="executor-symbol" aria-hidden="true">○</span>
    <span id="unread-badge" class="unread-badge" aria-label="0 unread Teacher messages" hidden>0</span>
  </button>
  <span id="bubble-status" class="sr-only" role="status">Executor ready</span>
</main>
```

In `bubble.js`, map safe Executor states exactly:

```js
const STATUS = {
  ready: ["○", "Executor ready"],
  working: ["◌", "Executor working"],
  "waiting-for-learner": ["!", "Executor waiting for you"],
  "response-ready": ["✓", "Executor response ready"],
  stale: ["~", "Executor context stale"],
  disconnected: ["×", "Executor disconnected"],
  "not-bound": ["–", "No Executor task bound"],
};
```

Unread count is the number of Teacher-role messages newer than a local in-memory `lastSeenTeacherMessageId`; cap the visible badge at `99+`. Opening quick chat marks the current newest Teacher message seen. Do not persist unread count as Practice evidence.

- [ ] **Step 4: Implement quick-chat markup and behavior**

Use a landmark header, scrollable `role="log"` with `aria-live="polite"`, and form:

```html
<header class="quick-header">
  <div><span class="eyebrow">Practice Teacher</span><strong id="quick-status"></strong></div>
  <button type="button" data-action="expand">Expand Practice</button>
</header>
<main>
  <p id="quick-freshness" role="status"></p>
  <div id="quick-messages" role="log" aria-label="Teacher conversation" aria-live="polite"></div>
</main>
<form id="quick-form">
  <label for="quick-message">Message Teacher</label>
  <textarea id="quick-message" maxlength="4000" rows="3"></textarea>
  <button type="submit">Send</button>
</form>
```

Render only role, bounded text, and formatted timestamp. Submit through `sendTeacherMessage`; disable only the composer and Send button while waiting. Keep the draft if sending fails. Expand calls `expand`; Escape calls `closeQuickChat`; clicking outside is handled by the coordinator's blur listener and also calls `closeQuickChat`. Bubble remains visible throughout.

- [ ] **Step 5: Run compact tests and commit**

Run:

```powershell
node --test tests/practice-ipc-contract.test.mjs tests/compact-renderers.test.mjs tests/window-coordinator.test.mjs
git diff --check
```

Expected: all compact IPC, renderer, and coordinator tests PASS.

Commit:

```powershell
git add prototypes/app-startup-electron-mock/src/renderer/bubble.html prototypes/app-startup-electron-mock/src/renderer/bubble.js prototypes/app-startup-electron-mock/src/renderer/bubble.css prototypes/app-startup-electron-mock/src/renderer/quick-chat.html prototypes/app-startup-electron-mock/src/renderer/quick-chat.js prototypes/app-startup-electron-mock/src/renderer/compact.css prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs
git commit -m "feat: add compact teacher chat"
```

---

### Task 11: Compose the application and prove the integrated flow with a fake App Server

**Files:**
- Modify: `prototypes/app-startup-electron-mock/package.json`
- Modify: `prototypes/app-startup-electron-mock/src/main/main.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs`

**Interfaces:**
- Consumes: all services and renderers from Tasks 1–10.
- Produces: one Electron lifecycle with one App Server connection, one main Course/Practice window, one hidden-until-needed bubble, one hidden-until-needed quick-chat popover, and one complete shutdown path.
- Produces: deterministic fake Executor, unbound decoy, and ephemeral Teacher protocol behavior for smoke tests.

- [ ] **Step 1: Extend package and composition contract tests before main-process changes**

Update `test:unit` to include every new test in this order after the existing setup tests:

```json
"tests/practice-contracts.test.mjs tests/practice-store.test.mjs tests/practice-session-reducer.test.mjs tests/executor-conversation-service.test.mjs tests/executor-activity-reader.test.mjs tests/teacher-context-broker.test.mjs tests/teacher-adapter.test.mjs tests/practice-orchestrator.test.mjs tests/practice-ipc-contract.test.mjs tests/window-coordinator.test.mjs tests/practice-renderer.test.mjs tests/compact-renderers.test.mjs"
```

Extend the main-process source contract to require imports for:

```text
mission-repository.mjs
practice-store.mjs
executor-conversation-service.mjs
executor-activity-reader.mjs
teacher-adapter.mjs
practice-orchestrator.mjs
practice-ipc-handlers.mjs
window-coordinator.mjs
```

Assert `main.mjs` creates the Teacher sandbox below `userData`, uses `createAppServerTeacherAdapter` on the normal path, loads `practice.module-0.fixture.json`, registers both setup and Practice IPC, broadcasts sanitized Practice ViewModels through the coordinator, disposes the orchestrator before stopping the shared client, and never reads `.codex/auth.json`.

- [ ] **Step 2: Run the composition contract and verify failure**

Run:

```powershell
node --test tests/ipc-contract.test.mjs
```

Expected: FAIL on the new Practice composition assertions.

- [ ] **Step 3: Extend the fake App Server with bound, decoy, and Teacher behavior**

Maintain in-memory records shaped:

```js
const threads = new Map();
let nextThread = 1;

function makeThread(params) {
  const id = params.ephemeral ? `thr-teacher-${nextThread++}` : `thr-practice-${nextThread++}`;
  const now = Math.floor(Date.now() / 1_000);
  return {
    id,
    sessionId: id,
    name: null,
    cwd: params.cwd,
    preview: "",
    ephemeral: Boolean(params.ephemeral),
    modelProvider: "openai",
    source: "appServer",
    status: { type: "idle" },
    turns: [],
    createdAt: now,
    updatedAt: now,
    cliVersion: "fixture",
  };
}
```

Support these exact methods in addition to current auth methods:

- `thread/start`: create and return `{ thread, cwd, model, modelProvider, approvalPolicy, approvalsReviewer: "user", sandbox }`; emit `thread/started`.
- `thread/name/set`: set `thread.name`, return `{}`, emit `thread/name/updated`; for the persistent Practice task, schedule the bound activity and one decoy activity sequence.
- `thread/read`: return `{ thread }`; include `turns` only when `includeTurns` is true.
- `thread/list`: return the persistent task plus a different-workspace task; apply the requested exact `cwd` filter before returning.
- `thread/resume`: return the stored task response shape and emit `thread/started`.
- `thread/unsubscribe`: return `{ status: "unsubscribed" }`.
- `turn/start`: only accept an ephemeral Teacher task; respond with an in-progress turn, then emit a final `agentMessage` and `turn/completed` whose text reports the bound prompt, read-only constraints, Executor report, and zero changed files from the supplied envelope.
- `turn/interrupt`: return `{}` and emit interrupted completion.

Emit this bound external activity after naming:

```js
const promptText = "Inspect ContentPilot Lite. Read only; do not edit, install, or use network.";
const reportText = "ContentPilot Lite contains Brand Brain, Idea Lab, Draft Studio, and Calendar Board. No files changed.";
```

Emit the same event types under `thr-decoy` with text `DECOY TASK MUST STAY OUT OF TEACHER CONTEXT`. Store only the bound sequence in the persistent Practice task's `turns`; the decoy remains a separate task.

- [ ] **Step 4: Compose all main-process services and window lifecycle**

Refactor `createMainWindow` into `createApplication` with this order:

```js
const onboardingContent = await loadOnboardingFixture();
const setupStore = createSetupStore({ userDataPath: userDataPath() });
const practiceStore = createPracticeStore({ userDataPath: userDataPath() });
const practiceStartRequest = await loadPracticeStartRequest({
  fixturePath: path.join(mockRoot, "content", "practice.module-0.fixture.json"),
  repositoryRoot: path.resolve(mockRoot, "..", ".."),
});

client = createCodexClient();
await connectAppServer();
auth = createAuthService({ client, openExternal: openAuthUrl });

const teacherCwd = path.join(userDataPath(), "teacher-sandbox");
await mkdir(teacherCwd, { recursive: true });
const conversationService = createExecutorConversationService({
  client,
  openExternal: (url) => fixtureServerPath ? Promise.resolve() : shell.openExternal(url),
});
const activityReader = createExecutorActivityReader({ client });
const teacherAdapter = createAppServerTeacherAdapter({ client, teacherCwd });
const orchestrator = createPracticeOrchestrator({
  startRequest: practiceStartRequest,
  store: practiceStore,
  conversationService,
  activityReader,
  teacherAdapter,
});
await orchestrator.initialize();
```

Create the window coordinator with renderer/preload paths, `toBubbleViewModel`, `toQuickChatViewModel`, and callbacks to orchestrator tab, presentation, and pause methods. Create windows, then register setup IPC and Practice IPC. Forward auth status only to the main renderer; forward `orchestrator.onChange(viewModel)` through `windowCoordinator.broadcast(viewModel)`, which maps the payload separately for each compact surface. `second-instance` calls `expandTeacher()` instead of reaching into a raw window.

Cleanup order is exact:

```text
unregister setup IPC
unregister Practice IPC
remove auth forwarder
remove Practice ViewModel forwarder
dispose window coordinator
dispose Practice orchestrator
dispose auth service
stop shared App Server client with the existing 1.5-second bound
```

If App Server is initially unavailable, still create all windows, initialize a disconnected Practice ViewModel, and keep retry available. App activation recreates the coordinated windows without creating duplicate service subscriptions.

- [ ] **Step 5: Write the integrated smoke flow and observe its first failure**

Extend the existing smoke test after setup completion:

```text
Open course
→ Start Practice in the same main window
→ create and bind the dedicated named task
→ confirm response-ready within 10 seconds
→ open Teacher tab
→ ask “What did my Executor inspect, which constraints did it follow, and did files change?”
→ confirm the reply contains ContentPilot Lite, read-only/no-edit constraints, report content, and zero changed files
→ confirm the reply and rendered DOM do not contain DECOY
→ Compact to Teacher
→ confirm main hidden and 72px bubble visible
→ click bubble and send a second Teacher message in quick chat
→ Expand Practice and confirm main restores on Teacher tab
→ close and relaunch with the same user-data directory
→ open course and confirm the same mission, task name, Teacher chat, and revalidated bound activity return
```

Add a helper that finds windows by `new URL(page.url()).pathname.endsWith(fileName)` and polls for at most 5 seconds. Use Playwright locators by accessible role/name. After closing the first app, read `practice-state.json` and assert it contains `thr-practice-1` only in the main-process binding, contains the bounded report and Teacher messages, and does not contain `DECOY`, `RAW OUTPUT`, `accessToken`, `refreshToken`, `apiKey`, `authorization`, or `reasoning`.

Run:

```powershell
npm run test:smoke
```

Expected: FAIL until the composition and renderer event timing are fully connected.

- [ ] **Step 6: Run the complete automated gate**

Run:

```powershell
npm run test:unit
npm run test:smoke
npm run check
git diff --check
```

Expected: all unit tests PASS, the integrated Electron smoke test PASS, `npm run check` exits `0`, and the diff check exits `0`.

- [ ] **Step 7: Commit the integrated application**

```powershell
git add prototypes/app-startup-electron-mock/package.json prototypes/app-startup-electron-mock/src/main/main.mjs prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs
git commit -m "feat: compose practice mode awareness flow"
```

---

### Task 12: Document the boundary and run the real-Codex acceptance checkpoint

**Files:**
- Modify: `prototypes/app-startup-electron-mock/README.md`

**Interfaces:**
- Consumes: completed automated slice and installed current Codex/ChatGPT desktop app.
- Produces: accurate run, privacy, recovery, and verification instructions.
- Produces: a pass/fail execution report in the implementation handoff; no account identity, task transcript, credential, auth URL, or raw protocol payload is committed.

- [ ] **Step 1: Replace the README's deferred Practice claims with exact implemented behavior**

Under **Implemented behavior**, add:

```markdown
- one versioned Module 0 mock-adaptation mission;
- same-window Course-to-Practice transition;
- Exercise and Teacher chat tabs with shared Executor freshness;
- dedicated App Server task creation, naming, verification, binding, and canonical Codex deep link;
- eligible same-workspace existing-task fallback;
- strict bound-task-only prompt, response, read-action, and changed-file awareness;
- bounded Teacher context receipt and guarded ephemeral real Teacher adapter;
- draggable always-on-top Teacher bubble and quick-chat popover;
- restart revalidation, stale/disconnected disclosure, retry, pause, and explicit rebind.
```

Under **Simulated fixture behavior**, state that automated tests use a fake App Server for account, Executor, unbound decoy, and Teacher events. Under **Explicitly deferred**, remove Practice Mode monitoring, Executor binding, Teacher inference, and always-on-top Teacher chat; retain production course content, mastery/evidence grading, proactive coaching, approval steering, multiple missions, tray, cloud, packaging, macOS/Linux, capture, and voice.

Add **Practice data stored** and **Practice data never stored** lists copied from the approved design. Add recovery instructions for stale context, missing task, wrong workspace, and named-task fallback. Do not describe the fixture as production content.

- [ ] **Step 2: Run the automated release gate from a clean dependency install**

From the mock directory:

```powershell
npm ci
npx --no-install install-electron --no
npm run check
```

Expected: dependency and pinned Electron runtime installation exit `0`; every unit and smoke test passes.

- [ ] **Step 3: Run the real App Server and desktop-task checkpoint**

From the repository root:

```powershell
.\start-course.cmd
```

Use the existing managed ChatGPT session or complete official login. Then verify manually:

1. **Start Practice** creates `Practice · Module 0 · Read-only inspection` in the repository workspace.
2. **Open in Codex** uses `codex://threads/<verified-threadId>` and focuses that exact empty task.
3. The composer is empty; Practice Mode did not submit the first prompt.
4. Send a learner-authored read-only inspection prompt in Codex.
5. Practice Mode shows Working and then Response ready within 10 seconds under normal local conditions.
6. Create a second Codex task and enter visibly different decoy text there.
7. Ask Teacher what the bound Executor was asked, which constraints it followed, what it reported, and whether files changed.
8. Teacher accurately reports the bound prompt/report, says zero changed files for the fixture, and does not mention the decoy.
9. Compact mode hides the main window, shows one draggable bubble, opens quick chat, and Expand restores the Teacher tab.
10. Disconnect or stop App Server; verify stale/disconnected disclosure and no claim of current awareness.
11. Restart the Course App; verify the same mission/task/chat return only after binding revalidation.
12. Inspect UI and logs; confirm no raw credentials, auth URLs, raw protocol messages, environment variables, reasoning, or unrelated task content appeared.

If the canonical deep link cannot open the App Server-created task in the installed desktop build, verify that the unique task name is still discoverable and the fallback instructions are truthful. If the created task is not visible at all, stop acceptance: keep the UI and contracts, report the adapter gate as failed, and do not claim the slice is complete.

- [ ] **Step 4: Run privacy, boundary, and ownership scans**

From the repository root:

```powershell
git diff --check
rg -n -i "access[_-]?token|refresh[_-]?token|api[_-]?key|authorization:|auth\.json|raw environment|reasoning" prototypes/app-startup-electron-mock -g "!package-lock.json"
rg -n "mock-adaptation|productionApproved|sourceOwner|mechanismOwner|bound-thread-only|Compact to Teacher|codex://threads/" prototypes/app-startup-electron-mock docs/superpowers/specs/2026-08-03-practice-mode-awareness-prototype-design.md
```

Expected: diff check exits `0`; secret scan matches only deliberate forbidden-field tests or documentation statements, never credential values, credential reads, raw reasoning storage, or renderer exposure; ownership/boundary scan finds every required marker.

- [ ] **Step 5: Commit documentation and run the final repository check**

```powershell
git add prototypes/app-startup-electron-mock/README.md
git commit -m "docs: explain practice mode awareness prototype"
git status --short
git log --oneline -12
```

Expected: the worktree is clean and twelve focused implementation commits appear in task order. The execution handoff reports automated results, real-Codex pass/fail for each checkpoint, and any blocked adapter gate without including private account or conversation data.
