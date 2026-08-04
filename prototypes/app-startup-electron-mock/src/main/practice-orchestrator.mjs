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
import { teacherFailureDetails } from "./teacher-adapter.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAVE_ERROR = "Practice state could not be saved. Retry the operation.";
const INITIALIZE_ERROR = "Practice could not be initialized safely.";
const NO_SESSION_ERROR = "Start Practice before using this operation.";
const NO_BINDING_ERROR = "Bind an Executor task before using this operation.";
const DISPOSED_ERROR = "The Practice session orchestrator is disposed.";
const CREATE_ERROR = "A dedicated Codex task could not be created. Retry or choose an eligible task.";
const BIND_ERROR = "That Codex task is unavailable or belongs to a different workspace.";
const DISCONNECTED_ERROR = "The bound Codex task is disconnected. Retry or rebind explicitly.";
const TEACHER_START_ERROR = "Teacher could not start a response. Retry.";
const TEACHER_COMPLETION_ERROR = "Teacher response did not complete. Retry.";
const TEACHER_TIMEOUT_ERROR = "Teacher is taking too long. Retry your message.";
const TEACHER_DISCONNECTED_ERROR = "Teacher lost connection. Retry observation or restart Course App.";
const TEACHER_BOUNDARY_ERROR = "Teacher could not use the current Practice context. Refresh observation and retry.";
const BINDING_TRANSITION_ERROR = "Executor task binding is changing. Wait for it to finish.";
const UNKNOWN_SESSION_ERROR = "Practice encountered a recoverable issue. Retry or restart the session.";
const SAFE_SESSION_ERRORS = new Set([
  CREATE_ERROR,
  BIND_ERROR,
  DISCONNECTED_ERROR,
  TEACHER_START_ERROR,
  TEACHER_COMPLETION_ERROR,
  TEACHER_TIMEOUT_ERROR,
  TEACHER_DISCONNECTED_ERROR,
  TEACHER_BOUNDARY_ERROR,
]);

function publicError(message, code = "PRACTICE_OPERATION_FAILED") {
  return Object.assign(new Error(message), { code });
}

function safeHandoff(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (typeof value.opened !== "boolean" || typeof value.fallbackName !== "string") return null;
  return { opened: value.opened, fallbackName: value.fallbackName };
}

function safeSessionError(value) {
  if (value === null || value === undefined) return null;
  return SAFE_SESSION_ERRORS.has(value) ? value : UNKNOWN_SESSION_ERROR;
}

function teacherPublicMessage(error) {
  const { operation, category } = teacherFailureDetails(error);
  if (category === "timeout") return TEACHER_TIMEOUT_ERROR;
  if (category === "disconnected") return TEACHER_DISCONNECTED_ERROR;
  if (category === "boundary-violation") return TEACHER_BOUNDARY_ERROR;
  return operation === "thread-start"
    ? TEACHER_START_ERROR
    : TEACHER_COMPLETION_ERROR;
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
  let initializationFailed = false;
  let initializePromise = null;
  let startPromise = null;
  let bindingPromise = null;
  let bindingOwner = null;
  let teacherSendOwner = null;
  let activitySuppressionOwner = null;
  let disposed = false;
  let bindingEpoch = 0;
  let committedBindingGeneration = 0;
  let bindingTransition = false;
  let activeBindingTransition = null;
  let observationEnabled = false;
  let observationEpoch = 0;
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
    if (bindingTransition) {
      throw publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION");
    }
    if (!session.binding) throw publicError(NO_BINDING_ERROR, "PRACTICE_BINDING_REQUIRED");
    return session;
  }

  async function bindReader(binding) {
    observationEpoch += 1;
    const token = observationEpoch;
    observationEnabled = false;
    const snapshot = await activityReader.bind(structuredClone(binding));
    if (!disposed && observationEpoch === token) observationEnabled = true;
    return snapshot;
  }

  function pauseReader() {
    observationEpoch += 1;
    observationEnabled = false;
    activityReader.pause();
  }

  function disposeReader() {
    observationEpoch += 1;
    observationEnabled = false;
    activityReader.dispose();
  }

  function captureCommittedBinding() {
    const session = requireBinding();
    return Object.freeze({
      sessionId: session.sessionId,
      threadId: session.binding.threadId,
      generation: committedBindingGeneration,
    });
  }

  function bindingCaptureIsCurrent(capture) {
    const session = persisted?.activeSession;
    return Boolean(
      !disposed
      && !bindingTransition
      && session?.binding
      && committedBindingGeneration === capture.generation
      && session.sessionId === capture.sessionId
      && session.binding.threadId === capture.threadId
    );
  }

  function teacherSendOwnerIsCurrent(owner) {
    return Boolean(
      owner?.token
      && teacherSendOwner?.token === owner.token
      && bindingCaptureIsCurrent(owner)
    );
  }

  function observationCaptureIsCurrent(capture) {
    return Boolean(
      observationEnabled
      && observationEpoch === capture.observationToken
      && bindingCaptureIsCurrent(capture)
    );
  }

  function claimActivitySuppression(operation = null) {
    const owner = Object.freeze({
      token: Symbol("activity-suppression"),
      bindingToken: operation?.token ?? bindingEpoch,
      generation: operation?.generation ?? committedBindingGeneration,
      sessionId: operation?.sessionId ?? persisted?.activeSession?.sessionId ?? null,
    });
    activitySuppressionOwner = owner;
    return owner;
  }

  function activitySuppressionIsCurrent() {
    const owner = activitySuppressionOwner;
    return Boolean(
      owner
      && owner.bindingToken === bindingEpoch
      && owner.generation === committedBindingGeneration
      && owner.sessionId === persisted?.activeSession?.sessionId
    );
  }

  function releaseActivitySuppression(owner) {
    if (activitySuppressionOwner === owner) activitySuppressionOwner = null;
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
        error: safeSessionError(session.error),
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
    const allowed = () => !disposed && (!guard || guard());
    const run = async () => {
      if (!allowed()) return getViewModel();
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

      if (!allowed()) return getViewModel();

      let committed;
      try {
        committed = parsePracticeState(written);
      } catch {
        throw publicError(SAVE_ERROR, "PRACTICE_SAVE_FAILED");
      }
      if (!allowed()) return getViewModel();
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

  function beginBindingTransition({ replaceOwned = false } = {}) {
    if (!replaceOwned && (bindingTransition || bindingPromise)) {
      throw publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION");
    }
    const session = requireSession();
    const priorObservationEnabled = replaceOwned && activeBindingTransition
      ? activeBindingTransition.priorObservationEnabled
      : observationEnabled;
    bindingTransition = true;
    bindingEpoch += 1;
    committedBindingGeneration += 1;
    activitySuppressionOwner = null;
    teacherSendOwner = null;
    handoff = null;
    const operation = Object.freeze({
      token: bindingEpoch,
      generation: committedBindingGeneration,
      sessionId: session.sessionId,
      priorBinding: session.binding ? structuredClone(session.binding) : null,
      priorActivity: session.activity ? structuredClone(session.activity) : null,
      priorObservationEnabled,
    });
    activeBindingTransition = operation;
    return operation;
  }

  function transitionIsCurrent(operation) {
    return Boolean(
      !disposed
      && bindingTransition
      && bindingEpoch === operation.token
      && committedBindingGeneration === operation.generation
      && persisted?.activeSession?.sessionId === operation.sessionId
    );
  }

  function finishBindingTransition(operation) {
    if (transitionIsCurrent(operation)) {
      bindingTransition = false;
      activeBindingTransition = null;
    }
  }

  async function rollbackReader(operation) {
    try { pauseReader(); } catch { /* Rollback remains best effort. */ }
    if (!operation.priorBinding) return true;
    try {
      const snapshot = await bindReader(operation.priorBinding);
      if (snapshot?.threadId === operation.priorBinding.threadId) {
        if (!operation.priorObservationEnabled) pauseReader();
        return true;
      }
    } catch {
      // A failed rollback is handled as a disconnected retained binding.
    }
    try { pauseReader(); } catch { /* Rollback remains best effort. */ }
    return false;
  }

  function readerSwitchFailure(error, rollbackFailed) {
    return {
      code: error?.code,
      rollbackFailed,
      readerSwitchFailure: true,
    };
  }

  const removeActivityListener = activityReader.onSnapshot((activity) => {
    if (
      disposed
      || !initialized
      || !observationEnabled
      || bindingTransition
      || activitySuppressionIsCurrent()
      || !persisted?.activeSession?.binding
    ) return;
    const capture = {
      sessionId: persisted.activeSession.sessionId,
      threadId: persisted.activeSession.binding.threadId,
      generation: committedBindingGeneration,
      observationToken: observationEpoch,
    };
    void transact((current) => {
      const session = current?.activeSession;
      if (!session?.binding || activity?.threadId !== session.binding.threadId) return null;
      const activeSession = reducePracticeSession(session, {
        type: "ACTIVITY_OBSERVED", activity, at: at(),
      });
      return activeSession === session ? null : { activeSession };
    }, {
      guard: () => initialized
        && !activitySuppressionIsCurrent()
        && observationCaptureIsCurrent(capture),
    }).catch(() => {
      // Background observation failure retains the last committed state.
    });
  });

  function initialize() {
    requireUsable();
    if (initializationFailed) {
      return Promise.reject(publicError(INITIALIZE_ERROR, "PRACTICE_INITIALIZE_FAILED"));
    }
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

      bindingTransition = true;
      committedBindingGeneration += 1;
      const suppression = claimActivitySuppression();
      try {
        try {
          const result = await conversationService.revalidateBinding(
            savedSession.startRequest,
            structuredClone(savedSession.binding),
          );
          if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
          const nextBinding = validRevalidatedBinding(result?.binding, savedSession);
          const nextActivity = await bindReader(nextBinding);
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
          }), {
            afterCommit: () => {
              bindingTransition = false;
              initialized = true;
            },
          });
        } catch (error) {
          if (error?.code === "PRACTICE_SAVE_FAILED" || error?.code === "PRACTICE_DISPOSED") throw error;
          try { pauseReader(); } catch { /* Failed restart remains disconnected. */ }
          await transact((current) => ({
            activeSession: reducePracticeSession(current.activeSession, {
              type: "BINDING_LOST", error: DISCONNECTED_ERROR, at: at(),
            }),
          }), {
            afterCommit: () => {
              bindingTransition = false;
              initialized = true;
            },
          });
        }
      } finally {
        releaseActivitySuppression(suppression);
      }
      return getViewModel();
    })().catch((error) => {
      if (!disposed) {
        initializationFailed = true;
        initialized = false;
        bindingEpoch += 1;
        committedBindingGeneration += 1;
        bindingTransition = false;
        activeBindingTransition = null;
        activitySuppressionOwner = null;
        try { pauseReader(); } catch { /* Terminal initialization failure stays non-observing. */ }
      }
      throw error;
    }).finally(() => {
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

  async function applyBinding(nextBindingValue, nextHandoff, operation, expectedThreadId = null) {
    if (!transitionIsCurrent(operation)) return getViewModel();
    const session = requireSession();
    const nextBinding = validBindingForSession(nextBindingValue, session, expectedThreadId);
    const suppression = claimActivitySuppression(operation);
    try {
      let nextActivity;
      try {
        nextActivity = await bindReader(nextBinding);
        if (!transitionIsCurrent(operation)) return getViewModel();
        if (!nextActivity || nextActivity.threadId !== nextBinding.threadId) {
          throw new TypeError("Activity identity does not match the Executor binding.");
        }
        const mappedHandoff = safeHandoff(nextHandoff);
        return await transact((current) => {
          const currentSession = current?.activeSession;
          if (!currentSession || currentSession.sessionId !== nextBinding.sessionId) return null;
          return {
            activeSession: reducePracticeSession(currentSession, {
              type: "BINDING_VERIFIED", binding: nextBinding, activity: nextActivity, at: at(),
            }),
          };
        }, {
          guard: () => transitionIsCurrent(operation),
          afterCommit: () => {
            handoff = mappedHandoff;
            finishBindingTransition(operation);
          },
        });
      } catch (error) {
        if (!transitionIsCurrent(operation)) return getViewModel();
        const restored = await rollbackReader(operation);
        throw readerSwitchFailure(error, !restored);
      }
    } finally {
      releaseActivitySuppression(suppression);
    }
  }

  function claimBindingOperation(run, owner, operation) {
    let owned;
    const task = Promise.resolve().then(() => {
      if (disposed) throw publicError(DISPOSED_ERROR, "PRACTICE_DISPOSED");
      if (bindingPromise !== owned || !transitionIsCurrent(operation)) {
        throw publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION");
      }
      return run();
    });
    owned = task.finally(() => {
      if (bindingPromise === owned) {
        bindingPromise = null;
        bindingOwner = null;
      }
    });
    bindingPromise = owned;
    bindingOwner = owner;
    return owned;
  }

  function runBindingOperation(work, failureMessage, { bindingLost = false } = {}) {
    requireSession();
    if (bindingPromise || bindingTransition) {
      return Promise.reject(publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION"));
    }
    const operation = beginBindingTransition();
    return claimBindingOperation(async () => {
      try {
        return await work(operation);
      } catch (error) {
        if (!transitionIsCurrent(operation)) return getViewModel();
        if (error?.code === "PRACTICE_SAVE_FAILED" && !error?.rollbackFailed) {
          finishBindingTransition(operation);
          throw publicError(SAVE_ERROR, "PRACTICE_SAVE_FAILED");
        }
        const lost = bindingLost || error?.rollbackFailed;
        const safeError = lost ? DISCONNECTED_ERROR : failureMessage;
        try {
          return await transact((current) => ({
            activeSession: reducePracticeSession(current.activeSession, {
              type: lost ? "BINDING_LOST" : "ERROR", error: safeError, at: at(),
            }),
          }), {
            guard: () => transitionIsCurrent(operation),
            afterCommit: () => finishBindingTransition(operation),
          });
        } catch (saveError) {
          finishBindingTransition(operation);
          throw saveError;
        }
      }
    }, "binding", operation);
  }

  function createDedicatedTask() {
    return runBindingOperation(async (operation) => {
      const session = requireSession();
      const result = await conversationService.createDedicatedTask(
        session.startRequest,
        session.sessionId,
      );
      return applyBinding(result?.binding, result?.handoff, operation);
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
    return runBindingOperation(async (operation) => {
      const session = requireSession();
      const nextBinding = await conversationService.bindExistingTask(
        session.startRequest,
        session.sessionId,
        threadId,
      );
      return applyBinding(nextBinding, null, operation, threadId);
    }, BIND_ERROR);
  }

  async function openBoundTask() {
    const capture = captureCommittedBinding();
    const binding = structuredClone(persisted.activeSession.binding);
    try {
      const result = await conversationService.openBoundTask(binding);
      if (!bindingCaptureIsCurrent(capture)) return getViewModel();
      const mapped = safeHandoff(result);
      if (!mapped) throw new TypeError("Invalid handoff result.");
      return transact(() => ({}), {
        guard: () => bindingCaptureIsCurrent(capture),
        afterCommit: () => { handoff = mapped; },
      });
    } catch (error) {
      if (error?.code === "PRACTICE_DISPOSED" || error?.code === "PRACTICE_SAVE_FAILED") throw error;
      throw publicError("The bound Codex task could not be opened.", "PRACTICE_OPEN_FAILED");
    }
  }

  function requestRebind() {
    requireSession();
    if (bindingOwner === "rebind") {
      return Promise.reject(publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION"));
    }
    const operation = beginBindingTransition({ replaceOwned: Boolean(bindingPromise || bindingTransition) });
    return claimBindingOperation(async () => {
      try {
        pauseReader();
        return await transact((current) => ({
          activeSession: reducePracticeSession(current.activeSession, {
            type: "REBIND_REQUESTED", at: at(),
          }),
        }), {
          guard: () => transitionIsCurrent(operation),
          afterCommit: () => finishBindingTransition(operation),
        });
      } catch (error) {
        if (!transitionIsCurrent(operation)) return getViewModel();
        const suppression = claimActivitySuppression(operation);
        try {
          const restored = await rollbackReader(operation);
          if (!transitionIsCurrent(operation)) return getViewModel();
          if (restored) {
            finishBindingTransition(operation);
            throw error;
          }
          try {
            return await transact((current) => ({
              activeSession: reducePracticeSession(current.activeSession, {
                type: "BINDING_LOST", error: DISCONNECTED_ERROR, at: at(),
              }),
            }), {
              guard: () => transitionIsCurrent(operation),
              afterCommit: () => finishBindingTransition(operation),
            });
          } catch (saveError) {
            finishBindingTransition(operation);
            throw saveError;
          }
        } finally {
          releaseActivitySuppression(suppression);
        }
      }
    }, "rebind", operation);
  }

  function retryObservation() {
    requireBinding();
    return runBindingOperation(async (operation) => {
      if (!operation.priorBinding) throw new TypeError("A committed binding is required.");
      const savedThreadId = operation.priorBinding.threadId;
      const suppression = claimActivitySuppression(operation);
      try {
        try {
          const nextActivity = await bindReader(operation.priorBinding);
          if (!transitionIsCurrent(operation)) return getViewModel();
          if (!nextActivity || nextActivity.threadId !== savedThreadId) {
            throw new TypeError("Activity identity does not match the saved binding.");
          }
          return await transact((current) => {
            if (
              current.activeSession?.sessionId !== operation.sessionId
              || current.activeSession?.binding?.threadId !== savedThreadId
            ) return null;
            let activeSession = reducePracticeSession(current.activeSession, { type: "RESUME", at: at() });
            activeSession = reducePracticeSession(activeSession, {
              type: "ACTIVITY_OBSERVED", activity: nextActivity, at: at(),
            });
            activeSession = reducePracticeSession(activeSession, { type: "ERROR", error: null, at: at() });
            return { activeSession };
          }, {
            guard: () => transitionIsCurrent(operation),
            afterCommit: () => finishBindingTransition(operation),
          });
        } catch (error) {
          if (!transitionIsCurrent(operation)) return getViewModel();
          const restored = await rollbackReader(operation);
          throw readerSwitchFailure(error, !restored);
        }
      } finally {
        releaseActivitySuppression(suppression);
      }
    }, DISCONNECTED_ERROR, { bindingLost: true });
  }

  async function sendTeacherMessage(text) {
    const bindingCapture = captureCommittedBinding();
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
    const normalizedText = text.trim();
    if (teacherSendOwnerIsCurrent(teacherSendOwner)) {
      throw publicError("A Teacher message is already being sent.", "PRACTICE_TEACHER_BUSY");
    }
    const owner = Object.freeze({
      ...bindingCapture,
      token: Symbol("teacher-send"),
    });
    teacherSendOwner = owner;
    const guard = () => teacherSendOwnerIsCurrent(owner);
    const currentChat = structuredClone(persisted.teacherChat);
    const unresolved = currentChat.at(-1);
    const retryingUnresolved = unresolved?.role === "learner"
      && unresolved.text.trim() === normalizedText;
    const priorChat = retryingUnresolved ? currentChat.slice(0, -1) : currentChat;
    const learnerMessage = retryingUnresolved
      ? unresolved
      : parseTeacherChatMessage({
        id: randomUUID(), role: "learner", text: normalizedText, createdAt: at(),
      });

    try {
      await transact((current) => ({
        teacherChat: retryingUnresolved
          ? current.teacherChat
          : [...current.teacherChat, learnerMessage].slice(-40),
        activeSession: reducePracticeSession(current.activeSession, {
          type: "ERROR", error: null, at: at(),
        }),
      }), { guard });
      if (!guard()) return getViewModel();

      const envelope = currentContext();
      if (!envelope) throw new TypeError("Bound Teacher context is unavailable.");
      const answer = await teacherAdapter.respond({
        envelope,
        chat: priorChat,
        learnerMessage: learnerMessage.text,
      });
      if (!guard()) return getViewModel();
      const teacherMessage = parseTeacherChatMessage({
        id: randomUUID(), role: "teacher", text: answer, createdAt: at(),
      });
      return await transact((current) => ({
        teacherChat: [...current.teacherChat, teacherMessage].slice(-40),
        activeSession: reducePracticeSession(current.activeSession, {
          type: "ERROR", error: null, at: at(),
        }),
      }), { guard });
    } catch (error) {
      if (!guard()) return getViewModel();
      if (error?.code === "PRACTICE_SAVE_FAILED") throw error;
      const message = teacherPublicMessage(error);
      await setSessionError(message, guard);
      if (!guard()) return getViewModel();
      throw publicError(message, "PRACTICE_TEACHER_FAILED");
    } finally {
      if (teacherSendOwner?.token === owner.token) teacherSendOwner = null;
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
    if (bindingTransition) {
      return Promise.reject(publicError(BINDING_TRANSITION_ERROR, "PRACTICE_BINDING_TRANSITION"));
    }
    bindingEpoch += 1;
    teacherSendOwner = null;
    pauseReader();
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
    committedBindingGeneration += 1;
    bindingTransition = true;
    activeBindingTransition = null;
    activitySuppressionOwner = null;
    teacherSendOwner = null;
    bindingPromise = null;
    bindingOwner = null;
    listeners.clear();
    try { removeActivityListener(); } catch { /* Cleanup is best effort. */ }
    try { pauseReader(); } catch { /* Cleanup is best effort. */ }
    try { disposeReader(); } catch { /* Cleanup is best effort. */ }
    const queued = stateQueue.catch(() => undefined);
    let teacherCleanup;
    try {
      teacherCleanup = Promise.resolve(teacherAdapter.dispose()).catch(() => undefined);
    } catch {
      teacherCleanup = Promise.resolve();
    }
    await Promise.all([queued, teacherCleanup]);
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
