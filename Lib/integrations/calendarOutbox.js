import { ObjectId } from "mongodb";
import connectToDatabase from "../mongodb";
import { syncAppointmentToGoogle } from "./googleCalendar";

const COLLECTION = "calendarOutbox";

async function ensureIndexes(db) {
  await Promise.all([
    db
      .collection(COLLECTION)
      .createIndex(
        { idempotencyKey: 1 },
        { unique: true, name: "calendar_idempotency" },
      ),
    db
      .collection(COLLECTION)
      .createIndex({ status: 1, runAt: 1 }, { name: "calendar_dispatch" }),
  ]);
}

export async function enqueueCalendarSync(db, appointment, { force = false } = {}) {
  await ensureIndexes(db);
  const idempotencyKey = `${appointment._id}:v${appointment.version || 1}:${appointment.status}`;
  if (force) {
    const now = new Date();
    await db.collection(COLLECTION).updateOne(
      { idempotencyKey },
      {
        $set: {
          appointmentId: appointment._id,
          coachId: appointment.coachId,
          idempotencyKey,
          status: "pending",
          attempts: 0,
          runAt: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
        $unset: {
          completedAt: "",
          lastError: "",
          lockedAt: "",
          result: "",
        },
      },
      { upsert: true },
    );
    return;
  }
  await db.collection(COLLECTION).updateOne(
    { idempotencyKey },
    {
      $setOnInsert: {
        appointmentId: appointment._id,
        coachId: appointment.coachId,
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

export async function drainCalendarOutbox({ appointmentId, limit = 25 } = {}) {
  const connection = await connectToDatabase();
  const db = connection.db;
  await ensureIndexes(db);
  let processed = 0;
  while (processed < limit) {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
    const claimed = await db.collection(COLLECTION).findOneAndUpdate(
      {
        $or: [
          {
            status: { $in: ["pending", "retry"] },
            runAt: { $lte: now },
          },
          { status: "processing", lockedAt: { $lt: staleBefore } },
        ],
        ...(appointmentId
          ? { appointmentId: new ObjectId(appointmentId) }
          : {}),
      },
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
      const result = await syncAppointmentToGoogle(claimed.appointmentId);
      await db
        .collection(COLLECTION)
        .updateOne(
          { _id: claimed._id },
          {
            $set: {
              status: "completed",
              result,
              completedAt: new Date(),
              updatedAt: new Date(),
            },
            $unset: { lockedAt: "" },
          },
        );
    } catch (error) {
      const attempts = Number(claimed.attempts || 0) + 1;
      await db.collection(COLLECTION).updateOne(
        { _id: claimed._id },
        {
          $set: {
            status: attempts >= 8 ? "dead" : "retry",
            attempts,
            runAt: new Date(
              Date.now() + Math.min(6 * 60 * 60 * 1000, 30_000 * 2 ** attempts),
            ),
            lastError: String(error.message).slice(0, 500),
            updatedAt: new Date(),
          },
          $unset: { lockedAt: "" },
        },
      );
      await db
        .collection("appointments")
        .updateOne(
          { _id: claimed.appointmentId },
          { $set: { calendarSyncError: String(error.message).slice(0, 500) } },
        );
    }
  }
  return { processed };
}

export async function enqueueFutureCoachAppointments(
  ownerId,
  limit = 500,
  { force = false } = {},
) {
  const connection = await connectToDatabase();
  const db = connection.db;
  const ownerObjectId = ObjectId.isValid(ownerId)
    ? new ObjectId(ownerId)
    : ownerId;
  const appointments = await db
    .collection("appointments")
    .find({
      coachId: { $in: [ownerObjectId, String(ownerId)] },
      status: { $in: ["pending", "approved"] },
      $or: [
        { startAt: { $gte: new Date() } },
        { selectedDate: { $gte: new Date() } },
      ],
    })
    .limit(limit)
    .toArray();
  for (const appointment of appointments) {
    await enqueueCalendarSync(db, appointment, { force });
  }
  return appointments.length;
}
