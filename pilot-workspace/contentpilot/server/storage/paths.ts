import path from "node:path";

export function getDataRoot() {
  return path.resolve(process.cwd(), "data");
}

export function resolveDataPath(relativePath: string, dataRoot = getDataRoot()) {
  if (!relativePath.trim()) {
    throw new Error("Data path must not be empty.");
  }

  if (path.isAbsolute(relativePath)) {
    throw new Error("Data path must be relative.");
  }

  const root = path.resolve(dataRoot);
  const target = path.resolve(root, relativePath);
  const relativeToRoot = path.relative(root, target);

  if (
    !relativeToRoot ||
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new Error("Data path must stay inside the managed data directory.");
  }

  return target;
}
