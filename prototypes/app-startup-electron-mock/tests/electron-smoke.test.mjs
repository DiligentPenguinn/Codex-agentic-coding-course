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

async function launchMock() {
  return electron.launch({
    args: [mockRoot],
    env: {
      ...process.env,
      NODE_ENV: "test",
      COURSE_MOCK_APP_SERVER_FIXTURE: fakeServerPath,
      COURSE_MOCK_USER_DATA_DIR: userDataPath,
    },
  });
}

test("completes and resumes the Electron startup flow", {
  timeout: 45_000,
}, async (t) => {
  const mainSource = await readFile(
    path.join(mockRoot, "src", "main", "main.mjs"),
    "utf8",
  );
  assert.match(mainSource, /COURSE_MOCK_APP_SERVER_FIXTURE/);
  assert.match(mainSource, /ELECTRON_RUN_AS_NODE/);

  await rm(userDataPath, { recursive: true, force: true });
  t.after(() => rm(userDataPath, { recursive: true, force: true }));

  let electronApp = await launchMock();
  let window = await electronApp.firstWindow();
  await window.getByRole("heading", { name: "Connect Codex" }).waitFor();
  await window.getByRole("button", { name: "Connect Codex" }).click();
  await window.getByRole("heading", {
    name: "Sample teaching setup",
  }).waitFor();
  await window.getByLabel("Sample goal").fill("Test the startup mechanism");
  await window.getByLabel("Sample short session").check();
  await window.getByLabel("Sample check-ins").check();
  await window.getByRole("button", { name: "Continue", exact: true }).click();
  await window.getByRole("heading", { name: "Setup complete" }).waitFor();
  await electronApp.close();

  electronApp = await launchMock();
  window = await electronApp.firstWindow();
  await window.getByRole("heading", { name: "Setup complete" }).waitFor();
  await window.getByRole("button", { name: "Reopen setup" }).click();
  await window.getByRole("heading", {
    name: "Sample teaching setup",
  }).waitFor();
  assert.equal(
    await window.getByLabel("Sample goal").inputValue(),
    "Test the startup mechanism",
  );
  await electronApp.close();
});
