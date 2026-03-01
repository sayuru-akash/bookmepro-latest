// app/api/cron/send-day-before-emails/route.js
import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import connectToDatabase from "../../../../Lib/mongodb";
import { sendEmail } from "../../../../utils/sendEmail";

export const dynamic = "force-dynamic";

async function processDayBeforeReminders() {
  const { db } = await connectToDatabase();

  try {
    // Find appointments that are approved and have not yet received the day-before email
    const appointments = await db
      .collection("appointments")
      .find({
        status: "Approved",
        dayBeforeSent: { $ne: true },
        selectedDate: { $exists: true },
        selectedTime: { $exists: true },
      })
      .toArray();

    // console.log("Day-before appointments to check:", appointments.length);

    if (appointments.length === 0) {
      // console.log("No appointments found for day-before reminders");
      return { processed: 0, sent: 0, errors: 0 };
    }

    const now = DateTime.now();
    const tomorrow = now.plus({ days: 1 }).startOf("day");
    
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

        const apptDate = appointmentDate.startOf("day");

        // console.log(`Appointment ${appt._id}: ${apptDate.toFormat('yyyy-MM-dd')} vs Tomorrow: ${tomorrow.toFormat('yyyy-MM-dd')}`);

        // Check if appointment date is exactly tomorrow
        if (apptDate.equals(tomorrow)) {
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

          const formattedDate = apptDate.toFormat("MMMM d, yyyy");

          try {
            await sendEmail({
              email: appt.email,
              name: appt.fullName || appt.name || "Student",
              subject: `Reminder: Your appointment tomorrow (${formattedDate} at ${timeString})`,
              htmlContent: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #333;">Appointment Reminder</h2>
                  <p>Dear ${appt.fullName || appt.name || "Student"},</p>
                  <p>This is a friendly reminder that your appointment is scheduled for <strong>tomorrow</strong>:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>📅 Date:</strong> ${formattedDate}</p>
                    <p><strong>🕐 Time:</strong> ${timeString}</p>
                    ${appt.appointmentDetails ? `<p><strong>📝 Details:</strong> ${appt.appointmentDetails}</p>` : ''}
                  </div>
                  <p>Please make sure to be available at the scheduled time. If you need to reschedule or have any questions, please contact us as soon as possible.</p>
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
                  dayBeforeSent: { $ne: true },
                  status: "Approved"
                },
                { 
                  $set: { 
                    dayBeforeSent: true,
                    dayBeforeSentAt: new Date()
                  } 
                }
              );

            if (updateResult.modifiedCount > 0) {
              sentCount++;
              // console.log(`✅ Day-before reminder sent to ${appt.email} (appt ${appt._id})`);
            } else {
              // console.log(`⚠️ Appointment ${appt._id} was already processed by another instance`);
            }

          } catch (emailError) {
            errorCount++;
            console.error(`❌ Failed to send day-before email to ${appt.email} (appt ${appt._id}):`, emailError);
            
            // Track failed attempts
            await db
              .collection("appointments")
              .updateOne(
                { _id: appt._id },
                { 
                  $inc: { dayBeforeEmailAttempts: 1 },
                  $set: { lastDayBeforeEmailError: emailError.message }
                }
              );
          }
        } else {
          // console.log(`Appointment ${appt._id} is not tomorrow`);
        }
      } catch (processingError) {
        errorCount++;
        console.error(`❌ Error processing appointment ${appt._id}:`, processingError);
      }
    }

    // console.log(`📊 Day-before reminders summary: Processed ${processedCount}, Sent ${sentCount}, Errors ${errorCount}`);
    return { processed: processedCount, sent: sentCount, errors: errorCount };

  } catch (err) {
    console.error("❌ Error in processDayBeforeReminders:", err);
    throw err;
  }
}

export async function GET(request) {
  try {
    const results = await processDayBeforeReminders();
    
    return NextResponse.json({ 
      message: "Processed day-before emails successfully.",
      ...results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error in day-before job:", error);
    return NextResponse.json(
      { 
        message: "Error processing day-before emails.", 
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// app/api/cron/send-day-before-emails/route.js
// import { NextResponse } from "next/server";
// import { DateTime } from "luxon";
// import connectToDatabase from "../../../../Lib/mongodb";
// import { sendEmail } from "../../../../utils/sendEmail";

// export const dynamic = "force-dynamic";

// async function processDayBeforeReminders() {
//   const { db } = await connectToDatabase();

//   try {
//     // Find appointments that are approved and have not yet received the day-before email
//     const appointments = await db
//       .collection("appointments")
//       .find({
//         status: "Approved",
//         dayBeforeSent: { $ne: true },
//       })
//       .toArray();

//     // console.log("Day-before appointments to check:", appointments.length);

//     const nowUtc = DateTime.utc();

//     for (const appt of appointments) {
//       const userTz = appt.timezone || "UTC";
//       const nowLocal = nowUtc.setZone(userTz);

//       const apptLocalDate = DateTime.fromJSDate(appt.selectedDate, {
//         zone: userTz,
//       }).startOf("day");

//       const tomorrowLocal = nowLocal.plus({ days: 1 }).startOf("day");

//       // Check if appointment date is exactly tomorrow in user's timezone
//       if (apptLocalDate.equals(tomorrowLocal)) {
//         // Parse the start time of the appointment from string "HH:mm - HH:mm"
//         const [startTimeStr] = appt.selectedTime.split(" - ");
//         const [hour, minute] = startTimeStr.split(":").map(Number);

//         // Create full datetime for appointment on that date and start time
//         const apptLocalDateTime = apptLocalDate.set({
//           hour,
//           minute,
//           second: 0,
//           millisecond: 0,
//         });

//         const formattedDate = apptLocalDateTime.toFormat("MMMM d, yyyy");
//         const formattedTime = apptLocalDateTime.toFormat("h:mm a");

//         try {
//           await sendEmail({
//             email: appt.email,
//             name: appt.fullName || appt.name || "Student",
//             subject: `Reminder: Your appointment on ${formattedDate} at ${formattedTime} is tomorrow!`,
//             htmlContent: `
//               <p>Dear ${appt.fullName || appt.name || "Student"},</p>
//               <p>This is a reminder that your appointment is scheduled for tomorrow, <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong> (${userTz}).</p>
//               <p>Thank you!</p>
//             `,
//           });

//           // Mark the day-before reminder as sent (only mark emailSent for day-before)
//           await db
//             .collection("appointments")
//             .updateOne(
//               { _id: appt._id, dayBeforeSent: { $ne: true } },
//               { $set: { dayBeforeSent: true } }
//             );

//           // console.log(
//             `Day-before reminder sent to ${appt.email} (appt ${appt._id})`
//           );
//         } catch (err) {
//           console.error(
//             `Failed to send day-before email to ${appt.email}`,
//             err
//           );
//         }
//       }
//     }
//   } catch (err) {
//     console.error("Error in processDayBeforeReminders:", err);
//   }
// }

// export async function GET(request) {
//   const { searchParams } = new URL(request.url);

//   try {
//     await processDayBeforeReminders();
//     return NextResponse.json({ message: "Processed day-before emails." });
//   } catch (error) {
//     console.error("Error in day-before job:", error);
//     return NextResponse.json(
//       { message: "Error sending day-before emails.", error: error.message },
//       { status: 500 }
//     );
//   }
// }
