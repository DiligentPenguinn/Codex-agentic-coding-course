const story = [
  {
    sceneId: "meeting",
    title: "Phòng họp sáng thứ Hai",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Trên màn hình phòng họp là chiến dịch mới nhất của đối thủ."
  },
  {
    sceneId: "meeting",
    title: "Phòng họp sáng thứ Hai",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Không phải vì nó đẹp. Team nào rồi cũng có lúc ra được một campaign đẹp."
  },
  {
    sceneId: "meeting",
    title: "Phòng họp sáng thứ Hai",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Cái khiến cả phòng im lặng là tốc độ."
  },
  {
    sceneId: "meeting",
    title: "Phòng họp sáng thứ Hai",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Landing page mới, cả chục bài social, một chuỗi email — ra đều trong hai tuần. Giọng viết không lệch câu nào. Lịch đăng thì nhìn phát biết ai đang giữ khâu nào."
  },
  {
    sceneId: "meeting",
    title: "Phòng họp sáng thứ Hai",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player"],
    text: "Không phải họ làm nhanh hơn. Họ đang chạy theo một hệ thống, còn mình thì không."
  },
  {
    sceneId: "folder",
    title: "Folder campaign rối",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Bạn mở lại folder campaign của chính team mình."
  },
  {
    sceneId: "folder",
    title: "Folder campaign rối",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Ba file cùng tên final. Một bảng lịch đăng thiếu cột người duyệt. Feedback nằm rải rác đâu đó trong lịch sử chat."
  },
  {
    sceneId: "folder",
    title: "Folder campaign rối",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Brand guideline thì có sẵn — nhưng lần nào viết cũng phải mở ra dò lại: câu này có được nói không?"
  },
  {
    sceneId: "folder",
    title: "Folder campaign rối",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player"],
    text: "Không ai trong team thiếu ý tưởng. Chỉ là mỗi lần bắt tay viết, ai cũng phải ráp lại ngữ cảnh từ đầu."
  },
  {
    sceneId: "folder",
    title: "Folder campaign rối",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player"],
    text: "Càng gần deadline, mọi thứ càng rối."
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Chị không nghĩ vấn đề của em là thiếu ý tưởng đâu."
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong"],
    text: "Vậy thiếu người? Hay thiếu công cụ?"
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Chưa chắc. Chị muốn hỏi một câu khác trước."
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Workflow này đang gãy ở đâu?"
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Bạn nhìn lại: file rời, feedback rời, lịch đăng rời, quy tắc thương hiệu rời — bốn mảnh chưa từng nằm chung một chỗ."
  },
  {
    sceneId: "mentor",
    title: "Hương đặt câu hỏi",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Lần đầu tiên, vấn đề có tên rõ hơn."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Chị muốn cho em thử một cách khác."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "huong",
    visible: ["player", "huong"],
    text: "Hương mở một repo nhỏ, tên ContentPilot Lite."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Đây chưa phải sản phẩm hoàn chỉnh."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Chỉ là một bản nháp — nhưng đủ những mảnh mà team em đang thiếu."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Nơi lưu brand voice, nơi gom ý tưởng, nơi viết nháp, nơi nhìn lịch đăng — tất cả trên một màn hình."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong"],
    text: "Nhưng em đâu phải dân kỹ thuật."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Không cần. Thứ em cần học trước không phải là code."
  },
  {
    sceneId: "repo",
    title: "Hương mở ContentPilot Lite",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Là cách giao việc rõ ràng cho một cộng sự kỹ thuật."
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Đây là Codex."
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Codex",
    role: "Cộng sự kỹ thuật",
    active: "codex",
    visible: ["player", "huong", "codex"],
    text: "Chào em. Tôi đọc file, đề xuất kế hoạch, sửa code, chạy kiểm tra — và luôn báo lại bằng chứng cho từng việc mình vừa làm."
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Nhưng Codex không tự biết team em muốn gì, nếu em không giao việc rõ."
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong", "codex"],
    text: "Folder campaign vẫn rối. Nhưng trên màn hình, lần đầu tiên có một nơi đủ nhỏ để thử."
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong", "codex"],
    text: "Vậy nếu mình dùng Codex để từng bước biến ContentPilot Lite thành xưởng làm việc cho cả team thì sao?"
  },
  {
    sceneId: "codex",
    title: "Codex xuất hiện",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Đó là một mục tiêu tốt. Nhưng mình sẽ bắt đầu chậm hơn em nghĩ."
  },
  {
    sceneId: "rule",
    title: "Luật đầu tiên",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong", "codex"],
    text: "Không xây tính năng ngay?"
  },
  {
    sceneId: "rule",
    title: "Luật đầu tiên",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Chưa."
  },
  {
    sceneId: "rule",
    title: "Luật đầu tiên",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Bước đầu tiên là yêu cầu Codex đọc repo trước khi sửa bất kỳ thứ gì."
  },
  {
    sceneId: "rule",
    title: "Luật đầu tiên",
    speaker: "Codex",
    role: "Cộng sự kỹ thuật",
    active: "codex",
    visible: ["player", "huong", "codex"],
    text: "Ở bước này tôi chỉ inspect — không sửa gì cả. Tôi sẽ tóm tắt cấu trúc repo, chỉ ra file quan trọng, rủi ro, và đề xuất bước tiếp theo."
  },
  {
    sceneId: "rule",
    title: "Luật đầu tiên",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Đó là bài học đầu tiên: trước khi giao Codex việc lớn, em học cách giao một việc nhỏ, rõ, và an toàn."
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Trong khóa này, chị là Teacher. Chị giúp em hiểu tình huống, đặt câu hỏi đúng, và luyện cách ra quyết định."
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong"],
    text: "Còn Codex?"
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Codex là Executor — người thao tác thật trong repo, khi việc đã đủ rõ."
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong", "codex"],
    text: "Vậy em là gì? Người ngồi giữa?"
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong", "codex"],
    text: "Em là người giữ mục tiêu. Em duyệt rủi ro. Em quyết định điều gì đủ tốt để đưa vào workflow thật."
  },
  {
    sceneId: "roles",
    title: "Vai của bạn",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Bạn không cần trở thành kỹ sư — nhưng bạn cần học cách dẫn một cộng sự kỹ thuật làm đúng việc."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Trước khi vào Module 0, em cần viết một brief ngắn cho chính mình."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Bạn",
    role: "Nhân vật chính",
    active: "player",
    visible: ["player", "huong"],
    text: "Brief gì?"
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Một workflow brief. Nó nhắc em rằng mình học Codex vì một việc thật, không phải vì tò mò công cụ."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Hương",
    role: "Teacher",
    active: "huong",
    visible: ["player", "huong"],
    text: "Đừng viết cho đẹp. Viết để tự nhắc mình sau này."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Bạn nhìn lại folder campaign."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Vấn đề chưa biến mất."
  },
  {
    sceneId: "brief",
    title: "My Workflow Brief",
    speaker: "Người dẫn chuyện",
    role: "Mở đầu",
    active: "player",
    visible: ["player", "huong"],
    text: "Nhưng bây giờ, nó có bước đầu tiên.",
    choices: ["Bắt đầu Module 0", "Xem lại câu chuyện"]
  }
];

const sceneClasses = [
  "scene-meeting",
  "scene-folder",
  "scene-mentor",
  "scene-repo",
  "scene-codex",
  "scene-rule",
  "scene-roles",
  "scene-brief"
];

const stage = document.querySelector("#stage");
const sceneKicker = document.querySelector("#sceneKicker");
const sceneTitle = document.querySelector("#sceneTitle");
const speakerRole = document.querySelector("#speakerRole");
const speakerName = document.querySelector("#speakerName");
const dialogueText = document.querySelector("#dialogueText");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const prevButton = document.querySelector("#prevScene");
const nextButton = document.querySelector("#nextScene");
const logToggle = document.querySelector("#logToggle");
const titleScreen = document.querySelector("#titleScreen");
const startStoryButton = document.querySelector("#startStory");
const castToggle = document.querySelector("#castToggle");
const castDossier = document.querySelector("#castDossier");
const backlog = document.querySelector("#backlog");
const closeLog = document.querySelector("#closeLog");
const backlogList = document.querySelector("#backlogList");
const choiceRow = document.querySelector("#choiceRow");
const sprites = Array.from(document.querySelectorAll(".sprite"));
const castCards = Array.from(document.querySelectorAll(".cast-card"));
const avatarImages = Array.from(document.querySelectorAll(".avatar-art"));

let storyIndex = 0;
let typedText = "";
let typingTimer = null;
let titleDismissed = false;
const viewed = new Set();

function currentStep() {
  return story[storyIndex];
}

function sceneNumberFor(stepIndex) {
  const sceneIds = [];
  story.slice(0, stepIndex + 1).forEach((step) => {
    if (!sceneIds.includes(step.sceneId)) {
      sceneIds.push(step.sceneId);
    }
  });
  return sceneIds.length;
}

function setStageScene(sceneId) {
  stage.classList.remove(...sceneClasses);
  stage.classList.add(`scene-${sceneId}`);
}

function setSprites(step) {
  sprites.forEach((sprite) => {
    const character = sprite.dataset.character;
    sprite.classList.toggle("is-visible", step.visible.includes(character));
    sprite.classList.toggle("is-active", step.active === character);
  });

  castCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.focus === step.active);
  });
}

function setupAvatarImages() {
  avatarImages.forEach((image) => {
    const portrait = image.closest(".portrait");

    image.addEventListener("load", () => {
      portrait.classList.add("avatar-ready");
    });

    image.addEventListener("error", () => {
      image.hidden = true;
      portrait.classList.remove("avatar-ready");
    });

    if (image.complete && image.naturalWidth > 0) {
      portrait.classList.add("avatar-ready");
    }
  });
}

function renderChoices(step) {
  choiceRow.replaceChildren();

  if (!step.choices) {
    choiceRow.hidden = true;
    return;
  }

  step.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = choice;
    button.addEventListener("click", () => {
      if (index === 0) {
        dialogueText.textContent = "Sẵn sàng. Bước tiếp theo trong Codex là: $start-course-lesson module-0";
      } else {
        setStep(0);
      }
    });
    choiceRow.append(button);
  });

  choiceRow.hidden = false;
}

function dismissTitleScreen() {
  if (titleDismissed) {
    return;
  }

  titleDismissed = true;
  stage.classList.remove("title-active");
  stage.classList.add("title-exiting", "title-dismissed");
  titleScreen.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    titleScreen.hidden = true;
    stage.classList.remove("title-exiting");
  }, 540);
}

function toggleCastDossier() {
  const shouldHide = !stage.classList.contains("cast-hidden");
  stage.classList.toggle("cast-hidden", shouldHide);
  castToggle.setAttribute("aria-expanded", String(!shouldHide));
  castDossier.setAttribute("aria-hidden", String(shouldHide));
  castToggle.textContent = shouldHide ? "Nhân vật" : "Ẩn nhân vật";
}

function addToBacklog(step) {
  if (viewed.has(storyIndex)) {
    return;
  }

  viewed.add(storyIndex);
  const item = document.createElement("li");
  item.innerHTML = `<strong>${step.speaker}</strong>: ${step.text}`;
  backlogList.append(item);
}

function typeLine(text) {
  clearInterval(typingTimer);
  typedText = "";
  dialogueText.textContent = "";

  let index = 0;
  typingTimer = setInterval(() => {
    typedText += text[index];
    dialogueText.textContent = typedText;
    index += 1;

    if (index >= text.length) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
  }, 14);
}

function finishTyping() {
  if (!typingTimer) {
    return false;
  }

  clearInterval(typingTimer);
  typingTimer = null;
  dialogueText.textContent = currentStep().text;
  return true;
}

function setStep(index) {
  storyIndex = Math.max(0, Math.min(index, story.length - 1));
  const step = currentStep();

  setStageScene(step.sceneId);
  setSprites(step);
  sceneKicker.textContent = `Cảnh ${String(sceneNumberFor(storyIndex)).padStart(2, "0")}`;
  sceneTitle.textContent = step.title;
  speakerRole.textContent = step.role;
  speakerName.textContent = step.speaker;
  progressText.textContent = `${String(storyIndex + 1).padStart(2, "0")} / ${String(story.length).padStart(2, "0")}`;
  progressBar.style.width = `${((storyIndex + 1) / story.length) * 100}%`;
  prevButton.disabled = storyIndex === 0;
  nextButton.disabled = storyIndex === story.length - 1;

  addToBacklog(step);
  renderChoices(step);
  typeLine(step.text);
}

function nextStep() {
  if (!titleDismissed) {
    dismissTitleScreen();
    return;
  }

  if (finishTyping()) {
    return;
  }

  if (storyIndex < story.length - 1) {
    setStep(storyIndex + 1);
  }
}

function previousStep() {
  if (storyIndex > 0) {
    setStep(storyIndex - 1);
  }
}

prevButton.addEventListener("click", previousStep);
nextButton.addEventListener("click", nextStep);
startStoryButton.addEventListener("click", dismissTitleScreen);
castToggle.addEventListener("click", toggleCastDossier);
stage.addEventListener("click", (event) => {
  if (event.target.closest("button") || event.target.closest(".backlog") || event.target.closest(".title-screen")) {
    return;
  }

  nextStep();
});

logToggle.addEventListener("click", () => {
  backlog.hidden = !backlog.hidden;
});

closeLog.addEventListener("click", () => {
  backlog.hidden = true;
});

castCards.forEach((card) => {
  card.addEventListener("click", () => {
    const character = card.dataset.focus;
    const matchIndex = story.findIndex((step) => step.active === character || step.visible.includes(character));
    if (matchIndex >= 0) {
      setStep(matchIndex);
    }
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    nextStep();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousStep();
  }

  if (event.key.toLowerCase() === "l") {
    if (!titleDismissed) {
      return;
    }

    backlog.hidden = !backlog.hidden;
  }
});

setupAvatarImages();
setStep(0);
