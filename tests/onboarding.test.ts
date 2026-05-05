import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRENT_ONBOARDING_VERSION,
  shouldShowOnboarding,
  toOnboardingUpdate,
} from "../src/lib/onboarding";

test("shouldShowOnboarding requires users to encounter unseen onboarding versions", () => {
  assert.equal(shouldShowOnboarding(null), true);
  assert.equal(shouldShowOnboarding({ onboarding_version: 0, onboarding_completed_at: null, onboarding_skipped_at: null }), true);
  assert.equal(shouldShowOnboarding({ onboarding_version: CURRENT_ONBOARDING_VERSION, onboarding_completed_at: null, onboarding_skipped_at: null }), true);
  assert.equal(shouldShowOnboarding({ onboarding_version: CURRENT_ONBOARDING_VERSION, onboarding_completed_at: "2026-05-05", onboarding_skipped_at: null }), false);
  assert.equal(shouldShowOnboarding({ onboarding_version: CURRENT_ONBOARDING_VERSION, onboarding_completed_at: null, onboarding_skipped_at: "2026-05-05" }), false);
  assert.equal(shouldShowOnboarding({ onboarding_version: CURRENT_ONBOARDING_VERSION - 1, onboarding_completed_at: "2026-05-05", onboarding_skipped_at: null }), true);
});

test("toOnboardingUpdate records completion or skip for the current version", () => {
  assert.deepEqual(toOnboardingUpdate("completed", "2026-05-05T10:00:00.000Z"), {
    onboarding_version: CURRENT_ONBOARDING_VERSION,
    onboarding_completed_at: "2026-05-05T10:00:00.000Z",
    onboarding_skipped_at: null,
  });
  assert.deepEqual(toOnboardingUpdate("skipped", "2026-05-05T10:00:00.000Z"), {
    onboarding_version: CURRENT_ONBOARDING_VERSION,
    onboarding_completed_at: null,
    onboarding_skipped_at: "2026-05-05T10:00:00.000Z",
  });
});
