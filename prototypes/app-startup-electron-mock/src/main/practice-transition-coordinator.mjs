import { parsePracticeDefinition } from "../shared/practice-contracts.mjs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CANCELLABLE_STAGES = new Set(["prepared", "target-created", "handoff-prepared"]);

function assertUuid(value, label) {
  if (typeof value !== "string" || !UUID.test(value)) throw new TypeError(`${label} must be a UUID.`);
  return value;
}

function safeNavigation(binding) {
  return { opened: false, fallbackName: binding.displayName };
}

export function createPracticeTransitionCoordinator({
  store,
  chatCoordinator,
  loadStartRequest,
  createId,
  clock = () => new Date(),
}) {
  if (typeof store?.read !== "function" || typeof store?.write !== "function") {
    throw new TypeError("Practice transition coordinator requires a workspace store.");
  }
  for (const method of ["createTargetChat", "prepareSelectiveHandoff", "attachSelectiveHandoff", "openChat"]) {
    if (typeof chatCoordinator?.[method] !== "function") {
      throw new TypeError(`Practice transition coordinator requires chatCoordinator.${method}.`);
    }
  }
  if (typeof loadStartRequest !== "function" || typeof createId !== "function") {
    throw new TypeError("Practice transition coordinator requires start-request and ID providers.");
  }

  let inFlight = null;

  function now() {
    const value = clock().toISOString();
    if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
      throw new TypeError("Practice transition clock must return a valid date.");
    }
    return value;
  }

  function shared(operation) {
    if (inFlight) return inFlight;
    const current = Promise.resolve().then(operation);
    inFlight = current.finally(() => {
      if (inFlight === current || inFlight === wrapped) inFlight = null;
    });
    const wrapped = inFlight;
    return wrapped;
  }

  async function writePending(state, fields) {
    const updatedAt = now();
    return store.write({
      ...state,
      pendingTransition: { ...state.pendingTransition, ...fields, updatedAt },
      updatedAt,
    });
  }

  async function commitTransition(state, startRequest) {
    const transition = state.pendingTransition;
    if (!transition || transition.stage !== "verified" || !transition.targetChat) {
      throw new TypeError("Only a verified Practice transition can commit.");
    }
    if (transition.sourceRunId !== null) {
      if (!state.activeRun
        || state.activeRun.runId !== transition.sourceRunId
        || state.activeRun.bindingGeneration !== transition.sourceBindingGeneration) {
        throw new TypeError("The active Practice run changed before transition commit.");
      }
    } else if (state.activeRun !== null) {
      throw new TypeError("A first-Practice transition cannot replace an active run.");
    }
    const definition = parsePracticeDefinition(startRequest.practiceDefinition);
    if (definition.id !== startRequest.missionId) throw new TypeError("Practice definition must match the mission.");
    const timestamp = now();
    const archivedRuns = [...state.archivedRuns];
    if (state.activeRun) {
      if (!state.activeRun.binding) throw new TypeError("An active Practice run must have an exact Executor chat before switching.");
      archivedRuns.push({
        runId: state.activeRun.runId,
        definitionId: state.activeRun.definitionId,
        definitionVersion: state.activeRun.definitionVersion,
        threadId: state.activeRun.binding.threadId,
        displayName: state.activeRun.binding.displayName,
        archivedAt: timestamp,
        handoffHash: transition.handoffHash,
      });
    }
    const bindingGeneration = state.activeRun ? state.activeRun.bindingGeneration + 1 : 1;
    const committed = await store.write({
      ...state,
      activeRun: {
        runId: transition.targetRunId,
        definitionId: definition.id,
        definitionVersion: definition.version,
        status: "active",
        startRequest,
        binding: transition.targetChat,
        bindingGeneration,
        checklist: definition.steps.map((step, index) => ({
          stepId: step.id,
          completionAuthority: step.completionAuthority,
          status: index === 0 ? "next" : "remaining",
          completion: null,
        })),
        createdAt: transition.createdAt,
        updatedAt: timestamp,
      },
      archivedRuns: archivedRuns.slice(-40),
      pendingTransition: null,
      updatedAt: timestamp,
    });
    let navigation;
    try {
      navigation = await chatCoordinator.openChat(committed.activeRun.binding);
    } catch {
      navigation = safeNavigation(committed.activeRun.binding);
    }
    return { state: committed, navigation };
  }

  async function continuePending() {
    const startRequest = await loadStartRequest();
    let state = await store.read();
    if (!state.pendingTransition) return { state, navigation: null };

    while (state.pendingTransition) {
      const transition = state.pendingTransition;
      if (transition.stage === "prepared") {
        const targetChat = await chatCoordinator.createTargetChat({
          startRequest,
          targetRunId: transition.targetRunId,
        });
        state = await writePending(state, { stage: "target-created", targetChat });
        continue;
      }
      if (transition.stage === "target-created") {
        if (transition.mode === "fresh") {
          state = await writePending(state, { stage: "verified" });
        } else {
          if (!state.activeRun?.binding) throw new TypeError("Selective transfer requires the exact active Executor chat.");
          const handoff = await chatCoordinator.prepareSelectiveHandoff({
            startRequest,
            sourceBinding: state.activeRun.binding,
          });
          state = await writePending(state, {
            stage: "handoff-prepared",
            handoffHash: handoff.hash,
            handoff,
          });
        }
        continue;
      }
      if (transition.stage === "handoff-prepared") {
        const receipt = await chatCoordinator.attachSelectiveHandoff({
          startRequest,
          targetBinding: transition.targetChat,
          handoff: transition.handoff,
        });
        state = await writePending(state, {
          stage: "attached",
          attachmentReceipt: {
            marker: receipt.marker,
            hash: receipt.hash,
            attachedAt: receipt.attachedAt,
            visible: receipt.visible,
          },
        });
        continue;
      }
      if (transition.stage === "attached") {
        state = await writePending(state, { stage: "verified" });
        continue;
      }
      if (transition.stage === "verified") return commitTransition(state, startRequest);
      throw new TypeError("Unsupported Practice transition stage.");
    }
    return { state, navigation: null };
  }

  function beginSwitch({ mode }) {
    return shared(async () => {
      if (!new Set(["fresh", "selective"]).has(mode)) throw new TypeError("Practice switch mode must be fresh or selective.");
      const state = await store.read();
      if (state.pendingTransition) throw new TypeError("A Practice switch is already pending.");
      if (mode === "selective" && !state.activeRun?.binding) {
        throw new TypeError("Selective transfer requires an active bound Practice run.");
      }
      const transitionId = assertUuid(createId(), "Practice transition id");
      const targetRunId = assertUuid(createId(), "Practice target run id");
      const timestamp = now();
      await store.write({
        ...state,
        pendingTransition: {
          id: transitionId,
          targetRunId,
          sourceRunId: state.activeRun?.runId ?? null,
          sourceBindingGeneration: state.activeRun?.bindingGeneration ?? null,
          mode,
          stage: "prepared",
          targetChat: null,
          handoffHash: null,
          handoff: null,
          attachmentReceipt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        updatedAt: timestamp,
      });
      return continuePending();
    });
  }

  function retrySwitch() {
    return shared(continuePending);
  }

  async function cancelSwitch() {
    if (inFlight) throw new TypeError("Practice switch is busy and cannot be cancelled yet.");
    const state = await store.read();
    if (!state.pendingTransition) return state;
    if (!CANCELLABLE_STAGES.has(state.pendingTransition.stage)) {
      throw new TypeError("Practice switch cannot be cancelled after attachment.");
    }
    const timestamp = now();
    return store.write({ ...state, pendingTransition: null, updatedAt: timestamp });
  }

  async function resumeActive() {
    const state = await store.read();
    if (!state.activeRun?.binding) throw new TypeError("There is no active Executor chat to resume.");
    let navigation;
    try {
      navigation = await chatCoordinator.openChat(state.activeRun.binding);
    } catch {
      navigation = safeNavigation(state.activeRun.binding);
    }
    return { state, navigation };
  }

  return Object.freeze({ beginSwitch, retrySwitch, cancelSwitch, resumeActive });
}
