const FIELD_TYPES = new Set(["shortText", "singleChoice", "multipleChoice"]);
const SAFE_ID = /^[a-z][a-z0-9-]*$/;

export class ContentValidationError extends Error {
  constructor(issues) {
    super(`Invalid onboarding fixture: ${issues.join("; ")}`);
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export function parseOnboardingContent(input) {
  const issues = [];

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ContentValidationError(["content must be an object"]);
  }

  if (input.schemaVersion !== 1) issues.push("schemaVersion must equal 1");
  if (input.contentKind !== "fixture") {
    issues.push("contentKind must equal fixture");
  }
  if (input.contentOwner !== "Duy mock fixture") {
    issues.push("contentOwner must identify Duy mock fixture");
  }
  if (typeof input.title !== "string" || input.title.trim() === "") {
    issues.push("title is required");
  }
  if (typeof input.notice !== "string" || !/fixture/i.test(input.notice)) {
    issues.push("notice must identify fixture content");
  }

  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    issues.push("fields must contain at least one item");
  } else {
    const ids = new Set();

    for (const field of input.fields) {
      if (!field || typeof field !== "object" || Array.isArray(field)) {
        issues.push("every field must be an object");
        continue;
      }

      if (!SAFE_ID.test(field.id ?? "")) issues.push("field id is invalid");
      if (ids.has(field.id)) issues.push(`duplicate field id: ${field.id}`);
      ids.add(field.id);

      if (!FIELD_TYPES.has(field.type)) {
        issues.push(`unsupported field type: ${field.type}`);
      }
      if (typeof field.label !== "string" || field.label.trim() === "") {
        issues.push(`field label is required: ${field.id ?? "unknown"}`);
      }
      if (typeof field.required !== "boolean") {
        issues.push(`field required must be boolean: ${field.id ?? "unknown"}`);
      }
      if (
        field.type !== "shortText"
        && (!Array.isArray(field.options) || field.options.length < 2)
      ) {
        issues.push(
          `choice field needs at least two options: ${field.id ?? "unknown"}`,
        );
      }
    }
  }

  if (issues.length > 0) throw new ContentValidationError(issues);
  return structuredClone(input);
}
