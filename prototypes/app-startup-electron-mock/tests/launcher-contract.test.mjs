import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveNodeToolCommand } from "../../../scripts/setup-and-start.mjs";

const testsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testsDirectory, "..", "..", "..");
const launcherPath = path.join(repositoryRoot, "start-course.cmd");

test("runs npm shims through Node without enabling a shell", () => {
  assert.deepEqual(
    resolveNodeToolCommand(
      "npm",
      ["ci"],
      "C:\\Program Files\\nodejs\\node.exe",
    ),
    {
      command: "C:\\Program Files\\nodejs\\node.exe",
      args: [
        "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js",
        "ci",
      ],
    },
  );
  assert.deepEqual(
    resolveNodeToolCommand(
      "npx",
      ["--no-install", "install-electron", "--no"],
      "C:\\Program Files\\nodejs\\node.exe",
    ).args[0],
    "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npx-cli.js",
  );
});

test("root launcher is short, Windows-native, and contains no teaching or auth", async () => {
  const source = await readFile(launcherPath, "utf8");

  assert.doesNotMatch(source, /ExecutionPolicy|Bypass/i);
  assert.match(source, /OpenJS\.NodeJS\.LTS/);
  assert.match(source, /winget/);
  assert.match(source, /setup-and-start\.mjs/);
  assert.match(source, /process\.versions\.node/);
  assert.match(source, /set \/p/i);
  assert.match(source, /%~dp0/);
  assert.match(source, /Welcome to Content Builder Academy!/);
  assert.match(source, /CONTENT BUILDER/);
  assert.match(source, /Build something real\./);
  assert.ok(
    source.indexOf("CONTENT BUILDER")
      < source.indexOf("Welcome to Content Builder Academy!"),
    "the workshop splash must appear before the welcome",
  );
  assert.match(source, /Nothing will be installed without your approval/);
  const setupSource = await readFile(
    path.join(repositoryRoot, "scripts", "setup-and-start.mjs"),
    "utf8",
  );
  assert.match(
    setupSource,
    /Everything is ready\. Opening the course setup app/,
  );
  assert.ok(
    source.indexOf("Welcome to Content Builder Academy!")
      < source.indexOf("where node"),
    "the learner welcome must appear before prerequisite checks",
  );
  assert.doesNotMatch(
    source,
    /ChatGPT|access.?token|refresh.?token|api.?key|teaching question/i,
  );
});

test("declining a simulated missing Node install exits without winget", async () => {
  const result = await new Promise((resolve, reject) => {
    const child = spawn(
      process.env.ComSpec ?? "cmd.exe",
      ["/d", "/c", launcherPath],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          COURSE_MOCK_BOOTSTRAP_TEST: "1",
          COURSE_MOCK_FORCE_NODE_MISSING: "1",
        },
        windowsHide: true,
      },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdin.end("N\r\n");
    child.once("error", reject);
    child.once("exit", (exitCode) => resolve({
      exitCode,
      output: `${stdout}\n${stderr}`,
    }));
  });

  assert.equal(result.exitCode, 2, result.output);
  assert.match(result.output, /Welcome to Content Builder Academy!/);
  assert.match(result.output, /CONTENT BUILDER/);
  assert.match(result.output, /\[ >_ \]  \+/);
  assert.match(result.output, /Build something real\./);
  assert.ok(
    result.output.indexOf("CONTENT BUILDER")
      < result.output.indexOf("Welcome to Content Builder Academy!"),
  );
  assert.match(result.output, /Here's what we'll do:/);
  assert.ok(
    result.output.indexOf("Welcome to Content Builder Academy!")
      < result.output.indexOf("Required: Node.js 22 or newer"),
  );
  assert.match(result.output, /winget install --id OpenJS\.NodeJS\.LTS/);
  assert.match(result.output, /No installation was run/);
  assert.doesNotMatch(result.output, /Successfully installed/i);
});
