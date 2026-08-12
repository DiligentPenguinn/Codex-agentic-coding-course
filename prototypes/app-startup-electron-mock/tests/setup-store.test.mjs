import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createDefaultSetupState,
  parseSetupState,
} from "../src/shared/setup-state-schema.mjs";
import { createSetupStore } from "../src/main/setup-store.mjs";

const now = "2026-07-30T00:00:00.000Z";
const clock = () => new Date(now);

function validState(overrides = {}) {
  return {
    schemaVersion: 1,
    setupCompleted: false,
    codexConnected: false,
    onboardingResponses: {},
    updatedAt: now,
    ...overrides,
  };
}

test("creates safe first-run defaults", () => {
  assert.deepEqual(createDefaultSetupState(clock), validState());
});

test("rejects credential-shaped fields recursively", () => {
  for (const key of ["accessToken", "refresh_token", "apiKey", "authorization"]) {
    assert.throws(
      () => parseSetupState(validState({
        onboardingResponses: {
          sample: {
            [key]: "secret",
          },
        },
      })),
      /credential-shaped field/i,
    );
  }
});

test("rejects unknown top-level keys and non-boolean connection state", () => {
  assert.throws(
    () => parseSetupState({ ...validState(), unexpected: true }),
    /unknown setup-state field/i,
  );
  assert.throws(
    () => parseSetupState(validState({ codexConnected: "yes" })),
    /codexConnected must be boolean/i,
  );
});

test("returns a deep clone of valid state", () => {
  const input = validState({
    setupCompleted: true,
    codexConnected: true,
    onboardingResponses: { "sample-goal": "Build a sample" },
  });
  const parsed = parseSetupState(input);

  assert.deepEqual(parsed, input);
  assert.notEqual(parsed, input);
  assert.notEqual(parsed.onboardingResponses, input.onboardingResponses);
});

test("writes atomically and resumes valid state", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "course-store-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  const store = createSetupStore({ userDataPath, clock });
  const state = validState({
    setupCompleted: true,
    codexConnected: true,
    onboardingResponses: { "sample-goal": "Test persistence" },
  });

  await store.write(state);

  assert.deepEqual(await store.read(), state);
  assert.doesNotMatch((await readdir(userDataPath)).join(","), /\.tmp/);
  assert.equal(
    JSON.parse(await readFile(path.join(userDataPath, "setup-state.json"), "utf8"))
      .setupCompleted,
    true,
  );
});

test("quarantines corrupt JSON and returns defaults", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "course-corrupt-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  const statePath = path.join(userDataPath, "setup-state.json");
  await writeFile(statePath, "{broken");
  const store = createSetupStore({ userDataPath, clock });

  const state = await store.read();

  assert.equal(state.setupCompleted, false);
  assert.equal(
    (await readdir(userDataPath)).some((name) => (
      name === "setup-state.corrupt-2026-07-30T00-00-00.000Z.json"
    )),
    true,
  );
  assert.deepEqual(store.lastRecovery, {
    code: "STATE_RESET",
    message: "Local setup progress was reset because it could not be read.",
  });
  assert.doesNotMatch(JSON.stringify(store.lastRecovery), /\{broken/);
});

test("reset removes stored progress and returns defaults", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "course-reset-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  const store = createSetupStore({ userDataPath, clock });
  await store.write(validState({ setupCompleted: true }));

  const resetState = await store.reset();

  assert.deepEqual(resetState, createDefaultSetupState(clock));
  assert.deepEqual(await readdir(userDataPath), []);
});
