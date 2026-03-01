//utils/sendEmail.js
import axios from "axios";

export async function sendEmail({ email, name, subject, htmlContent }) {
  const API_URL = "https://api.brevo.com/v3/smtp/email";
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!email || !name || !subject || !htmlContent) {
    throw new Error("Missing required parameters");
  }
  if (!BREVO_API_KEY) {
    throw new Error("Brevo API key is missing");
  }

  const emailData = {
    sender: { email: "bookmeprocodezela@gmail.com", name: "BookMePro" },
    to: [{ email, name }],
    subject,
    htmlContent,
  };

  try {
    const response = await axios.post(API_URL, emailData, {
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
    });
    console.log(`Email sent successfully to ${email}:`, response.data);
    return { success: true };
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );
    return { success: false, error: error.response?.data || error.message };
  }
}
