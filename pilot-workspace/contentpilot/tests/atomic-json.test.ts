import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { readJson, writeJsonAtomic } from "@/server/storage/atomic-json";
import { resolveDataPath } from "@/server/storage/paths";

const temporaryRoots: string[] = [];

async function createDataRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "contentpilot-storage-"));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })),
  );
});

describe("managed data paths", () => {
  it("rejects absolute paths and traversal", async () => {
    const dataRoot = await createDataRoot();

    expect(() => resolveDataPath("/tmp/outside.json", dataRoot)).toThrow(
      "Data path must be relative.",
    );
    expect(() => resolveDataPath("../outside.json", dataRoot)).toThrow(
      "Data path must stay inside the managed data directory.",
    );
  });
});

describe("atomic JSON storage", () => {
  it("replaces JSON through a readable final file", async () => {
    const dataRoot = await createDataRoot();

    await writeJsonAtomic("profiles/example.json", { revision: 1 }, dataRoot);
    await writeJsonAtomic("profiles/example.json", { revision: 2 }, dataRoot);

    await expect(
      readJson<{ revision: number }>("profiles/example.json", dataRoot),
    ).resolves.toEqual({ revision: 2 });
  });

  it("preserves the previous file when serialization fails", async () => {
    const dataRoot = await createDataRoot();
    const relativePath = "profiles/example.json";
    const circularValue: { self?: unknown } = {};
    circularValue.self = circularValue;

    await writeJsonAtomic(relativePath, { revision: 1 }, dataRoot);

    await expect(
      writeJsonAtomic(relativePath, circularValue, dataRoot),
    ).rejects.toThrow();

    const target = resolveDataPath(relativePath, dataRoot);
    const contents = await readFile(target, "utf8");

    expect(JSON.parse(contents)).toEqual({ revision: 1 });
  });
});
