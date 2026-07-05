#!/usr/bin/env node
// Generates the 8 scene background images for the opening-scene visual novel
// via the OpenAI Images API (gpt-image-1) and saves them into ../images/.
//
// Usage:
//   1. Put your key in scripts/.env.openai:
//      OPENAI_API_KEY=...
//   2. Run from the repo root:
//      node scripts/generate-images.mjs
//      Or run from visuals/opening-scene/:
//      node scripts/generate-images.mjs
//
// Requires Node.js 18+ (for global fetch). No dependencies.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, ".env.openai");
const outputDir = join(__dirname, "..", "images");

function parseEnvValue(rawValue) {
  const value = rawValue.trim();
  const isQuoted =
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"));

  return isQuoted ? value.slice(1, -1) : value;
}

async function loadEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
      const separatorIndex = normalized.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = normalized.slice(0, separatorIndex).trim();
      const value = parseEnvValue(normalized.slice(separatorIndex + 1));
      const isValidKey = /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);

      if (isValidKey && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }
}

await loadEnvFile(envPath);

const apiKey = process.env.OPENAI_API_KEY;
const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const imageSize = process.env.OPENAI_IMAGE_SIZE || "1536x1024";
const imageQuality = process.env.OPENAI_IMAGE_QUALITY || "high";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY.");
  console.error("Add it to scripts/.env.openai, for example:");
  console.error("OPENAI_API_KEY=your_openai_api_key_here");
  process.exit(1);
}

// Shared style guide applied to every scene, so all 8 images read as one
// consistent set rather than 8 unrelated illustrations.
const STYLE_PREFIX =
  "Semi-realistic modern digital-painting illustration, cinematic lighting, " +
  "warm amber and deep teal/green color grade, soft depth of field, wide " +
  "landscape composition, no people or characters visible in frame, no " +
  "readable text or UI labels anywhere in the image, empty workspace scene.";

const scenes = [
  {
    id: "meeting",
    prompt: `${STYLE_PREFIX} A modern glass-walled meeting room, morning light through large windows, a big wall-mounted screen displaying an abstract colorful marketing campaign layout (blocks and shapes only, no legible text), a long table with laptops and coffee cups, empty chairs.`
  },
  {
    id: "folder",
    prompt: `${STYLE_PREFIX} A close-up desk scene: an open laptop showing a cluttered file browser with scattered document icons (abstract, no legible text), loose sticky notes, an open notebook, a coffee cup, warm desk lamp light.`
  },
  {
    id: "mentor",
    prompt: `${STYLE_PREFIX} A quiet shared co-working table with two laptops facing each other, an open notebook with abstract handwriting marks, a pen resting on top, soft green-toned ambient light, calm and reflective mood.`
  },
  {
    id: "repo",
    prompt: `${STYLE_PREFIX} A laptop screen close-up showing an abstract code editor and project file-tree panel (blocks of color representing code, no legible text), blue-toned tech lighting, minimal desk setup.`
  },
  {
    id: "codex",
    prompt: `${STYLE_PREFIX} A dual-monitor developer desk: one screen shows an abstract repository file tree, the other shows a dark terminal with glowing green and amber accent marks (no legible text), cool blue-green ambient lighting.`
  },
  {
    id: "rule",
    prompt: `${STYLE_PREFIX} A desk scene with a dimmed abstract code editor on screen, a magnifying glass resting beside the keyboard, a subtle padlock and shield motif suggesting a safety check, cautious amber and blue lighting.`
  },
  {
    id: "roles",
    prompt: `${STYLE_PREFIX} A wide shot of a collaborative office space suggesting a network of three connected workstations, faint glowing lines like a mind-map connecting the desks, balanced green, amber, and blue accent lighting.`
  },
  {
    id: "brief",
    prompt: `${STYLE_PREFIX} A physical open notebook with a pen resting on it, sitting on a wooden desk beside a closed laptop, warm cream-toned late-afternoon light, calm and conclusive mood.`
  }
];

async function generateImage(prompt) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: imageModel,
      prompt,
      size: imageSize,
      quality: imageQuality,
      n: 1
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return Buffer.from(data.data[0].b64_json, "base64");
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  for (const scene of scenes) {
    process.stdout.write(`Generating scene-${scene.id}.jpg... `);
    try {
      const imageBuffer = await generateImage(scene.prompt);
      const outputPath = join(outputDir, `scene-${scene.id}.jpg`);
      await writeFile(outputPath, imageBuffer);
      console.log("done");
    } catch (error) {
      console.log("failed");
      console.error(error.message);
    }
  }
}

main();
