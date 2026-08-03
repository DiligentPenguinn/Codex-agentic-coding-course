import readline from "node:readline";

function typedError(code, message) {
  return Object.assign(new Error(message), { code });
}

const quietLogger = Object.freeze({
  info() {},
  error() {},
});

export class CodexAppServerClient {
  #spawn;
  #logger;
  #nextId = 1;
  #pending = new Map();
  #listeners = new Set();
  #connectionListeners = new Set();
  #process = null;
  #initialized = false;
  #expectedStop = false;
  #lines = null;

  constructor({ spawn, logger = quietLogger }) {
    this.#spawn = spawn;
    this.#logger = logger;
  }

  get initialized() {
    return this.#initialized;
  }

  async start() {
    if (this.#process) {
      throw typedError(
        "APP_SERVER_ALREADY_STARTED",
        "Codex App Server is already running.",
      );
    }

    this.#expectedStop = false;
    const child = this.#spawn("codex", ["app-server"], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    this.#process = child;
    child.stderr?.resume();
    this.#lines = readline.createInterface({ input: child.stdout });
    this.#lines.on("line", (line) => this.#handleLine(line));
    child.once("exit", (code) => this.#handleExit(child, code));
    child.once("error", () => this.#handleExit(child, null));

    await this.#rawRequest("initialize", {
      clientInfo: {
        name: "content_builder_academy_startup_mock",
        title: "Content Builder Academy Startup Mock",
        version: "0.1.0",
      },
    });
    this.#rawNotify("initialized", {});
    this.#initialized = true;
    this.#logger.info("app-server-started", { status: "initialized" });
    this.#emitConnectionState("connected");
  }

  request(method, params = {}) {
    if (!this.#initialized) {
      return Promise.reject(typedError(
        "APP_SERVER_NOT_INITIALIZED",
        "Codex App Server is not initialized.",
      ));
    }
    return this.#rawRequest(method, params);
  }

  notify(method, params = {}) {
    if (!this.#initialized) {
      throw typedError(
        "APP_SERVER_NOT_INITIALIZED",
        "Codex App Server is not initialized.",
      );
    }
    this.#rawNotify(method, params);
  }

  onNotification(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  onConnectionState(listener) {
    this.#connectionListeners.add(listener);
    return () => this.#connectionListeners.delete(listener);
  }

  async stop({ clearListeners = true } = {}) {
    const child = this.#process;
    this.#expectedStop = true;
    this.#initialized = false;
    this.#rejectPending(
      typedError("APP_SERVER_STOPPED", "Codex App Server stopped."),
    );
    this.#lines?.close();
    this.#lines = null;

    if (child) {
      child.stdin?.end();
      if (child.exitCode === null) child.kill();
    }
    this.#process = null;
    this.#emitConnectionState("stopped");
    if (clearListeners) {
      this.#listeners.clear();
      this.#connectionListeners.clear();
    }
  }

  async restart() {
    await this.stop({ clearListeners: false });
    await this.start();
  }

  #rawRequest(method, params) {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { method, resolve, reject });
      try {
        this.#write({ id, method, params });
      } catch {
        this.#pending.delete(id);
        reject(typedError(
          "APP_SERVER_WRITE_FAILED",
          `Could not send App Server request: ${method}`,
        ));
      }
    });
  }

  #rawNotify(method, params) {
    this.#write({ method, params });
  }

  #write(message) {
    if (!this.#process?.stdin?.writable) {
      throw typedError(
        "APP_SERVER_DISCONNECTED",
        "Codex App Server is disconnected.",
      );
    }
    this.#process.stdin.write(`${JSON.stringify(message)}\n`);
  }

  #handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      this.#logger.error("app-server-protocol-error", {
        code: "MALFORMED_JSON",
      });
      return;
    }

    if (Object.hasOwn(message, "id")) {
      const pending = this.#pending.get(message.id);
      if (!pending) return;
      this.#pending.delete(message.id);
      if (message.error) {
        pending.reject(typedError(
          "APP_SERVER_REQUEST_FAILED",
          `App Server request failed: ${pending.method}`,
        ));
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    if (typeof message.method === "string") {
      for (const listener of this.#listeners) listener(message);
    }
  }

  #handleExit(child, code) {
    if (child !== this.#process) return;
    this.#process = null;
    this.#initialized = false;
    this.#lines?.close();
    this.#lines = null;

    if (!this.#expectedStop) {
      this.#rejectPending(typedError(
        "APP_SERVER_EXITED",
        "Codex App Server exited unexpectedly.",
      ));
      this.#logger.error("app-server-exited", {
        code: Number.isInteger(code) ? code : "unknown",
      });
      this.#emitConnectionState("disconnected");
    }
  }

  #emitConnectionState(state) {
    for (const listener of this.#connectionListeners) {
      try {
        listener(state);
      } catch {
        this.#logger.error("app-server-connection-listener-error", { state });
      }
    }
  }

  #rejectPending(error) {
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }
}
