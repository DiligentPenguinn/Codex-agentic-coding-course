import { createHash } from "node:crypto";
import { readFile as readFileDefault } from "node:fs/promises";

function majorOf(version) {
  const match = String(version ?? "").match(/^v?(\d+)/);
  return match ? Number(match[1]) : 0;
}

async function readOptional(path, readFile) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function packageLockFingerprint(
  lockPath,
  { readFile = readFileDefault } = {},
) {
  const contents = await readFile(lockPath);
  return createHash("sha256").update(contents).digest("hex");
}

export async function detectSetup({
  platform,
  nodeVersion,
  commandExists,
  commandSucceeds,
  mockRoot,
  lockPath,
  stampPath,
  readFile,
}) {
  const nodeMajor = majorOf(nodeVersion);
  const [npmAvailable, codexAvailable, lockFingerprint] = await Promise.all([
    commandExists("npm"),
    commandExists("codex"),
    packageLockFingerprint(lockPath, { readFile }),
  ]);
  const appServerAvailable = codexAvailable
    ? await commandSucceeds("codex", ["app-server", "--help"])
    : false;
  const installedFingerprint = await readOptional(stampPath, readFile);

  return Object.freeze({
    platformSupported: platform === "win32",
    nodeMajor,
    nodeCompatible: nodeMajor >= 22,
    npmAvailable,
    codexAvailable,
    appServerAvailable,
    lockFingerprint,
    installedFingerprint: installedFingerprint?.trim() ?? null,
    lockMatches: installedFingerprint?.trim() === lockFingerprint,
    mockRoot,
    lockPath,
    stampPath,
  });
}

export function buildInstallPlan(report) {
  const actions = [];

  if (!report.codexAvailable || !report.appServerAvailable) {
    actions.push({
      id: "codex-cli",
      reason: "Codex App Server is required for managed ChatGPT login.",
      scope: "user-level global npm package",
      command: "npm",
      args: ["install", "-g", "@openai/codex@latest"],
    });
  }

  if (!report.lockMatches) {
    actions.push({
      id: "project-packages",
      reason: "The Electron mock dependencies must match package-lock.json.",
      scope: "project-local node_modules",
      command: "npm",
      args: ["ci"],
      cwd: report.mockRoot,
      fingerprint: report.lockFingerprint,
      stampPath: report.stampPath,
    });
  }

  return actions;
}

function displayCommand(action) {
  return [action.command, ...action.args].join(" ");
}

export function formatInstallPlan(actions) {
  const lines = ["Proposed installation plan:"];

  for (const action of actions) {
    lines.push(
      "",
      `[${action.id}]`,
      `Why: ${action.reason}`,
      `Scope: ${action.scope}`,
      `Command: ${displayCommand(action)}`,
    );
    if (action.cwd) lines.push(`Directory: ${action.cwd}`);
  }

  return lines.join("\n");
}

export async function executeInstallPlan(
  actions,
  { confirm, run, writeFile = async () => {} },
) {
  if (actions.length === 0) return;

  const approved = await confirm(formatInstallPlan(actions));
  if (!approved) {
    const error = new Error("Installation declined.");
    error.code = "INSTALL_DECLINED";
    throw error;
  }

  for (const action of actions) {
    let result;
    try {
      result = await run(action.command, action.args, {
        cwd: action.cwd,
        stdio: "inherit",
      });
    } catch {
      const error = new Error(`Installation action failed: ${action.id}`);
      error.code = "INSTALL_FAILED";
      error.actionId = action.id;
      throw error;
    }
    const exitCode = typeof result === "number" ? result : result?.exitCode;

    if (exitCode !== 0) {
      const error = new Error(`Installation action failed: ${action.id}`);
      error.code = "INSTALL_FAILED";
      error.actionId = action.id;
      throw error;
    }

    if (
      action.id === "project-packages"
      && action.stampPath
      && action.fingerprint
    ) {
      await writeFile(action.stampPath, action.fingerprint, "utf8");
    }
  }
}
