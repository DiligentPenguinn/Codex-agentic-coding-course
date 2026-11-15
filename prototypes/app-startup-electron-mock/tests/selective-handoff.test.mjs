import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSelectiveHandoff,
  extractBoundedHandoffSource,
  threadContainsHandoffMarker,
} from "../src/main/selective-handoff.mjs";

const NOW = "2026-08-08T01:00:00.000Z";

function sourceThread() {
  return {
    id: "thr-source",
    cwd: "C:\\course",
    ephemeral: false,
    turns: [
      {
        id: "turn-1",
        status: "completed",
        items: [
          {
            id: "user-1",
            type: "userMessage",
            content: [{ type: "text", text: "Chỉ kiểm tra CSS ở 390px; không sửa JavaScript." }],
          },
          {
            id: "reasoning-1",
            type: "reasoning",
            summary: ["HIDDEN REASONING MUST NOT TRANSFER"],
          },
          {
            id: "command-1",
            type: "commandExecution",
            aggregatedOutput: "API_KEY=secret RAW TOOL OUTPUT",
          },
          {
            id: "answer-1",
            type: "agentMessage",
            phase: "final_answer",
            text: "Đã xác nhận nút chưa rộng 100%; chưa thay đổi tệp.",
          },
        ],
      },
    ],
  };
}

function selection() {
  return {
    goals: ["Làm nút chính rộng 100% ở viewport 390px."],
    decisions: ["Giữ nguyên JavaScript."],
    constraints: ["Chỉ sửa CSS onboarding và không tạo tràn ngang."],
    blockers: ["Chưa có thay đổi nào được thực hiện."],
    outcomes: ["Đã xác nhận trạng thái ban đầu của nút."],
  };
}

test("extracts only bounded learner prompts and final Executor answers", () => {
  const source = extractBoundedHandoffSource(sourceThread(), {
    expectedThreadId: "thr-source",
    maxTurns: 8,
    maxItems: 20,
    maxCharacters: 2_000,
  });

  assert.deepEqual(source.messages, [
    { role: "learner", text: "Chỉ kiểm tra CSS ở 390px; không sửa JavaScript." },
    { role: "executor", text: "Đã xác nhận nút chưa rộng 100%; chưa thay đổi tệp." },
  ]);
  assert.equal(JSON.stringify(source).includes("HIDDEN REASONING"), false);
  assert.equal(JSON.stringify(source).includes("API_KEY"), false);
  assert.equal(JSON.stringify(source).includes("RAW TOOL OUTPUT"), false);
});

test("rejects a substituted source thread and enforces source bounds", () => {
  assert.throws(
    () => extractBoundedHandoffSource(sourceThread(), { expectedThreadId: "thr-decoy" }),
    /exact source Executor chat/i,
  );

  const oversized = sourceThread();
  oversized.turns[0].items[0].content[0].text = "a".repeat(2_001);
  assert.throws(
    () => extractBoundedHandoffSource(oversized, {
      expectedThreadId: "thr-source",
      maxCharacters: 2_000,
    }),
    /character bound/i,
  );
});

test("builds a deterministic visible handoff marker from approved categories", () => {
  const first = buildSelectiveHandoff({
    sourceThreadId: "thr-source",
    sourceDisplayName: "Practice cũ",
    selection: selection(),
    createdAt: NOW,
  });
  const second = buildSelectiveHandoff({
    sourceThreadId: "thr-source",
    sourceDisplayName: "Practice cũ",
    selection: selection(),
    createdAt: "2026-08-08T02:00:00.000Z",
  });

  assert.equal(first.hash, second.hash);
  assert.equal(first.marker, second.marker);
  assert.match(first.marker, /^\[CBA_HANDOFF_V1:[a-f0-9]{64}\]$/);
  assert.match(first.text, /BỐI CẢNH ĐƯỢC CHUYỂN CÓ CHỌN LỌC/);
  assert.match(first.text, /Practice cũ/);
  assert.deepEqual(first.item, {
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text: first.text }],
  });
});

test("rejects forbidden or unbounded summary content", () => {
  assert.throws(
    () => buildSelectiveHandoff({
      sourceThreadId: "thr-source",
      sourceDisplayName: "Practice cũ",
      selection: { ...selection(), constraints: ["Authorization: Bearer secret"] },
      createdAt: NOW,
    }),
    /forbidden/i,
  );
  assert.throws(
    () => buildSelectiveHandoff({
      sourceThreadId: "thr-source",
      sourceDisplayName: "Practice cũ",
      selection: { ...selection(), outcomes: Array.from({ length: 6 }, () => "Outcome") },
      createdAt: NOW,
    }),
    /bounded/i,
  );
});

test("detects a marker only in learner-visible message items", () => {
  const handoff = buildSelectiveHandoff({
    sourceThreadId: "thr-source",
    sourceDisplayName: "Practice cũ",
    selection: selection(),
    createdAt: NOW,
  });
  const visible = sourceThread();
  visible.turns[0].items.push(handoff.item);
  const hidden = sourceThread();
  hidden.turns[0].items.push({ type: "reasoning", summary: [handoff.marker] });

  assert.equal(threadContainsHandoffMarker(visible, handoff.marker), true);
  assert.equal(threadContainsHandoffMarker(hidden, handoff.marker), false);
});
