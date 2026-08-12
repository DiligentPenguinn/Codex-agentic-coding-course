import assert from "node:assert/strict";
import test from "node:test";

import { createAutomaticHandoffSelection } from "../src/main/selective-handoff.mjs";

test("selects only bounded goals, decisions, constraints, blockers, and outcomes", () => {
  const selection = createAutomaticHandoffSelection({
    schemaVersion: 1,
    sourceThreadId: "thr-source",
    messages: [
      { role: "learner", text: "Mục tiêu là làm nút chính rộng 100% ở 390px." },
      { role: "learner", text: "Tôi quyết định giữ JavaScript; chỉ sửa CSS và không tạo tràn ngang." },
      { role: "executor", text: "Đã kiểm tra trạng thái ban đầu của nút." },
      { role: "executor", text: "Chưa thể kết luận vì cần phê duyệt kế hoạch." },
    ],
  });

  assert.deepEqual(selection, {
    goals: [
      "Mục tiêu là làm nút chính rộng 100% ở 390px.",
      "Tôi quyết định giữ JavaScript; chỉ sửa CSS và không tạo tràn ngang.",
    ],
    decisions: ["Tôi quyết định giữ JavaScript; chỉ sửa CSS và không tạo tràn ngang."],
    constraints: ["Tôi quyết định giữ JavaScript; chỉ sửa CSS và không tạo tràn ngang."],
    blockers: ["Chưa thể kết luận vì cần phê duyệt kế hoạch."],
    outcomes: ["Đã kiểm tra trạng thái ban đầu của nút."],
  });
});

test("bounds every selected message to 500 code points", () => {
  const selection = createAutomaticHandoffSelection({
    schemaVersion: 1,
    sourceThreadId: "thr-source",
    messages: [{ role: "learner", text: `Mục tiêu ${"a".repeat(800)}` }],
  });

  assert.equal([...selection.goals[0]].length, 500);
  assert.match(selection.goals[0], /…$/);
});
