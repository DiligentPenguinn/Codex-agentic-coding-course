const posts = [
  {
    title: "Đừng hỏi ChatGPT đáp án. Hãy bắt nó hỏi ngược lại bạn.",
    format: "Bài viết",
    platform: "Facebook",
    match: 92,
    patterns: 3,
    paragraphs: [
      "Nếu bạn dùng ChatGPT để học mà lúc nào cũng bắt nó trả lời trước, bạn đang dùng AI hơi phí.",
      "Một câu trả lời đẹp có thể tạo cảm giác rằng mình đã hiểu. Nhưng cảm giác hiểu khi đọc lời giải không giống với khả năng tự tạo ra lời giải.",
      "Lần tới, hãy thử đổi vai: đưa cho AI cách bạn đang nghĩ, rồi yêu cầu nó hỏi ngược lại từng câu cho đến khi bạn tự tìm được lỗ hổng.",
      "AI tốt nhất không phải là AI làm bài thay bạn. Đó là AI khiến bạn suy nghĩ rõ hơn."
    ]
  },
  {
    title: "Cấm ChatGPT trong lớp học nghe hợp lý, cho đến khi học sinh vẫn dùng nó ở nhà.",
    format: "Bài viết",
    platform: "Facebook",
    match: 89,
    patterns: 4,
    paragraphs: [
      "Cấm một công cụ không dạy người học cách dùng công cụ đó tốt hơn.",
      "Thay vì giả vờ AI không tồn tại, chúng ta có thể dạy học sinh phân biệt giữa được AI làm hộ và dùng AI để kiểm tra cách suy nghĩ của mình.",
      "Bài học quan trọng không còn là “có dùng AI hay không”. Đó là: sau khi đóng màn hình, em còn tự giải thích được điều gì?"
    ]
  },
  {
    title: "Một prompt 10 phút để biến chương sách khó thành bài tự kiểm tra.",
    format: "Hướng dẫn",
    platform: "Facebook",
    match: 94,
    patterns: 2,
    paragraphs: [
      "Highlight khiến trang sách trông chăm chỉ. Nó không đảm bảo kiến thức đã ở trong đầu bạn.",
      "Sau khi đọc một chương, hãy đưa mục lục và ghi chú của bạn cho AI. Yêu cầu nó tạo năm câu hỏi tăng dần độ khó, nhưng chưa đưa đáp án.",
      "Trả lời bằng trí nhớ trước. Chỉ mở gợi ý khi thật sự mắc kẹt. Mười phút khó chịu này đáng giá hơn một giờ đọc lại."
    ]
  },
  {
    title: "AI có thể lập kế hoạch học 12 tháng, nhưng không thể sống 12 tháng đó thay bạn.",
    format: "Bài viết",
    platform: "Facebook",
    match: 87,
    patterns: 3,
    paragraphs: [
      "Kế hoạch đẹp thường cho chúng ta phần thưởng tâm lý quá sớm.",
      "AI có thể vẽ một lộ trình hoàn hảo trong vài giây. Nhưng năng lực chỉ xuất hiện sau những buổi học không hoàn hảo mà bạn thật sự hoàn thành.",
      "Hãy dùng AI để chọn bước nhỏ nhất cho hôm nay, không phải để trang trí một năm chưa bắt đầu."
    ]
  },
  {
    title: "Prompt xấu không làm bạn kém thông minh. Nó chỉ lộ ra điều bạn chưa rõ.",
    format: "Bài viết",
    platform: "Facebook",
    match: 91,
    patterns: 3,
    paragraphs: [
      "Khi AI trả lời lan man, phản xạ đầu tiên thường là đổ lỗi cho công cụ.",
      "Nhưng một prompt mơ hồ đôi khi là chiếc gương rất tốt: mục tiêu của mình là gì, giới hạn ở đâu, và kết quả nào mới thật sự hữu ích?",
      "Đừng cố viết prompt nghe thông minh. Hãy viết một brief khiến người khác biết chính xác việc cần làm."
    ]
  }
];

const state = {
  activeView: "today",
  activePost: 0,
  approvedPosts: new Set(),
  workflowRunning: false,
  workflowComplete: false,
  selectedVisual: "A"
};

const progressMessages = [
  "Đang tìm tín hiệu mới và xác minh nguồn công khai…",
  "Đang rút ra pattern và tạo 10 ý tưởng nguyên bản…",
  "Đang viết 5 bản thảo theo voice profile đã lưu…",
  "Đang tạo hai hướng hình ảnh cho mỗi bài…",
  "5 gói nội dung đã sẵn sàng để bạn duyệt."
];

const navItems = [...document.querySelectorAll(".nav-item")];
const views = [...document.querySelectorAll(".view")];
const postList = document.querySelector("#postList");
const reviewCount = document.querySelector("#reviewCount");
const remainingCount = document.querySelector("#remainingCount");
const draftTitle = document.querySelector("#draftTitle");
const draftBody = document.querySelector("#draftBody");
const reviewPlatform = document.querySelector("#reviewPlatform");
const sourceSummary = document.querySelector("#sourceSummary");
const runButton = document.querySelector("#runButton");
const progressCopy = document.querySelector("#progressCopy");
const dueChip = document.querySelector("#dueChip");
const approveButton = document.querySelector("#approveButton");
const visualSelection = document.querySelector("#visualSelection");
const evidenceDialog = document.querySelector("#evidenceDialog");

function showView(viewName) {
  state.activeView = viewName;

  views.forEach((view) => {
    view.classList.toggle("is-active", view.dataset.view === viewName);
  });

  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.viewTarget === viewName);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view-target]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewTarget));
});

function renderPostList() {
  postList.innerHTML = "";

  posts.forEach((post, index) => {
    const button = document.createElement("button");
    button.className = "post-item";
    button.type = "button";

    if (index === state.activePost) {
      button.classList.add("is-active");
    }

    if (state.approvedPosts.has(index)) {
      button.classList.add("is-approved");
    }

    button.innerHTML = `
      <span class="post-number">${String(index + 1).padStart(2, "0")}</span>
      <span>
        <strong>${post.title}</strong>
        <small>${state.approvedPosts.has(index) ? "Đã duyệt" : `${post.match}% khớp voice`}</small>
      </span>
    `;

    button.addEventListener("click", () => {
      state.activePost = index;
      renderReview();
    });

    postList.appendChild(button);
  });
}

function renderReview() {
  const post = posts[state.activePost];

  renderPostList();
  draftTitle.textContent = post.title;
  draftBody.innerHTML = post.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("");
  reviewPlatform.textContent = `${post.platform} · ${post.format}`;
  sourceSummary.textContent = `Dựa trên ${post.patterns} pattern · Khớp voice ${post.match}%`;

  const isApproved = state.approvedPosts.has(state.activePost);
  approveButton.querySelector(".button-label").textContent = isApproved
    ? "Đã duyệt"
    : "Duyệt bài này";
  approveButton.disabled = isApproved;

  const remaining = posts.length - state.approvedPosts.size;
  remainingCount.textContent = remaining;
  reviewCount.textContent = remaining;
}

function updateProgress(activeIndex) {
  document.querySelectorAll(".stage").forEach((stage, index) => {
    stage.classList.toggle("is-complete", index < activeIndex);
    stage.classList.toggle("is-current", index === activeIndex);
  });
  progressCopy.textContent = progressMessages[activeIndex];
}

async function runWorkflow() {
  if (state.workflowRunning) return;

  if (state.workflowComplete) {
    showView("review");
    return;
  }

  state.workflowRunning = true;
  runButton.disabled = true;
  runButton.querySelector(".button-label").textContent = "Đang tạo batch…";
  runButton.querySelector(".button-arrow").textContent = "•••";
  dueChip.textContent = "Đang chạy";

  for (let index = 0; index < progressMessages.length; index += 1) {
    updateProgress(index);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
  }

  state.workflowRunning = false;
  state.workflowComplete = true;
  runButton.disabled = false;
  runButton.querySelector(".button-label").textContent = "Duyệt 5 bài";
  runButton.querySelector(".button-arrow").textContent = "→";
  dueChip.textContent = "Đã hoàn thành";
  dueChip.style.color = "var(--success)";
  dueChip.style.borderColor = "color-mix(in srgb, var(--success) 35%, var(--line))";
  dueChip.style.background = "color-mix(in srgb, var(--success) 8%, white)";
}

runButton.addEventListener("click", runWorkflow);

document.querySelectorAll(".choice").forEach((choice) => {
  choice.addEventListener("click", () => {
    const nextSelected = !choice.classList.contains("is-selected");
    choice.classList.toggle("is-selected", nextSelected);
    choice.setAttribute("aria-pressed", String(nextSelected));
  });
});

document.querySelector("#setupForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const saveStatus = document.querySelector("#saveStatus");
  saveStatus.textContent = "Đã lưu thiết lập vừa xong";
  showView("today");
});

document.querySelectorAll(".visual-option").forEach((option) => {
  option.addEventListener("click", () => {
    state.selectedVisual = option.dataset.visual;

    document.querySelectorAll(".visual-option").forEach((candidate) => {
      const isSelected = candidate === option;
      candidate.classList.toggle("is-selected", isSelected);
      candidate.setAttribute("aria-pressed", String(isSelected));
    });

    visualSelection.textContent = `Đã chọn ${state.selectedVisual}`;
  });
});

approveButton.addEventListener("click", () => {
  state.approvedPosts.add(state.activePost);

  const nextPending = posts.findIndex((_, index) => !state.approvedPosts.has(index));
  if (nextPending !== -1) {
    state.activePost = nextPending;
  }

  renderReview();
});

document.querySelector("#reviseButton").addEventListener("click", () => {
  const instruction = window.prompt(
    "Bạn muốn AI chỉnh điều gì?",
    "Rút gọn phần mở đầu và làm CTA cụ thể hơn."
  );

  if (!instruction) return;

  const note = document.createElement("p");
  note.textContent = `Ghi chú chỉnh sửa: ${instruction}`;
  note.style.color = "var(--accent-dark)";
  note.style.fontWeight = "700";
  draftBody.prepend(note);
});

document.querySelector("#evidenceToggle").addEventListener("click", () => {
  evidenceDialog.showModal();
});

document.querySelector("#closeEvidence").addEventListener("click", () => {
  evidenceDialog.close();
});

evidenceDialog.addEventListener("click", (event) => {
  if (event.target === evidenceDialog) {
    evidenceDialog.close();
  }
});

renderReview();
