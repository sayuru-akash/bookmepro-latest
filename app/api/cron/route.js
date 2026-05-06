// app/api/cron/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "../../../Lib/mongodb";
import { sendDailyReminders } from "../../../utils/emailUtils";
import { isAuthorizedCronRequest } from "../../../utils/cronAuth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { db } = await connectToDatabase();
    const result = await sendDailyReminders(db);

    return NextResponse.json({
      success: true,
      message: "Cron jobs initialized successfully",
      reminders: result,
    });
  } catch (error) {
    console.error("Error initializing cron jobs:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
