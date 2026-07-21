import assert from "node:assert/strict";
import test from "node:test";
import { brevoSender } from "../Lib/notifications/email.js";

test("Brevo sender requires a valid configured email", { concurrency: false }, () => {
  const originalEmail = process.env.BREVO_SENDER_EMAIL;
  try {
    delete process.env.BREVO_SENDER_EMAIL;
    assert.throws(
      () => brevoSender(),
      /BREVO_SENDER_EMAIL is not configured with a valid email address/,
    );

    process.env.BREVO_SENDER_EMAIL = "not-an-email";
    assert.throws(
      () => brevoSender(),
      /BREVO_SENDER_EMAIL is not configured with a valid email address/,
    );
  } finally {
    if (originalEmail === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = originalEmail;
  }
});

test("Brevo sender normalizes the configured email and name", { concurrency: false }, () => {
  const originalEmail = process.env.BREVO_SENDER_EMAIL;
  const originalName = process.env.BREVO_SENDER_NAME;
  try {
    process.env.BREVO_SENDER_EMAIL = " Notifications@BookMePro.com.au ";
    process.env.BREVO_SENDER_NAME = " BookMePro ";
    assert.deepEqual(brevoSender(), {
      email: "notifications@bookmepro.com.au",
      name: "BookMePro",
    });
  } finally {
    if (originalEmail === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = originalEmail;
    if (originalName === undefined) delete process.env.BREVO_SENDER_NAME;
    else process.env.BREVO_SENDER_NAME = originalName;
  }
});
