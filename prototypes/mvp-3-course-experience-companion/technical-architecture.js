const flows = Object.freeze({
  overview: {
    label: "System overview",
    code: "FLOW / 00",
    summary:
      "The companion coordinates learning while Codex remains the real work surface. Context crosses boundaries only through named, inspectable adapters.",
    status: "PROPOSED — adapter spike required",
    caveat:
      "App Server capabilities and Hooks lifecycle events are documented; native-surface thread correlation still needs validation.",
    nodes: ["learner", "companion-ui", "orchestrator", "thread-binder", "context-broker", "consent-gate", "state-store", "teacher-service", "assessment", "codex-adapter", "codex-executor", "workspace", "evidence-collector", "capture-adapter", "codex-service"],
    edges: ["learner-ui", "ui-orchestrator", "orchestrator-state", "orchestrator-binder", "binder-adapter", "adapter-executor", "executor-workspace", "workspace-evidence", "evidence-broker", "adapter-broker", "broker-teacher", "teacher-ui", "capture-consent", "consent-broker", "executor-openai", "teacher-assessment"],
    packet: ["course", "executor", "workspace", "assessment", "sharedView", "provenance"],
    packetState: "SCOPED SNAPSHOT",
    steps: [
      ["Learner controls the loop", "Prompts, approvals, and decisions stay learner-owned."],
      ["One mission binds to one thread", "No window-title guessing or unrelated conversation access."],
      ["Context is assembled, not copied wholesale", "Every dynamic field has scope, source, and freshness."],
    ],
  },
  launch: {
    label: "Start or resume",
    code: "FLOW / 01",
    summary:
      "The mission loads local course state, plays its authored briefing, then requires the learner to create or select the exact Executor thread.",
    status: "MVP PATH — explicit selection required",
    caveat:
      "If a saved thread cannot be validated, course progress survives and the Workshop presents a reconnect action.",
    nodes: ["learner", "companion-ui", "orchestrator", "state-store", "thread-binder", "codex-adapter", "codex-executor"],
    edges: ["learner-ui", "ui-orchestrator", "orchestrator-state", "orchestrator-binder", "binder-adapter", "adapter-executor"],
    packet: ["course", "executor", "provenance"],
    packetState: "BINDING CREATED",
    steps: [
      ["Load the course run", "Read checkpoint, narrative progress, prior evidence, and saved binding."],
      ["Play the authored briefing", "Story sets the mission; the Teacher does not invent canonical plot."],
      ["Bind the Executor thread", "Persist courseRunId, missionId, threadId, and workspace root together."],
    ],
  },
  executor: {
    label: "Executor work",
    code: "FLOW / 02",
    summary:
      "The learner works directly in Codex. Scoped lifecycle events and workspace results update the broker without turning the companion into a second coding interface.",
    status: "TECHNICAL SPIKE — event correlation",
    caveat:
      "Validate prompt, tool, approval, result, stop, and restart events on the chosen Codex surface.",
    nodes: ["learner", "codex-executor", "codex-adapter", "workspace", "evidence-collector", "context-broker", "codex-service"],
    edges: ["adapter-executor", "executor-workspace", "workspace-evidence", "evidence-broker", "adapter-broker", "executor-openai"],
    packet: ["executor", "workspace", "provenance"],
    packetState: "EXECUTOR DELTA",
    steps: [
      ["Learner prompts in Codex", "The Executor acts only within normal Codex permissions and approvals."],
      ["Adapter normalizes events", "Only events matching the explicitly bound threadId are accepted."],
      ["Workspace produces evidence", "Changed files, command results, tests, and artifacts update independently of chat claims."],
    ],
  },
  teacher: {
    label: "Ask Teacher",
    code: "FLOW / 03",
    summary:
      "Opening the bubble sends the learner's question with a bounded context envelope. The Teacher coaches and assesses but cannot silently operate the Executor.",
    status: "PROPOSED — scoped Teacher API",
    caveat:
      "Exact recent turns are fetched on demand; older history is summarized to keep the context explainable and bounded.",
    nodes: ["learner", "companion-ui", "context-broker", "teacher-service", "assessment", "orchestrator", "codex-adapter"],
    edges: ["learner-ui", "ui-orchestrator", "adapter-broker", "broker-teacher", "teacher-assessment", "teacher-ui"],
    packet: ["course", "executor", "workspace", "assessment", "provenance"],
    packetState: "NEXT TEACHER TURN",
    steps: [
      ["Ask through the bubble", "The overlay preserves the underlying Codex Workshop."],
      ["Assemble a context receipt", "Course, Executor, evidence, mastery, and freshness are visible before sending."],
      ["Return coaching", "Teacher responds with explanation or hints; learner decides what reaches Codex."],
    ],
  },
  evidence: {
    label: "Evidence gate",
    code: "FLOW / 04",
    summary:
      "A mission completes only when observable workspace evidence and learner-owned answers satisfy the checkpoint rubric.",
    status: "MVP PATH — deterministic evidence first",
    caveat:
      "Start with changed-file presence, diff summary, one deterministic test, and a learner explanation; add domain-specific adapters later.",
    nodes: ["codex-executor", "workspace", "evidence-collector", "context-broker", "teacher-service", "assessment", "orchestrator", "companion-ui"],
    edges: ["executor-workspace", "workspace-evidence", "evidence-broker", "broker-teacher", "teacher-assessment", "teacher-ui", "ui-orchestrator"],
    packet: ["course", "workspace", "assessment", "provenance"],
    packetState: "CHECKPOINT REVIEW",
    steps: [
      ["Collect observable results", "Use artifacts, diffs, commands, and tests—not a conversational “done.”"],
      ["Assess against the rubric", "Teacher combines evidence with a learner-owned explanation."],
      ["Resolve the checkpoint", "Pass triggers authored debrief; retry returns a bounded hint and restores Workshop."],
    ],
  },
  share: {
    label: "Share view",
    code: "FLOW / 05",
    summary:
      "A current tab, window, region, or screenshot is a separate opt-in source. It is previewed, bounded, visible while active, and revocable.",
    status: "OPTIONAL — not Phase 1 critical path",
    caveat:
      "Platform capture APIs and permissions vary. Begin with a single user-triggered screenshot before considering bounded streaming.",
    nodes: ["learner", "companion-ui", "capture-adapter", "consent-gate", "context-broker", "teacher-service"],
    edges: ["learner-ui", "capture-consent", "consent-broker", "broker-teacher", "teacher-ui"],
    packet: ["course", "sharedView", "provenance"],
    packetState: "EPHEMERAL ATTACHMENT",
    steps: [
      ["Choose Share view", "The learner selects exactly one source and duration."],
      ["Preview and redact", "Consent UI shows scope, exclusions, expiry, and a Stop control."],
      ["Attach to one Teacher turn", "The shared view expires; no silent continuous screen capture is created."],
    ],
  },
  recovery: {
    label: "Recovery",
    code: "FLOW / 06",
    summary:
      "Course progress and Codex connectivity fail independently. The learner can continue working when Teacher context is stale or offline.",
    status: "REQUIRED — degraded states are first-class",
    caveat:
      "A missing adapter must never erase mission state or fabricate fresh context; surface timestamps and reconnect explicitly.",
    nodes: ["companion-ui", "orchestrator", "state-store", "thread-binder", "codex-adapter", "context-broker", "teacher-service"],
    edges: ["ui-orchestrator", "orchestrator-state", "orchestrator-binder", "binder-adapter", "adapter-broker", "broker-teacher", "teacher-ui"],
    packet: ["course", "executor", "provenance"],
    packetState: "STALE / DEGRADED",
    steps: [
      ["Detect the failed source", "Mark the bound thread, adapter stream, Teacher service, or evidence collector separately."],
      ["Preserve the course run", "Narrative, checkpoint, evidence, and room unlocks remain in local state."],
      ["Recover without guessing", "Rebind, retry, or continue in Codex with a visible stale-context receipt."],
    ],
  },
});

const flowButtons = [...document.querySelectorAll("[data-flow]")];
const nodeElements = [...document.querySelectorAll("[data-node]")];
const edgeElements = [...document.querySelectorAll("[data-edge]")];
const packetElements = [...document.querySelectorAll("[data-packet]")];
const traceSteps = document.querySelector("#traceSteps");

function renderSteps(steps) {
  traceSteps.replaceChildren(
    ...steps.map(([title, detail], index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      const copy = document.createElement("div");
      const heading = document.createElement("strong");
      const paragraph = document.createElement("p");

      number.textContent = String(index + 1).padStart(2, "0");
      heading.textContent = title;
      paragraph.textContent = detail;
      copy.append(heading, paragraph);
      item.append(number, copy);
      return item;
    }),
  );
}

function setFlow(flowId, { moveFocus = false } = {}) {
  const flow = flows[flowId];
  if (!flow) return;

  flowButtons.forEach((button) => {
    const selected = button.dataset.flow === flowId;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) button.focus();
  });

  nodeElements.forEach((node) => {
    node.classList.toggle("is-active", flow.nodes.includes(node.dataset.node));
  });

  edgeElements.forEach((edge) => {
    edge.classList.toggle("is-active", flow.edges.includes(edge.dataset.edge));
  });

  packetElements.forEach((packet) => {
    packet.classList.toggle(
      "is-active",
      flow.packet.includes(packet.dataset.packet),
    );
  });

  document.querySelector("#traceCode").textContent = flow.code;
  document.querySelector("#traceTitle").textContent = flow.label;
  document.querySelector("#traceSummary").textContent = flow.summary;
  document.querySelector("#traceStatus").textContent = flow.status;
  document.querySelector("#traceCaveat").textContent = flow.caveat;
  document.querySelector("#packetState").textContent = flow.packetState;
  document.querySelector("#activeNodeCount").textContent = flow.nodes.length;
  document.querySelector("#activeEdgeCount").textContent = flow.edges.length;
  renderSteps(flow.steps);

  document.documentElement.dataset.activeFlow = flowId;
}

flowButtons.forEach((button, index) => {
  button.addEventListener("click", () => setFlow(button.dataset.flow));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "ArrowRight") nextIndex = (index + 1) % flowButtons.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + flowButtons.length) % flowButtons.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = flowButtons.length - 1;

    setFlow(flowButtons[nextIndex].dataset.flow, { moveFocus: true });
  });
});

document.addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.matches("input, textarea, select")
  ) {
    return;
  }

  const numericIndex = Number(event.key) - 1;
  if (numericIndex >= 0 && numericIndex < flowButtons.length) {
    setFlow(flowButtons[numericIndex].dataset.flow);
  }
});

setFlow("overview");
