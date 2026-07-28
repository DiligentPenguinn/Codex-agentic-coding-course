const STORAGE_KEY = "codex-academy-pixel-onboarding-v1";

const story = [
  {
    avatar: "T",
    speaker: "TEACHER",
    role: "NGƯỜI DẪN ĐƯỜNG",
    title: "TÍN HIỆU ĐẦU TIÊN",
    text: "Chào bạn. Đây không phải khóa học biến bạn thành lập trình viên. Đây là hành trình giúp bạn biến một công việc nội dung lặp lại thành công cụ của riêng mình."
  },
  {
    avatar: "E",
    speaker: "EXECUTOR",
    role: "CỘNG SỰ THỰC THI",
    title: "MỘT SỨC MẠNH MỚI",
    text: "Tôi là Codex. Tôi có thể đọc workspace, lập kế hoạch, sửa file và chạy kiểm tra. Nhưng tôi không tự quyết định mục tiêu hay điều gì đủ tốt."
  },
  {
    avatar: "Y",
    speaker: "BẠN",
    role: "NGƯỜI GIỮ QUYỀN QUYẾT ĐỊNH",
    title: "VAI TRÒ CỦA BẠN",
    text: "Bạn không cần hiểu mọi dòng code. Bạn giữ mục tiêu, phê duyệt hành động có rủi ro và dùng bằng chứng để quyết định kết quả có được chấp nhận hay không."
  },
  {
    avatar: "T",
    speaker: "TEACHER",
    role: "LUẬT ĐẦU TIÊN",
    title: "ĐỌC TRƯỚC KHI SỬA",
    text: "Nhiệm vụ đầu tiên sẽ rất nhỏ: yêu cầu Codex quan sát workspace mà không thay đổi gì. Bạn sẽ thấy cách cộng tác an toàn trước khi chúng ta hỏi về công việc của bạn."
  }
];

const cockpitSteps = [
  {
    view: "chat",
    kicker: "NƠI BẠN BẮT ĐẦU",
    title: "Trò chuyện bằng ngôn ngữ bình thường",
    description: "Bạn không cần prompt hoàn hảo. Teacher sẽ giải thích, hỏi từng câu một và giúp bạn biến ý tưởng thành yêu cầu rõ ràng."
  },
  {
    view: "workspace",
    kicker: "NGUỒN SỰ THẬT",
    title: "Workspace là thư mục dự án đang mở",
    description: "Khóa học, ứng dụng ContentPilot và artifact của bạn cùng nằm ở đây. Codex đọc những file này để hiểu bối cảnh trước khi hành động."
  },
  {
    view: "approval",
    kicker: "ĐIỂM DỪNG AN TOÀN",
    title: "Approval cho bạn quyền nói có hoặc không",
    description: "Khi Codex muốn sửa file, cài dependency hoặc chạm hệ thống bên ngoài, hãy xem phạm vi rồi mới cho phép. Approval không phải lỗi."
  },
  {
    view: "changes",
    kicker: "BẰNG CHỨNG THAY ĐỔI",
    title: "Changes và diff cho thấy điều gì đã đổi",
    description: "Bạn không cần đọc mọi dòng. Hãy kiểm tra đúng file, đúng phạm vi và yêu cầu test hoặc quan sát giao diện trước khi chấp nhận."
  }
];

const progressByScreen = {
  start: { width: 20, label: "CỔNG KHỞI HÀNH", count: "01 / 05" },
  story: { width: 40, label: "GẶP ĐỘI CỦA BẠN", count: "02 / 05" },
  map: { width: 60, label: "BẢN ĐỒ HÀNH TRÌNH", count: "03 / 05" },
  cockpit: { width: 80, label: "PHÒNG ĐIỀU KHIỂN", count: "04 / 05" },
  complete: { width: 100, label: "CHECKPOINT ĐÃ MỞ", count: "05 / 05" }
};

const screens = Array.from(document.querySelectorAll("[data-screen]"));
const progressBar = document.querySelector("#progressBar");
const progressLabel = document.querySelector("#progressLabel");
const progressCount = document.querySelector("#progressCount");
const startButton = document.querySelector("#startButton");
const storyTitle = document.querySelector("#storyTitle");
const speakerAvatar = document.querySelector("#speakerAvatar");
const speakerRole = document.querySelector("#speakerRole");
const speakerName = document.querySelector("#speakerName");
const storyCounter = document.querySelector("#storyCounter");
const storyText = document.querySelector("#storyText");
const storyPrevious = document.querySelector("#storyPrevious");
const storyNext = document.querySelector("#storyNext");
const cockpitButtons = Array.from(document.querySelectorAll("[data-cockpit-step]"));
const cockpitCounter = document.querySelector("#cockpitCounter");
const cockpitKicker = document.querySelector("#cockpitKicker");
const cockpitStepTitle = document.querySelector("#cockpitStepTitle");
const cockpitDescription = document.querySelector("#cockpitDescription");
const cockpitNext = document.querySelector("#cockpitNext");
const codexMockup = document.querySelector("#codexMockup");

let currentScreen = "start";
let storyIndex = 0;
let cockpitIndex = 0;
let savedState = readSavedState();

function readSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? null;
  } catch {
    return null;
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        screen: currentScreen,
        storyIndex,
        cockpitIndex,
        completed: currentScreen === "complete"
      })
    );
  } catch {
    // The experience still works when local storage is blocked.
  }
}

function focusScreenHeading(screenName) {
  if (screenName === "start") return;
  const heading = document.querySelector(
    `[data-screen="${screenName}"] h1, [data-screen="${screenName}"] h2`
  );
  window.setTimeout(() => heading?.focus({ preventScroll: true }), 30);
}

function openScreen(screenName, shouldSave = true) {
  currentScreen = screenName;
  screens.forEach((screen) => {
    const isActive = screen.dataset.screen === screenName;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  });

  const progress = progressByScreen[screenName];
  progressBar.style.width = `${progress.width}%`;
  progressLabel.textContent = progress.label;
  progressCount.textContent = progress.count;

  if (screenName === "story") renderStory();
  if (screenName === "cockpit") renderCockpit();
  if (shouldSave) saveState();
  focusScreenHeading(screenName);
}

function renderStory() {
  const beat = story[storyIndex];
  storyTitle.textContent = beat.title;
  speakerAvatar.textContent = beat.avatar;
  speakerRole.textContent = beat.role;
  speakerName.textContent = beat.speaker;
  storyCounter.textContent = `${String(storyIndex + 1).padStart(2, "0")} / 04`;
  storyText.textContent = beat.text;
  storyPrevious.disabled = storyIndex === 0;
  storyNext.querySelector("span").textContent =
    storyIndex === story.length - 1 ? "MỞ BẢN ĐỒ" : "TIẾP TỤC";
  saveState();
}

function moveStory(direction) {
  const nextIndex = storyIndex + direction;
  if (nextIndex < 0) return;
  if (nextIndex >= story.length) {
    openScreen("map");
    return;
  }
  storyIndex = nextIndex;
  renderStory();
}

function renderCockpit() {
  const step = cockpitSteps[cockpitIndex];
  cockpitButtons.forEach((button, index) => {
    const isActive = index === cockpitIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-current", isActive ? "step" : "false");
  });

  codexMockup.dataset.view = step.view;
  cockpitCounter.textContent = `${String(cockpitIndex + 1).padStart(2, "0")} / 04`;
  cockpitKicker.textContent = step.kicker;
  cockpitStepTitle.textContent = step.title;
  cockpitDescription.textContent = step.description;
  cockpitNext.querySelector("span").textContent =
    cockpitIndex === cockpitSteps.length - 1 ? "NHẬN NHIỆM VỤ" : "TIẾP THEO";
  saveState();
}

function moveCockpit(index) {
  if (index >= cockpitSteps.length) {
    openScreen("complete");
    return;
  }
  cockpitIndex = Math.max(0, index);
  renderCockpit();
}

function resetState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // No-op when local storage is blocked.
  }
  savedState = null;
  storyIndex = 0;
  cockpitIndex = 0;
  startButton.querySelector("span").textContent = "BẮT ĐẦU CHUYẾN ĐI";
  openScreen("start");
}

startButton.addEventListener("click", () => {
  if (savedState?.screen && savedState.screen !== "start") {
    storyIndex = Math.min(savedState.storyIndex ?? 0, story.length - 1);
    cockpitIndex = Math.min(savedState.cockpitIndex ?? 0, cockpitSteps.length - 1);
    openScreen(savedState.screen);
    return;
  }
  openScreen("story");
});

storyPrevious.addEventListener("click", () => moveStory(-1));
storyNext.addEventListener("click", () => moveStory(1));
document.querySelector("#mapNext").addEventListener("click", () => openScreen("cockpit"));

cockpitButtons.forEach((button) => {
  button.addEventListener("click", () => {
    moveCockpit(Number(button.dataset.cockpitStep));
  });
});
cockpitNext.addEventListener("click", () => moveCockpit(cockpitIndex + 1));

document.querySelectorAll("[data-reset]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    resetState();
  });
});

document.querySelector("#copyReturnText").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const returnText = document.querySelector("#returnText");
  try {
    await navigator.clipboard.writeText(returnText.textContent);
    button.querySelector("span").textContent = "ĐÃ SAO CHÉP";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(returnText);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    button.querySelector("span").textContent = "VĂN BẢN ĐÃ ĐƯỢC CHỌN";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") {
    if (currentScreen === "start") openScreen("story");
    else if (currentScreen === "story") moveStory(1);
    else if (currentScreen === "map") openScreen("cockpit");
    else if (currentScreen === "cockpit") moveCockpit(cockpitIndex + 1);
  }

  if (event.key === "ArrowLeft") {
    if (currentScreen === "story") moveStory(-1);
    else if (currentScreen === "cockpit") moveCockpit(cockpitIndex - 1);
  }
});

if (savedState?.screen && savedState.screen !== "start") {
  startButton.querySelector("span").textContent = savedState.completed
    ? "MỞ LẠI CHECKPOINT"
    : "TIẾP TỤC CHUYẾN ĐI";
}

screens.forEach((screen) => {
  screen.setAttribute("aria-hidden", String(!screen.classList.contains("is-active")));
});
openScreen("start", false);
