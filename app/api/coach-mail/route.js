// app/api/coach-mail/route.js
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import connectToDatabase from "../../../Lib/mongodb";
import { sendCoachEmail } from "../../../utils/emailUtils";
import { DateTime } from "luxon";

const MAX_APPOINTMENTS_PER_COACH = 50;
const DEFAULT_TIMEZONE = "UTC";
const EMAIL_SENDING_CONCURRENCY = 5;

async function sendTomorrowAppointments() {
  const { db } = await connectToDatabase();
  const nowUtc = DateTime.utc();

  // Calculate tomorrow's date range in UTC
  const tomorrowStart = nowUtc.plus({ days: 1 }).startOf("day");
  const tomorrowEnd = nowUtc.plus({ days: 1 }).endOf("day");

  try {
    const appointments = await db
      .collection("appointments")
      .find({
        status: "Approved",
        selectedDate: {
          $gte: tomorrowStart.toJSDate(),
          $lte: tomorrowEnd.toJSDate(),
        },
        tomorrowReminderSent: { $ne: true },
      })
      .limit(1000)
      .toArray();

    // console.log(`Found ${appointments.length} appointments for tomorrow.`);

    if (appointments.length === 0) {
      return { success: true, message: "No appointments found for tomorrow" };
    }

    // Group appointments by coachId
    const appointmentsByCoach = appointments.reduce((acc, appt) => {
      if (!appt.coachId) {
        console.warn(`Appointment ${appt._id} has no coachId`);
        return acc;
      }

      const coachId = appt.coachId.toString();
      acc[coachId] = acc[coachId] || [];

      if (acc[coachId].length < MAX_APPOINTMENTS_PER_COACH) {
        acc[coachId].push(appt);
      } else {
        console.warn(
          `Coach ${coachId} has too many appointments (max ${MAX_APPOINTMENTS_PER_COACH})`
        );
      }

      return acc;
    }, {});

    const coachIds = Object.keys(appointmentsByCoach);
    const processedAppointmentIds = [];

    for (let i = 0; i < coachIds.length; i += EMAIL_SENDING_CONCURRENCY) {
      const batch = coachIds.slice(i, i + EMAIL_SENDING_CONCURRENCY);

      await Promise.all(
        batch.map(async (coachId) => {
          try {
            const coachAppointments = appointmentsByCoach[coachId];
            if (!coachAppointments?.length) return;

            const coach = await db
              .collection("users")
              .findOne(
                { _id: new ObjectId(coachId), role: "coach" },
                { projection: { name: 1, email: 1, timezone: 1 } }
              );

            if (!coach?.email) {
              console.warn(`Coach ${coachId} not found or missing email`);
              return;
            }

            const appointmentList = coachAppointments
              .map((appt) => {
                const zone =
                  appt.timezone || coach.timezone || DEFAULT_TIMEZONE;
                const apptDate = DateTime.fromJSDate(appt.selectedDate).setZone(
                  zone
                );
                const formattedDate = apptDate.toFormat("MMMM d, yyyy");
                const [startTime] = appt.selectedTime?.split(" - ") ?? [];

                let formattedTime = "";
                if (startTime) {
                  const [hour, minute] = startTime.split(":").map(Number);
                  formattedTime = apptDate
                    .set({ hour, minute })
                    .toFormat("h:mm a");
                } else {
                  formattedTime = apptDate.toFormat("h:mm a");
                }

                return `
              <li style="margin-bottom: 15px;">
                <strong>Student:</strong> ${appt.name}<br>
                <strong>Date:</strong> ${formattedDate}<br>
                <strong>Time:</strong> ${formattedTime} ${
                  apptDate.offsetNameShort || zone
                }<br>
                <strong>Contact:</strong> ${appt.email} | ${appt.phone}<br>
              </li>
            `;
              })
              .join("");

            const emailSubject = `Reminder: ${
              coachAppointments.length
            } Appointment${coachAppointments.length > 1 ? "s" : ""} Tomorrow`;

            const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <h2 style="color: #2c3e50;">BookMePro Appointment Reminder</h2>
              <p>Dear ${coach.name},</p>
              <p>You have <strong>${
                coachAppointments.length
              }</strong> confirmed appointment${
              coachAppointments.length > 1 ? "s" : ""
            } scheduled for tomorrow:</p>
              <ul style="padding-left: 20px;">${appointmentList}</ul>
              <p>Please ensure you're available for these sessions.</p>
              <p style="margin-top: 30px;">Best regards,<br>The BookMePro Team</p>
            </div>
          `;

            const isSent = await sendCoachEmail({
              email: coach.email,
              name: coach.name,
              subject: emailSubject,
              htmlContent,
            });

            if (isSent) {
              coachAppointments.forEach((appt) => {
                processedAppointmentIds.push(new ObjectId(appt._id));
              });
            }
          } catch (err) {
            console.error(`Error processing coach ${coachId}:`, err.message);
          }
        })
      );
    }

    if (processedAppointmentIds.length > 0) {
      const result = await db
        .collection("appointments")
        .updateMany(
          { _id: { $in: processedAppointmentIds } },
          {
            $set: {
              tomorrowReminderSent: true,
              lastReminderSentAt: new Date(),
            },
          }
        );
      // console.log(`Marked ${result.modifiedCount} appointments as reminded.`);
    }

    return {
      success: true,
      message: `Processed reminders for ${coachIds.length} coaches and ${processedAppointmentIds.length} appointments.`,
    };
  } catch (error) {
    console.error("Error in sendTomorrowAppointments:", error.message);
    throw error;
  }
}

export async function GET(request) {
  try {
    const result = await sendTomorrowAppointments();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in send-tomorrow-appointments route:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process tomorrow's appointments",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
