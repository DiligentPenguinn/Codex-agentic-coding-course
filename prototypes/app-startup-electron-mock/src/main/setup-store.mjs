import * as defaultFs from "node:fs/promises";

import {
  createDefaultSetupState,
  parseSetupState,
} from "../shared/setup-state-schema.mjs";
import { createAtomicJsonStore } from "./atomic-json-store.mjs";

export function createSetupStore({
  userDataPath,
  fs = defaultFs,
  clock = () => new Date(),
}) {
  return createAtomicJsonStore({
    directory: userDataPath,
    fileName: "setup-state.json",
    parse: parseSetupState,
    createDefault: createDefaultSetupState,
    recoveryMessage: "Local setup progress was reset because it could not be read.",
    fs,
    clock,
  });
}
