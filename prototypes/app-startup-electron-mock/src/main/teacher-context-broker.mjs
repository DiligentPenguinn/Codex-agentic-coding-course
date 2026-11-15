import {
  parseTeacherChatMessage,
  parseTeacherContextEnvelope,
} from "../shared/practice-contracts.mjs";

const MAX_TEACHER_MESSAGE = 4_000;

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
    : age >= staleAfterMs || activity.status === "stale"
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
  const parsed = parseTeacherContextEnvelope(envelope);
  return Object.freeze({
    missionTitle,
    taskName,
    observedAt: parsed.freshness.observedAt,
    freshness: parsed.freshness.state,
    scopeLabel: "Bound task only",
  });
}

export function buildTeacherTurnInput({ envelope, chat, learnerMessage }) {
  const parsedEnvelope = parseTeacherContextEnvelope(envelope);
  if (!Array.isArray(chat)) throw new TypeError("Teacher chat must be an array.");
  const parsedChat = chat.map((message) => parseTeacherChatMessage(message));
  if (
    typeof learnerMessage !== "string"
    || learnerMessage.trim() === ""
    || [...learnerMessage].length > MAX_TEACHER_MESSAGE
  ) {
    throw new TypeError("Current learner message must be a non-empty bounded string.");
  }
  const recent = parsedChat.slice(-40).map(({ role, text, createdAt }) => ({
    role,
    text,
    createdAt,
  }));

  return [
    "TEACHER_CONTEXT_ENVELOPE",
    JSON.stringify(parsedEnvelope),
    "RECENT_TEACHER_CHAT",
    JSON.stringify(recent),
    "CURRENT_LEARNER_MESSAGE",
    learnerMessage,
    "Answer the learner using only this material. Disclose stale or disconnected context.",
  ].join("\n");
}
