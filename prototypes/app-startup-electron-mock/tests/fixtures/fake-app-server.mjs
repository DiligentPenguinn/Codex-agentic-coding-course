import readline from "node:readline";

let account = null;
let activeLogin = null;

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function respond(id, result) {
  send({ id, result });
}

const lines = readline.createInterface({ input: process.stdin });
lines.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    respond(message.id, {
      serverInfo: { name: "fake-app-server", version: "1.0.0" },
    });
    return;
  }
  if (message.method === "initialized") return;

  if (message.method === "account/read") {
    respond(message.id, {
      account,
      requiresOpenaiAuth: true,
    });
    return;
  }

  if (message.method === "account/login/start") {
    activeLogin = "login-fixture-1";
    if (message.params?.type === "chatgptDeviceCode") {
      respond(message.id, {
        loginId: activeLogin,
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "FIXTURE-CODE",
      });
    } else {
      respond(message.id, {
        loginId: activeLogin,
        authUrl: "https://auth.openai.com/codex/fixture",
      });
    }
    setTimeout(() => {
      if (!activeLogin) return;
      account = {
        type: "chatgpt",
        email: "fixture@example.test",
        planType: "fixture",
      };
      send({
        method: "account/login/completed",
        params: { loginId: activeLogin, success: true },
      });
      send({
        method: "account/updated",
        params: { accountType: "chatgpt" },
      });
      activeLogin = null;
    }, 120);
    return;
  }

  if (message.method === "account/login/cancel") {
    activeLogin = null;
    respond(message.id, {});
    return;
  }

  send({
    id: message.id,
    error: { code: -32601, message: "Fixture method unavailable" },
  });
});
