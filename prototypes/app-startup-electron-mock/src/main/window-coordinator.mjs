import { CHANNELS } from "../shared/channels.mjs";
import {
  createBubbleWindowOptions,
  createMainWindowOptions,
  createQuickChatWindowOptions,
  installWindowPolicy,
} from "./window-policy.mjs";

const BOUNDS_DEBOUNCE_MS = 150;

function isRectangle(value) {
  return Boolean(
    value
    && typeof value === "object"
    && ["x", "y", "width", "height"].every((key) => Number.isFinite(value[key]))
    && value.width > 0
    && value.height > 0
  );
}

function distanceToWorkArea(point, area) {
  const right = area.x + area.width;
  const bottom = area.y + area.height;
  const xDistance = point.x < area.x
    ? area.x - point.x
    : Math.max(0, point.x - right);
  const yDistance = point.y < area.y
    ? area.y - point.y
    : Math.max(0, point.y - bottom);
  return (xDistance ** 2) + (yDistance ** 2);
}

function displayForBounds(bounds, displays) {
  const center = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  return displays.find(({ workArea }) => (
    center.x >= workArea.x
    && center.x <= workArea.x + workArea.width
    && center.y >= workArea.y
    && center.y <= workArea.y + workArea.height
  )) ?? displays.reduce((nearest, current) => (
    distanceToWorkArea(center, current.workArea)
      < distanceToWorkArea(center, nearest.workArea)
      ? current
      : nearest
  ));
}

export function clampBounds(bounds, displays, fallback) {
  if (!Array.isArray(displays) || displays.length === 0) {
    throw new TypeError("At least one display is required to clamp window bounds.");
  }
  const candidate = isRectangle(bounds) ? bounds : fallback;
  if (!isRectangle(candidate)) {
    throw new TypeError("Window bounds require a valid rectangle or fallback.");
  }
  const display = displayForBounds(candidate, displays);
  const area = display.workArea;
  const width = Math.min(candidate.width, Math.max(1, area.width - 32));
  const height = Math.min(candidate.height, Math.max(1, area.height - 32));
  return {
    x: Math.max(
      area.x + 16,
      Math.min(candidate.x, area.x + area.width - width - 16),
    ),
    y: Math.max(
      area.y + 16,
      Math.min(candidate.y, area.y + area.height - height - 16),
    ),
    width,
    height,
  };
}

function sameBounds(left, right) {
  return Boolean(
    left
    && right
    && left.x === right.x
    && left.y === right.y
    && left.width === right.width
    && left.height === right.height
  );
}

function activeWindow(window) {
  return Boolean(window && !window.isDestroyed());
}

function activeWebContents(window) {
  if (!activeWindow(window)) return false;
  return typeof window.webContents?.isDestroyed !== "function"
    || !window.webContents.isDestroyed();
}

export function createWindowCoordinator({
  BrowserWindow,
  Menu,
  screen,
  openExternal,
  rendererPaths,
  preloadPaths,
  presentation,
  updatePresentation,
  selectTab,
  pausePractice,
  quitApp,
  toBubbleViewModel,
  toQuickChatViewModel,
  timers = globalThis,
}) {
  const presentationState = structuredClone(presentation ?? {
    mode: "full",
    lastFullTab: "exercise",
    mainBounds: null,
    bubbleBounds: null,
    popoverBounds: null,
  });
  let mainWindow = null;
  let bubbleWindow = null;
  let quickChatWindow = null;
  let createPromise = null;
  let disposed = false;
  let requestedMode = "full";
  let appliedMode = null;
  let transitionVersion = 0;
  let transitionQueue = Promise.resolve();
  let updateQueue = Promise.resolve();
  const listeners = [];
  const boundsTimers = new Map();
  const applyingBounds = new Set();

  function allDisplays() {
    return screen.getAllDisplays();
  }

  function primaryArea() {
    return screen.getPrimaryDisplay().workArea;
  }

  function mainFallback() {
    const area = primaryArea();
    return {
      x: area.x + 80,
      y: area.y + 60,
      width: 1180,
      height: 800,
    };
  }

  function bubbleFallback() {
    const area = primaryArea();
    return {
      x: area.x + area.width - 96,
      y: area.y + area.height - 120,
      width: 72,
      height: 72,
    };
  }

  function quickFallback(bubbleBounds, displays = allDisplays()) {
    const display = displayForBounds(bubbleBounds, displays);
    const area = display.workArea;
    const left = bubbleBounds.x - 376;
    const right = bubbleBounds.x + bubbleBounds.width + 16;
    const hasRoomLeft = left >= area.x + 16;
    const hasRoomRight = right + 360 <= area.x + area.width - 16;
    const above = bubbleBounds.y - 536;
    const below = bubbleBounds.y + bubbleBounds.height + 16;
    const hasRoomAbove = above >= area.y + 16;
    const hasRoomBelow = below + 520 <= area.y + area.height - 16;
    let candidate;
    if (hasRoomLeft || hasRoomRight) {
      candidate = {
        x: hasRoomLeft ? left : right,
        y: Math.max(area.y + 16, bubbleBounds.y + bubbleBounds.height - 520),
        width: 360,
        height: 520,
      };
    } else {
      candidate = {
        x: bubbleBounds.x,
        y: hasRoomAbove || !hasRoomBelow ? above : below,
        width: 360,
        height: 520,
      };
    }
    return clampBounds(null, [display], candidate);
  }

  function clampedBubbleBounds() {
    return clampBounds(
      bubbleWindow.getBounds(),
      allDisplays(),
      bubbleFallback(),
    );
  }

  function currentQuickFallback() {
    const bubbleBounds = activeWindow(bubbleWindow)
      ? clampedBubbleBounds()
      : clampBounds(presentationState.bubbleBounds, allDisplays(), bubbleFallback());
    return quickFallback(bubbleBounds);
  }

  function boundsDefinition(kind) {
    if (kind === "main") {
      return {
        window: mainWindow,
        field: "mainBounds",
        fallback: mainFallback(),
      };
    }
    if (kind === "bubble") {
      return {
        window: bubbleWindow,
        field: "bubbleBounds",
        fallback: bubbleFallback(),
      };
    }
    return {
      window: quickChatWindow,
      field: "popoverBounds",
      fallback: currentQuickFallback(),
    };
  }

  function addListener(emitter, event, listener) {
    emitter.on(event, listener);
    listeners.push([emitter, event, listener]);
  }

  function queuePresentationUpdate(patch) {
    const safePatch = structuredClone(patch);
    const operation = updateQueue.then(async () => {
      if (disposed) return false;
      await updatePresentation(safePatch);
      if (disposed) return false;
      Object.assign(presentationState, structuredClone(safePatch));
      return true;
    });
    updateQueue = operation.catch(() => {});
    return operation;
  }

  function setClampedBounds(kind, bounds) {
    const { window } = boundsDefinition(kind);
    if (!activeWindow(window) || sameBounds(window.getBounds(), bounds)) return;
    applyingBounds.add(kind);
    try {
      window.setBounds(bounds);
    } finally {
      applyingBounds.delete(kind);
    }
  }

  function applyPresentationInvariant(mode, {
    restoreMain = false,
    focusMain = false,
    focusQuickChat = false,
  } = {}) {
    if (![mainWindow, bubbleWindow, quickChatWindow].every(activeWindow)) return false;
    if (mode === "full") {
      bubbleWindow.hide();
      quickChatWindow.hide();
      if (restoreMain) mainWindow.restore();
      mainWindow.show();
      if (focusMain) mainWindow.focus();
    } else if (mode === "compact") {
      quickChatWindow.hide();
      mainWindow.hide();
      bubbleWindow.show();
    } else if (mode === "quick-chat") {
      mainWindow.hide();
      bubbleWindow.show();
      quickChatWindow.show();
      if (focusQuickChat) quickChatWindow.focus();
    } else {
      throw new TypeError("Unknown Practice presentation mode.");
    }
    appliedMode = mode;
    return true;
  }

  function reconcileQuickChatAnchor() {
    const bubbleBounds = clampedBubbleBounds();
    setClampedBounds("bubble", bubbleBounds);
    const quickBounds = quickFallback(bubbleBounds);
    setClampedBounds("quickChat", quickBounds);
    return { bubbleBounds, quickBounds };
  }

  function persistExactBounds(field, bounds) {
    if (sameBounds(presentationState[field], bounds)) return Promise.resolve(true);
    return queuePresentationUpdate({ [field]: bounds });
  }

  async function persistQuickChatAnchor(isCurrent) {
    const { bubbleBounds, quickBounds } = reconcileQuickChatAnchor();
    await persistExactBounds("bubbleBounds", bubbleBounds);
    if (!isCurrent()) return false;
    await persistExactBounds("popoverBounds", quickBounds);
    return isCurrent();
  }

  async function persistBoundsNow(kind) {
    if (disposed) return false;
    const { window, field, fallback } = boundsDefinition(kind);
    if (!activeWindow(window)) return false;
    const bounds = clampBounds(window.getBounds(), allDisplays(), fallback);
    setClampedBounds(kind, bounds);
    return persistExactBounds(field, bounds);
  }

  function scheduleBoundsPersistence(kind) {
    if (disposed || applyingBounds.has(kind)) return;
    const currentTimer = boundsTimers.get(kind);
    if (currentTimer !== undefined) timers.clearTimeout(currentTimer);
    const timer = timers.setTimeout(() => {
      if (boundsTimers.get(kind) === timer) boundsTimers.delete(kind);
      return persistBoundsNow(kind).catch(() => {});
    }, BOUNDS_DEBOUNCE_MS);
    boundsTimers.set(kind, timer);
  }

  function reclampCompactWindows() {
    if (disposed || !activeWindow(bubbleWindow) || !activeWindow(quickChatWindow)) return;
    reconcileQuickChatAnchor();
    scheduleBoundsPersistence("bubble");
    scheduleBoundsPersistence("quickChat");
  }

  function requestTransition(nextMode, operation) {
    if (disposed) return Promise.resolve(false);
    const version = ++transitionVersion;
    requestedMode = nextMode;
    const isCurrent = () => !disposed && version === transitionVersion;
    const run = transitionQueue.then(async () => {
      if (!isCurrent()) return false;
      if (createPromise) await createPromise;
      if (!isCurrent()) return false;
      try {
        return await operation(isCurrent);
      } catch (error) {
        if (isCurrent()) {
          requestedMode = appliedMode ?? presentationState.mode ?? "full";
          if (appliedMode === null) {
            applyPresentationInvariant(requestedMode);
          }
        }
        throw error;
      }
    });
    transitionQueue = run.catch(() => {});
    return run;
  }

  function requireWindows() {
    if (![mainWindow, bubbleWindow, quickChatWindow].every(activeWindow)) {
      throw new Error("Practice windows have not been created.");
    }
  }

  function create() {
    if (disposed) return Promise.reject(new Error("Window coordinator is disposed."));
    if (createPromise) return createPromise;
    createPromise = (async () => {
      const displays = allDisplays();
      const mainBounds = clampBounds(
        presentationState.mainBounds,
        displays,
        mainFallback(),
      );
      const bubbleBounds = clampBounds(
        presentationState.bubbleBounds,
        displays,
        bubbleFallback(),
      );
      const quickBounds = clampBounds(
        presentationState.popoverBounds,
        displays,
        quickFallback(bubbleBounds),
      );

      mainWindow = new BrowserWindow(createMainWindowOptions({
        preloadPath: preloadPaths.main,
        bounds: mainBounds,
      }));
      bubbleWindow = new BrowserWindow(createBubbleWindowOptions({
        preloadPath: preloadPaths.bubble,
        bounds: bubbleBounds,
      }));
      quickChatWindow = new BrowserWindow(createQuickChatWindowOptions({
        preloadPath: preloadPaths.quickChat,
        bounds: quickBounds,
      }));

      for (const window of [mainWindow, bubbleWindow, quickChatWindow]) {
        installWindowPolicy(window, { openExternal });
      }
      for (const [kind, window] of [
        ["main", mainWindow],
        ["bubble", bubbleWindow],
        ["quickChat", quickChatWindow],
      ]) {
        const persist = () => scheduleBoundsPersistence(kind);
        addListener(window, "move", persist);
        addListener(window, "resize", persist);
      }
      addListener(quickChatWindow, "blur", () => {
        void closeQuickChat().catch(() => {});
      });
      addListener(screen, "display-removed", reclampCompactWindows);

      await Promise.all([
        mainWindow.loadFile(rendererPaths.main),
        bubbleWindow.loadFile(rendererPaths.bubble),
        quickChatWindow.loadFile(rendererPaths.quickChat),
      ]);
      if (!disposed && transitionVersion === 0) {
        applyPresentationInvariant("full");
      }
      return mainWindow;
    })();
    return createPromise;
  }

  function getMainWindow() {
    return mainWindow;
  }

  function broadcast(viewModel) {
    if (disposed) return;
    if (activeWebContents(mainWindow)) {
      mainWindow.webContents.send(CHANNELS.PRACTICE_STATE_CHANGED, viewModel);
    }
    if (activeWebContents(bubbleWindow)) {
      bubbleWindow.webContents.send(
        CHANNELS.PRACTICE_STATE_CHANGED,
        toBubbleViewModel(viewModel),
      );
    }
    if (activeWebContents(quickChatWindow)) {
      quickChatWindow.webContents.send(
        CHANNELS.PRACTICE_STATE_CHANGED,
        toQuickChatViewModel(viewModel),
      );
    }
  }

  function compact() {
    requireWindows();
    return requestTransition("compact", async (isCurrent) => {
      await persistBoundsNow("main");
      if (!isCurrent()) return false;
      await queuePresentationUpdate({ mode: "compact" });
      if (!isCurrent()) return false;

      const bounds = clampBounds(
        bubbleWindow.getBounds(),
        allDisplays(),
        bubbleFallback(),
      );
      setClampedBounds("bubble", bounds);
      return applyPresentationInvariant("compact");
    });
  }

  function openQuickChat() {
    requireWindows();
    if (requestedMode !== "compact") {
      return Promise.reject(new Error("Quick chat requires compact mode."));
    }
    return requestTransition("quick-chat", async (isCurrent) => {
      await persistBoundsNow("main");
      if (!isCurrent()) return false;
      await persistQuickChatAnchor(isCurrent);
      if (!isCurrent()) return false;
      await queuePresentationUpdate({ mode: "quick-chat" });
      if (!isCurrent()) return false;

      return applyPresentationInvariant("quick-chat", {
        focusQuickChat: true,
      });
    });
  }

  function closeQuickChat() {
    if (disposed || !activeWindow(quickChatWindow)) return Promise.resolve(false);
    if (requestedMode !== "quick-chat") return Promise.resolve(false);
    return requestTransition("compact", async (isCurrent) => {
      await persistBoundsNow("main");
      if (!isCurrent()) return false;
      const bounds = clampedBubbleBounds();
      setClampedBounds("bubble", bounds);
      await queuePresentationUpdate({ mode: "compact" });
      if (!isCurrent()) return false;
      return applyPresentationInvariant("compact");
    });
  }

  function expandTeacher() {
    requireWindows();
    return requestTransition("full", async (isCurrent) => {
      await selectTab("teacher");
      if (!isCurrent()) return false;
      await queuePresentationUpdate({ mode: "full" });
      if (!isCurrent()) return false;

      return applyPresentationInvariant("full", {
        restoreMain: true,
        focusMain: true,
      });
    });
  }

  function invokeSafely(operation) {
    try {
      void Promise.resolve(operation()).catch(() => {});
    } catch {
      // Native menu callbacks surface failures through their owning UI action.
    }
  }

  function openBubbleMenu(sender) {
    if (disposed) return null;
    const menu = Menu.buildFromTemplate([
      { label: "Open Practice", click: () => invokeSafely(expandTeacher) },
      { label: "Pause Practice", click: () => invokeSafely(pausePractice) },
      { type: "separator" },
      { label: "Quit Course App", click: () => invokeSafely(quit) },
    ]);
    const owner = BrowserWindow.fromWebContents?.(sender) ?? bubbleWindow;
    menu.popup({ window: owner });
    return menu;
  }

  function quit() {
    if (disposed) return undefined;
    return quitApp();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    transitionVersion += 1;
    for (const timer of boundsTimers.values()) timers.clearTimeout(timer);
    boundsTimers.clear();
    for (const [emitter, event, listener] of listeners.splice(0)) {
      emitter.removeListener(event, listener);
    }
    if (activeWindow(quickChatWindow)) quickChatWindow.close();
    if (activeWindow(bubbleWindow)) bubbleWindow.close();
  }

  return Object.freeze({
    create,
    getMainWindow,
    broadcast,
    compact,
    openQuickChat,
    closeQuickChat,
    expandTeacher,
    openBubbleMenu,
    quit,
    dispose,
  });
}
