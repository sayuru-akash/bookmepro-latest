import validator from "validator";
import { escapeHtml, sendBrevoEmail } from "../../../Lib/notifications/email";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || "")
      .trim()
      .slice(0, 120);
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const phone = String(body.phone || "")
      .trim()
      .slice(0, 60);
    const message = String(body.message || "")
      .trim()
      .slice(0, 5000);
    if (!name || !validator.isEmail(email) || !message) {
      return Response.json(
        { message: "Provide a valid name, email, and message." },
        { status: 400 },
      );
    }
    await sendBrevoEmail({
      to: {
        email: process.env.CONTACT_RECIPIENT_EMAIL || "hiranthaviraj@gmail.com",
        name: "BookMePro Admin",
      },
      subject: "New BookMePro contact form submission",
      htmlContent: `<h1>New Contact Form Submission</h1><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Phone:</strong> ${escapeHtml(phone || "Not provided")}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replaceAll("\n", "<br>")}</p>`,
      textContent: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\n\n${message}`,
      tags: ["bookmepro", "contact_form"],
    });
    return Response.json({ message: "Email sent successfully." });
  } catch (error) {
    console.error("Contact email failed:", error.message);
    return Response.json(
      { message: "Unable to send your message right now." },
      { status: 502 },
    );
  }
}
