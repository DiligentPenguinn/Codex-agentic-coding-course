import { createAtomicJsonStore } from "./atomic-json-store.mjs";
import {
  createDefaultPracticeState,
  createDefaultPracticeWorkspaceState,
  parsePracticeState,
  parsePracticeWorkspaceState,
} from "../shared/practice-state-schema.mjs";

export function createPracticeStore({ userDataPath, fs, clock = () => new Date() }) {
  return createAtomicJsonStore({
    directory: userDataPath,
    fileName: "practice-state.json",
    parse: parsePracticeState,
    createDefault: createDefaultPracticeState,
    recoveryMessage: "Local Practice progress was reset because it could not be read.",
    ...(fs ? { fs } : {}),
    clock,
  });
}

export function createPracticeWorkspaceStore({ userDataPath, fs, clock = () => new Date() }) {
  return createAtomicJsonStore({
    directory: userDataPath,
    fileName: "practice-workspace-state.json",
    parse: parsePracticeWorkspaceState,
    createDefault: createDefaultPracticeWorkspaceState,
    recoveryMessage: "Local Practice workspace was reset because it could not be read.",
    ...(fs ? { fs } : {}),
    clock,
  });
}
