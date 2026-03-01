import cron from "node-cron";
import { sendDailyReminders } from "./../utils/emailUtils"; 
import connectToDatabase from "./../Lib/mongodb";

// Schedule the daily reminder job
cron.schedule("0 8 * * *", async () => {
  console.log("Running daily reminder job...");
  try {
    const { db } = await connectToDatabase();
    const result = await sendDailyReminders(db);
    console.log(`Daily reminders sent: ${result.sent}/${result.total}`);
  } catch (error) {
    console.error("Error running daily reminder job:", error);
  }
});

console.log("Cron job scheduled successfully.");