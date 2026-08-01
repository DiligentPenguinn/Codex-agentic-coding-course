import * as defaultFs from "node:fs/promises";
import path from "node:path";

import {
  createDefaultSetupState,
  parseSetupState,
} from "../shared/setup-state-schema.mjs";

function safeTimestamp(date) {
  return date.toISOString().replaceAll(":", "-");
}

export function createSetupStore({
  userDataPath,
  fs = defaultFs,
  clock = () => new Date(),
}) {
  const statePath = path.join(userDataPath, "setup-state.json");
  const tempPath = path.join(userDataPath, "setup-state.json.tmp");
  let lastRecovery = null;

  async function quarantine() {
    const quarantinePath = path.join(
      userDataPath,
      `setup-state.corrupt-${safeTimestamp(clock())}.json`,
    );
    await fs.rename(statePath, quarantinePath);
    lastRecovery = Object.freeze({
      code: "STATE_RESET",
      message: "Local setup progress was reset because it could not be read.",
    });
  }

  return {
    get lastRecovery() {
      return lastRecovery;
    },

    async read() {
      let source;
      try {
        source = await fs.readFile(statePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") return createDefaultSetupState(clock);
        throw error;
      }

      try {
        return parseSetupState(JSON.parse(source));
      } catch {
        await quarantine();
        return createDefaultSetupState(clock);
      }
    },

    async write(value) {
      const state = parseSetupState(value);
      await fs.mkdir(userDataPath, { recursive: true });
      const handle = await fs.open(tempPath, "w");
      try {
        await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(tempPath, statePath);
      return structuredClone(state);
    },

    async reset() {
      await fs.rm(statePath, { force: true });
      await fs.rm(tempPath, { force: true });
      lastRecovery = null;
      return createDefaultSetupState(clock);
    },
  };
}
