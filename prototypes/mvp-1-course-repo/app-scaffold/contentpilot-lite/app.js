const defaultBrand = {
  voice: "Ấm áp, rõ ràng, thực tế. Viết như một người cố vấn thân thiện, tránh hứa hẹn quá đà.",
  audience: "Chủ shop nhỏ cần đăng đều hơn. Content creator độc lập muốn biến ý tưởng rời rạc thành campaign.",
  claims: "Không hứa tăng doanh thu chắc chắn. Không nói công cụ thay thế hoàn toàn marketer. Không bịa số liệu performance.",
  pillars: [
    "Học Codex qua task thật",
    "Brand memory trước khi generate",
    "Lập plan trước khi sửa code",
    "Review evidence thay vì tin cảm giác"
  ]
};

const ideas = [
  {
    id: "idea-001",
    platform: "LinkedIn",
    pillar: "Học Codex qua task thật",
    hook: "Đừng bắt đầu bằng 'hãy làm app cho tôi'. Hãy bắt đầu bằng inspect.",
    format: "Short post",
    status: "draft"
  },
  {
    id: "idea-002",
    platform: "Facebook",
    pillar: "Brand memory trước khi generate",
    hook: "AI viết tốt hơn khi nó biết brand không được nói gì.",
    format: "Carousel outline",
    status: "draft"
  },
  {
    id: "idea-003",
    platform: "TikTok",
    pillar: "Review evidence thay vì tin cảm giác",
    hook: "Nếu Codex nói 'xong rồi', hãy hỏi: bằng chứng đâu?",
    format: "Short video script",
    status: "planned"
  }
];

const calendar = [
  { day: "Thứ 2", title: "Inspect trước khi sửa", platform: "LinkedIn" },
  { day: "Thứ 4", title: "Brand Brain giữ voice", platform: "Facebook" },
  { day: "Thứ 6", title: "Evidence thay vì cảm giác", platform: "TikTok" }
];

const elements = {
  voiceInput: document.querySelector("#voiceInput"),
  audienceInput: document.querySelector("#audienceInput"),
  claimsInput: document.querySelector("#claimsInput"),
  saveBrandButton: document.querySelector("#saveBrandButton"),
  ideaList: document.querySelector("#ideaList"),
  draftPlatform: document.querySelector("#draftPlatform"),
  draftHook: document.querySelector("#draftHook"),
  draftBody: document.querySelector("#draftBody"),
  pillarRow: document.querySelector("#pillarRow"),
  calendarList: document.querySelector("#calendarList")
};

let selectedIdeaId = ideas[0].id;

function getBrand() {
  try {
    const saved = localStorage.getItem("contentpilot-lite-brand");
    return saved ? JSON.parse(saved) : defaultBrand;
  } catch {
    return defaultBrand;
  }
}

function saveBrand() {
  const nextBrand = {
    voice: elements.voiceInput.value.trim(),
    audience: elements.audienceInput.value.trim(),
    claims: elements.claimsInput.value.trim(),
    pillars: defaultBrand.pillars
  };
  localStorage.setItem("contentpilot-lite-brand", JSON.stringify(nextBrand));
  renderDraft();
  elements.saveBrandButton.textContent = "Saved";
  window.setTimeout(() => {
    elements.saveBrandButton.textContent = "Save memory";
  }, 1200);
}

function renderBrand() {
  const brand = getBrand();
  elements.voiceInput.value = brand.voice;
  elements.audienceInput.value = brand.audience;
  elements.claimsInput.value = brand.claims;
}

function renderIdeas() {
  elements.ideaList.innerHTML = "";
  ideas.forEach((idea) => {
    const button = document.createElement("button");
    button.className = "idea-card";
    button.type = "button";
    button.setAttribute("aria-pressed", String(idea.id === selectedIdeaId));
    button.innerHTML = `
      <strong>${idea.hook}</strong>
      <span>${idea.platform} · ${idea.format} · ${idea.status}</span>
    `;
    button.addEventListener("click", () => {
      selectedIdeaId = idea.id;
      renderIdeas();
      renderDraft();
    });
    elements.ideaList.appendChild(button);
  });
}

function renderDraft() {
  const brand = getBrand();
  const idea = ideas.find((item) => item.id === selectedIdeaId) || ideas[0];
  elements.draftPlatform.textContent = `${idea.platform} · ${idea.format}`;
  elements.draftHook.textContent = idea.hook;
  elements.draftBody.textContent = `Draft hướng ${brand.voice.toLowerCase()} dành cho ${brand.audience.toLowerCase()}. Nội dung cần bám pillar "${idea.pillar}" và tránh: ${brand.claims.toLowerCase()}`;

  elements.pillarRow.innerHTML = "";
  brand.pillars.forEach((pillar) => {
    const pill = document.createElement("span");
    pill.textContent = pillar;
    elements.pillarRow.appendChild(pill);
  });
}

function renderCalendar() {
  elements.calendarList.innerHTML = "";
  calendar.forEach((item) => {
    const row = document.createElement("li");
    row.innerHTML = `
      <time>${item.day}</time>
      <strong>${item.title}</strong>
      <span>${item.platform}</span>
    `;
    elements.calendarList.appendChild(row);
  });
}

elements.saveBrandButton.addEventListener("click", saveBrand);
renderBrand();
renderIdeas();
renderDraft();
renderCalendar();
