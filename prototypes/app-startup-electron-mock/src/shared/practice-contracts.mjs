import path from "node:path";

const FORBIDDEN_KEY = /^(access.?token|refresh.?token|api.?key|authorization|auth.?url|environment|env|reasoning)$/i;
const MAX_SUMMARY = 2_000;
const MAX_CHANGED_FILES = 50;
const MAX_TEACHER_MESSAGE = 4_000;

function plainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be a plain object.`);
  return value;
}

function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${label} field: ${key}.`);
  }
}

function objectWithKeys(value, allowed, label) {
  const object = plainObject(value, label);
  exactKeys(object, new Set(allowed), label);
  return object;
}

function requiredString(value, label, maximum = 500) {
  if (typeof value !== "string" || value.trim() === "" || [...value].length > maximum) throw new TypeError(`${label} must be a non-empty bounded string.`);
  return value;
}

function stringArray(value, label, maximumItems = 20) {
  if (!Array.isArray(value) || value.length === 0 || value.length > maximumItems) throw new TypeError(`${label} must be a non-empty bounded array.`);
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

function schemaVersion(value) {
  if (value.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
}

function isoTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) throw new TypeError(`${label} must be an ISO timestamp.`);
  const canonical = new Date(value).toISOString();
  if (value !== canonical) throw new TypeError(`${label} must be an ISO timestamp.`);
  return canonical;
}

function normalizedRepositoryRelativePath(value, label) {
  if (typeof value !== "string" || value.trim() === "" || [...value].length > 1_000) {
    throw new TypeError(`${label} must be a normalized repository-relative path.`);
  }
  const segments = value.split("/");
  if (
    path.posix.isAbsolute(value)
    || path.win32.isAbsolute(value)
    || /^[A-Za-z]:/.test(value)
    || value.includes("\\")
    || value.includes("//")
    || segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new TypeError(`${label} must be a normalized repository-relative path.`);
  }
  return value;
}

const CONTENT_KEYS = ["version", "locale", "title", "description", "learningOutcomes", "instructions", "allowedActions", "prohibitedActions", "expectedEvidence"];

function parseMissionContent(value, label, additionalKeys = []) {
  const content = objectWithKeys(value, [...CONTENT_KEYS, ...additionalKeys], label);
  for (const key of ["version", "locale", "title", "description"]) requiredString(content[key], `${label}.${key}`, 1_000);
  for (const key of ["learningOutcomes", "instructions", "allowedActions", "prohibitedActions", "expectedEvidence"]) stringArray(content[key], `${label}.${key}`);
  return content;
}

function parseTeacherMission(value) {
  const mission = objectWithKeys(value, [
    "title",
    "description",
    "learningOutcomes",
    "instructions",
    "allowedActions",
    "prohibitedActions",
    "expectedEvidence",
    "contentKind",
    "contentVersion",
  ], "Teacher mission");
  for (const key of ["title", "description", "contentKind", "contentVersion"]) {
    requiredString(mission[key], `Teacher mission.${key}`, 1_000);
  }
  for (const key of [
    "learningOutcomes",
    "instructions",
    "allowedActions",
    "prohibitedActions",
    "expectedEvidence",
  ]) stringArray(mission[key], `Teacher mission.${key}`);
  return mission;
}

export function parsePracticeMissionFixture(input) {
  const value = objectWithKeys(input, ["schemaVersion", "courseRunId", "lessonId", "missionId", "checkpointId", "fixtureMetadata", "content", "workspace"], "Practice mission fixture");
  rejectForbiddenKeys(value);
  schemaVersion(value);
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId"]) requiredString(value[key], key);
  const metadata = objectWithKeys(value.fixtureMetadata, ["contentKind", "source", "sourceOwner", "mechanismOwner", "productionApproved"], "fixtureMetadata");
  if (metadata.contentKind !== "mock-adaptation") throw new TypeError("contentKind must equal mock-adaptation.");
  if (metadata.sourceOwner !== "Triết") throw new TypeError("sourceOwner must equal Triết.");
  if (metadata.mechanismOwner !== "Duy") throw new TypeError("mechanismOwner must equal Duy.");
  if (metadata.productionApproved !== false) throw new TypeError("productionApproved must equal false.");
  requiredString(metadata.source, "fixtureMetadata.source");
  parseMissionContent(value.content, "content");
  const workspace = objectWithKeys(value.workspace, ["exercisePath"], "workspace");
  requiredString(workspace.exercisePath, "workspace.exercisePath", 1_000);
  if (path.isAbsolute(workspace.exercisePath)) throw new TypeError("exercisePath must be repository-relative.");
  return structuredClone(value);
}

export function parsePracticeStartRequest(input) {
  const value = objectWithKeys(input, ["schemaVersion", "courseRunId", "lessonId", "missionId", "checkpointId", "content", "workspace"], "Practice start request");
  rejectForbiddenKeys(value);
  schemaVersion(value);
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId"]) requiredString(value[key], key);
  const content = objectWithKeys(value.content, [...CONTENT_KEYS, "kind", "owner"], "Practice start content");
  parseMissionContent(content, "Practice start content", ["kind", "owner"]);
  for (const key of ["kind", "owner"]) requiredString(content[key], `content.${key}`, 1_000);
  if (content.kind !== "mock-adaptation" || content.owner !== "Triết") throw new TypeError("Practice start content must remain a Triết-sourced mock adaptation.");
  const workspace = objectWithKeys(value.workspace, ["expectedRepositoryRoot", "exercisePath"], "Practice start workspace");
  if (!path.isAbsolute(workspace.expectedRepositoryRoot)) throw new TypeError("expectedRepositoryRoot must be absolute.");
  requiredString(workspace.exercisePath, "workspace.exercisePath", 1_000);
  if (path.isAbsolute(workspace.exercisePath)) throw new TypeError("exercisePath must remain repository-relative.");
  return structuredClone(value);
}

export function parseExecutorBinding(input) {
  const value = objectWithKeys(input, ["schemaVersion", "sessionId", "threadId", "displayName", "workspaceRoot", "sourceKind", "boundAt", "verifiedAt"], "Executor binding");
  rejectForbiddenKeys(value);
  schemaVersion(value);
  for (const key of ["sessionId", "threadId", "displayName"]) requiredString(value[key], key);
  if (!path.isAbsolute(value.workspaceRoot)) throw new TypeError("workspaceRoot must be absolute.");
  if (!["created-by-practice", "selected-existing"].includes(value.sourceKind)) throw new TypeError("Invalid binding sourceKind.");
  return { ...structuredClone(value), boundAt: isoTimestamp(value.boundAt, "boundAt"), verifiedAt: isoTimestamp(value.verifiedAt, "verifiedAt") };
}

export function parseActivitySnapshot(input) {
  const value = objectWithKeys(input, ["schemaVersion", "threadId", "status", "cursor", "learnerPromptSummary", "executorResponseSummary", "activityKinds", "changedFiles", "observedAt"], "Activity snapshot");
  rejectForbiddenKeys(value);
  schemaVersion(value);
  requiredString(value.threadId, "threadId");
  requiredString(value.cursor, "cursor");
  if (!["not-bound", "ready", "working", "waiting-for-learner", "response-ready", "stale", "disconnected"].includes(value.status)) throw new TypeError("Invalid activity status.");
  for (const [key, text] of [["learnerPromptSummary", value.learnerPromptSummary], ["executorResponseSummary", value.executorResponseSummary]]) {
    if (typeof text !== "string" || [...text].length > MAX_SUMMARY) throw new TypeError(`${key} exceeds ${MAX_SUMMARY} code points.`);
  }
  if (!Array.isArray(value.activityKinds) || value.activityKinds.some((item) => typeof item !== "string")) throw new TypeError("activityKinds must be strings.");
  if (!Array.isArray(value.changedFiles) || value.changedFiles.length > MAX_CHANGED_FILES) throw new TypeError(`changedFiles cannot exceed ${MAX_CHANGED_FILES} items.`);
  value.changedFiles.forEach((item) => normalizedRepositoryRelativePath(item, "changedFiles item"));
  return { ...structuredClone(value), observedAt: isoTimestamp(value.observedAt, "observedAt") };
}

export function parseTeacherContextEnvelope(input) {
  const value = objectWithKeys(input, ["schemaVersion", "course", "mission", "executor", "freshness", "privacy", "provenance"], "Teacher envelope");
  rejectForbiddenKeys(value);
  schemaVersion(value);
  const course = objectWithKeys(value.course, ["courseRunId", "lessonId", "missionId", "checkpointId", "contentVersion"], "course");
  for (const key of ["courseRunId", "lessonId", "missionId", "checkpointId", "contentVersion"]) requiredString(course[key], `course.${key}`);
  parseTeacherMission(value.mission);
  const executor = objectWithKeys(value.executor, ["threadId", "status", "activity"], "executor");
  requiredString(executor.threadId, "executor.threadId");
  const activity = parseActivitySnapshot(executor.activity);
  if (executor.threadId !== activity.threadId) throw new TypeError("Teacher activity must match executor.threadId.");
  if (executor.status !== activity.status) throw new TypeError("Teacher executor status must match the activity snapshot.");
  const freshness = objectWithKeys(value.freshness, ["observedAt", "state"], "freshness");
  if (!["fresh", "stale", "disconnected"].includes(freshness.state)) throw new TypeError("Invalid freshness state.");
  isoTimestamp(freshness.observedAt, "freshness.observedAt");
  const privacy = objectWithKeys(value.privacy, ["scope", "redactionsApplied"], "privacy");
  if (privacy.scope !== "bound-thread-only" || privacy.redactionsApplied !== true) throw new TypeError("Teacher privacy must be bound-thread-only with redactions.");
  const provenance = objectWithKeys(value.provenance, ["sources"], "provenance");
  if (JSON.stringify(provenance.sources) !== JSON.stringify(["practice-start-request", "bound-executor-task"])) throw new TypeError("Teacher provenance sources are invalid.");
  return structuredClone(value);
}

export function parseTeacherChatMessage(input) {
  const value = objectWithKeys(input, ["id", "role", "text", "createdAt"], "Teacher chat message");
  rejectForbiddenKeys(value);
  requiredString(value.id, "message.id");
  if (!["learner", "teacher"].includes(value.role)) throw new TypeError("Invalid Teacher chat role.");
  requiredString(value.text, "message.text", MAX_TEACHER_MESSAGE);
  return { ...structuredClone(value), createdAt: isoTimestamp(value.createdAt, "message.createdAt") };
}
