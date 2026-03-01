//utils/emailUtils.js
import axios from "axios";
import { ObjectId } from "mongodb";

// Email sending service using Brevo API
export async function sendCoachEmail({ email, name, subject, htmlContent }) {
  const API_URL = "https://api.brevo.com/v3/smtp/email";
  const BREVO_API_KEY = process.env.BREVO_API_KEY;

  if (!BREVO_API_KEY) {
    console.error("Brevo API key is missing");
    return false;
  }

  const emailData = {
    sender: {
      email: "codezelabookmepro@gmail.com",
      name: "BookMePro System",
    },
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
    console.log(`Email sent to ${email}:`, response.data);
    return true;
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message,
    );
    return false;
  }
}

// Function to send daily appointment reminders
export async function sendDailyReminders(db) {
  try {
    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    console.log(`Checking appointments for ${tomorrow.toISOString()}...`);

    // Find all approved appointments for tomorrow without reminders
    const appointments = await db
      .collection("appointments")
      .find({
        status: "approved",
        selectedDate: {
          $gte: tomorrow,
          $lte: endOfTomorrow,
        },
        reminderSent: { $ne: true },
      })
      .toArray();

    if (appointments.length === 0) {
      console.log("No appointments needing reminders today.");
      return { sent: 0 };
    }

    // Group appointments by coach
    const appointmentsByCoach = {};
    for (const appointment of appointments) {
      if (!appointmentsByCoach[appointment.coachId]) {
        appointmentsByCoach[appointment.coachId] = [];
      }
      appointmentsByCoach[appointment.coachId].push(appointment);
    }

    let emailsSent = 0;

    // Process each coach's appointments
    for (const [coachId, coachAppointments] of Object.entries(
      appointmentsByCoach,
    )) {
      try {
        const coach = await db.collection("users").findOne({
          _id: new ObjectId(coachId),
          role: "coach",
        });

        if (!coach || !coach.email) {
          console.warn(`Coach ${coachId} not found or has no email`);
          continue;
        }

        // Format appointment details
        const appointmentItems = coachAppointments
          .map(
            (app) => `
            <li style="margin-bottom: 15px;">
              <strong>Student:</strong> ${app.name}<br>
              <strong>Date:</strong> ${new Date(
                app.selectedDate,
              ).toLocaleDateString()}<br>
              <strong>Time:</strong> ${app.selectedTime}<br>
              <strong>Contact:</strong> ${app.email} | ${app.phone}<br>
              ${
                app.appointmentDetails
                  ? `<strong>Details:</strong> ${app.appointmentDetails}`
                  : ""
              }
            </li>
          `,
          )
          .join("");

        // Send the reminder email
        const emailSent = await sendCoachEmail({
          email: coach.email,
          name: coach.name,
          subject: `Reminder: You have ${coachAppointments.length} appointment(s) tomorrow`,
          htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2c3e50;">BookMePro Appointment Reminder</h2>
                <p>Dear ${coach.name},</p>
                <p>You have ${coachAppointments.length} confirmed appointment(s) scheduled for tomorrow:</p>
                <ul style="padding-left: 20px;">${appointmentItems}</ul>
                <p>Please ensure you're available for these sessions.</p>
                <p style="margin-top: 30px;">Best regards,<br>The BookMePro Team</p>
              </div>
            `,
        });

        if (emailSent) {
          emailsSent++;
          // Mark appointments as reminded
          await db.collection("appointments").updateMany(
            {
              _id: { $in: coachAppointments.map((a) => new ObjectId(a._id)) },
            },
            { $set: { reminderSent: true, lastReminderSentAt: new Date() } },
          );
        }
      } catch (error) {
        console.error(`Error processing coach ${coachId}:`, error);
      }
    }

    console.log(`Successfully sent ${emailsSent} reminder emails`);
    return { sent: emailsSent, total: appointments.length };
  } catch (error) {
    console.error("Error in sendDailyReminders:", error);
    throw error;
  }
}
