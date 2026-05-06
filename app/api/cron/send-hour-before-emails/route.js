// /app/api/cron/send-hour-before-emails/route.js

import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import connectToDatabase from "../../../../Lib/mongodb";
import { sendEmail } from "../../../../utils/sendEmail";
import { isAuthorizedCronRequest } from "../../../../utils/cronAuth";

export const dynamic = "force-dynamic";

// Not scheduled in vercel.json by default: this route needs frequent execution
// to catch the one-hour reminder window, which requires Vercel Pro or an
// external scheduler such as QStash/Inngest. Keep CRON_SECRET enabled.
async function processHourBeforeReminders() {
  try {
    const { db } = await connectToDatabase();
    const now = DateTime.now();

    // console.log(`Current time: ${now.toISO()}`);

    // Get appointments for today that haven't received hour-before reminder
    const todayStart = now.startOf('day');
    const todayEnd = now.endOf('day');

    const appointments = await db
      .collection("appointments")
      .find({
        status: "Approved",
        hourBeforeSent: { $ne: true },
        // We'll filter by date after parsing the different formats
      })
      .toArray();

    // console.log(`Found ${appointments.length} approved appointments to check`);

    const remindersData = [];
    let processedCount = 0;
    let sentCount = 0;
    let errorCount = 0;

    for (const appt of appointments) {
      processedCount++;
      
      try {
        // Handle different date formats from database
        let appointmentDate;
        if (appt.selectedDate instanceof Date) {
          appointmentDate = DateTime.fromJSDate(appt.selectedDate);
        } else if (appt.selectedDate?.$date) {
          // Handle MongoDB date format
          const timestamp = typeof appt.selectedDate.$date === 'object' 
            ? parseInt(appt.selectedDate.$date.$numberLong) 
            : appt.selectedDate.$date;
          appointmentDate = DateTime.fromMillis(timestamp);
        } else if (typeof appt.selectedDate === 'string') {
          appointmentDate = DateTime.fromISO(appt.selectedDate);
        } else {
          console.error(`Invalid selectedDate format for appointment ${appt._id}:`, appt.selectedDate);
          errorCount++;
          continue;
        }

        // Check if appointment is today
        const apptDate = appointmentDate.startOf('day');
        if (!apptDate.hasSame(now, 'day')) {
          continue; // Skip appointments not today
        }

        // Extract time from selectedTime
        let timeString;
        if (typeof appt.selectedTime === 'string') {
          timeString = appt.selectedTime;
        } else if (appt.selectedTime?.value) {
          timeString = appt.selectedTime.value;
        } else {
          console.error(`Invalid selectedTime format for appointment ${appt._id}:`, appt.selectedTime);
          errorCount++;
          continue;
        }

        const [startTimeStr] = timeString.split(" - ");
        const [hour, minute] = startTimeStr.split(":").map(Number);

        if (isNaN(hour) || isNaN(minute)) {
          console.error(`Invalid time format for appointment ${appt._id}: ${startTimeStr}`);
          errorCount++;
          continue;
        }

        // Create exact appointment datetime for today
        const apptDateTime = appointmentDate.set({
          hour,
          minute,
          second: 0,                
          millisecond: 0,
        });

        const reminderTime = apptDateTime.minus({ hours: 1 });

        // console.log(`\n--- Appointment ${appt._id} ---`);
        // console.log(`Selected date: ${appointmentDate.toFormat('yyyy-MM-dd')}`);
        // console.log(`Selected time: ${timeString}`);
        // console.log(`Appointment datetime: ${apptDateTime.toISO()}`);
        // console.log(`Reminder time: ${reminderTime.toISO()}`);
        // console.log(`Current time: ${now.toISO()}`);

        const minutesDifference = now.diff(reminderTime, "minutes").minutes;
        // console.log(`Minutes difference: ${minutesDifference}`);

        // Send reminder if we're within 5 minutes of the reminder time
        if (Math.abs(minutesDifference) <= 5) {
          // console.log(`📧 Sending reminder to ${appt.email}`);
          
          remindersData.push({
            apptId: appt._id,
            email: appt.email,
            apptDateTime: apptDateTime.toISO(),
            reminderTime: reminderTime.toISO(),
            timeDifference: minutesDifference,
            status: "scheduled",
          });

          try {
            const formattedDate = apptDateTime.toFormat("MMMM d, yyyy");
            const formattedTime = apptDateTime.toFormat("h:mm a");

            await sendEmail({
              email: appt.email,
              name: appt.fullName || appt.name || "Student",
              subject: `Reminder: Your appointment starts in 1 hour (${formattedTime})`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">⏰ Appointment Starting Soon!</h2>
                  <p>Dear ${appt.fullName || appt.name || "Student"},</p>
                  <p>This is a reminder that your appointment starts in <strong>1 hour</strong>:</p>
                  <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
                    <p><strong>📅 Date:</strong> ${formattedDate}</p>
                    <p><strong>🕐 Time:</strong> ${formattedTime}</p>
                    ${appt.appointmentDetails ? `<p><strong>📝 Details:</strong> ${appt.appointmentDetails}</p>` : ''}
                    ${appt.location ? `<p><strong>📍 Location:</strong> ${appt.location}</p>` : ''}
                  </div>
                  <p>Please make sure to be ready for your appointment. If you have any questions or need to make changes, please contact us immediately.</p>
                  <p>Thank you!</p>
                </div>
              `,
            });

            // Use atomic update to prevent duplicates
            const updateResult = await db
              .collection("appointments")
              .updateOne(
                { 
                  _id: appt._id, 
                  hourBeforeSent: { $ne: true },
                  status: "Approved"
                },
                { 
                  $set: { 
                    hourBeforeSent: true,
                    hourBeforeSentAt: new Date()
                  } 
                }
              );

            if (updateResult.modifiedCount > 0) {
              sentCount++;
              // console.log(`✅ Hour-before reminder sent to ${appt.email}`);
              remindersData[remindersData.findIndex((r) => r.apptId === appt._id)].status = "sent";
            } else {
              // console.log(`⚠️ Appointment ${appt._id} was already processed by another instance`);
              remindersData[remindersData.findIndex((r) => r.apptId === appt._id)].status = "already_processed";
            }

          } catch (emailError) {
            errorCount++;
            console.error(`❌ Failed to send email to ${appt.email}:`, emailError);
            remindersData[remindersData.findIndex((r) => r.apptId === appt._id)].status = "email_failed";
            
            // Track failed attempts
            await db
              .collection("appointments")
              .updateOne(
                { _id: appt._id },
                { 
                  $inc: { hourBeforeEmailAttempts: 1 },
                  $set: { lastHourBeforeEmailError: emailError.message }
                }
              );
          }
        } else {
          // console.log(`⏭️ Outside notification window (${minutesDifference} minutes)`);
          remindersData.push({
            apptId: appt._id,
            email: appt.email,
            apptDateTime: apptDateTime.toISO(),
            reminderTime: reminderTime.toISO(),
            timeDifference: minutesDifference,
            status: "skipped",
            reason: `Outside 5-minute window (${Math.round(minutesDifference)} min difference)`
          });
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Error processing appointment ${appt._id}:`, err);
        remindersData.push({
          apptId: appt._id,
          email: appt.email,
          status: "processing_failed",
          error: err.message,
        });
      }
    }

    // console.log(`\n📊 Hour-before reminders summary:`);
    // console.log(`- Processed: ${processedCount}`);
    // console.log(`- Sent: ${sentCount}`);
    // console.log(`- Errors: ${errorCount}`);
    // console.log(`- Skipped: ${processedCount - sentCount - errorCount}`);

    return {
      success: true,
      message: `Processed ${processedCount} appointments, sent ${sentCount} reminders`,
      stats: {
        processed: processedCount,
        sent: sentCount,
        errors: errorCount,
        skipped: processedCount - sentCount - errorCount
      },
      data: remindersData,
      processedAt: now.toISO(),
    };
    
  } catch (error) {
    console.error("❌ Hour-before cron job failed:", error);
    return {
      success: false,
      error: error.message,
      processedAt: DateTime.now().toISO(),
    };
  }
}

export async function GET(request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const result = await processHourBeforeReminders();
  return NextResponse.json(
    {
      success: result.success,
      message: result.message,
      stats: result.stats,
      data: result.data,
      processedAt: result.processedAt,
    },
    { status: result.success ? 200 : 500 }
  );
}
