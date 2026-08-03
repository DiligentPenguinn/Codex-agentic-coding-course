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
const STATE_KEYS = new Set(["schemaVersion", "activeSession", "presentation", "teacherChat", "updatedAt"]);
const PRESENTATION_KEYS = new Set(["mode", "lastFullTab", "mainBounds", "bubbleBounds", "popoverBounds"]);
const SESSION_KEYS = new Set([
  "sessionId", "lifecycle", "startRequest", "binding", "activity",
  "observationCursor", "boundAt", "error", "updatedAt",
]);
const BOUNDS_KEYS = new Set(["x", "y", "width", "height"]);

function plainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${label} field: ${key}.`);
  }
}

function isoTimestamp(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new TypeError(`${label} must be an ISO timestamp.`);
  }
  const canonical = new Date(value).toISOString();
  if (value !== canonical) throw new TypeError(`${label} must be an ISO timestamp.`);
  return canonical;
}

function rejectForbiddenState(value, location = "practiceState") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectForbiddenState(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_STATE_KEY.test(key)) {
      throw new TypeError(`Forbidden Practice state field: ${location}.${key}`);
    }
    rejectForbiddenState(item, `${location}.${key}`);
  }
}

function parseBounds(value, label) {
  if (value === null) return null;
  const bounds = plainObject(value, `Practice ${label}`);
  exactKeys(bounds, BOUNDS_KEYS, "Practice bounds");
  for (const key of BOUNDS_KEYS) {
    if (!Number.isInteger(bounds[key])) {
      throw new TypeError(`${label} must contain integer x, y, width, and height.`);
    }
  }
  if (bounds.width < 1 || bounds.height < 1) {
    throw new TypeError(`${label} dimensions must be positive.`);
  }
  return structuredClone(bounds);
}

function parseActiveSession(value, stateUpdatedAt) {
  if (value === null) return null;
  const session = plainObject(value, "Practice session");
  exactKeys(session, SESSION_KEYS, "Practice session");
  if (!LIFECYCLES.has(session.lifecycle)) throw new TypeError("Invalid Practice lifecycle.");
  if (typeof session.sessionId !== "string" || session.sessionId.trim() === "") {
    throw new TypeError("Practice sessionId is required.");
  }
  if (session.observationCursor !== null && typeof session.observationCursor !== "string") {
    throw new TypeError("Invalid observation cursor.");
  }
  if (session.boundAt !== null && session.boundAt !== undefined) {
    isoTimestamp(session.boundAt, "boundAt");
  }
  if (session.error !== undefined && session.error !== null && typeof session.error !== "string") {
    throw new TypeError("Invalid Practice error.");
  }

  const binding = session.binding === null ? null : parseExecutorBinding(session.binding);
  const activity = session.activity === null ? null : parseActivitySnapshot(session.activity);
  if (["ready", "active", "paused"].includes(session.lifecycle) && !binding) {
    throw new TypeError("Bound Practice lifecycle requires an Executor binding.");
  }
  if (binding && activity && binding.threadId !== activity.threadId) {
    throw new TypeError("Activity must belong to the bound Executor task.");
  }

  return {
    sessionId: session.sessionId,
    lifecycle: session.lifecycle,
    startRequest: parsePracticeStartRequest(session.startRequest),
    binding,
    activity,
    observationCursor: session.observationCursor,
    boundAt: session.boundAt === undefined ? null : session.boundAt === null ? null : isoTimestamp(session.boundAt, "boundAt"),
    error: session.error === undefined ? null : session.error,
    updatedAt: session.updatedAt === undefined ? stateUpdatedAt : isoTimestamp(session.updatedAt, "session updatedAt"),
  };
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

export function parsePracticeState(input) {
  const state = plainObject(input, "Practice state");
  rejectForbiddenState(state);
  exactKeys(state, STATE_KEYS, "Practice state");
  if (state.schemaVersion !== 1) throw new TypeError("schemaVersion must equal 1.");
  const updatedAt = isoTimestamp(state.updatedAt, "Practice updatedAt");

  const presentation = plainObject(state.presentation, "Practice presentation");
  exactKeys(presentation, PRESENTATION_KEYS, "Practice presentation");
  if (!MODES.has(presentation.mode)) throw new TypeError("Invalid presentation mode.");
  if (!TABS.has(presentation.lastFullTab)) throw new TypeError("Invalid Practice tab.");
  if (!Array.isArray(state.teacherChat)) throw new TypeError("Teacher chat must be an array.");

  return {
    schemaVersion: 1,
    activeSession: parseActiveSession(state.activeSession, updatedAt),
    presentation: {
      mode: presentation.mode,
      lastFullTab: presentation.lastFullTab,
      mainBounds: parseBounds(presentation.mainBounds, "mainBounds"),
      bubbleBounds: parseBounds(presentation.bubbleBounds, "bubbleBounds"),
      popoverBounds: parseBounds(presentation.popoverBounds, "popoverBounds"),
    },
    teacherChat: state.teacherChat.map(parseTeacherChatMessage).slice(-40),
    updatedAt,
  };
}
