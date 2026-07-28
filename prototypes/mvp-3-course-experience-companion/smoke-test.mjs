import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function readRequired(relativePath) {
  const path = join(root, relativePath);
  assert.equal(existsSync(path), true, `missing ${relativePath}`);
  return readFileSync(path, "utf8");
}

const html = readRequired("index.html");
const css = readRequired("styles.css");
const app = readRequired("app.js");
const readme = readRequired("README.md");

for (const asset of ["assets/home-base.png", "assets/teacher.png"]) {
  assert.equal(existsSync(join(root, asset)), true, `missing ${asset}`);
}

for (const id of [
  "homeView",
  "sceneOverlay",
  "workshopView",
  "teacherBubble",
  "teacherChat",
  "contextDrawer",
  "progressPanel",
  "streakPanel",
  "rewardPanel",
  "screenShareDialog",
]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
}

for (const action of [
  "open-mission",
  "open-workshop",
  "open-teacher",
  "open-progress",
  "open-streak",
  "open-reward",
  "advance-scene",
  "complete-mission",
]) {
  assert.match(
    html,
    new RegExp(`data-action=["']${action}["']`),
    `missing ${action}`,
  );
}

assert.match(html, /Simulated integration/i);
assert.match(html, /assets\/home-base\.png/);
assert.match(html, /assets\/teacher\.png/);

for (const selector of [
  "#homeView",
  "#sceneOverlay",
  "#workshopView",
  "#teacherChat",
  "#teacherBubble",
]) {
  assert.match(css, new RegExp(selector.replace("#", "\\#")), `missing ${selector} CSS`);
}

assert.match(css, /prefers-reduced-motion/);
assert.match(css, /:focus-visible/);

for (const fn of [
  "setSurface",
  "openPanel",
  "closeTopLayer",
  "renderScene",
  "sendTeacherMessage",
  "completeSimulatedMission",
]) {
  assert.match(app, new RegExp(`function\\s+${fn}\\s*\\(`), `missing ${fn}()`);
}

for (const key of ["Escape", "KeyT", "KeyH"]) {
  assert.match(app, new RegExp(key), `missing ${key} keyboard behavior`);
}

for (const heading of ["How to run", "What to click", "What is simulated"]) {
  assert.match(readme, new RegExp(`^## ${heading}$`, "m"), `missing README heading: ${heading}`);
}

console.log("Course companion smoke test passed.");
