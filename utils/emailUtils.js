import { sendBrevoEmail } from "../Lib/notifications/email";

export async function sendCoachEmail({ email, name, subject, htmlContent }) {
  if (!email || !subject || !htmlContent) return false;
  try {
    await sendBrevoEmail({
      to: { email, name: name || "Coach" },
      subject,
      htmlContent,
      tags: ["bookmepro", "coach"],
    });
    return true;
  } catch (error) {
    console.error("Coach email failed:", error.message);
    return false;
  }
}
