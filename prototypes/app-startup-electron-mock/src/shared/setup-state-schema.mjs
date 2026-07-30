const FORBIDDEN_KEY =
  /^(access.?token|refresh.?token|api.?key|authorization|auth.?url|environment|env)$/i;
const TOP_LEVEL = new Set([
  "schemaVersion",
  "setupCompleted",
  "codexConnected",
  "onboardingResponses",
  "updatedAt",
]);

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function inspectJsonValue(value, path, issues) {
  if (
    value === null
    || typeof value === "string"
    || typeof value === "boolean"
    || (typeof value === "number" && Number.isFinite(value))
  ) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectJsonValue(
      item,
      `${path}[${index}]`,
      issues,
    ));
    return;
  }

  if (!isPlainObject(value)) {
    issues.push(`${path} must contain only JSON values`);
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_KEY.test(key)) {
      issues.push(`credential-shaped field is forbidden: ${path}.${key}`);
    }
    inspectJsonValue(item, `${path}.${key}`, issues);
  }
}

export function createDefaultSetupState(clock = () => new Date()) {
  return {
    schemaVersion: 1,
    setupCompleted: false,
    codexConnected: false,
    onboardingResponses: {},
    updatedAt: clock().toISOString(),
  };
}

export function parseSetupState(input) {
  const issues = [];

  if (!isPlainObject(input)) {
    throw new TypeError("Setup state must be a plain object.");
  }

  for (const key of Object.keys(input)) {
    if (!TOP_LEVEL.has(key)) issues.push(`unknown setup-state field: ${key}`);
  }
  if (input.schemaVersion !== 1) issues.push("schemaVersion must equal 1");
  if (typeof input.setupCompleted !== "boolean") {
    issues.push("setupCompleted must be boolean");
  }
  if (typeof input.codexConnected !== "boolean") {
    issues.push("codexConnected must be boolean");
  }
  if (!isPlainObject(input.onboardingResponses)) {
    issues.push("onboardingResponses must be a plain object");
  } else {
    inspectJsonValue(
      input.onboardingResponses,
      "onboardingResponses",
      issues,
    );
  }
  if (
    typeof input.updatedAt !== "string"
    || Number.isNaN(Date.parse(input.updatedAt))
  ) {
    issues.push("updatedAt must be an ISO timestamp");
  }

  if (issues.length > 0) {
    throw new TypeError(`Invalid setup state: ${issues.join("; ")}`);
  }

  return structuredClone(input);
}
