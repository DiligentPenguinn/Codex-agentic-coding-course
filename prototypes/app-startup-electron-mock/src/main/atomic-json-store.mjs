import * as defaultFs from "node:fs/promises";
import path from "node:path";

function safeTimestamp(date) {
  return date.toISOString().replaceAll(":", "-");
}

export function createAtomicJsonStore({
  directory,
  fileName,
  parse,
  createDefault,
  recoveryMessage,
  fs = defaultFs,
  clock = () => new Date(),
}) {
  const statePath = path.join(directory, fileName);
  const tempPath = `${statePath}.tmp`;
  let lastRecovery = null;

  async function quarantine() {
    const extension = path.extname(fileName);
    const stem = path.basename(fileName, extension);
    const quarantinePath = path.join(
      directory,
      `${stem}.corrupt-${safeTimestamp(clock())}${extension}`,
    );
    await fs.rename(statePath, quarantinePath);
    lastRecovery = Object.freeze({ code: "STATE_RESET", message: recoveryMessage });
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
        if (error?.code === "ENOENT") return createDefault(clock);
        throw error;
      }

      try {
        return parse(JSON.parse(source));
      } catch {
        await quarantine();
        return createDefault(clock);
      }
    },

    async write(value) {
      const state = parse(value);
      await fs.mkdir(directory, { recursive: true });
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
      return createDefault(clock);
    },
  };
}
