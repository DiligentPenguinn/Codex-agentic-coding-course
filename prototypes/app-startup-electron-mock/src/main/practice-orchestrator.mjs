import { randomUUID as defaultRandomUUID } from "node:crypto";

import {
  parseExecutorBinding,
  parsePracticeStartRequest,
  parseTeacherChatMessage,
} from "../shared/practice-contracts.mjs";
import {
  createDefaultPracticeState,
  parsePracticeState,
} from "../shared/practice-state-schema.mjs";
import {
  createInitialPracticeSession,
  reducePracticeSession,
} from "../shared/practice-session-reducer.mjs";
import {
  createContextReceipt,
  createTeacherContextEnvelope,
} from "./teacher-context-broker.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAVE_ERROR = "Practice state could not be saved. Retry the operation.";
const INITIALIZE_ERROR = "Practice could not be initialized safely.";
const NO_SESSION_ERROR = "Start Practice before using this operation.";
const NO_BINDING_ERROR = "Bind an Executor task before using this operation.";
const DISPOSED_ERROR = "The Practice session orchestrator is disposed.";
const CREATE_ERROR = "A dedicated Codex task could not be created. Retry or choose an eligible task.";
const BIND_ERROR = "That Codex task is unavailable or belongs to a different workspace.";
const DISCONNECTED_ERROR = "The bound Codex task is disconnected. Retry or rebind explicitly.";
const TEACHER_ERROR = "Teacher could not answer from the current context. Retry your message.";

function publicError(message, code = "PRACTICE_OPERATION_FAILED") {
  return Object.assign(new Error(message), { code });
}

function safeHandoff(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.opened !== "boolean" || typeof value.fallbackName !== "string") return null;
  return { opened: value.opened, fallbackName: value.fallbackName };
}

function safeEligibleTasks(value) {
  if (!Array.isArray(value)) throw new TypeError("Eligible task result must be an array.");
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new TypeError("Invalid eligible task.");
    const { threadId, displayName, updatedAt, status } = item;
    if (
      typeof threadId !== "string" || !/^[A-Za-z0-9_-]+$/.test(threadId)
      || typeof displayName !== "string" || displayName.trim() === ""
      || typeof updatedAt !== "string" || Number.isNaN(Date.parse(updatedAt))
      || typeof status !== "string"
    ) throw new TypeError("Invalid eligible task.");
    return { threadId, displayName, updatedAt, status };
  });
}

export function createPracticeOrchestrator({
  startRequest,
  store,
  conversationService,
  activityReader,
  teacherAdapter,
  randomUUID = defaultRandomUUID,
  clock = () => new Date(),
}) {
  const pinnedStartRequest = parsePracticeStartRequest(structuredClone(startRequest));
  let persisted = null;
  let handoff = null;
  let initialized = false;
  let initializePromise = null;
  let startPromise = null;
  let bindingPromise = null;
  let teacherSending = false;
  const activitySuppressions = new Set();
  let disposed = false;
  let bindingEpoch = 0;
  let teacherEpoch = 0;
  let stateQueue = Promise.resolve();
  const listeners = new Set();

  function at() {
    return clock().toISOString();
  }

  function requireUsable() {
    if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
  }

  function requireInitialized() {
    requireUsable();
    if (!initialized || !persisted) throw publicError(INITIALIZE_ERROR, "PRACTICE_NOT_INITIALIZED");
  }

  function requireSession() {
    requireInitialized();
    const session = persisted.activeSession;
    if (!session) throw publicError(NO_SESSION_ERROR, "PRACTICE_SESSION_REQUIRED");
    return session;
  }

  function requireBinding() {
    const session = requireSession();
    if (!session.binding) throw publicError(NO_BINDING_ERROR, "PRACTICE_BINDING_REQUIRED");
    return session;
  }

  function currentContext() {
    const session = persisted?.activeSession;
    if (
      !session?.binding
      || !session.activity
      || session.binding.threadId !== session.activity.threadId
    ) return null;
    return createTeacherContextEnvelope({
      startRequest: session.startRequest,
      binding: session.binding,
      activity: session.activity,
      clock,
    });
  }

  function getViewModel() {
    const session = persisted?.activeSession ?? null;
    const envelope = session ? currentContext() : null;
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
          status: session.activity?.status ?? (session.binding ? "disconnected" : "not-bound"),
          freshness: envelope?.freshness.state ?? "disconnected",
          observedAt: envelope?.freshness.observedAt ?? null,
          handoff,
        },
        contextReceipt: envelope ? createContextReceipt(envelope, {
          missionTitle: session.startRequest.content.title,
          taskName: session.binding.displayName,
        }) : null,
        teacherChat: persisted.teacherChat,
        error: session.error ?? null,
      } : null,
      presentation: {
        mode: persisted?.presentation.mode ?? "full",
        lastFullTab: persisted?.presentation.lastFullTab ?? "exercise",
      },
    });
  }

  function emit() {
    const value = getViewModel();
    for (const listener of listeners) {
      try {
        listener(structuredClone(value));
      } catch {
        // Renderer observers are isolated from persistence and one another.
      }
    }
    return value;
  }

  function transact(mutator, { guard, afterCommit } = {}) {
    requireUsable();
    const run = async () => {
      if (disposed || (guard && !guard())) return getViewModel();
      const patch = mutator(persisted);
      if (patch === null || patch === undefined) return getViewModel();
      let candidate;
      try {
        candidate = parsePracticeState({
          ...persisted,
          ...patch,
          updatedAt: at(),
        });
      } catch {
        throw publicError(SAVE_ERROR, "PRACTICE_SAVE_FAILED");
      }

      let written;
      try {
        written = await store.write(candidate);
      } catch {
        throw publicError(SAVE_ERROR, "PRACTICE_SAVE_FAILED");
      }

      let committed;
      try {
        committed = parsePracticeState(written);
      } catch {
        throw publicError(SAVE_ERROR, "PRACTICE_SAVE_FAILED");
      }
      persisted = committed;
      if (afterCommit) afterCommit();
      return emit();
    };
    const task = stateQueue.then(run, run);
    stateQueue = task.catch(() => undefined);
    return task;
  }

  function setSessionError(message, guard) {
    return transact((current) => {
      if (!current?.activeSession) return null;
      return {
        activeSession: reducePracticeSession(current.activeSession, {
          type: "ERROR", error: message, at: at(),
        }),
      };
    }, { guard });
  }

  function validBindingForSession(value, session, expectedThreadId = null) {
    const nextBinding = parseExecutorBinding(value);
    if (
      nextBinding.sessionId !== session.sessionId
      || nextBinding.workspaceRoot !== session.startRequest.workspace.expectedRepositoryRoot
      || (expectedThreadId !== null && nextBinding.threadId !== expectedThreadId)
    ) throw new TypeError("Executor binding identity does not match the Practice session.");
    return nextBinding;
  }

  function validRevalidatedBinding(value, session) {
    const saved = session.binding;
    const nextBinding = validBindingForSession(value, session, saved.threadId);
    for (const key of [
      "schemaVersion", "sessionId", "threadId", "displayName",
      "workspaceRoot", "sourceKind", "boundAt",
    ]) {
      if (nextBinding[key] !== saved[key]) {
        throw new TypeError("Revalidation must retain the exact saved Executor binding.");
      }
    }
    return nextBinding;
  }

  const removeActivityListener = activityReader.onSnapshot((activity) => {
    if (disposed || activitySuppressions.size > 0 || !persisted?.activeSession?.binding) return;
    void transact((current) => {
      const session = current?.activeSession;
      if (!session?.binding || activity?.threadId !== session.binding.threadId) return null;
      const activeSession = reducePracticeSession(session, {
        type: "ACTIVITY_OBSERVED", activity, at: at(),
      });
      return activeSession === session ? null : { activeSession };
    }).catch(() => {
      // Background observation failure retains the last committed state.
    });
  });

  function initialize() {
    requireUsable();
    if (initialized) return Promise.resolve(emit());
    if (initializePromise) return initializePromise;
    initializePromise = (async () => {
      let loaded;
      try {
        loaded = parsePracticeState(await store.read());
      } catch {
        throw publicError(INITIALIZE_ERROR, "PRACTICE_INITIALIZE_FAILED");
      }
      if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
      persisted = loaded;
      handoff = null;
      const savedSession = loaded.activeSession;
      if (!savedSession?.binding) {
        initialized = true;
        return emit();
      }

      const suppression = Symbol("initialize");
      activitySuppressions.add(suppression);
      try {
        const result = await conversationService.revalidateBinding(
          savedSession.startRequest,
          structuredClone(savedSession.binding),
        );
        if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
        const nextBinding = validRevalidatedBinding(result?.binding, savedSession);
        const nextActivity = await activityReader.bind(nextBinding);
        if (!nextActivity || nextActivity.threadId !== savedSession.binding.threadId) {
          throw new TypeError("Activity identity does not match the saved binding.");
        }
        await transact((current) => ({
          activeSession: reducePracticeSession(current.activeSession, {
            type: "BINDING_VERIFIED",
            binding: nextBinding,
            activity: nextActivity,
            at: at(),
          }),
        }));
      } catch (error) {
        if (error?.code === "PRACTICE_SAVE_FAILED" || error?.code === "PRACTICE_DISPOSED") throw error;
        await transact((current) => ({
          activeSession: reducePracticeSession(current.activeSession, {
            type: "BINDING_LOST", error: DISCONNECTED_ERROR, at: at(),
          }),
        }));
      } finally {
        activitySuppressions.delete(suppression);
      }
      initialized = true;
      return getViewModel();
    })().finally(() => {
      initializePromise = null;
    });
    return initializePromise;
  }

  function startPractice() {
    requireInitialized();
    if (persisted.activeSession) return Promise.resolve(emit());
    if (startPromise) return startPromise;
    const sessionId = randomUUID();
    if (typeof sessionId !== "string" || !UUID.test(sessionId)) {
      return Promise.reject(publicError("Practice session creation failed.", "PRACTICE_SESSION_ID_INVALID"));
    }
    startPromise = transact((current) => {
      if (current.activeSession) return null;
      let session = createInitialPracticeSession(pinnedStartRequest, sessionId, clock);
      session = reducePracticeSession(session, { type: "MISSION_READY", at: at() });
      return { activeSession: session, teacherChat: [] };
    }).finally(() => {
      startPromise = null;
    });
    return startPromise;
  }

  async function applyBinding(nextBindingValue, nextHandoff, token, expectedThreadId = null) {
    if (disposed || token !== bindingEpoch) return getViewModel();
    const session = requireSession();
    const nextBinding = validBindingForSession(nextBindingValue, session, expectedThreadId);
    const suppression = Symbol("binding");
    activitySuppressions.add(suppression);
    let nextActivity;
    try {
      nextActivity = await activityReader.bind(nextBinding);
    } finally {
      activitySuppressions.delete(suppression);
    }
    if (disposed || token !== bindingEpoch) return getViewModel();
    if (!nextActivity || nextActivity.threadId !== nextBinding.threadId) {
      throw new TypeError("Activity identity does not match the Executor binding.");
    }
    const mappedHandoff = safeHandoff(nextHandoff);
    return transact((current) => {
      const currentSession = current?.activeSession;
      if (!currentSession || currentSession.sessionId !== nextBinding.sessionId) return null;
      return {
        activeSession: reducePracticeSession(currentSession, {
          type: "BINDING_VERIFIED", binding: nextBinding, activity: nextActivity, at: at(),
        }),
      };
    }, {
      guard: () => !disposed && token === bindingEpoch,
      afterCommit: () => { handoff = mappedHandoff; },
    });
  }

  function runBindingOperation(work, failureMessage, { bindingLost = false } = {}) {
    requireSession();
    if (bindingPromise) return bindingPromise;
    const token = ++bindingEpoch;
    const promise = (async () => {
      try {
        return await work(token);
      } catch (error) {
        if (disposed || token !== bindingEpoch) return getViewModel();
        if (error?.code === "PRACTICE_SAVE_FAILED") throw error;
        if (!bindingLost) {
          return setSessionError(failureMessage, () => !disposed && token === bindingEpoch);
        }
        return transact((current) => ({
          activeSession: reducePracticeSession(current.activeSession, {
            type: "BINDING_LOST", error: failureMessage, at: at(),
          }),
        }), { guard: () => !disposed && token === bindingEpoch });
      }
    })();
    bindingPromise = promise.finally(() => {
      if (bindingPromise === wrapped) bindingPromise = null;
    });
    const wrapped = bindingPromise;
    return bindingPromise;
  }

  function createDedicatedTask() {
    return runBindingOperation(async (token) => {
      const session = requireSession();
      const result = await conversationService.createDedicatedTask(
        session.startRequest,
        session.sessionId,
      );
      return applyBinding(result?.binding, result?.handoff, token);
    }, CREATE_ERROR);
  }

  async function listEligibleTasks() {
    const session = requireSession();
    try {
      const tasks = await conversationService.listEligibleTasks(session.startRequest);
      if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
      return structuredClone(safeEligibleTasks(tasks));
    } catch (error) {
      if (error?.code === "PRACTICE_DISPOSED") throw error;
      throw publicError("Eligible Codex tasks could not be listed.", "PRACTICE_LIST_FAILED");
    }
  }

  function bindExistingTask(threadId) {
    if (typeof threadId !== "string" || !/^[A-Za-z0-9_-]+$/.test(threadId)) {
      return Promise.reject(publicError(BIND_ERROR, "PRACTICE_BIND_FAILED"));
    }
    return runBindingOperation(async (token) => {
      const session = requireSession();
      const nextBinding = await conversationService.bindExistingTask(
        session.startRequest,
        session.sessionId,
        threadId,
      );
      return applyBinding(nextBinding, null, token, threadId);
    }, BIND_ERROR);
  }

  async function openBoundTask() {
    const session = requireBinding();
    const token = bindingEpoch;
    try {
      const result = await conversationService.openBoundTask(structuredClone(session.binding));
      if (disposed || token !== bindingEpoch) return getViewModel();
      const mapped = safeHandoff(result);
      if (!mapped) throw new TypeError("Invalid handoff result.");
      handoff = mapped;
      return emit();
    } catch (error) {
      if (error?.code === "PRACTICE_DISPOSED") throw error;
      throw publicError("The bound Codex task could not be opened.", "PRACTICE_OPEN_FAILED");
    }
  }

  function requestRebind() {
    requireSession();
    bindingEpoch += 1;
    teacherEpoch += 1;
    bindingPromise = null;
    activityReader.pause();
    return transact((current) => ({
      activeSession: reducePracticeSession(current.activeSession, {
        type: "REBIND_REQUESTED", at: at(),
      }),
    }), {
      afterCommit: () => { handoff = null; },
    });
  }

  function retryObservation() {
    return runBindingOperation(async (token) => {
      const session = requireBinding();
      const savedThreadId = session.binding.threadId;
      const suppression = Symbol("retry");
      activitySuppressions.add(suppression);
      let nextActivity;
      try {
        nextActivity = await activityReader.bind(structuredClone(session.binding));
      } finally {
        activitySuppressions.delete(suppression);
      }
      if (disposed || token !== bindingEpoch) return getViewModel();
      if (!nextActivity || nextActivity.threadId !== savedThreadId) {
        throw new TypeError("Activity identity does not match the saved binding.");
      }
      return transact((current) => {
        if (current.activeSession?.binding?.threadId !== savedThreadId) return null;
        let activeSession = reducePracticeSession(current.activeSession, { type: "RESUME", at: at() });
        activeSession = reducePracticeSession(activeSession, {
          type: "ACTIVITY_OBSERVED", activity: nextActivity, at: at(),
        });
        activeSession = reducePracticeSession(activeSession, { type: "ERROR", error: null, at: at() });
        return { activeSession };
      }, { guard: () => !disposed && token === bindingEpoch });
    }, DISCONNECTED_ERROR, { bindingLost: true });
  }

  async function sendTeacherMessage(text) {
    const session = requireBinding();
    if (
      typeof text !== "string"
      || text.trim() === ""
      || [...text].length > 4_000
    ) {
      throw publicError(
        "Teacher messages must be non-empty and at most 4,000 code points.",
        "PRACTICE_TEACHER_MESSAGE_INVALID",
      );
    }
    if (teacherSending) {
      throw publicError("A Teacher message is already being sent.", "PRACTICE_TEACHER_BUSY");
    }
    teacherSending = true;
    const token = ++teacherEpoch;
    const priorChat = structuredClone(persisted.teacherChat);
    const learnerMessage = parseTeacherChatMessage({
      id: randomUUID(), role: "learner", text, createdAt: at(),
    });

    try {
      await transact((current) => ({
        teacherChat: [...current.teacherChat, learnerMessage].slice(-40),
        activeSession: reducePracticeSession(current.activeSession, {
          type: "ERROR", error: null, at: at(),
        }),
      }), { guard: () => !disposed && token === teacherEpoch });
      if (disposed || token !== teacherEpoch) return getViewModel();

      const envelope = currentContext();
      if (!envelope) throw new TypeError("Bound Teacher context is unavailable.");
      const answer = await teacherAdapter.respond({
        envelope,
        chat: priorChat,
        learnerMessage: learnerMessage.text,
      });
      if (disposed || token !== teacherEpoch) return getViewModel();
      const teacherMessage = parseTeacherChatMessage({
        id: randomUUID(), role: "teacher", text: answer, createdAt: at(),
      });
      return transact((current) => ({
        teacherChat: [...current.teacherChat, teacherMessage].slice(-40),
        activeSession: reducePracticeSession(current.activeSession, {
          type: "ERROR", error: null, at: at(),
        }),
      }), { guard: () => !disposed && token === teacherEpoch });
    } catch (error) {
      if (disposed || token !== teacherEpoch) return getViewModel();
      if (error?.code === "PRACTICE_SAVE_FAILED") throw error;
      return setSessionError(TEACHER_ERROR, () => !disposed && token === teacherEpoch);
    } finally {
      teacherSending = false;
    }
  }

  function updatePresentation(patch) {
    requireInitialized();
    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      return Promise.reject(publicError("Invalid Practice presentation update.", "PRACTICE_PRESENTATION_INVALID"));
    }
    const allowed = new Set(["mode", "lastFullTab", "mainBounds", "bubbleBounds", "popoverBounds"]);
    if (Object.keys(patch).some((key) => !allowed.has(key))) {
      return Promise.reject(publicError("Invalid Practice presentation update.", "PRACTICE_PRESENTATION_INVALID"));
    }
    return transact((current) => ({
      presentation: { ...current.presentation, ...structuredClone(patch) },
    }));
  }

  function selectTab(tab) {
    if (!new Set(["exercise", "teacher"]).has(tab)) {
      return Promise.reject(publicError("Invalid Practice tab.", "PRACTICE_PRESENTATION_INVALID"));
    }
    return updatePresentation({ lastFullTab: tab });
  }

  function setPresentation(mode) {
    if (!new Set(["full", "compact", "quick-chat"]).has(mode)) {
      return Promise.reject(publicError("Invalid Practice presentation mode.", "PRACTICE_PRESENTATION_INVALID"));
    }
    return updatePresentation({ mode });
  }

  function pause() {
    const session = requireSession();
    if (!session.binding) return Promise.resolve(emit());
    bindingEpoch += 1;
    teacherEpoch += 1;
    bindingPromise = null;
    activityReader.pause();
    return transact((current) => ({
      activeSession: reducePracticeSession(current.activeSession, { type: "PAUSE", at: at() }),
    }));
  }

  function onChange(listener) {
    requireUsable();
    if (typeof listener !== "function") throw new TypeError("Practice listener must be a function.");
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    bindingEpoch += 1;
    teacherEpoch += 1;
    try { removeActivityListener(); } catch { /* Cleanup is best effort. */ }
    try { activityReader.pause(); } catch { /* Cleanup is best effort. */ }
    try { activityReader.dispose(); } catch { /* Cleanup is best effort. */ }
    try { await teacherAdapter.dispose(); } catch { /* Cleanup is best effort. */ }
    await stateQueue.catch(() => undefined);
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
