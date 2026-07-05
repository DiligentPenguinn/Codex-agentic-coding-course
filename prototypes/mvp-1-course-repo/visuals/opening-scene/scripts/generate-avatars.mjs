#!/usr/bin/env node
// Generates the 3 character avatars for the opening-scene visual novel
// via the OpenAI Images API and saves them into ../images/.
//
// Usage from the repo root:
//   node scripts/generate-avatars.mjs
//
// Optional: generate only selected avatars:
//   node scripts/generate-avatars.mjs player huong codex
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
const imageModel = process.env.OPENAI_AVATAR_MODEL || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const imageSize = process.env.OPENAI_AVATAR_SIZE || "1024x1536";
const imageQuality = process.env.OPENAI_AVATAR_QUALITY || process.env.OPENAI_IMAGE_QUALITY || "high";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY.");
  console.error("Add it to scripts/.env.openai, for example:");
  console.error("OPENAI_API_KEY=your_openai_api_key_here");
  process.exit(1);
}

const STYLE_PREFIX =
  "Semi-realistic modern digital-painting visual novel character portrait, " +
  "same warm amber and deep teal/green color grade as a modern marketing office scene, " +
  "soft cinematic rim light, clean readable silhouette, waist-up composition, " +
  "three-quarter view facing slightly toward camera, natural office posture, " +
  "no readable text, no UI labels, no logos, no speech bubbles, no extra characters.";

const avatars = [
  {
    id: "player",
    fileName: "avatar-player.png",
    prompt:
      `${STYLE_PREFIX} The learner character: a Vietnamese content/marketing coordinator in smart casual workwear, calm but under deadline pressure, holding a slim laptop close to their side, thoughtful expression, practical and relatable main-character energy, designed to blend naturally over dark meeting-room and laptop-screen backgrounds.`
  },
  {
    id: "huong",
    fileName: "avatar-huong.png",
    prompt:
      `${STYLE_PREFIX} Hương, the Teacher mentor: a Vietnamese woman in her early thirties, composed and warm, wearing a muted green blazer over a simple top, holding a small notebook and pen, confident mentor expression, grounded professional presence, suitable for a realistic AI workflow training story.`
  },
  {
    id: "codex",
    fileName: "avatar-codex.png",
    prompt:
      `${STYLE_PREFIX} Codex, the technical executor: an elegant human-scale terminal assistant avatar represented as a sleek dark translucent workstation panel with subtle green and amber code-light accents, friendly but precise, not a cartoon robot, not a mascot, visually distinct from the human characters while still fitting a modern office scene.`
  }
];

const requestedIds = new Set(process.argv.slice(2).map((value) => value.toLowerCase()));
const selectedAvatars = requestedIds.size
  ? avatars.filter((avatar) => requestedIds.has(avatar.id))
  : avatars;

if (selectedAvatars.length === 0) {
  console.error("No matching avatars. Use one or more of: player, huong, codex.");
  process.exit(1);
}

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

  for (const avatar of selectedAvatars) {
    process.stdout.write(`Generating ${avatar.fileName}... `);
    try {
      const imageBuffer = await generateImage(avatar.prompt);
      const outputPath = join(outputDir, avatar.fileName);
      await writeFile(outputPath, imageBuffer);
      console.log("done");
    } catch (error) {
      console.log("failed");
      console.error(error.message);
    }
  }
}

main();
