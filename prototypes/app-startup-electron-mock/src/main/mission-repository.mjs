import * as defaultFs from "node:fs/promises";
import path from "node:path";

import { parsePracticeMissionFixture, parsePracticeStartRequest } from "../shared/practice-contracts.mjs";

export async function loadPracticeStartRequest({ fixturePath, repositoryRoot, fs = defaultFs }) {
  const root = path.resolve(repositoryRoot);
  const source = await fs.readFile(path.resolve(fixturePath), "utf8");
  const fixture = parsePracticeMissionFixture(JSON.parse(source));
  const exerciseAbsolute = path.resolve(root, fixture.workspace.exercisePath);
  const relative = path.relative(root, exerciseAbsolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new TypeError("Practice exercise must stay inside the repository.");
  const stat = await fs.stat(exerciseAbsolute);
  if (!stat.isDirectory()) throw new TypeError("Practice exercise directory is unavailable.");
  return parsePracticeStartRequest({
    schemaVersion: 1,
    courseRunId: fixture.courseRunId,
    lessonId: fixture.lessonId,
    missionId: fixture.missionId,
    checkpointId: fixture.checkpointId,
    content: { ...fixture.content, kind: fixture.fixtureMetadata.contentKind, owner: fixture.fixtureMetadata.sourceOwner },
    workspace: { expectedRepositoryRoot: root, exercisePath: fixture.workspace.exercisePath },
  });
}
