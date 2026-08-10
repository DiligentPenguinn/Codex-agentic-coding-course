const panels = Array.from(document.querySelectorAll("[data-panel]"));
const steps = Array.from(document.querySelectorAll("[data-step]"));
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const stepHint = document.querySelector("#stepHint");
const copyLine = document.querySelector("#copyLine");
const copyStatus = document.querySelector("#copyStatus");

const hints = [
  "Hiểu vai trò của Codex trước khi thiết lập.",
  "Hiểu quyền quyết định và cách phê duyệt hành động.",
  "Chọn model theo công việc, không theo tên gọi.",
  "Tách mục tiêu của task khỏi chỉ dẫn lâu dài.",
  "Gọi Skill khi bạn cần một quy trình có thể dùng lại."
];

let currentStep = 0;

function showStep(nextStep) {
  currentStep = Math.max(0, Math.min(nextStep, panels.length - 1));

  panels.forEach((panel, index) => {
    const active = index === currentStep;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });

  steps.forEach((step, index) => {
    const active = index === currentStep;
    step.classList.toggle("is-active", active);
    step.setAttribute("aria-current", active ? "step" : "false");
  });

  progressText.textContent = `${currentStep + 1} / ${panels.length}`;
  progressBar.style.width = `${((currentStep + 1) / panels.length) * 100}%`;
  stepHint.textContent = hints[currentStep];
  backButton.disabled = currentStep === 0;
  nextButton.textContent = currentStep === panels.length - 1 ? "Đã xem xong" : "Tiếp tục";

  try {
    localStorage.setItem("codex-setup-step", String(currentStep));
  } catch {
    // The guide remains usable when browser storage is unavailable.
  }
}

steps.forEach((step) => {
  step.addEventListener("click", () => showStep(Number(step.dataset.step)));
});

backButton.addEventListener("click", () => showStep(currentStep - 1));
nextButton.addEventListener("click", () => {
  if (currentStep < panels.length - 1) showStep(currentStep + 1);
});

copyLine.addEventListener("click", async () => {
  const message = "Tôi đã xem xong hướng dẫn thiết lập Codex.";
  try {
    await navigator.clipboard.writeText(message);
    copyStatus.textContent = "Đã sao chép";
  } catch {
    copyStatus.textContent = "Hãy chọn và sao chép";
  }
});

let savedStep = 0;
try {
  savedStep = Number(localStorage.getItem("codex-setup-step") ?? 0);
} catch {
  savedStep = 0;
}

showStep(Number.isInteger(savedStep) ? savedStep : 0);
