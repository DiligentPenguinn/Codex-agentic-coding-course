import { createAtomicJsonStore } from "./atomic-json-store.mjs";
import {
  createDefaultPracticeState,
  parsePracticeState,
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
