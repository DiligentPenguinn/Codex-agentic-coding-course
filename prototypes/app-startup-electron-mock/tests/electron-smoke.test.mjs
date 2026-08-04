import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { _electron as electron } from "playwright";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const mockRoot = path.resolve(testsDirectory, "..");
const fakeServerPath = path.join(
  testsDirectory,
  "fixtures",
  "fake-app-server.mjs",
);
const userDataPath = path.join(
  os.tmpdir(),
  `course-electron-smoke-${process.pid}`,
);
const taskName = "Practice · Module 0 · Read-only inspection";
const firstTeacherQuestion = "What did my Executor inspect, which constraints did it follow, and did files change?";
const secondTeacherQuestion = "Summarize the same bound-task report once more.";

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function pollUntil(operation, predicate, {
  timeoutMs = 5_000,
  intervalMs = 50,
  description = "condition",
} = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  let lastError;
  while (Date.now() <= deadline) {
    try {
      lastValue = await operation();
      if (predicate(lastValue)) return lastValue;
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }
  const detail = lastError?.message ?? JSON.stringify(lastValue);
  throw new Error(`Timed out waiting for ${description}: ${detail}`);
}

function pageMatchesFile(page, fileName) {
  try {
    return new URL(page.url()).pathname.endsWith(fileName);
  } catch {
    return false;
  }
}

async function browserWindowState(electronApp, page) {
  return electronApp.evaluate(({ BrowserWindow }, targetUrl) => {
    const window = BrowserWindow.getAllWindows().find(
      (candidate) => candidate.webContents.getURL() === targetUrl,
    );
    return window ? {
      visible: window.isVisible(),
      focused: window.isFocused(),
      bounds: window.getBounds(),
    } : null;
  }, page.url());
}

async function findWindowByFile(electronApp, fileName, {
  visible,
  timeoutMs = 5_000,
} = {}) {
  return pollUntil(async () => {
    const page = electronApp.windows().find((candidate) => (
      pageMatchesFile(candidate, fileName)
    ));
    if (!page || visible === undefined) return page ?? null;
    const state = await browserWindowState(electronApp, page);
    return state?.visible === visible ? page : null;
  }, Boolean, {
    timeoutMs,
    description: `${fileName} window${visible === undefined ? "" : ` visible=${visible}`}`,
  });
}

async function waitForWindowVisibility(electronApp, page, visible, timeoutMs = 5_000) {
  return pollUntil(
    () => browserWindowState(electronApp, page),
    (state) => state?.visible === visible,
    { timeoutMs, description: `${path.basename(new URL(page.url()).pathname)} visible=${visible}` },
  );
}

async function launchMock() {
  return electron.launch({
    args: ["--disable-gpu", "--disable-software-rasterizer", mockRoot],
    env: {
      ...process.env,
      NODE_ENV: "test",
      COURSE_MOCK_APP_SERVER_FIXTURE: fakeServerPath,
      COURSE_MOCK_USER_DATA_DIR: userDataPath,
    },
  });
}

async function openCourseIfPresented(mainWindow) {
  const openCourse = mainWindow.getByRole("button", { name: "Open course" });
  const state = await pollUntil(async () => ({
    courseButton: await openCourse.isVisible().catch(() => false),
    practiceHeading: await mainWindow.getByRole("heading", {
      name: /Inspect ContentPilot Lite/,
    }).isVisible().catch(() => false),
  }), (value) => value.courseButton || value.practiceHeading, {
    description: "saved course or restored Practice screen",
  });
  if (state.courseButton) await openCourse.click();
}

async function waitForResponseReady(mainWindow, timeoutMs = 10_000) {
  const statuses = mainWindow.getByRole("status").filter({
    hasText: "Response ready",
  });
  await statuses.first().waitFor({ state: "visible", timeout: timeoutMs });
}

async function closeApplication(electronApp) {
  if (!electronApp) return;
  await electronApp.close();
}

function collectKeyPaths(value, expectedKey, pathParts = [], result = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectKeyPaths(
      item,
      expectedKey,
      [...pathParts, String(index)],
      result,
    ));
    return result;
  }
  if (!value || typeof value !== "object") return result;
  for (const [key, item] of Object.entries(value)) {
    const nextPath = [...pathParts, key];
    if (item === expectedKey) result.push(nextPath.join("."));
    collectKeyPaths(item, expectedKey, nextPath, result);
  }
  return result;
}

test("completes startup and proves the bound-task Practice flow", {
  timeout: 75_000,
}, async (t) => {
  const mainSource = await readFile(
    path.join(mockRoot, "src", "main", "main.mjs"),
    "utf8",
  );
  assert.match(mainSource, /COURSE_MOCK_APP_SERVER_FIXTURE/);
  assert.match(mainSource, /ELECTRON_RUN_AS_NODE/);

  await rm(userDataPath, { recursive: true, force: true });
  let electronApp = null;
  t.after(async () => {
    await closeApplication(electronApp).catch(() => {});
    await rm(userDataPath, { recursive: true, force: true });
  });

  electronApp = await launchMock();
  let mainWindow = await findWindowByFile(electronApp, "index.html", {
    visible: true,
  });
  await mainWindow.getByRole("heading", {
    name: "Welcome to Content Builder Academy",
  }).waitFor();
  await mainWindow.getByRole("button", { name: "Start setup" }).click();
  await mainWindow.getByRole("heading", { name: "Connect Codex" }).waitFor();
  await mainWindow.getByRole("button", { name: "Connect Codex" }).click();
  await mainWindow.getByRole("heading", {
    name: "Sample teaching setup",
  }).waitFor();
  const goalInput = mainWindow.getByLabel("Sample goal");
  await mainWindow.getByRole("button", { name: "Continue", exact: true }).click();
  assert.equal(await goalInput.getAttribute("aria-invalid"), "true");
  assert.equal(await goalInput.evaluate((input) => (
    input === document.activeElement
  )), true);
  await goalInput.pressSequentially("Test the startup mechanism");
  assert.equal(await goalInput.inputValue(), "Test the startup mechanism");
  assert.equal(await goalInput.evaluate((input) => (
    input === document.activeElement
  )), true);
  await mainWindow.getByLabel("Sample short session").check();
  await mainWindow.getByLabel("Sample check-ins").check();
  await mainWindow.getByRole("button", { name: "Back" }).click();
  await mainWindow.getByRole("heading", { name: "Connect Codex" }).waitFor();
  await mainWindow.getByRole("button", { name: "Continue setup" }).click();
  await mainWindow.getByRole("heading", {
    name: "Sample teaching setup",
  }).waitFor();
  assert.equal(
    await mainWindow.getByLabel("Sample goal").inputValue(),
    "Test the startup mechanism",
  );
  await mainWindow.getByRole("button", { name: "Continue", exact: true }).click();
  await mainWindow.getByRole("heading", { name: "Setup complete" }).waitFor();
  await closeApplication(electronApp);
  electronApp = null;

  electronApp = await launchMock();
  mainWindow = await findWindowByFile(electronApp, "index.html", {
    visible: true,
  });
  await mainWindow.getByRole("heading", {
    name: "Welcome to Content Builder Academy",
  }).waitFor();
  await mainWindow.getByRole("button", { name: "Open course" }).click();
  await mainWindow.getByRole("heading", {
    name: "Work safely with an Executor",
  }).waitFor();

  await mainWindow.getByRole("button", { name: "Review setup" }).click();
  await mainWindow.getByRole("heading", {
    name: "Sample teaching setup",
  }).waitFor();
  assert.equal(
    await mainWindow.getByLabel("Sample goal").inputValue(),
    "Test the startup mechanism",
  );
  await mainWindow.getByRole("button", { name: "Continue", exact: true }).click();
  await mainWindow.getByRole("heading", { name: "Setup complete" }).waitFor();
  await mainWindow.getByRole("button", { name: "Continue to mock app" }).click();
  await mainWindow.getByRole("heading", {
    name: "Work safely with an Executor",
  }).waitFor();

  const mainWindowCountBeforePractice = electronApp.windows().filter((page) => (
    pageMatchesFile(page, "index.html")
  )).length;
  await mainWindow.getByRole("button", { name: "Start Practice" }).click();
  await mainWindow.getByRole("heading", {
    name: /Inspect ContentPilot Lite/,
  }).waitFor();
  assert.equal(
    electronApp.windows().filter((page) => pageMatchesFile(page, "index.html")).length,
    mainWindowCountBeforePractice,
    "Practice must reuse the existing main Course window.",
  );
  await mainWindow.getByText(taskName, { exact: true }).first().waitFor({
    timeout: 5_000,
  });
  await waitForResponseReady(mainWindow);

  await mainWindow.getByRole("tab", { name: "Teacher chat" }).click();
  const teacherComposer = mainWindow.getByRole("textbox", {
    name: "Message Teacher",
  });
  await teacherComposer.fill(firstTeacherQuestion);
  await mainWindow.getByRole("button", { name: "Send", exact: true }).click();
  const teacherLog = mainWindow.getByRole("log", {
    name: "Teacher conversation",
  });
  const teacherText = await pollUntil(
    () => teacherLog.innerText(),
    (text) => /Zero changed files/i.test(text),
    { timeoutMs: 10_000, description: "scoped Teacher answer" },
  );
  assert.match(teacherText, /ContentPilot Lite/);
  assert.match(teacherText, /read-only\/no-edit constraints/i);
  assert.match(
    teacherText,
    /Brand Brain[\s\S]*Idea Lab[\s\S]*Draft Studio[\s\S]*Calendar Board/,
  );
  assert.match(teacherText, /Zero changed files/i);
  assert.doesNotMatch(teacherText, /DECOY/i);
  assert.doesNotMatch(await mainWindow.getByRole("main").innerText(), /DECOY/i);

  const bubbleWindow = await findWindowByFile(electronApp, "bubble.html");
  const quickChatWindow = await findWindowByFile(electronApp, "quick-chat.html");
  await mainWindow.getByRole("button", { name: "Compact to Teacher" }).click();
  await waitForWindowVisibility(electronApp, mainWindow, false);
  const bubbleState = await waitForWindowVisibility(electronApp, bubbleWindow, true);
  assert.deepEqual(
    { width: bubbleState.bounds.width, height: bubbleState.bounds.height },
    { width: 72, height: 72 },
  );
  await bubbleWindow.getByRole("button", {
    name: "Open Teacher quick chat",
  }).click();
  await waitForWindowVisibility(electronApp, quickChatWindow, true);
  await quickChatWindow.getByRole("textbox", { name: "Message Teacher" }).fill(
    secondTeacherQuestion,
  );
  await quickChatWindow.getByRole("button", { name: "Send", exact: true }).click();
  const quickLog = quickChatWindow.getByRole("log", {
    name: "Teacher conversation",
  });
  await pollUntil(
    () => quickLog.innerText(),
    (text) => (text.match(/Zero changed files/gi) ?? []).length >= 2,
    { timeoutMs: 10_000, description: "second scoped Teacher answer" },
  );
  assert.doesNotMatch(await quickChatWindow.getByRole("main").innerText(), /DECOY/i);
  await quickChatWindow.getByRole("button", {
    name: "Expand Practice",
  }).click();
  await waitForWindowVisibility(electronApp, mainWindow, true);
  await waitForWindowVisibility(electronApp, bubbleWindow, false);
  await waitForWindowVisibility(electronApp, quickChatWindow, false);
  assert.equal(
    await mainWindow.getByRole("tab", { name: "Teacher chat" }).getAttribute(
      "aria-selected",
    ),
    "true",
  );

  await closeApplication(electronApp);
  electronApp = null;

  const practiceStatePath = path.join(userDataPath, "practice-state.json");
  const persistedSource = await readFile(practiceStatePath, "utf8");
  const persisted = JSON.parse(persistedSource);
  assert.equal(persisted.activeSession.binding.threadId, "thr-practice-1");
  assert.deepEqual(
    collectKeyPaths(persisted, "thr-practice-1").sort(),
    [
      "activeSession.activity.threadId",
      "activeSession.binding.threadId",
    ],
    "The bound task ID must remain only in trusted main-process identity fields.",
  );
  assert.match(
    persisted.activeSession.activity.executorResponseSummary,
    /Brand Brain[\s\S]*Calendar Board/,
  );
  assert.ok(persisted.teacherChat.some(({ text }) => text === firstTeacherQuestion));
  assert.ok(persisted.teacherChat.some(({ text }) => text === secondTeacherQuestion));
  assert.ok(persisted.teacherChat.some(({ role, text }) => (
    role === "teacher" && /Zero changed files/i.test(text)
  )));
  for (const forbidden of [
    "DECOY",
    "RAW OUTPUT",
    "accessToken",
    "refreshToken",
    "apiKey",
    "authorization",
    "reasoning",
  ]) {
    assert.doesNotMatch(persistedSource, new RegExp(forbidden, "i"));
  }

  electronApp = await launchMock();
  mainWindow = await findWindowByFile(electronApp, "index.html", {
    visible: true,
  });
  await openCourseIfPresented(mainWindow);
  await mainWindow.getByRole("heading", {
    name: /Inspect ContentPilot Lite/,
  }).waitFor({ timeout: 5_000 });
  await mainWindow.getByText(taskName, { exact: true }).first().waitFor();
  await waitForResponseReady(mainWindow);
  assert.equal(
    await mainWindow.getByRole("tab", { name: "Teacher chat" }).getAttribute(
      "aria-selected",
    ),
    "true",
  );
  const restoredChat = await mainWindow.getByRole("log", {
    name: "Teacher conversation",
  }).innerText();
  assert.match(restoredChat, new RegExp(firstTeacherQuestion.replaceAll("?", "\\?")));
  assert.match(restoredChat, new RegExp(secondTeacherQuestion.replaceAll(".", "\\.")));
  assert.match(restoredChat, /ContentPilot Lite/);
  assert.match(restoredChat, /Zero changed files/i);
  assert.doesNotMatch(restoredChat, /DECOY/i);
  assert.doesNotMatch(await mainWindow.getByRole("main").innerText(), /DECOY/i);

  await closeApplication(electronApp);
  electronApp = null;
});
