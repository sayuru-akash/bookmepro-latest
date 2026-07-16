import test from "node:test";
import assert from "node:assert/strict";

import {
  getPhoneCountryCode,
  normalizeCountryCode,
} from "../app/config/pricing.js";

test("pricing country normalization safely falls back", () => {
  assert.equal(normalizeCountryCode("lk"), "LK");
  assert.equal(normalizeCountryCode("AU"), "AU");
  assert.equal(normalizeCountryCode(undefined), "DEFAULT");
  assert.equal(normalizeCountryCode("not-a-country"), "DEFAULT");
});

test("phone country conversion never passes DEFAULT to the phone library", () => {
  assert.equal(getPhoneCountryCode("LK"), "lk");
  assert.equal(getPhoneCountryCode("US"), "us");
  assert.equal(getPhoneCountryCode("DEFAULT"), "au");
  assert.equal(getPhoneCountryCode(null), "au");
});
