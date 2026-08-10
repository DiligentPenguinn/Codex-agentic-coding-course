import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(new URL("./course-state.mjs", import.meta.url));

const courseMap = {
  pilotVersion: "test",
  defaultLessonId: "module-1",
  modules: [
    {
      id: "module-1",
      artifactPath: "artifacts/codex-setup-checklist.md",
      artifactGateCheckpoint: "m1-setup-checklist",
      checkpoints: ["m1-setup-checklist", "m1-mastery", "m1-complete"],
      nextLessonId: "module-2"
    },
    {
      id: "module-2",
      artifactPaths: ["artifacts/PRD.md", "artifacts/implementation-plan.md"],
      artifactGateCheckpoint: "m2-planning-package",
      checkpoints: ["m2-planning-package", "m2-mastery", "m2-complete"],
      nextLessonId: null
    }
  ]
};

async function createWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "course-state-test-"));
  await mkdir(join(root, "course"), { recursive: true });
  await writeFile(
    join(root, "course/course-structure.json"),
    `${JSON.stringify(courseMap, null, 2)}\n`
  );
  return root;
}

async function writeArtifact(root, path, content) {
  const fullPath = join(root, path);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

async function runState(root, ...args) {
  return execFileAsync(process.execPath, [scriptPath, ...args], { cwd: root });
}

test("setup checkpoint requires the learner checklist", async () => {
  const root = await createWorkspace();
  try {
    await assert.rejects(
      runState(root, "checkpoint", "module-1", "m1-setup-checklist"),
      /missing artifacts: artifacts\/codex-setup-checklist\.md/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("completing setup advances the learner to Module 2", async () => {
  const root = await createWorkspace();
  try {
    await writeArtifact(
      root,
      "artifacts/codex-setup-checklist.md",
      "# Checklist\nLearner approved\n"
    );
    await runState(root, "checkpoint", "module-1", "m1-setup-checklist");
    await runState(root, "checkpoint", "module-1", "m1-mastery");
    await runState(root, "complete", "module-1");

    const state = JSON.parse(
      await readFile(join(root, ".course/learner-state.json"), "utf8")
    );
    assert.equal(state.currentLessonId, "module-2");
    assert.equal(state.currentBeatId, "m2-planning-package");
    assert.deepEqual(state.completedLessonIds, ["module-1"]);
    assert.ok(state.completedCheckpoints.includes("m1-complete"));
    assert.equal(
      state.artifacts.setupChecklistPath,
      "artifacts/codex-setup-checklist.md"
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("planning checkpoint requires both Module 2 artifacts", async () => {
  const root = await createWorkspace();
  try {
    await assert.rejects(
      runState(root, "checkpoint", "module-2", "m2-planning-package"),
      /missing artifacts: artifacts\/PRD\.md, artifacts\/implementation-plan\.md/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("planning checkpoint rejects an empty artifact", async () => {
  const root = await createWorkspace();
  try {
    await writeArtifact(root, "artifacts/PRD.md", "# PRD\n");
    await writeArtifact(root, "artifacts/implementation-plan.md", "   \n");
    await assert.rejects(
      runState(root, "checkpoint", "module-2", "m2-planning-package"),
      /empty artifacts: artifacts\/implementation-plan\.md/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Module 2 completes after both artifacts and required checkpoints exist", async () => {
  const root = await createWorkspace();
  try {
    await writeArtifact(root, "artifacts/PRD.md", "# PRD\nApproved\n");
    await writeArtifact(
      root,
      "artifacts/implementation-plan.md",
      "# Implementation plan\nApproved\n"
    );
    await runState(root, "checkpoint", "module-2", "m2-planning-package");
    await runState(root, "checkpoint", "module-2", "m2-mastery");
    await runState(root, "complete", "module-2");

    const state = JSON.parse(
      await readFile(join(root, ".course/learner-state.json"), "utf8")
    );
    assert.deepEqual(state.completedLessonIds, ["module-2"]);
    assert.ok(state.completedCheckpoints.includes("m2-complete"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("completion revalidates artifacts after the planning checkpoint", async () => {
  const root = await createWorkspace();
  try {
    await writeArtifact(root, "artifacts/PRD.md", "# PRD\nApproved\n");
    await writeArtifact(
      root,
      "artifacts/implementation-plan.md",
      "# Implementation plan\nApproved\n"
    );
    await runState(root, "checkpoint", "module-2", "m2-planning-package");
    await runState(root, "checkpoint", "module-2", "m2-mastery");
    await rm(join(root, "artifacts/implementation-plan.md"));

    await assert.rejects(
      runState(root, "complete", "module-2"),
      /missing artifacts: artifacts\/implementation-plan\.md/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
