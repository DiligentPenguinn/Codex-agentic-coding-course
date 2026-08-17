const STORAGE_KEY = "codex-academy-visual-map-v2";

const story = [
  {
    title: "HAI KHÔNG GIAN, HAI MỤC ĐÍCH",
    text: "Phần giới thiệu này giúp bạn hiểu cách học. Codex là nơi bạn trò chuyện, cho phép hành động và kiểm tra công việc thật."
  },
  {
    title: "BẠN KHÔNG CẦN BIẾT LẬP TRÌNH",
    text: "Bạn có thể giao việc bằng ngôn ngữ bình thường. Vai trò của bạn là hiểu vấn đề, giữ mục tiêu, đưa ra quyết định và nói rõ điều gì đủ tốt."
  },
  {
    title: "CODEX PHẢI ĐƯA RA BẰNG CHỨNG",
    text: "Codex có thể đọc workspace, sửa file và chạy kiểm tra. Sau mỗi công việc, hãy xem file đã thay đổi, kết quả kiểm tra và phần so sánh trước khi tự quyết định chấp nhận."
  },
  {
    title: "LUẬT ĐẦU TIÊN: ĐỌC TRƯỚC KHI SỬA",
    text: "Khi trở lại Codex, bài thực hành đầu tiên chỉ cho phép đọc. Bạn sẽ thấy Codex kiểm tra đúng workspace mà không thay đổi bất kỳ file nào."
  }
];

const cockpitSteps = [
  {
    view: "prompt",
    image: "images/codex-app-interface.webp",
    alt: "Ảnh giao diện Codex chính thức, đánh dấu phần yêu cầu của người dùng",
    kicker: "NƠI BẠN GIAO VIỆC",
    title: "Viết yêu cầu bằng ngôn ngữ bình thường",
    description: "Hãy nói mục tiêu, bối cảnh và điều bạn muốn Codex kiểm tra. Bạn không cần viết lệnh kỹ thuật hay một prompt hoàn hảo."
  },
  {
    view: "progress",
    image: "images/codex-app-interface.webp",
    alt: "Ảnh giao diện Codex chính thức, đánh dấu phần báo cáo tiến độ và bằng chứng",
    kicker: "NƠI CODEX BÁO CÁO",
    title: "Theo dõi tiến độ và bằng chứng",
    description: "Codex cho biết nó đã đọc file nào, đang làm gì và đã kiểm tra kết quả ra sao. Đây là nơi bạn phát hiện sớm khi công việc đi sai hướng."
  },
  {
    view: "review",
    image: "images/codex-app-interface.webp",
    alt: "Ảnh giao diện Codex chính thức, đánh dấu bảng review các file thay đổi",
    kicker: "NƠI BẠN KIỂM TRA",
    title: "Xem các file đã thay đổi",
    description: "Sau khi Codex sửa code, khu vực Review cho thấy chính xác file nào đã đổi. Bạn có thể yêu cầu giải thích, kiểm tra thêm hoặc chỉnh lại."
  },
  {
    view: "terminal",
    image: "images/codex-terminal-interface.webp",
    alt: "Ảnh giao diện terminal tích hợp chính thức trong Codex",
    kicker: "NƠI LỆNH THẬT CHẠY",
    title: "Terminal nằm ngay trong Codex",
    description: "Terminal hiển thị thư mục, lệnh và kết quả thật. Mình sẽ giải thích trước khi bạn chạy một lệnh có thể thay đổi workspace hoặc hệ thống."
  }
];

const progressByScreen = {
  start: { width: 20, label: "BẮT ĐẦU", count: "01 / 05" },
  story: { width: 40, label: "THÔNG TIN CẦN BIẾT", count: "02 / 05" },
  map: { width: 60, label: "LỘ TRÌNH KỸ NĂNG", count: "03 / 05" },
  cockpit: { width: 80, label: "GIAO DIỆN CODEX", count: "04 / 05" },
  complete: { width: 100, label: "TRỞ LẠI CODEX", count: "05 / 05" }
};

const screens = Array.from(document.querySelectorAll("[data-screen]"));
const progressBar = document.querySelector("#progressBar");
const progressLabel = document.querySelector("#progressLabel");
const progressCount = document.querySelector("#progressCount");
const startButton = document.querySelector("#startButton");
const storyTitle = document.querySelector("#storyTitle");
const storyCounter = document.querySelector("#storyCounter");
const storyText = document.querySelector("#storyText");
const visualOnlyNote = document.querySelector(".visual-only-note");
const storyPrevious = document.querySelector("#storyPrevious");
const storyNext = document.querySelector("#storyNext");
const cockpitButtons = Array.from(document.querySelectorAll("[data-cockpit-step]"));
const cockpitCounter = document.querySelector("#cockpitCounter");
const cockpitKicker = document.querySelector("#cockpitKicker");
const cockpitStepTitle = document.querySelector("#cockpitStepTitle");
const cockpitDescription = document.querySelector("#cockpitDescription");
const cockpitNext = document.querySelector("#cockpitNext");
const realScreen = document.querySelector("#realScreen");
const codexScreenshot = document.querySelector("#codexScreenshot");

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
    // The visual map still works when local storage is blocked.
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
  storyCounter.textContent = `${String(storyIndex + 1).padStart(2, "0")} / 04`;
  storyText.textContent = beat.text;
  visualOnlyNote.hidden = storyIndex !== 0;
  storyPrevious.disabled = storyIndex === 0;
  storyNext.querySelector("span").textContent =
    storyIndex === story.length - 1 ? "XEM LỘ TRÌNH KỸ NĂNG" : "TIẾP TỤC";
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

  realScreen.dataset.view = step.view;
  codexScreenshot.src = step.image;
  codexScreenshot.alt = step.alt;
  cockpitCounter.textContent = `${String(cockpitIndex + 1).padStart(2, "0")} / 04`;
  cockpitKicker.textContent = step.kicker;
  cockpitStepTitle.textContent = step.title;
  cockpitDescription.textContent = step.description;
  cockpitNext.querySelector("span").textContent =
    cockpitIndex === cockpitSteps.length - 1 ? "TRỞ LẠI CODEX" : "TIẾP THEO";
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
  startButton.querySelector("span").textContent = "BẮT ĐẦU";
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
    ? "XEM LẠI PHẦN GIỚI THIỆU"
    : "TIẾP TỤC";
}

screens.forEach((screen) => {
  screen.setAttribute("aria-hidden", String(!screen.classList.contains("is-active")));
});
openScreen("start", false);
