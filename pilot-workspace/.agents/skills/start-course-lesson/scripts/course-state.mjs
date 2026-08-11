#!/usr/bin/env node

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";

const workspaceRoot = process.cwd();
const courseMapPath = resolve(workspaceRoot, "course/course-structure.json");
const statePath = resolve(workspaceRoot, ".course/learner-state.json");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readState() {
  try {
    return await readJson(statePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function findModule(courseMap, lessonId) {
  return courseMap.modules.find((module) => module.id === lessonId);
}

function artifactPathsFor(module) {
  if (Array.isArray(module.artifactPaths)) return module.artifactPaths;
  return module.artifactPath ? [module.artifactPath] : [];
}

async function validateArtifacts(module) {
  const missingArtifacts = [];
  const emptyArtifacts = [];

  for (const artifactPath of artifactPathsFor(module)) {
    try {
      const content = await readFile(resolve(workspaceRoot, artifactPath), "utf8");
      if (content.trim().length === 0) emptyArtifacts.push(artifactPath);
    } catch (error) {
      if (error?.code === "ENOENT") {
        missingArtifacts.push(artifactPath);
        continue;
      }
      throw error;
    }
  }

  if (missingArtifacts.length > 0 || emptyArtifacts.length > 0) {
    const problems = [
      missingArtifacts.length > 0
        ? `missing artifacts: ${missingArtifacts.join(", ")}`
        : null,
      emptyArtifacts.length > 0
        ? `empty artifacts: ${emptyArtifacts.join(", ")}`
        : null
    ].filter(Boolean);
    throw new Error(`Artifact gate failed for ${module.id}; ${problems.join("; ")}`);
  }
}

function defaultState(courseMap, lessonId) {
  const module = findModule(courseMap, lessonId);
  return {
    schemaVersion: "1.0.0",
    pilotVersion: courseMap.pilotVersion,
    currentLessonId: lessonId,
    currentBeatId: module.checkpoints[0],
    completedLessonIds: [],
    completedCheckpoints: [],
    timeBudgetMinutes: null,
    artifacts: {
      questCardPath: "artifacts/quest-card.md",
      setupChecklistPath: "artifacts/codex-setup-checklist.md",
      prdPath: "artifacts/PRD.md",
      implementationPlanPath: "artifacts/implementation-plan.md"
    },
    updatedAt: null
  };
}

async function writeState(state) {
  const nextState = {
    ...state,
    updatedAt: new Date().toISOString()
  };
  const tempPath = `${statePath}.tmp-${process.pid}`;
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(nextState, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
  await rename(tempPath, statePath);
  return nextState;
}

async function main() {
  const [command = "show", lessonId, beatId, minutesText] = process.argv.slice(2);
  const courseMap = await readJson(courseMapPath);
  const currentState = await readState();

  if (command === "show") {
    const result = currentState ?? {
      exists: false,
      currentLessonId: courseMap.defaultLessonId,
      currentBeatId: findModule(courseMap, courseMap.defaultLessonId).checkpoints[0],
      timeBudgetMinutes: null
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }

  if (command === "checkpoint") {
    const module = findModule(courseMap, lessonId);
    if (!module) return fail(`Unknown lesson id: ${lessonId ?? "(missing)"}`);
    if (!module.checkpoints.includes(beatId)) {
      return fail(`Unknown checkpoint for ${lessonId}: ${beatId ?? "(missing)"}`);
    }

    if (beatId === module.artifactGateCheckpoint) {
      await validateArtifacts(module);
    }

    const minutes = minutesText === undefined ? undefined : Number(minutesText);
    if (
      minutes !== undefined &&
      (!Number.isInteger(minutes) || ![10, 20, 30, 45, 60].includes(minutes))
    ) {
      return fail("Time budget must be one of: 10, 20, 30, 45, 60");
    }

    const state = currentState ?? defaultState(courseMap, lessonId);
    const completedCheckpoints = Array.from(
      new Set([...(state.completedCheckpoints ?? []), beatId])
    );
    const checkpointIndex = module.checkpoints.indexOf(beatId);
    const nextCheckpoint =
      module.checkpoints[checkpointIndex + 1] ?? module.checkpoints[checkpointIndex];
    const nextState = await writeState({
      ...state,
      currentLessonId: lessonId,
      currentBeatId: nextCheckpoint,
      completedCheckpoints,
      timeBudgetMinutes: minutes ?? state.timeBudgetMinutes
    });
    process.stdout.write(`${JSON.stringify(nextState, null, 2)}\n`);
    return;
  }

  if (command === "complete") {
    const module = findModule(courseMap, lessonId);
    if (!module) return fail(`Unknown lesson id: ${lessonId ?? "(missing)"}`);

    const state = currentState ?? defaultState(courseMap, lessonId);
    const requiredCheckpoints = module.checkpoints.slice(0, -1);
    const missingCheckpoints = requiredCheckpoints.filter(
      (checkpoint) => !(state.completedCheckpoints ?? []).includes(checkpoint)
    );
    if (missingCheckpoints.length > 0) {
      return fail(
        `Cannot complete ${lessonId}; missing checkpoints: ${missingCheckpoints.join(", ")}`
      );
    }

    await validateArtifacts(module);

    const completedLessonIds = Array.from(
      new Set([...(state.completedLessonIds ?? []), lessonId])
    );
    const completedCheckpoints = Array.from(
      new Set([
        ...(state.completedCheckpoints ?? []),
        module.checkpoints[module.checkpoints.length - 1]
      ])
    );
    const nextModule = module.nextLessonId
      ? findModule(courseMap, module.nextLessonId)
      : null;
    const nextState = await writeState({
      ...state,
      currentLessonId: nextModule?.id ?? lessonId,
      currentBeatId:
        nextModule?.checkpoints[0] ?? module.checkpoints[module.checkpoints.length - 1],
      completedLessonIds,
      completedCheckpoints
    });
    process.stdout.write(`${JSON.stringify(nextState, null, 2)}\n`);
    return;
  }

  fail(`Unknown command: ${command}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
