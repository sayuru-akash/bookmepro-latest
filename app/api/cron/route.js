import { NextResponse } from "next/server";
import connectToDatabase from "../../../Lib/mongodb";
import CalendarConnection from "../../../models/CalendarConnection";
import { isAuthorizedCronRequest } from "../../../utils/cronAuth";
import {
  drainNotificationOutbox,
  reconcileScheduledReminders,
} from "../../../Lib/notifications/outbox";
import { ensureBrevoDeliveryWebhook } from "../../../Lib/notifications/email";
import {
  drainCalendarOutbox,
  enqueueFutureCoachAppointments,
} from "../../../Lib/integrations/calendarOutbox";
import {
  ensureGoogleCalendarWatch,
  syncGoogleDestinationCalendar,
} from "../../../Lib/integrations/googleCalendar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    await connectToDatabase();
    const connections = await CalendarConnection.find({
      ownerType: "coach",
      status: "connected",
    })
      .sort({ lastSyncedAt: 1 })
      .limit(20);
    const calendarHealth = [];
    for (const connection of connections) {
      try {
        await syncGoogleDestinationCalendar(connection);
        await ensureGoogleCalendarWatch(connection);
        await enqueueFutureCoachAppointments(connection.ownerId);
        calendarHealth.push({ ownerId: connection.ownerId, status: "ok" });
      } catch (error) {
        connection.lastError = String(error.message).slice(0, 500);
        await connection.save();
        calendarHealth.push({ ownerId: connection.ownerId, status: "error" });
      }
    }
    let emailHealth;
    try {
      emailHealth = await ensureBrevoDeliveryWebhook();
    } catch (error) {
      console.error("Brevo delivery webhook reconciliation failed:", error);
      emailHealth = { status: "error" };
    }
    const notifications = await drainNotificationOutbox({ limit: 25 });
    const calendar = await drainCalendarOutbox({ limit: 25 });
    const reminders = await reconcileScheduledReminders(25);
    return NextResponse.json({
      success: true,
      details: {
        notifications,
        calendar,
        reminders,
        calendarHealth,
        emailHealth,
      },
    });
  } catch (error) {
    console.error("BookMePro reconciliation failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute reconciliation." },
      { status: 500 },
    );
  }
}
