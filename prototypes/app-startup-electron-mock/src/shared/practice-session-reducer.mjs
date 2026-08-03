import {
  parseActivitySnapshot,
  parseExecutorBinding,
  parsePracticeStartRequest,
} from "./practice-contracts.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validTimestamp(value, fallback) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return fallback;
  return new Date(value).toISOString() === value ? value : fallback;
}

function update(session, event, fields) {
  return Object.freeze({
    ...session,
    ...fields,
    updatedAt: validTimestamp(event.at, session.updatedAt),
  });
}

export function createInitialPracticeSession(startRequest, sessionId, clock = () => new Date()) {
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) {
    throw new TypeError("Practice sessionId must be a UUID.");
  }
  const updatedAt = clock().toISOString();
  if (Number.isNaN(Date.parse(updatedAt)) || new Date(updatedAt).toISOString() !== updatedAt) {
    throw new TypeError("Practice clock must return a valid date.");
  }
  return Object.freeze({
    sessionId,
    lifecycle: "entering",
    startRequest: parsePracticeStartRequest(structuredClone(startRequest)),
    binding: null,
    activity: null,
    observationCursor: null,
    boundAt: null,
    error: null,
    updatedAt,
  });
}

export function reducePracticeSession(session, event) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return session;
  if (event.type === "ENTER") {
    if (session !== null) return session;
    return createInitialPracticeSession(event.startRequest, event.sessionId, event.clock);
  }
  if (!session || typeof session !== "object" || Array.isArray(session)) return session;

  switch (event.type) {
    case "MISSION_READY":
      if (session.lifecycle !== "entering") return session;
      return update(session, event, { lifecycle: "needs-binding", error: null });

    case "BINDING_VERIFIED": {
      const binding = parseExecutorBinding(event.binding);
      const activity = parseActivitySnapshot(event.activity);
      if (binding.threadId !== activity.threadId) {
        throw new TypeError("Binding and activity must identify the same Executor task.");
      }
      if (binding.sessionId !== session.sessionId) {
        throw new TypeError("Binding must identify the current Practice session.");
      }
      return update(session, event, {
        lifecycle: "ready",
        binding: structuredClone(binding),
        activity: structuredClone(activity),
        observationCursor: activity.cursor,
        boundAt: binding.boundAt,
        error: null,
      });
    }

    case "ACTIVITY_OBSERVED": {
      if (!session.binding) return session;
      const activity = parseActivitySnapshot(event.activity);
      if (activity.threadId !== session.binding.threadId) return session;
      const lifecycle = session.lifecycle === "paused"
        ? "paused"
        : activity.activityKinds.includes("prompt")
          ? "active"
          : session.lifecycle;
      return update(session, event, {
        lifecycle,
        activity: structuredClone(activity),
        observationCursor: activity.cursor,
      });
    }

    case "PAUSE":
      if (!session.binding || session.lifecycle === "paused") return session;
      return update(session, event, { lifecycle: "paused" });

    case "RESUME":
      if (!session.binding) return session;
      return update(session, event, { lifecycle: "active" });

    case "BINDING_LOST": {
      if (!session.binding) return session;
      const activity = session.activity
        ? parseActivitySnapshot({
            ...structuredClone(session.activity),
            status: "disconnected",
            observedAt: validTimestamp(event.at, session.activity.observedAt),
          })
        : null;
      return update(session, event, {
        binding: structuredClone(session.binding),
        activity,
        error: typeof event.error === "string" ? event.error : null,
      });
    }

    case "REBIND_REQUESTED":
      return update(session, event, {
        lifecycle: "needs-binding",
        binding: null,
        activity: null,
        observationCursor: null,
        boundAt: null,
        error: null,
      });

    case "ERROR":
      if (event.error !== null && typeof event.error !== "string") return session;
      return update(session, event, { error: event.error });

    case "COMPLETE":
    default:
      return session;
  }
}
