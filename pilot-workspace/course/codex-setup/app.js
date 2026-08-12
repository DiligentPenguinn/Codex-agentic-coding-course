const panels = Array.from(document.querySelectorAll("[data-panel]"));
const steps = Array.from(document.querySelectorAll("[data-step]"));
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const stepHint = document.querySelector("#stepHint");
const copyLine = document.querySelector("#copyLine");
const copyStatus = document.querySelector("#copyStatus");
const storageKey = "codex-setup-step-v3";

const hints = [
  "Hiểu Codex trước khi đi vào thiết lập.",
  "Chọn model theo loại công việc.",
  "Dùng mức reasoning vừa đủ cho nhiệm vụ.",
  "Nhìn toàn bộ môi trường làm việc quanh model.",
  "Chốt cấu hình dành riêng cho ContentPilot.",
  "Nộp bằng chứng thật để mình duyệt."
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
  nextButton.textContent = currentStep === panels.length - 1
    ? "Đã xem xong"
    : currentStep === panels.length - 2
      ? "Chuyển sang Codex để thực hành"
      : "Tiếp tục";

  try {
    localStorage.setItem(storageKey, String(currentStep));
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
  const message = "Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt. Báo cáo dưới tiêu đề Verification, gồm Model, Effort, Speed, Approval và trạng thái Full access.";
  try {
    await navigator.clipboard.writeText(message);
    copyStatus.textContent = "Đã sao chép";
  } catch {
    copyStatus.textContent = "Hãy chọn và sao chép";
  }
});

let savedStep = 0;
try {
  const currentSavedStep = localStorage.getItem(storageKey);
  if (currentSavedStep !== null) {
    savedStep = Number(currentSavedStep);
  } else {
    const previousSavedStep = localStorage.getItem("codex-setup-step-v2");
    if (previousSavedStep !== null) {
      const migratedPreviousSteps = [0, 1, 1, 2, 3, 4, 5];
      savedStep = migratedPreviousSteps[Number(previousSavedStep)] ?? 0;
    } else {
      const legacyStep = Number(localStorage.getItem("codex-setup-step") ?? 0);
      const migratedLegacySteps = [0, 3, 3, 1, 1, 2, 4, 5];
      savedStep = migratedLegacySteps[legacyStep] ?? 0;
    }
  }
} catch {
  savedStep = 0;
}

showStep(Number.isInteger(savedStep) ? savedStep : 0);
