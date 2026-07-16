import { escapeHtml, sendBrevoEmail } from "./email";

function shell(title, body, action) {
  return `<!doctype html><html><body style="margin:0;background:#f4f7f5;font-family:Arial,sans-serif;color:#16271f"><table role="presentation" width="100%"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" style="max-width:600px;background:#fff;border:1px solid #dce8e0;border-radius:16px;overflow:hidden"><tr><td style="background:#037D40;color:#fff;padding:22px 28px;font-size:22px;font-weight:700">BookMePro</td></tr><tr><td style="padding:30px 28px"><h1 style="font-size:25px;margin:0 0 14px">${escapeHtml(title)}</h1><p style="color:#4b5563;line-height:1.65">${escapeHtml(body)}</p><p style="margin:26px 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#037D40;color:#fff;text-decoration:none;border-radius:8px;padding:12px 18px;font-weight:700">${escapeHtml(action.label)}</a></p><p style="font-size:13px;color:#6b7280;line-height:1.5">If you did not request this, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function sendStudentVerificationEmail({ email, name, token }) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://bookmepro.com.au";
  const href = `${base}/student-auth/verify-email?token=${encodeURIComponent(token)}`;
  return sendBrevoEmail({
    to: { email, name },
    subject: "Verify your BookMePro email",
    htmlContent: shell(
      "Verify your email",
      "Confirm your email address to protect your account and complete bookings.",
      { label: "Verify email", href },
    ),
    textContent: `Verify your BookMePro email: ${href}`,
    tags: ["bookmepro", "student_email_verification"],
    idempotencyKey: `verify:${email}:${token.slice(0, 12)}`,
  });
}
