import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
} from "./setup-core.mjs";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const mockRoot = path.join(
  repositoryRoot,
  "prototypes",
  "app-startup-electron-mock",
);

function runProcess(command, args, { cwd, stdio = "ignore", env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      shell: false,
      stdio,
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve({ exitCode: exitCode ?? 1 }));
  });
}

async function commandExists(command) {
  const result = await runProcess("where.exe", [command]);
  return result.exitCode === 0;
}

async function commandSucceeds(command, args) {
  try {
    const result = await runProcess(command, args);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

async function confirmInstall(formattedPlan) {
  const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    process.stdout.write(`${formattedPlan}\n\n`);
    const answer = await terminal.question("Run this exact plan? [y/N] ");
    return /^(y|yes)$/i.test(answer.trim());
  } finally {
    terminal.close();
  }
}

export async function launchElectron({
  root = mockRoot,
  disconnected = false,
  run = runProcess,
} = {}) {
  const result = await run("npm", ["start"], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      COURSE_MOCK_START_DISCONNECTED: disconnected ? "1" : "0",
    },
  });
  return result.exitCode;
}

export async function main() {
  const lockPath = path.join(mockRoot, "package-lock.json");
  const stampPath = path.join(
    mockRoot,
    "node_modules",
    ".course-lock.sha256",
  );
  const deps = {
    platform: process.platform,
    nodeVersion: process.versions.node,
    commandExists,
    commandSucceeds,
    mockRoot,
    lockPath,
    stampPath,
    readFile,
    confirm: confirmInstall,
    run: runProcess,
    writeFile,
  };

  const report = await detectSetup(deps);
  if (!report.platformSupported) {
    throw Object.assign(new Error("This prototype currently supports Windows."), {
      code: "UNSUPPORTED_PLATFORM",
      layer: "bootstrap",
    });
  }
  if (!report.nodeCompatible || !report.npmAvailable) {
    throw Object.assign(new Error("Node.js 22+ with npm is required."), {
      code: "PREREQUISITE_MISSING",
      layer: "prerequisite",
    });
  }

  const plan = buildInstallPlan(report);
  if (plan.length > 0) await executeInstallPlan(plan, deps);

  const finalReport = await detectSetup(deps);
  const exitCode = await launchElectron({
    root: mockRoot,
    disconnected: (
      !finalReport.codexAvailable || !finalReport.appServerAvailable
    ),
  });
  if (exitCode !== 0) {
    throw Object.assign(new Error("Electron exited unexpectedly."), {
      code: "ELECTRON_FAILED",
      layer: "Electron",
    });
  }
}

function safeFailure(error) {
  const layer = error?.layer ?? (
    error?.code === "INSTALL_DECLINED"
      ? "prerequisite"
      : error?.actionId === "project-packages"
        ? "project packages"
        : "prerequisite"
  );
  const recovery = error?.code === "INSTALL_DECLINED"
    ? "Rerun the command and approve the displayed plan, or run its commands manually."
    : "Correct the named layer, then rerun .\\start-course.cmd.";
  return { layer, recovery };
}

const isDirect = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirect) {
  main().catch((error) => {
    const failure = safeFailure(error);
    process.stderr.write(
      `Startup failed in ${failure.layer}.\nRecovery: ${failure.recovery}\n`,
    );
    process.exitCode = error?.code === "INSTALL_DECLINED" ? 2 : 3;
  });
}
