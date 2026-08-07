import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentValidationError,
  parseOnboardingContent,
} from "../src/shared/content-schema.mjs";

const validFixture = {
  schemaVersion: 1,
  contentKind: "fixture",
  contentOwner: "Duy mock fixture",
  title: "Sample teaching setup",
  notice: "Fixture content for testing the setup mechanism.",
  fields: [{
    id: "sample-goal",
    type: "shortText",
    label: "Sample question",
    required: true,
  }],
};

test("accepts the versioned Duy-owned fixture contract", () => {
  assert.deepEqual(parseOnboardingContent(validFixture), validFixture);
});

test("returns a clone rather than the caller's content object", () => {
  const parsed = parseOnboardingContent(validFixture);
  assert.notEqual(parsed, validFixture);
  assert.notEqual(parsed.fields, validFixture.fields);
});

test("rejects production-looking content and unsupported fields", () => {
  assert.throws(
    () => parseOnboardingContent({
      ...validFixture,
      contentKind: "production",
      fields: [{
        id: "secret",
        type: "password",
        label: "API key",
        required: true,
      }],
    }),
    ContentValidationError,
  );
});

test("rejects invalid, duplicate, and incomplete fields", () => {
  assert.throws(
    () => parseOnboardingContent({
      ...validFixture,
      fields: [
        {
          id: "Not Safe",
          type: "shortText",
          label: "",
          required: "yes",
        },
        {
          id: "Not Safe",
          type: "singleChoice",
          label: "Sample choice",
          required: true,
          options: [{ value: "one", label: "One" }],
        },
      ],
    }),
    (error) => {
      assert.ok(error instanceof ContentValidationError);
      assert.ok(error.issues.length >= 4);
      return true;
    },
  );
});

test("requires fixture metadata and at least one field", () => {
  assert.throws(
    () => parseOnboardingContent({
      schemaVersion: 2,
      contentKind: "fixture",
      contentOwner: "Someone else",
      title: "",
      notice: "Production content.",
      fields: [],
    }),
    ContentValidationError,
  );
});
