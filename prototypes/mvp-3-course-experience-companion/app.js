const briefingScene = [
  {
    kicker: "CHAPTER 01 · BRIEFING",
    title: "The first safe handoff",
    speaker: "Hương",
    dialogue:
      "Tonight, you are not asking Codex to “make it better.” You are giving an Executor enough information to produce evidence you can inspect.",
  },
  {
    kicker: "MISSION OBJECTIVE",
    title: "Turn intent into a verifiable brief",
    speaker: "Hương",
    dialogue:
      "Name the goal, the relevant context, the allowed scope, and what observable result would convince you the work is complete.",
  },
  {
    kicker: "READY · WORKSHOP",
    title: "The Executor is waiting",
    speaker: "Hương",
    dialogue:
      "Codex will become your main workspace. I will minimize into the Teacher bubble, keep the course context, and remain available whenever you want to reason together.",
  },
];

const debriefScene = [
  {
    kicker: "CHAPTER 01 · DEBRIEF",
    title: "Evidence before confidence",
    speaker: "Hương",
    dialogue:
      "You did not approve the plan because it sounded competent. You checked its scope, its verification step, and the evidence it promised to return.",
  },
  {
    kicker: "ROOM REWARD UNLOCKED",
    title: "The Verifier’s Lamp",
    speaker: "Hương",
    dialogue:
      "The lamp now belongs in your studio. It is a reminder: an agent’s confidence is not proof. Inspect the artifact, the diff, and the test result.",
  },
];

const state = {
  surface: "home",
  sceneType: "briefing",
  sceneIndex: 0,
  teacherOpen: false,
  missionComplete: localStorage.getItem("course-mock-mission-complete") === "true",
  overlayStack: [],
};

const appShell = document.querySelector("#courseCompanion");
const homeView = document.querySelector("#homeView");
const workshopView = document.querySelector("#workshopView");
const teacherBubble = document.querySelector("#teacherBubble");
const teacherChat = document.querySelector("#teacherChat");
const contextDrawer = document.querySelector("#contextDrawer");
const sceneOverlay = document.querySelector("#sceneOverlay");
const screenShareDialog = document.querySelector("#screenShareDialog");
const chatMessages = document.querySelector("#chatMessages");
const teacherInput = document.querySelector("#teacherInput");
const toast = document.querySelector("#toast");
const liveRegion = document.querySelector("#liveRegion");

function setSurface(surface) {
  state.surface = surface;
  const isWorkshop = surface === "workshop";

  homeView.hidden = isWorkshop;
  workshopView.hidden = !isWorkshop;
  teacherBubble.hidden = !isWorkshop || state.teacherOpen;

  if (!isWorkshop) {
    closeTeacher();
  }

  announce(isWorkshop ? "Codex Workshop opened." : "Home Base opened.");
}

function openPanel(panelId) {
  const panel = document.querySelector(`#${panelId}`);
  if (!panel) return;

  closeGenericPanels();
  panel.hidden = false;
  state.overlayStack.push(panelId);
  panel.querySelector("button")?.focus();
}

function closeGenericPanels() {
  document.querySelectorAll(".side-panel").forEach((panel) => {
    panel.hidden = true;
  });
  state.overlayStack = state.overlayStack.filter((id) => {
    return !["progressPanel", "streakPanel", "rewardPanel"].includes(id);
  });
}

function closeTopLayer() {
  if (screenShareDialog.open) {
    screenShareDialog.close();
    return;
  }

  if (!contextDrawer.hidden) {
    closeContext();
    return;
  }

  if (!teacherChat.hidden) {
    closeTeacher();
    return;
  }

  const topPanelId = state.overlayStack.pop();
  if (topPanelId) {
    document.querySelector(`#${topPanelId}`)?.setAttribute("hidden", "");
    return;
  }

  if (!sceneOverlay.hidden) {
    sceneOverlay.hidden = true;
    announce("Scene closed. Returned to Home Base.");
  }
}

function currentScene() {
  return state.sceneType === "debrief" ? debriefScene : briefingScene;
}

function renderScene() {
  const scenes = currentScene();
  const scene = scenes[state.sceneIndex];

  document.querySelector("#sceneKicker").textContent = scene.kicker;
  document.querySelector("#sceneTitle").textContent = scene.title;
  document.querySelector("#sceneSpeaker").textContent = scene.speaker;
  document.querySelector("#sceneDialogue").textContent = scene.dialogue;
  document.querySelector("#sceneProgress").textContent =
    `${state.sceneIndex + 1} / ${scenes.length}`;

  const nextButton = sceneOverlay.querySelector('[data-action="advance-scene"]');
  nextButton.innerHTML =
    state.sceneIndex === scenes.length - 1
      ? `${state.sceneType === "debrief" ? "Return home" : "Begin mission"} <span aria-hidden="true">→</span>`
      : 'Continue <span aria-hidden="true">→</span>';
}

function openMission() {
  closeGenericPanels();
  state.sceneType = state.missionComplete ? "debrief" : "briefing";
  state.sceneIndex = 0;
  renderScene();
  sceneOverlay.hidden = false;
  sceneOverlay.querySelector('[data-action="advance-scene"]').focus();
  announce(`${state.sceneType} scene opened.`);
}

function advanceScene() {
  const scenes = currentScene();

  if (state.sceneIndex < scenes.length - 1) {
    state.sceneIndex += 1;
    renderScene();
    return;
  }

  sceneOverlay.hidden = true;

  if (state.sceneType === "briefing") {
    localStorage.setItem("course-mock-briefing-viewed", "true");
    setSurface("workshop");
    showToast("Workshop opened · Teacher minimized to the companion bubble.");
  } else {
    setSurface("home");
    showToast("Home Base updated · The Verifier’s Lamp is unlocked.");
  }
}

function openTeacher() {
  state.teacherOpen = true;
  teacherChat.hidden = false;
  teacherBubble.hidden = true;
  teacherInput.focus();
  announce("Teacher Chat opened.");
}

function closeTeacher() {
  state.teacherOpen = false;
  teacherChat.hidden = true;
  contextDrawer.hidden = true;
  teacherBubble.hidden = state.surface !== "workshop";
  announce("Teacher Chat minimized.");
}

function openContext() {
  contextDrawer.hidden = false;
  contextDrawer.querySelector("button")?.focus();
  announce("Teacher context receipt opened.");
}

function closeContext() {
  contextDrawer.hidden = true;
  document.querySelector('[data-action="open-context"]')?.focus();
}

function getTeacherReply(message) {
  const text = message.toLowerCase();

  if (text.includes("scope") || text.includes("safe")) {
    return "The proposed scope is bounded to two named files and begins with inspection. Before approval, add an explicit rule for what the Executor must not change.";
  }

  if (text.includes("evidence") || text.includes("test")) {
    return "Ask for three things: the exact files changed, the diff you should inspect, and the command plus result used to verify the change.";
  }

  if (text.includes("plan") || text.includes("approve")) {
    return "The sequence is reasonable, but step three needs a named check. What result would let you distinguish “implemented” from “implemented correctly”?";
  }

  return "I can help you reason about the current mission, the Executor plan, or the evidence. I will not rewrite the assessed brief for you, but we can inspect one decision at a time.";
}

function addChatMessage(role, message) {
  const article = document.createElement("article");

  if (role === "learner") {
    article.className = "learner-chat-message";
    article.innerHTML = `
      <div>
        <strong>You</strong>
        <p></p>
      </div>
      <span class="learner-mini-avatar">YOU</span>
    `;
  } else {
    article.className = "teacher-message";
    article.innerHTML = `
      <img src="assets/teacher.png" alt="">
      <div>
        <strong>Hương</strong>
        <p></p>
        <time>Just now</time>
      </div>
    `;
  }

  article.querySelector("p").textContent = message;
  chatMessages.appendChild(article);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendTeacherMessage(message) {
  const trimmed = message.trim();
  if (!trimmed) return;

  addChatMessage("learner", trimmed);
  teacherInput.value = "";

  window.setTimeout(() => {
    addChatMessage("teacher", getTeacherReply(trimmed));
  }, 340);
}

function completeSimulatedMission() {
  state.missionComplete = true;
  localStorage.setItem("course-mock-mission-complete", "true");
  updateMissionCompleteUI();

  state.sceneType = "debrief";
  state.sceneIndex = 0;
  renderScene();
  sceneOverlay.hidden = false;
  announce("Simulated evidence completed. Debrief scene opened.");
}

function updateMissionCompleteUI() {
  appShell.classList.toggle("mission-complete", state.missionComplete);
  document.querySelector("#missionStatus").textContent = state.missionComplete
    ? "3 / 3 evidence signals"
    : "0 / 3 evidence signals";
  document.querySelector("#progressMissionCopy").textContent = state.missionComplete
    ? "Complete · Debrief available"
    : "Current · 0 / 3 evidence signals";
  document.querySelector("#rewardHotspotTitle").textContent = state.missionComplete
    ? "Reward unlocked"
    : "One lock remains";
  document.querySelector("#rewardHotspotCopy").textContent = state.missionComplete
    ? "The Verifier’s Lamp"
    : "Finish this mission";
  document.querySelector("#rewardStateTitle").textContent = state.missionComplete
    ? "Unlocked"
    : "Locked";
  document.querySelector("#rewardStateCopy").textContent = state.missionComplete
    ? "The Verifier’s Lamp can now appear beside the workstation in the evolving Home Base."
    : "Complete the current evidence check to place this lamp on your workstation.";
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function announce(message) {
  liveRegion.textContent = "";
  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 20);
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  const handlers = {
    "go-home": () => setSurface("home"),
    "open-mission": openMission,
    "open-workshop": () => setSurface("workshop"),
    "open-teacher": openTeacher,
    "close-teacher": closeTeacher,
    "open-context": openContext,
    "close-context": closeContext,
    "open-progress": () => openPanel("progressPanel"),
    "open-streak": () => openPanel("streakPanel"),
    "open-reward": () => openPanel("rewardPanel"),
    "advance-scene": advanceScene,
    "close-layer": closeTopLayer,
    "complete-mission": completeSimulatedMission,
    "screen-share": () => screenShareDialog.showModal(),
    "confirm-share": () => {
      showToast("View sharing simulated · No screen was captured.");
    },
    "voice-placeholder": () => {
      showToast("Voice is reserved for a later prototype.");
    },
  };

  handlers[action]?.();
});

document.querySelector("#teacherForm").addEventListener("submit", (event) => {
  event.preventDefault();
  sendTeacherMessage(teacherInput.value);
});

document.querySelectorAll("[data-suggest]").forEach((button) => {
  button.addEventListener("click", () => {
    sendTeacherMessage(button.dataset.suggest);
  });
});

document.addEventListener("keydown", (event) => {
  const isTyping =
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement;

  if (event.code === "Escape") {
    closeTopLayer();
    return;
  }

  if (isTyping) return;

  if (event.code === "KeyT") {
    if (state.teacherOpen) {
      closeTeacher();
    } else {
      openTeacher();
    }
  }

  if (event.code === "KeyH") {
    closeGenericPanels();
    sceneOverlay.hidden = true;
    setSurface("home");
  }
});

updateMissionCompleteUI();
setSurface("home");
