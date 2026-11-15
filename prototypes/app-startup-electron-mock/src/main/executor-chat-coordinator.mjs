import { parseExecutorBinding } from "../shared/practice-contracts.mjs";
import {
  buildSelectiveHandoff,
  extractBoundedHandoffSource,
  threadContainsHandoffMarker,
} from "./selective-handoff.mjs";

const HANDOFF_MARKER = /^\[CBA_HANDOFF_V1:[a-f0-9]{64}\]$/;

function visibleFailure() {
  return Object.assign(
    new Error("The selective handoff could not be verified in the new Executor chat."),
    { code: "HANDOFF_NOT_VISIBLE" },
  );
}

function parseHandoff(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError("Selective handoff is required.");
  if (!HANDOFF_MARKER.test(value.marker ?? "")) throw new TypeError("Selective handoff marker is invalid.");
  if (typeof value.hash !== "string" || value.marker !== `[CBA_HANDOFF_V1:${value.hash}]`) {
    throw new TypeError("Selective handoff hash does not match its marker.");
  }
  if (value.item?.type !== "message" || value.item?.role !== "assistant" || !Array.isArray(value.item?.content)) {
    throw new TypeError("Selective handoff item is invalid.");
  }
  return value;
}

export function createExecutorChatCoordinator({
  client,
  conversationService,
  summarize,
  clock = () => new Date(),
}) {
  if (typeof client?.request !== "function") throw new TypeError("Executor chat coordinator requires an App Server client.");
  if (typeof conversationService?.readBoundTask !== "function"
    || typeof conversationService?.createDedicatedTask !== "function"
    || typeof conversationService?.openBoundTask !== "function") {
    throw new TypeError("Executor chat coordinator requires the conversation service.");
  }
  if (typeof summarize !== "function") throw new TypeError("Executor chat coordinator requires a selective summarizer.");

  async function prepareSelectiveHandoff({ startRequest, sourceBinding: inputBinding }) {
    const sourceBinding = parseExecutorBinding(inputBinding);
    const { thread } = await conversationService.readBoundTask(
      startRequest,
      sourceBinding,
      { includeTurns: true },
    );
    const boundedSource = extractBoundedHandoffSource(thread, {
      expectedThreadId: sourceBinding.threadId,
    });
    const selection = await summarize(structuredClone(boundedSource));
    return buildSelectiveHandoff({
      sourceThreadId: sourceBinding.threadId,
      sourceDisplayName: sourceBinding.displayName,
      selection,
      createdAt: clock().toISOString(),
    });
  }

  async function createTargetChat({ startRequest, targetRunId }) {
    const result = await conversationService.createDedicatedTask(
      startRequest,
      targetRunId,
      { open: false },
    );
    const binding = parseExecutorBinding(result?.binding);
    if (binding.sessionId !== targetRunId) throw new TypeError("New Executor chat must identify the target Practice run.");
    return binding;
  }

  async function attachSelectiveHandoff({ startRequest, targetBinding: inputBinding, handoff: inputHandoff }) {
    const targetBinding = parseExecutorBinding(inputBinding);
    const handoff = parseHandoff(inputHandoff);
    const before = await conversationService.readBoundTask(
      startRequest,
      targetBinding,
      { includeTurns: true },
    );
    if (threadContainsHandoffMarker(before.thread, handoff.marker)) {
      return {
        marker: handoff.marker,
        hash: handoff.hash,
        attachedAt: clock().toISOString(),
        visible: true,
        duplicate: true,
      };
    }

    await client.request("thread/inject_items", {
      threadId: targetBinding.threadId,
      items: [structuredClone(handoff.item)],
    });
    const after = await conversationService.readBoundTask(
      startRequest,
      targetBinding,
      { includeTurns: true },
    );
    if (!threadContainsHandoffMarker(after.thread, handoff.marker)) throw visibleFailure();
    return {
      marker: handoff.marker,
      hash: handoff.hash,
      attachedAt: clock().toISOString(),
      visible: true,
      duplicate: false,
    };
  }

  function openChat(binding) {
    return conversationService.openBoundTask(parseExecutorBinding(binding));
  }

  return Object.freeze({
    prepareSelectiveHandoff,
    createTargetChat,
    attachSelectiveHandoff,
    openChat,
  });
}
