const scenarios = Object.freeze({
  start: {
    label: "I start a lesson",
    summary:
      "The course loads your progress, explains the mission, and connects the right Codex conversation.",
    actors: ["learner", "course", "codex"],
    connections: ["learner-course", "learner-codex", "course-codex"],
    steps: [
      ["Open the course", "Your saved progress loads."],
      ["See the mission", "A short briefing explains today's goal."],
      ["Connect Codex", "Choose the conversation for this mission."],
      ["Begin working", "Codex becomes your main screen."],
    ],
    outcome: "The course and Teacher now follow the correct mission work.",
    status: "CONNECTED",
  },
  work: {
    label: "I work in Codex",
    summary:
      "You instruct the Executor in Codex. Relevant results return to the course as evidence.",
    actors: ["learner", "course", "codex", "files"],
    connections: ["learner-codex", "codex-files", "files-course", "course-codex"],
    steps: [
      ["Give instructions", "Ask the Executor to do scoped work."],
      ["Approve the plan", "You stay responsible for important choices."],
      ["Build and test", "The Executor edits, runs, and verifies."],
      ["Return evidence", "Relevant results update the mission."],
    ],
    outcome: "The Teacher can follow progress without taking over the Executor.",
    status: "WORKING",
  },
  ask: {
    label: "I ask the Teacher",
    summary:
      "The Teacher receives your question and only the course context needed to help.",
    actors: ["learner", "course", "teacher", "codex"],
    connections: ["learner-course", "course-teacher", "course-codex", "learner-teacher"],
    steps: [
      ["Open the bubble", "Teacher Chat appears over your work."],
      ["Collect context", "The course gathers only relevant information."],
      ["Get coaching", "The Teacher explains, questions, or hints."],
      ["Choose your next move", "You decide what to do in Codex."],
    ],
    outcome: "Teacher coaching never silently changes your project files.",
    status: "TEACHER READY",
  },
  finish: {
    label: "I finish a mission",
    summary:
      "The course checks real results, and the Teacher checks your understanding before completion.",
    actors: ["learner", "course", "teacher", "codex", "files"],
    connections: ["learner-course", "codex-files", "files-course", "course-teacher"],
    steps: [
      ["Check the work", "Files, tests, and required results are inspected."],
      ["Check understanding", "The Teacher asks you to explain key choices."],
      ["Resolve the mission", "Evidence and understanding must both pass."],
      ["Continue the course", "Your progress and Home Base update."],
    ],
    outcome: "Saying done is not enough; a mission finishes with evidence.",
    status: "CHECKING EVIDENCE",
  },
  share: {
    label: "I share my screen",
    summary:
      "You choose exactly what the Teacher can see, for how long, and when sharing stops.",
    actors: ["learner", "course", "teacher"],
    connections: ["learner-course", "course-teacher"],
    steps: [
      ["Choose Share view", "Start from Teacher Chat."],
      ["Pick one source", "Select a window, region, or screenshot."],
      ["Confirm the scope", "Review what is shared and for how long."],
      ["Stop at any time", "The sharing indicator always stays visible."],
    ],
    outcome: "Screen context stays optional, limited, visible, and revocable.",
    status: "ASKS FIRST",
  },
  disconnect: {
    label: "Something disconnects",
    summary:
      "The course shows which connection is old or unavailable while keeping your progress safe.",
    actors: ["learner", "course", "teacher", "codex"],
    connections: ["learner-course", "course-codex", "course-teacher"],
    steps: [
      ["Show the problem", "The course names the stale connection."],
      ["Keep progress safe", "Your mission and completed work remain saved."],
      ["Reconnect or continue", "Codex work can continue without the Teacher."],
      ["Mark old context", "The Teacher never pretends old information is current."],
    ],
    outcome: "A lost connection does not erase your course progress.",
    status: "CONTEXT MAY BE OLD",
  },
});

const scenarioButtons = [...document.querySelectorAll("[data-scenario]")];
const actorElements = [...document.querySelectorAll("[data-actor]")];
const connectionElements = [...document.querySelectorAll("[data-connection]")];
const connectionLabels = [
  ...document.querySelectorAll("[data-connection-label]"),
];
const flowSteps = document.querySelector("#flowSteps");
const stage = document.querySelector(".actor-stage");

function renderSteps(steps) {
  flowSteps.replaceChildren(
    ...steps.map(([title, detail], index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      const copy = document.createElement("div");
      const heading = document.createElement("strong");
      const paragraph = document.createElement("p");

      number.textContent = String(index + 1);
      heading.textContent = title;
      paragraph.textContent = detail;
      copy.append(heading, paragraph);
      item.append(number, copy);
      return item;
    }),
  );
}

function setScenario(scenarioId, { moveFocus = false } = {}) {
  const scenario = scenarios[scenarioId];
  if (!scenario) return;

  scenarioButtons.forEach((button) => {
    const selected = button.dataset.scenario === scenarioId;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected && moveFocus) button.focus();
  });

  actorElements.forEach((actor) => {
    actor.classList.toggle(
      "is-active",
      scenario.actors.includes(actor.dataset.actor),
    );
  });

  connectionElements.forEach((connection) => {
    connection.classList.toggle(
      "is-active",
      scenario.connections.includes(connection.dataset.connection),
    );
  });

  connectionLabels.forEach((label) => {
    label.classList.toggle(
      "is-active",
      scenario.connections.includes(label.dataset.connectionLabel),
    );
  });

  document.querySelector("#flowTitle").textContent = scenario.label;
  document.querySelector("#flowSummary").textContent = scenario.summary;
  document.querySelector("#flowOutcome").textContent = scenario.outcome;
  document.querySelector("#flowStatus").textContent = scenario.status;
  renderSteps(scenario.steps);

  const activeActorCount = scenario.actors.length;
  stage.setAttribute(
    "aria-label",
    `${scenario.label}. ${activeActorCount} active people or tools. ${scenario.outcome}`,
  );
  document.documentElement.dataset.activeScenario = scenarioId;
}

scenarioButtons.forEach((button, index) => {
  button.addEventListener("click", () => setScenario(button.dataset.scenario));
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    let nextIndex = index;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % scenarioButtons.length;
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + scenarioButtons.length) % scenarioButtons.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = scenarioButtons.length - 1;

    setScenario(scenarioButtons[nextIndex].dataset.scenario, {
      moveFocus: true,
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.target.matches("input, textarea, select, summary")
  ) {
    return;
  }

  const numericIndex = Number(event.key) - 1;
  if (numericIndex >= 0 && numericIndex < scenarioButtons.length) {
    setScenario(scenarioButtons[numericIndex].dataset.scenario);
  }
});

setScenario("start");
