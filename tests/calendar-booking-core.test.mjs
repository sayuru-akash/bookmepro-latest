import assert from "node:assert/strict";
import test from "node:test";

import {
  appointmentInterval,
  appointmentCapacityTransition,
  intervalsOverlap,
  normalizeAppointmentStatus,
  normalizeTimeZone,
} from "../Lib/booking/time.js";
import { escapeHtml } from "../Lib/notifications/email.js";
import { calendarEventDisposition } from "../Lib/integrations/calendarPolicy.js";

test("appointment intervals preserve Australian daylight-saving offsets", () => {
  const summer = appointmentInterval({
    date: "2026-01-15",
    time: "10:00 - 11:00",
    timeZone: "Australia/Sydney",
  });
  const winter = appointmentInterval({
    date: "2026-07-15",
    time: "10:00 - 11:00",
    timeZone: "Australia/Sydney",
  });
  assert.equal(summer.startIso, "2026-01-14T23:00:00.000Z");
  assert.equal(winter.startIso, "2026-07-15T00:00:00.000Z");
});

test("appointment intervals support sessions that end after midnight", () => {
  const interval = appointmentInterval({
    date: "2026-07-15",
    time: "23:30 - 00:30",
    timeZone: "Australia/Sydney",
  });
  assert.equal(interval.endAt - interval.startAt, 60 * 60 * 1000);
});

test("appointment intervals reject incomplete slot values", () => {
  assert.throws(
    () =>
      appointmentInterval({
        date: "2026-07-15",
        time: "10:00",
        timeZone: "Australia/Sydney",
      }),
    /start\/end time/,
  );
});

test("legacy appointment statuses normalize to canonical values", () => {
  assert.equal(normalizeAppointmentStatus("Approved"), "approved");
  assert.equal(normalizeAppointmentStatus("Rejected"), "declined");
  assert.equal(normalizeAppointmentStatus("Canceled"), "cancelled");
});

test("interval overlap uses half-open boundaries", () => {
  assert.equal(
    intervalsOverlap(
      "2026-07-15T00:00:00Z",
      "2026-07-15T01:00:00Z",
      "2026-07-15T01:00:00Z",
      "2026-07-15T02:00:00Z",
    ),
    false,
  );
  assert.equal(
    intervalsOverlap(
      "2026-07-15T00:00:00Z",
      "2026-07-15T01:00:00Z",
      "2026-07-15T00:59:00Z",
      "2026-07-15T02:00:00Z",
    ),
    true,
  );
});

test("invalid timezones safely fall back and email values are escaped", () => {
  assert.equal(normalizeTimeZone("not/a-zone"), "Australia/Sydney");
  assert.equal(
    escapeHtml(`<script>alert("x")</script>`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
});

test("capacity transitions reserve and release exactly once", () => {
  assert.deepEqual(
    appointmentCapacityTransition({
      previousStatus: "declined",
      nextStatus: "approved",
      reservationReleased: true,
    }),
    { reserveNext: true, releasePrevious: false, reservationReleased: false },
  );
  assert.deepEqual(
    appointmentCapacityTransition({
      previousStatus: "approved",
      nextStatus: "completed",
      reservationReleased: false,
    }),
    { reserveNext: false, releasePrevious: true, reservationReleased: true },
  );
  assert.deepEqual(
    appointmentCapacityTransition({
      previousStatus: "approved",
      nextStatus: "approved",
      reservationReleased: false,
      groupChanged: true,
    }),
    { reserveNext: true, releasePrevious: true, reservationReleased: false },
  );
});

test("calendar policy removes stale pending holds but preserves approved groups", () => {
  assert.equal(calendarEventDisposition([], true), "delete");
  assert.equal(
    calendarEventDisposition([{ status: "pending" }], false),
    "delete",
  );
  assert.equal(
    calendarEventDisposition(
      [{ status: "pending" }, { status: "approved" }],
      false,
    ),
    "upsert",
  );
});

test("calendar OAuth state is authenticated, encrypted, and expires", async () => {
  process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY = "test-encryption-secret";
  process.env.GOOGLE_CALENDAR_STATE_SECRET = "test-state-secret";
  const { decryptSecret, encryptSecret, signState, verifyState } = await import(
    `../Lib/security/secretBox.js?test=${Date.now()}`
  );
  const encrypted = encryptSecret("refresh-token");
  assert.notEqual(encrypted, "refresh-token");
  assert.equal(decryptSecret(encrypted), "refresh-token");
  const state = signState({ ownerType: "coach", ownerId: "abc" });
  assert.deepEqual(
    { ...verifyState(state), exp: undefined },
    { ownerType: "coach", ownerId: "abc", exp: undefined },
  );
  assert.throws(
    () => verifyState(signState({ ownerId: "abc" }, -1)),
    /expired/,
  );
});
