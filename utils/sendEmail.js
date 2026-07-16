import { sendBrevoEmail } from "../Lib/notifications/email";

export async function sendEmail({ email, name, subject, htmlContent }) {
  if (!email || !name || !subject || !htmlContent) {
    throw new Error("Missing required parameters");
  }
  try {
    const result = await sendBrevoEmail({
      to: { email, name },
      subject,
      htmlContent,
      tags: ["bookmepro", "account"],
    });
    return { success: true, ...result };
  } catch (error) {
    console.error("Error sending email:", error.message);
    return { success: false, error: error.message };
  }
}
