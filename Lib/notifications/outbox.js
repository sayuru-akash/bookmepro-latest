import { ObjectId } from "mongodb";
import connectToDatabase from "../mongodb";
import {
  cancelBrevoScheduledEmail,
  newBatchId,
  renderAppointmentEmail,
  sendBrevoEmail,
} from "./email";
import { appointmentNotificationEvents } from "./policy";

const OUTBOX = "notificationOutbox";

async function ensureIndexes(db) {
  await Promise.all([
    db
      .collection(OUTBOX)
      .createIndex(
        { idempotencyKey: 1 },
        { unique: true, name: "notification_idempotency" },
      ),
    db
      .collection(OUTBOX)
      .createIndex({ status: 1, runAt: 1 }, { name: "notification_dispatch" }),
    db
      .collection("emailDeliveries")
      .createIndex(
        { messageId: 1, event: 1, timestamp: 1 },
        { unique: true, sparse: true, name: "email_delivery_event" },
      ),
  ]);
}

export async function enqueueAppointmentNotifications(
  db,
  appointment,
  transition,
  { actorRole = null } = {},
) {
  await ensureIndexes(db);
  const events = appointmentNotificationEvents(appointment, transition);
  if (!events.length) return;
  const version = Number(appointment.version || 1);
  for (const item of events) {
    const idempotencyKey = `${appointment._id}:${item.eventType}:${item.recipientType}:v${version}`;
    await db.collection(OUTBOX).updateOne(
      { idempotencyKey },
      {
        $setOnInsert: {
          appointmentId: appointment._id,
          ...item,
          actorRole,
          idempotencyKey,
          status: "pending",
          attempts: 0,
          runAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }
}

function retryAt(attempts) {
  return new Date(
    Date.now() + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** attempts),
  );
}

export async function drainNotificationOutbox({
  appointmentId,
  limit = 25,
} = {}) {
  const connection = await connectToDatabase();
  const db = connection.db;
  await ensureIndexes(db);
  let processed = 0;
  while (processed < limit) {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
    const filter = {
      $or: [
        {
          status: { $in: ["pending", "retry"] },
          runAt: { $lte: now },
        },
        { status: "processing", lockedAt: { $lt: staleBefore } },
      ],
      ...(appointmentId ? { appointmentId: new ObjectId(appointmentId) } : {}),
    };
    const claimed = await db
      .collection(OUTBOX)
      .findOneAndUpdate(
        filter,
        {
          $set: {
            status: "processing",
            lockedAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { sort: { createdAt: 1 }, returnDocument: "after" },
      );
    if (!claimed) break;
    processed += 1;
    try {
      const appointment = await db
        .collection("appointments")
        .findOne({ _id: claimed.appointmentId });
      if (!appointment) throw new Error("Appointment no longer exists.");
      const coachId = ObjectId.isValid(appointment.coachId)
        ? new ObjectId(appointment.coachId)
        : appointment.coachId;
      const coach = await db.collection("users").findOne({ _id: coachId });
      const recipient =
        claimed.recipientType === "coach"
          ? {
              email: coach?.email,
              name: coach?.name || coach?.firstName || "Coach",
            }
          : {
              email: claimed.recipient || appointment.email,
              name: appointment.name || "Student",
            };
      if (!recipient.email)
        throw new Error("Notification recipient is missing.");
      const rendered = renderAppointmentEmail({
        eventType: claimed.eventType,
        appointment,
        coach,
        recipientType: claimed.recipientType,
        actorRole: claimed.actorRole,
      });
      const result = await sendBrevoEmail({
        to: recipient,
        ...rendered,
        tags: ["bookmepro", claimed.eventType],
        idempotencyKey: claimed.idempotencyKey,
      });
      await db
        .collection(OUTBOX)
        .updateOne(
          { _id: claimed._id },
          {
            $set: {
              status: "sent",
              sentAt: new Date(),
              providerMessageId: result.messageId || null,
              updatedAt: new Date(),
            },
            $unset: { lockedAt: "" },
          },
        );
      if (result.messageId) {
        await db
          .collection("emailDeliveries")
          .updateOne(
            { messageId: result.messageId, event: "accepted", timestamp: 0 },
            {
              $setOnInsert: {
                messageId: result.messageId,
                event: "accepted",
                timestamp: 0,
                appointmentId: appointment._id,
                recipient: recipient.email,
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );
      }
    } catch (error) {
      const attempts = Number(claimed.attempts || 0) + 1;
      await db.collection(OUTBOX).updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: attempts >= 8 ? "dead" : "retry",
            attempts,
            runAt: retryAt(attempts),
            lastError: String(error.message).slice(0, 500),
            updatedAt: new Date(),
          },
          $unset: { lockedAt: "" },
        },
      );
    }
  }
  return { processed };
}

export async function cancelAppointmentReminders(db, appointment) {
  for (const reminder of appointment.reminderSchedule || []) {
    if (reminder.messageId && reminder.status === "scheduled") {
      await cancelBrevoScheduledEmail(reminder.messageId).catch(() => false);
    }
  }
  await db
    .collection("appointments")
    .updateOne({ _id: appointment._id }, { $set: { reminderSchedule: [] } });
}

export async function scheduleAppointmentReminders(db, appointment, coach) {
  if (appointment.status !== "approved" || !appointment.startAt) return [];
  const startAt = new Date(appointment.startAt);
  const maxScheduleAt = Date.now() + 72 * 60 * 60 * 1000;
  const definitions = [
    { eventType: "reminder_24h", offsetMs: 24 * 60 * 60 * 1000 },
    { eventType: "reminder_1h", offsetMs: 60 * 60 * 1000 },
  ];
  const existing = new Map(
    (appointment.reminderSchedule || []).map((item) => [item.eventType, item]),
  );
  const scheduled = [...(appointment.reminderSchedule || [])];
  for (const definition of definitions) {
    const scheduledAt = new Date(startAt.getTime() - definition.offsetMs);
    if (
      scheduledAt.getTime() <= Date.now() + 5 * 60 * 1000 ||
      scheduledAt.getTime() > maxScheduleAt
    )
      continue;
    const current = existing.get(definition.eventType);
    if (
      current?.status === "scheduled" &&
      new Date(current.scheduledAt).getTime() === scheduledAt.getTime()
    )
      continue;
    if (current?.messageId)
      await cancelBrevoScheduledEmail(current.messageId).catch(() => false);
    const rendered = renderAppointmentEmail({
      eventType: definition.eventType,
      appointment,
      coach,
      recipientType: "student",
    });
    const batchId = newBatchId();
    const result = await sendBrevoEmail({
      to: { email: appointment.email, name: appointment.name || "Student" },
      ...rendered,
      tags: ["bookmepro", definition.eventType],
      scheduledAt,
      batchId,
      idempotencyKey: `${appointment._id}:${definition.eventType}:v${appointment.version || 1}`,
    });
    const record = {
      eventType: definition.eventType,
      scheduledAt,
      messageId: result.messageId || result.messageIds?.[0] || null,
      batchId,
      status: "scheduled",
      createdAt: new Date(),
    };
    const index = scheduled.findIndex(
      (item) => item.eventType === definition.eventType,
    );
    if (index >= 0) scheduled[index] = record;
    else scheduled.push(record);
  }
  await db
    .collection("appointments")
    .updateOne(
      { _id: appointment._id },
      { $set: { reminderSchedule: scheduled, remindersPlannedAt: new Date() } },
    );
  return scheduled;
}

export async function reconcileScheduledReminders(limit = 500) {
  const connection = await connectToDatabase();
  const db = connection.db;
  const now = new Date();
  const max = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const appointments = await db
    .collection("appointments")
    .find({ status: "approved", startAt: { $gt: now, $lte: max } })
    .limit(limit)
    .toArray();
  for (const appointment of appointments) {
    const coachId = ObjectId.isValid(appointment.coachId)
      ? new ObjectId(appointment.coachId)
      : appointment.coachId;
    const coach = await db.collection("users").findOne({ _id: coachId });
    await scheduleAppointmentReminders(db, appointment, coach).catch((error) =>
      console.error(
        `Reminder scheduling failed for ${appointment._id}:`,
        error,
      ),
    );
  }
  return { inspected: appointments.length };
}
