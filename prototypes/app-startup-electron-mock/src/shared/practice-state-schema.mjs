import {
  parseActivitySnapshot,
  parseExecutorBinding,
  parsePracticeDefinition,
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

const WORKSPACE_STATE_KEYS = new Set([
  "schemaVersion", "activeRun", "archivedRuns", "pendingTransition",
  "presentation", "teacherChat", "updatedAt",
]);
const WORKSPACE_PRESENTATION_KEYS = new Set([
  "mode", "activePanel", "teacherScrollTop", "progressScrollTop",
  "mainBounds", "bubbleBounds", "popoverBounds",
]);
const RUN_KEYS = new Set([
  "runId", "definitionId", "definitionVersion", "status", "startRequest",
  "binding", "bindingGeneration", "checklist", "createdAt", "updatedAt",
]);
const CHECKLIST_KEYS = new Set([
  "stepId", "completionAuthority", "status", "completion",
]);
const ARCHIVED_RUN_KEYS = new Set([
  "runId", "definitionId", "definitionVersion", "threadId", "displayName",
  "archivedAt", "handoffHash",
]);
const TRANSITION_KEYS = new Set([
  "id", "targetRunId", "sourceRunId", "sourceBindingGeneration", "mode", "stage",
  "targetChat", "handoffHash", "handoff", "attachmentReceipt", "createdAt", "updatedAt",
]);
const ATTACHMENT_RECEIPT_KEYS = new Set(["marker", "hash", "attachedAt", "visible"]);
const HANDOFF_KEYS = new Set([
  "schemaVersion", "sourceThreadId", "sourceDisplayName", "hash", "marker",
  "text", "item", "createdAt",
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HANDOFF_HASH = /^[a-f0-9]{64}$/;
const HANDOFF_FORBIDDEN_TEXT = /authorization\s*:|bearer\s+[A-Za-z0-9._-]+|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|begin [a-z ]*private key/i;
const RUN_STATUSES = new Set(["preparing", "active", "paused"]);
const CHECKLIST_STATUSES = new Set(["completed", "next", "remaining"]);
const TRANSITION_STAGES = new Set([
  "prepared", "target-created", "handoff-prepared", "attached", "verified",
]);

function boundedString(value, label, maximum = 1_000) {
  if (typeof value !== "string" || value.trim() === "" || [...value].length > maximum) {
    throw new TypeError(`${label} must be a non-empty bounded string.`);
  }
  return value;
}

function nonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError(`${label} must be a non-negative integer.`);
  return value;
}

function parseChecklistCompletion(value, authority) {
  const completion = plainObject(value, "Practice checklist completion");
  if (authority === "machine") {
    exactKeys(completion, new Set(["source", "cursor", "observedAt"]), "Practice machine completion");
    if (completion.source !== "bound-executor-chat") throw new TypeError("Machine completion must come from the bound Executor chat.");
    boundedString(completion.cursor, "Machine completion cursor", 500);
    isoTimestamp(completion.observedAt, "Machine completion observedAt");
    return structuredClone(completion);
  }
  exactKeys(completion, new Set(["source", "messageId", "assessedAt"]), "Practice Teacher completion");
  if (completion.source !== "teacher-assessment") throw new TypeError("Teacher completion must come from Teacher assessment.");
  boundedString(completion.messageId, "Teacher completion messageId", 500);
  isoTimestamp(completion.assessedAt, "Teacher completion assessedAt");
  return structuredClone(completion);
}

function parsePracticeChecklist(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new TypeError("Practice checklist must contain between 1 and 20 steps.");
  }
  const stepIds = new Set();
  const checklist = value.map((inputStep, index) => {
    const step = plainObject(inputStep, `Practice checklist step ${index}`);
    exactKeys(step, CHECKLIST_KEYS, "Practice checklist step");
    boundedString(step.stepId, `Practice checklist step ${index}.stepId`, 120);
    if (stepIds.has(step.stepId)) throw new TypeError(`Duplicate Practice checklist step: ${step.stepId}.`);
    stepIds.add(step.stepId);
    if (!new Set(["machine", "teacher"]).has(step.completionAuthority)) {
      throw new TypeError("Invalid Practice checklist completionAuthority.");
    }
    if (!CHECKLIST_STATUSES.has(step.status)) throw new TypeError("Invalid Practice checklist status.");
    const completion = step.status === "completed"
      ? parseChecklistCompletion(step.completion, step.completionAuthority)
      : step.completion === null
        ? null
        : (() => { throw new TypeError("Only completed Practice steps may carry completion evidence."); })();
    return { ...structuredClone(step), completion };
  });

  const incomplete = checklist.filter((step) => step.status !== "completed");
  if (incomplete.length > 0 && incomplete.filter((step) => step.status === "next").length !== 1) {
    throw new TypeError("An incomplete Practice checklist must have exactly one next step.");
  }
  let phase = "completed";
  for (const step of checklist) {
    if (phase === "completed" && step.status === "completed") continue;
    if (phase === "completed" && step.status === "next") {
      phase = "remaining";
      continue;
    }
    if (phase === "remaining" && step.status === "remaining") continue;
    throw new TypeError("Practice checklist steps must remain ordered.");
  }
  return checklist;
}

function parsePracticeRun(value) {
  if (value === null) return null;
  const run = plainObject(value, "Practice active run");
  exactKeys(run, RUN_KEYS, "Practice active run");
  if (!UUID.test(run.runId ?? "")) throw new TypeError("Practice runId must be a UUID.");
  boundedString(run.definitionId, "Practice definitionId", 200);
  boundedString(run.definitionVersion, "Practice definitionVersion", 100);
  if (!RUN_STATUSES.has(run.status)) throw new TypeError("Invalid Practice run status.");
  if (!Number.isSafeInteger(run.bindingGeneration) || run.bindingGeneration < 0) {
    throw new TypeError("Practice bindingGeneration must be a non-negative integer.");
  }
  const startRequest = parsePracticeStartRequest(run.startRequest);
  if (startRequest.missionId !== run.definitionId) throw new TypeError("Practice run definitionId must match its mission.");
  const binding = run.binding === null ? null : parseExecutorBinding(run.binding);
  if (binding && binding.sessionId !== run.runId) throw new TypeError("Practice binding must identify the active run.");
  if (["active", "paused"].includes(run.status) && !binding) throw new TypeError("Active Practice run requires an Executor binding.");
  return {
    ...structuredClone(run),
    startRequest,
    binding,
    checklist: parsePracticeChecklist(run.checklist),
    createdAt: isoTimestamp(run.createdAt, "Practice run createdAt"),
    updatedAt: isoTimestamp(run.updatedAt, "Practice run updatedAt"),
  };
}

function parseArchivedRuns(value) {
  if (!Array.isArray(value) || value.length > 40) throw new TypeError("Archived Practice receipts cannot exceed 40 items.");
  const ids = new Set();
  return value.map((inputReceipt) => {
    const receipt = plainObject(inputReceipt, "Archived Practice receipt");
    exactKeys(receipt, ARCHIVED_RUN_KEYS, "Archived Practice receipt");
    if (!UUID.test(receipt.runId ?? "")) throw new TypeError("Archived Practice runId must be a UUID.");
    if (ids.has(receipt.runId)) throw new TypeError(`Duplicate archived Practice run: ${receipt.runId}.`);
    ids.add(receipt.runId);
    for (const key of ["definitionId", "definitionVersion", "threadId", "displayName"]) {
      boundedString(receipt[key], `Archived Practice ${key}`, 500);
    }
    if (receipt.handoffHash !== null) boundedString(receipt.handoffHash, "Archived Practice handoffHash", 200);
    return { ...structuredClone(receipt), archivedAt: isoTimestamp(receipt.archivedAt, "Archived Practice archivedAt") };
  });
}

function parseAttachmentReceipt(value) {
  if (value === null) return null;
  const receipt = plainObject(value, "Practice attachment receipt");
  exactKeys(receipt, ATTACHMENT_RECEIPT_KEYS, "Practice attachment receipt");
  boundedString(receipt.marker, "Practice attachment marker", 500);
  boundedString(receipt.hash, "Practice attachment hash", 200);
  if (receipt.visible !== true) throw new TypeError("Practice attachment receipt must be visibly verified.");
  return { ...structuredClone(receipt), attachedAt: isoTimestamp(receipt.attachedAt, "Practice attachment attachedAt") };
}

function parsePersistedHandoff(value, activeRun) {
  if (value === null) return null;
  const handoff = plainObject(value, "Practice selective handoff");
  exactKeys(handoff, HANDOFF_KEYS, "Practice selective handoff");
  if (handoff.schemaVersion !== 1) throw new TypeError("Practice selective handoff schemaVersion must equal 1.");
  boundedString(handoff.sourceThreadId, "Practice handoff sourceThreadId", 500);
  boundedString(handoff.sourceDisplayName, "Practice handoff sourceDisplayName", 500);
  if (!HANDOFF_HASH.test(handoff.hash ?? "") || handoff.marker !== `[CBA_HANDOFF_V1:${handoff.hash}]`) {
    throw new TypeError("Practice selective handoff marker and hash are invalid.");
  }
  boundedString(handoff.text, "Practice handoff text", 6_000);
  if (!handoff.text.includes(handoff.marker)) throw new TypeError("Practice handoff text must contain its marker.");
  if (HANDOFF_FORBIDDEN_TEXT.test(handoff.text)) throw new TypeError("Practice handoff text contains forbidden content.");
  const item = plainObject(handoff.item, "Practice handoff item");
  exactKeys(item, new Set(["type", "role", "content"]), "Practice handoff item");
  if (item.type !== "message" || item.role !== "assistant" || !Array.isArray(item.content) || item.content.length !== 1) {
    throw new TypeError("Practice handoff item must be one assistant message.");
  }
  const content = plainObject(item.content[0], "Practice handoff item content");
  exactKeys(content, new Set(["type", "text"]), "Practice handoff item content");
  if (content.type !== "output_text" || content.text !== handoff.text) {
    throw new TypeError("Practice handoff item content must equal the visible handoff text.");
  }
  if (activeRun?.binding && handoff.sourceThreadId !== activeRun.binding.threadId) {
    throw new TypeError("Practice handoff must identify the active source Executor chat.");
  }
  return { ...structuredClone(handoff), createdAt: isoTimestamp(handoff.createdAt, "Practice handoff createdAt") };
}

function parsePendingTransition(value, activeRun) {
  if (value === null) return null;
  const transition = plainObject(value, "Practice pending transition");
  exactKeys(transition, TRANSITION_KEYS, "Practice pending transition");
  if (!UUID.test(transition.id ?? "")) throw new TypeError("Practice transition id must be a UUID.");
  if (!UUID.test(transition.targetRunId ?? "")) throw new TypeError("Practice transition targetRunId must be a UUID.");
  if (!new Set(["fresh", "selective"]).has(transition.mode)) throw new TypeError("Invalid Practice transition mode.");
  if (!TRANSITION_STAGES.has(transition.stage)) throw new TypeError("Invalid Practice transition stage.");
  if (transition.sourceRunId === null) {
    if (transition.sourceBindingGeneration !== null) throw new TypeError("A first Practice transition has no source binding generation.");
  } else {
    if (!activeRun || transition.sourceRunId !== activeRun.runId) throw new TypeError("Pending transition must reference the exact active run.");
    if (transition.sourceBindingGeneration !== activeRun.bindingGeneration) throw new TypeError("Pending transition must reference the exact binding generation.");
  }
  const targetChat = transition.targetChat === null ? null : parseExecutorBinding(transition.targetChat);
  if (targetChat && targetChat.sessionId !== transition.targetRunId) {
    throw new TypeError("Practice transition target chat must identify targetRunId.");
  }
  if (transition.handoffHash !== null) boundedString(transition.handoffHash, "Practice transition handoffHash", 200);
  const handoff = parsePersistedHandoff(transition.handoff, activeRun);
  if (handoff && transition.handoffHash !== handoff.hash) {
    throw new TypeError("Practice transition handoff hash must match its payload.");
  }
  const attachmentReceipt = parseAttachmentReceipt(transition.attachmentReceipt);
  if (attachmentReceipt && transition.handoffHash !== attachmentReceipt.hash) {
    throw new TypeError("Practice attachment receipt hash must match the handoff hash.");
  }
  if (transition.stage === "prepared" && targetChat !== null) {
    throw new TypeError("Prepared Practice transition cannot have a target chat.");
  }
  if (transition.stage !== "prepared" && targetChat === null) {
    throw new TypeError("Advanced Practice transition requires a target chat.");
  }
  if (transition.mode === "fresh") {
    if (handoff !== null || transition.handoffHash !== null || attachmentReceipt !== null) {
      throw new TypeError("Fresh Practice transition cannot contain handoff data.");
    }
  } else if (["prepared", "target-created"].includes(transition.stage)) {
    if (handoff !== null || transition.handoffHash !== null || attachmentReceipt !== null) {
      throw new TypeError("Selective handoff data is not valid before handoff preparation.");
    }
  } else {
    if (handoff === null || transition.handoffHash !== handoff.hash) {
      throw new TypeError("Selective Practice transition requires its persisted handoff.");
    }
    if (["attached", "verified"].includes(transition.stage) && attachmentReceipt === null) {
      throw new TypeError("Attached Practice transition requires a visible receipt.");
    }
    if (transition.stage === "handoff-prepared" && attachmentReceipt !== null) {
      throw new TypeError("Handoff preparation cannot contain an attachment receipt.");
    }
  }
  return {
    ...structuredClone(transition),
    targetChat,
    handoff,
    attachmentReceipt,
    createdAt: isoTimestamp(transition.createdAt, "Practice transition createdAt"),
    updatedAt: isoTimestamp(transition.updatedAt, "Practice transition updatedAt"),
  };
}

export function createDefaultPracticeWorkspaceState(clock = () => new Date()) {
  return {
    schemaVersion: 2,
    activeRun: null,
    archivedRuns: [],
    pendingTransition: null,
    presentation: {
      mode: "full",
      activePanel: "teacher",
      teacherScrollTop: 0,
      progressScrollTop: 0,
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: clock().toISOString(),
  };
}

export function parsePracticeWorkspaceState(input) {
  const state = plainObject(input, "Practice workspace state");
  rejectForbiddenState(state, "practiceWorkspaceState");
  exactKeys(state, WORKSPACE_STATE_KEYS, "Practice workspace");
  if (state.schemaVersion !== 2) throw new TypeError("Practice workspace schemaVersion must equal 2.");
  const updatedAt = isoTimestamp(state.updatedAt, "Practice workspace updatedAt");
  const activeRun = parsePracticeRun(state.activeRun);
  const archivedRuns = parseArchivedRuns(state.archivedRuns);
  if (activeRun && archivedRuns.some((receipt) => receipt.runId === activeRun.runId)) {
    throw new TypeError("The active Practice run cannot also be archived.");
  }
  const presentation = plainObject(state.presentation, "Practice workspace presentation");
  exactKeys(presentation, WORKSPACE_PRESENTATION_KEYS, "Practice workspace presentation");
  if (!MODES.has(presentation.mode)) throw new TypeError("Invalid Practice workspace mode.");
  if (!new Set(["teacher", "progress"]).has(presentation.activePanel)) throw new TypeError("Invalid Practice workspace panel.");
  for (const key of ["teacherScrollTop", "progressScrollTop"]) nonNegativeInteger(presentation[key], key);
  if (!Array.isArray(state.teacherChat)) throw new TypeError("Teacher chat must be an array.");
  return {
    schemaVersion: 2,
    activeRun,
    archivedRuns,
    pendingTransition: parsePendingTransition(state.pendingTransition, activeRun),
    presentation: {
      mode: presentation.mode,
      activePanel: presentation.activePanel,
      teacherScrollTop: presentation.teacherScrollTop,
      progressScrollTop: presentation.progressScrollTop,
      mainBounds: parseBounds(presentation.mainBounds, "mainBounds"),
      bubbleBounds: parseBounds(presentation.bubbleBounds, "bubbleBounds"),
      popoverBounds: parseBounds(presentation.popoverBounds, "popoverBounds"),
    },
    teacherChat: state.teacherChat.map(parseTeacherChatMessage).slice(-40),
    updatedAt,
  };
}

export function migrateLegacyPracticeState(input, inputDefinition, clock = () => new Date()) {
  const legacy = parsePracticeState(input);
  const definition = parsePracticeDefinition(inputDefinition);
  const fallbackTimestamp = clock().toISOString();
  const migrated = createDefaultPracticeWorkspaceState(() => new Date(legacy.updatedAt ?? fallbackTimestamp));
  migrated.presentation = {
    mode: legacy.presentation.mode,
    activePanel: legacy.presentation.lastFullTab === "teacher" ? "teacher" : "progress",
    teacherScrollTop: 0,
    progressScrollTop: 0,
    mainBounds: legacy.presentation.mainBounds,
    bubbleBounds: legacy.presentation.bubbleBounds,
    popoverBounds: legacy.presentation.popoverBounds,
  };
  migrated.teacherChat = structuredClone(legacy.teacherChat);
  migrated.updatedAt = legacy.updatedAt;
  if (!legacy.activeSession) return parsePracticeWorkspaceState(migrated);
  if (legacy.activeSession.startRequest.missionId !== definition.id) {
    throw new TypeError("Legacy Practice mission does not match the supplied definition.");
  }
  if (!UUID.test(legacy.activeSession.sessionId)) {
    throw new TypeError("Legacy Practice sessionId must be a UUID before migration.");
  }
  const binding = legacy.activeSession.binding === null
    ? null
    : parseExecutorBinding(legacy.activeSession.binding);
  if (binding && binding.sessionId !== legacy.activeSession.sessionId) {
    throw new TypeError("Legacy Practice binding must identify the exact session.");
  }
  const status = legacy.activeSession.lifecycle === "paused"
    ? "paused"
    : binding
      ? "active"
      : "preparing";
  migrated.activeRun = {
    runId: legacy.activeSession.sessionId,
    definitionId: definition.id,
    definitionVersion: definition.version,
    status,
    startRequest: structuredClone(legacy.activeSession.startRequest),
    binding,
    bindingGeneration: binding ? 1 : 0,
    checklist: definition.steps.map((step, index) => ({
      stepId: step.id,
      completionAuthority: step.completionAuthority,
      status: index === 0 ? "next" : "remaining",
      completion: null,
    })),
    createdAt: legacy.activeSession.updatedAt,
    updatedAt: legacy.activeSession.updatedAt,
  };
  return parsePracticeWorkspaceState(migrated);
}
