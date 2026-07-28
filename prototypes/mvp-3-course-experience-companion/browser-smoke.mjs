import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const cdpBase = process.env.CDP_BASE ?? "http://127.0.0.1:9222";
const mockUrl =
  process.env.MOCK_URL ??
  "http://127.0.0.1:4173/prototypes/mvp-3-course-experience-companion/";
const screenshotDir = join(tmpdir(), "course-companion-qa");
mkdirSync(screenshotDir, { recursive: true });

class CdpClient {
  constructor(webSocketUrl) {
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    this.socket = new WebSocket(webSocketUrl);
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error.message));
        } else {
          pending.resolve(message.result);
        }
        return;
      }

      this.events.push(message);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return promise;
  }

  close() {
    this.socket.close();
  }
}

async function createTarget() {
  const response = await fetch(`${cdpBase}/json/new?${encodeURIComponent(mockUrl)}`, {
    method: "PUT",
  });
  assert.equal(response.ok, true, `Unable to create browser target: ${response.status}`);
  return response.json();
}

async function waitForPage(client) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await evaluate(client, "document.readyState");
    if (ready === "complete") return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Page did not finish loading.");
}

async function waitForRoomAsset(client) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const loaded = await evaluate(
      client,
      `(() => {
        const image = document.querySelector(".room-art");
        return Boolean(image?.complete && image.naturalWidth > 0);
      })()`,
    );
    if (loaded) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Home Base artwork did not finish loading.");
}

async function evaluate(client, expression) {
  const response = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });

  if (response.exceptionDetails) {
    throw new Error(response.exceptionDetails.text);
  }

  return response.result.value;
}

async function screenshot(client, name) {
  const response = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const path = join(screenshotDir, name);
  writeFileSync(path, Buffer.from(response.data, "base64"));
  return path;
}

const target = await createTarget();
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.connect();

try {
  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Log.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await waitForPage(client);
  await evaluate(client, "localStorage.clear(); location.reload()");
  await waitForPage(client);
  await waitForRoomAsset(client);
  await new Promise((resolve) => setTimeout(resolve, 1100));

  assert.equal(await evaluate(client, "!document.querySelector('#homeView').hidden"), true);
  const homeScreenshot = await screenshot(client, "home.png");

  await evaluate(
    client,
    "document.querySelector('[data-action=\"open-mission\"]').click()",
  );
  assert.equal(await evaluate(client, "!document.querySelector('#sceneOverlay').hidden"), true);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const sceneScreenshot = await screenshot(client, "briefing-scene.png");

  for (let step = 0; step < 3; step += 1) {
    await evaluate(
      client,
      "document.querySelector('[data-action=\"advance-scene\"]').click()",
    );
  }

  assert.equal(await evaluate(client, "!document.querySelector('#workshopView').hidden"), true);
  assert.equal(await evaluate(client, "!document.querySelector('#teacherBubble').hidden"), true);
  const workshopScreenshot = await screenshot(client, "workshop.png");

  await evaluate(client, "document.querySelector('#teacherBubble').click()");
  assert.equal(await evaluate(client, "!document.querySelector('#teacherChat').hidden"), true);

  await evaluate(
    client,
    `(() => {
      const input = document.querySelector("#teacherInput");
      input.value = "What evidence should I ask for?";
      document.querySelector("#teacherForm").dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    })()`,
  );
  await new Promise((resolve) => setTimeout(resolve, 450));
  assert.equal(
    await evaluate(client, "document.querySelectorAll('#chatMessages article').length >= 4"),
    true,
  );
  const chatScreenshot = await screenshot(client, "teacher-chat.png");

  await evaluate(
    client,
    "document.querySelector('#teacherChat [data-action=\"open-context\"]').click()",
  );
  assert.equal(await evaluate(client, "!document.querySelector('#contextDrawer').hidden"), true);
  const contextScreenshot = await screenshot(client, "context-receipt.png");

  await evaluate(client, "document.querySelector('[data-action=\"close-context\"]').click()");
  await evaluate(client, "document.querySelector('[data-action=\"close-teacher\"]').click()");
  await evaluate(client, "document.querySelector('[data-action=\"complete-mission\"]').click()");
  assert.equal(await evaluate(client, "!document.querySelector('#sceneOverlay').hidden"), true);

  for (let step = 0; step < 2; step += 1) {
    await evaluate(
      client,
      "document.querySelector('[data-action=\"advance-scene\"]').click()",
    );
  }

  assert.equal(await evaluate(client, "!document.querySelector('#homeView').hidden"), true);
  assert.equal(
    await evaluate(client, "document.querySelector('#courseCompanion').classList.contains('mission-complete')"),
    true,
  );

  await evaluate(
    client,
    "document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyT', bubbles: true }))",
  );
  assert.equal(await evaluate(client, "!document.querySelector('#teacherChat').hidden"), true);
  await evaluate(
    client,
    "document.querySelector('#teacherChat [data-action=\"screen-share\"]').click()",
  );
  assert.equal(await evaluate(client, "document.querySelector('#screenShareDialog').open"), true);
  await evaluate(
    client,
    "document.querySelector('#screenShareDialog [data-action=\"confirm-share\"]').click()",
  );
  assert.equal(await evaluate(client, "document.querySelector('#screenShareDialog').open"), false);
  await evaluate(
    client,
    "document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))",
  );
  assert.equal(await evaluate(client, "document.querySelector('#teacherChat').hidden"), true);

  for (const [action, panelId] of [
    ["open-progress", "progressPanel"],
    ["open-streak", "streakPanel"],
    ["open-reward", "rewardPanel"],
  ]) {
    await evaluate(
      client,
      `document.querySelector('[data-action="${action}"]').click()`,
    );
    assert.equal(
      await evaluate(client, `!document.querySelector("#${panelId}").hidden`),
      true,
    );
    await evaluate(
      client,
      "document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }))",
    );
    assert.equal(
      await evaluate(client, `document.querySelector("#${panelId}").hidden`),
      true,
    );
  }

  await evaluate(
    client,
    "document.querySelector('[data-action=\"open-workshop\"]').click()",
  );
  await evaluate(
    client,
    "document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyH', bubbles: true }))",
  );
  assert.equal(await evaluate(client, "!document.querySelector('#homeView').hidden"), true);

  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const narrowScreenshot = await screenshot(client, "home-narrow.png");

  const runtimeErrors = client.events.filter((event) => {
    return event.method === "Runtime.exceptionThrown" || event.method === "Log.entryAdded";
  });
  assert.deepEqual(runtimeErrors, [], `Browser errors: ${JSON.stringify(runtimeErrors)}`);

  console.log("Browser interaction smoke test passed.");
  console.log(`Home screenshot: ${homeScreenshot}`);
  console.log(`Briefing scene screenshot: ${sceneScreenshot}`);
  console.log(`Workshop screenshot: ${workshopScreenshot}`);
  console.log(`Teacher chat screenshot: ${chatScreenshot}`);
  console.log(`Context receipt screenshot: ${contextScreenshot}`);
  console.log(`Narrow screenshot: ${narrowScreenshot}`);
} finally {
  client.close();
}
