import { createHash } from "node:crypto";

const THREAD_ID = /^[A-Za-z0-9_-]+$/;
const HANDOFF_MARKER = /^\[CBA_HANDOFF_V1:[a-f0-9]{64}\]$/;
const CATEGORY_KEYS = ["goals", "decisions", "constraints", "blockers", "outcomes"];
const CATEGORY_LABELS = {
  goals: "MỤC TIÊU",
  decisions: "QUYẾT ĐỊNH ĐÃ CHỐT",
  constraints: "GIỚI HẠN ĐÃ DUYỆT",
  blockers: "VƯỚNG MẮC CHƯA GIẢI QUYẾT",
  outcomes: "KẾT QUẢ VÀ BẰNG CHỨNG",
};
const FORBIDDEN_TEXT = /authorization\s*:|bearer\s+[A-Za-z0-9._-]+|api[_-]?key\s*[:=]|access[_-]?token\s*[:=]|refresh[_-]?token\s*[:=]|begin [a-z ]*private key|(?:^|\s)[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/i;

function plainObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function exactKeys(value, allowed, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new TypeError(`Unknown ${label} field: ${key}.`);
  }
}

function boundedInteger(value, fallback, minimum, maximum, label) {
  const candidate = value === undefined ? fallback : value;
  if (!Number.isSafeInteger(candidate) || candidate < minimum || candidate > maximum) {
    throw new TypeError(`${label} must be an integer between ${minimum} and ${maximum}.`);
  }
  return candidate;
}

function normalizedText(value, label, maximum) {
  if (typeof value !== "string") throw new TypeError(`${label} must be text.`);
  const text = value.replaceAll(/\s+/g, " ").trim();
  if (text === "" || [...text].length > maximum) {
    throw new TypeError(`${label} must be non-empty bounded text.`);
  }
  if (FORBIDDEN_TEXT.test(text)) throw new TypeError(`${label} contains forbidden content.`);
  return text;
}

function userMessageText(item) {
  if (item?.type !== "userMessage" || !Array.isArray(item.content)) return null;
  const text = item.content
    .filter((content) => content?.type === "text" && typeof content.text === "string")
    .map((content) => content.text)
    .join(" ")
    .replaceAll(/\s+/g, " ")
    .trim();
  return text || null;
}

function agentMessageText(item) {
  if (item?.type !== "agentMessage") return null;
  if (![undefined, null, "final_answer"].includes(item.phase)) return null;
  const text = typeof item.text === "string" ? item.text.replaceAll(/\s+/g, " ").trim() : "";
  return text || null;
}

export function extractBoundedHandoffSource(threadInput, options = {}) {
  const thread = plainObject(threadInput, "Source Executor chat");
  const expectedThreadId = options.expectedThreadId;
  if (!THREAD_ID.test(expectedThreadId ?? "") || thread.id !== expectedThreadId) {
    throw new TypeError("Handoff history must come from the exact source Executor chat.");
  }
  const maxTurns = boundedInteger(options.maxTurns, 12, 1, 50, "maxTurns");
  const maxItems = boundedInteger(options.maxItems, 48, 1, 100, "maxItems");
  const maxCharacters = boundedInteger(options.maxCharacters, 12_000, 100, 20_000, "maxCharacters");
  const turns = Array.isArray(thread.turns) ? thread.turns.slice(-maxTurns) : [];
  const eligible = [];
  for (const turn of turns) {
    if (!turn || typeof turn !== "object" || !Array.isArray(turn.items)) continue;
    for (const item of turn.items) {
      const learner = userMessageText(item);
      const executor = learner === null ? agentMessageText(item) : null;
      const text = learner ?? executor;
      if (!text || FORBIDDEN_TEXT.test(text)) continue;
      eligible.push({ role: learner === null ? "executor" : "learner", text });
    }
  }
  const messages = eligible.slice(-maxItems);
  const characterCount = messages.reduce((count, message) => count + [...message.text].length, 0);
  if (characterCount > maxCharacters) {
    throw new TypeError("Bounded handoff source exceeds the character bound.");
  }
  return {
    schemaVersion: 1,
    sourceThreadId: expectedThreadId,
    messages: structuredClone(messages),
  };
}

function boundedSummary(value) {
  const normalized = value.replaceAll(/\s+/g, " ").trim();
  const points = [...normalized];
  return points.length <= 500 ? normalized : `${points.slice(0, 499).join("")}…`;
}

export function createAutomaticHandoffSelection(sourceInput) {
  const source = plainObject(sourceInput, "Bounded handoff source");
  exactKeys(source, new Set(["schemaVersion", "sourceThreadId", "messages"]), "Bounded handoff source");
  if (source.schemaVersion !== 1 || !THREAD_ID.test(source.sourceThreadId ?? "") || !Array.isArray(source.messages)) {
    throw new TypeError("Bounded handoff source is invalid.");
  }
  const messages = source.messages.flatMap((message) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) return [];
    if (!["learner", "executor"].includes(message.role) || typeof message.text !== "string") return [];
    const text = boundedSummary(message.text);
    if (!text || FORBIDDEN_TEXT.test(text)) return [];
    return [{ role: message.role, text }];
  });
  const learner = messages.filter((message) => message.role === "learner").map((message) => message.text);
  const executor = messages.filter((message) => message.role === "executor").map((message) => message.text);
  const decisionPattern = /quyết định|đã chọn|giữ nguyên|\bdecid(?:e|ed|ing)\b|\bkeep\b/i;
  const constraintPattern = /\bchỉ\b|\bkhông\b|\bphải\b|\bonly\b|\bmust\b|\bdo not\b|\bdon't\b/i;
  const blockerPattern = /chưa thể|không thể|cần phê duyệt|bị chặn|\bblocked\b|\bcannot\b|\bneed(?:s|ed)? approval\b/i;
  const blockers = executor.filter((text) => blockerPattern.test(text));
  return {
    goals: learner.slice(-2),
    decisions: learner.filter((text) => decisionPattern.test(text)).slice(-1),
    constraints: learner.filter((text) => constraintPattern.test(text)).slice(-2),
    blockers: blockers.slice(-1),
    outcomes: executor.filter((text) => !blockerPattern.test(text)).slice(-2),
  };
}

function parseSelection(input) {
  const selection = plainObject(input, "Selective handoff selection");
  exactKeys(selection, new Set(CATEGORY_KEYS), "Selective handoff selection");
  const normalized = {};
  let total = 0;
  for (const key of CATEGORY_KEYS) {
    const values = selection[key];
    if (!Array.isArray(values) || values.length > 5) {
      throw new TypeError(`Selective handoff ${key} must be a bounded array.`);
    }
    normalized[key] = values.map((value, index) => {
      const text = normalizedText(value, `Selective handoff ${key}[${index}]`, 500);
      total += [...text].length;
      return text;
    });
  }
  if (total === 0 || total > 4_000) throw new TypeError("Selective handoff content must be non-empty and bounded.");
  return normalized;
}

export function buildSelectiveHandoff({
  sourceThreadId,
  sourceDisplayName,
  selection: inputSelection,
  createdAt,
}) {
  if (!THREAD_ID.test(sourceThreadId ?? "")) throw new TypeError("Selective handoff sourceThreadId is invalid.");
  const displayName = normalizedText(sourceDisplayName, "Selective handoff sourceDisplayName", 500);
  if (typeof createdAt !== "string" || Number.isNaN(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt) {
    throw new TypeError("Selective handoff createdAt must be an ISO timestamp.");
  }
  const selection = parseSelection(inputSelection);
  const canonical = JSON.stringify({ schemaVersion: 1, sourceThreadId, sourceDisplayName: displayName, selection });
  const hash = createHash("sha256").update(canonical, "utf8").digest("hex");
  const marker = `[CBA_HANDOFF_V1:${hash}]`;
  const sections = CATEGORY_KEYS.flatMap((key) => selection[key].length === 0
    ? []
    : [CATEGORY_LABELS[key], ...selection[key].map((value) => `- ${value}`)]);
  const text = [
    marker,
    "BỐI CẢNH ĐƯỢC CHUYỂN CÓ CHỌN LỌC",
    `Nguồn: ${displayName} (${sourceThreadId})`,
    `Thời điểm tạo: ${createdAt}`,
    "Chỉ dùng nội dung dưới đây làm bối cảnh; không suy đoán thêm từ chat cũ.",
    ...sections,
  ].join("\n");
  return Object.freeze({
    schemaVersion: 1,
    sourceThreadId,
    sourceDisplayName: displayName,
    hash,
    marker,
    text,
    item: {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text }],
    },
    createdAt,
  });
}

function visibleMessageText(item) {
  if (item?.type === "agentMessage" && typeof item.text === "string") return item.text;
  if (!["message", "userMessage"].includes(item?.type) || !Array.isArray(item.content)) return "";
  return item.content
    .filter((content) => ["text", "input_text", "output_text"].includes(content?.type) && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n");
}

export function threadContainsHandoffMarker(threadInput, marker) {
  if (!HANDOFF_MARKER.test(marker ?? "")) return false;
  const thread = threadInput && typeof threadInput === "object" && !Array.isArray(threadInput)
    ? threadInput
    : {};
  if (!Array.isArray(thread.turns)) return false;
  return thread.turns.some((turn) => Array.isArray(turn?.items)
    && turn.items.some((item) => visibleMessageText(item).includes(marker)));
}
