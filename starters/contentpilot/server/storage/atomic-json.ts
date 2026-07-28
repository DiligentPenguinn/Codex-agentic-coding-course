import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { getDataRoot, resolveDataPath } from "./paths";

export async function readJson<T>(
  relativePath: string,
  dataRoot = getDataRoot(),
): Promise<T> {
  const target = resolveDataPath(relativePath, dataRoot);
  const contents = await readFile(target, "utf8");

  return JSON.parse(contents) as T;
}

export async function writeJsonAtomic(
  relativePath: string,
  value: unknown,
  dataRoot = getDataRoot(),
) {
  const target = resolveDataPath(relativePath, dataRoot);
  const directory = path.dirname(target);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  const temporary = path.join(
    directory,
    `.${path.basename(target)}.${process.pid}.${randomUUID()}.tmp`,
  );

  await mkdir(directory, { recursive: true });

  try {
    await writeFile(temporary, serialized, {
      encoding: "utf8",
      flag: "wx",
    });
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
