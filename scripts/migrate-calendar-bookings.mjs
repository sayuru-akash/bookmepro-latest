import crypto from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BSON, MongoClient, ObjectId } from "mongodb";
import {
  ACTIVE_APPOINTMENT_STATUSES,
  appointmentInterval,
  normalizeAppointmentStatus,
} from "../Lib/booking/time.js";

const apply = process.argv.includes("--apply");
const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB;
if (!uri || !databaseName) {
  throw new Error("MONGODB_URI and MONGODB_DB are required.");
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(databaseName);

function textId(value) {
  return String(value || "");
}

function dateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function groupKey({ coachId, startAt, endAt, location }) {
  return crypto
    .createHash("sha256")
    .update(
      `${coachId}|${new Date(startAt).toISOString()}|${new Date(endAt).toISOString()}|${location || ""}`,
    )
    .digest("hex");
}

async function backupCollections() {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const directory = path.join("/tmp", "bookmepro-backups", stamp);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  for (const collectionName of ["appointments", "students", "availabledates"]) {
    const documents = await db.collection(collectionName).find({}).toArray();
    const file = path.join(directory, `${collectionName}.ejson`);
    await writeFile(file, BSON.EJSON.stringify(documents, { relaxed: false }), {
      mode: 0o600,
    });
    await chmod(file, 0o600);
  }
  return directory;
}

try {
  const [appointments, students, coaches, availability] = await Promise.all([
    db.collection("appointments").find({}).toArray(),
    db.collection("students").find({}).toArray(),
    db.collection("users").find({ role: "coach" }).toArray(),
    db.collection("availabledates").find({}).toArray(),
  ]);
  const coachMap = new Map(coaches.map((coach) => [textId(coach._id), coach]));
  const studentIds = new Set(students.map((student) => textId(student._id)));
  const slotMap = new Map();
  const availabilityOps = [];

  for (const date of availability) {
    const key = dateKey(date.date);
    const coach = coachMap.get(textId(date.coachId));
    const fallbackZone = date.timezone || coach?.timezone || "Australia/Sydney";
    const timeSlots = (date.timeSlots || []).map((slot) => {
      const multipleBookings = Boolean(slot.multipleBookings);
      const normalized = {
        time: String(slot.time || "").trim(),
        multipleBookings,
        capacity: multipleBookings
          ? Math.max(2, Math.min(500, Number(slot.capacity || 25)))
          : 1,
        timezone: slot.timezone || fallbackZone,
        ...(slot.location ? { location: slot.location } : {}),
      };
      slotMap.set(
        `${date.coachId}|${key}|${normalized.time}|${normalized.location || ""}`,
        normalized,
      );
      return normalized;
    });
    availabilityOps.push({
      updateOne: {
        filter: { _id: date._id },
        update: {
          $set: {
            timezone: fallbackZone,
            slots: timeSlots.length,
            timeSlots,
          },
        },
      },
    });
  }

  const appointmentOps = [];
  const failures = [];
  for (const appointment of appointments) {
    try {
      const coach = coachMap.get(textId(appointment.coachId));
      const selectedTime = String(
        appointment.selectedTime?.value || appointment.selectedTime || "",
      ).trim();
      const selectedDateKey = dateKey(appointment.selectedDate);
      const location = appointment.location || null;
      const slot = slotMap.get(
        `${appointment.coachId}|${selectedDateKey}|${selectedTime}|${location || ""}`,
      );
      const timeZone =
        appointment.timeZone ||
        appointment.selectedTimezone ||
        slot?.timezone ||
        coach?.timezone ||
        "Australia/Sydney";
      const interval = appointmentInterval({
        date: selectedDateKey,
        time: selectedTime,
        timeZone,
      });
      const multipleBookings =
        slot?.multipleBookings ??
        appointment.multipleBookings ??
        appointment.isIndividualSession === false;
      const capacity = multipleBookings
        ? Math.max(
            2,
            Math.min(500, Number(slot?.capacity || appointment.capacity || 25)),
          )
        : 1;
      const status = normalizeAppointmentStatus(appointment.status);
      const normalizedGroupKey = groupKey({
        coachId: appointment.coachId,
        ...interval,
        location,
      });
      const coachId = ObjectId.isValid(textId(appointment.coachId))
        ? new ObjectId(textId(appointment.coachId))
        : appointment.coachId;
      const studentId =
        ObjectId.isValid(textId(appointment.studentId)) &&
        studentIds.has(textId(appointment.studentId))
          ? new ObjectId(textId(appointment.studentId))
          : appointment.studentId;
      appointmentOps.push({
        updateOne: {
          filter: { _id: appointment._id },
          update: {
            $set: {
              coachId,
              studentId,
              selectedDate: new Date(`${interval.dateKey}T00:00:00.000Z`),
              selectedTime,
              selectedTimezone: interval.timeZone,
              timeZone: interval.timeZone,
              startAt: interval.startAt,
              endAt: interval.endAt,
              location,
              isIndividualSession: !multipleBookings,
              multipleBookings,
              capacity,
              groupKey: normalizedGroupKey,
              status,
              version: Math.max(1, Number(appointment.version || 1)),
              reservationReleased:
                !ACTIVE_APPOINTMENT_STATUSES.includes(status),
              createdAt:
                appointment.createdAt ||
                appointment._id.getTimestamp?.() ||
                new Date(),
              updatedAt: appointment.updatedAt || new Date(),
            },
          },
        },
      });
    } catch (error) {
      failures.push({ id: textId(appointment._id), reason: error.message });
    }
  }

  const summary = {
    mode: apply ? "apply" : "dry-run",
    database: databaseName,
    appointments: appointments.length,
    appointmentUpdates: appointmentOps.length,
    appointmentFailures: failures,
    studentsToGrandfatherAsVerified: students.filter(
      (student) => !student.emailVerifiedAt,
    ).length,
    availabilityUpdates: availabilityOps.length,
  };

  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = failures.length ? 1 : 0;
  } else {
    if (failures.length) {
      throw new Error(
        `Migration stopped because ${failures.length} appointment records could not be normalized.`,
      );
    }
    const backupDirectory = await backupCollections();
    if (appointmentOps.length)
      await db.collection("appointments").bulkWrite(appointmentOps, {
        ordered: true,
      });
    if (availabilityOps.length)
      await db.collection("availabledates").bulkWrite(availabilityOps, {
        ordered: true,
      });
    await db.collection("students").updateMany(
      { emailVerifiedAt: { $exists: false } },
      {
        $set: {
          emailVerifiedAt: new Date(),
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null,
        },
      },
    );

    const activeGroups = await db
      .collection("appointments")
      .aggregate([
        { $match: { status: { $in: ACTIVE_APPOINTMENT_STATUSES } } },
        {
          $group: {
            _id: "$groupKey",
            activeCount: { $sum: 1 },
            capacity: { $max: "$capacity" },
          },
        },
      ])
      .toArray();
    if (activeGroups.length) {
      await db.collection("bookingCapacity").bulkWrite(
        activeGroups.map((group) => ({
          replaceOne: {
            filter: { _id: group._id },
            replacement: {
              _id: group._id,
              activeCount: group.activeCount,
              capacity: group.capacity,
              updatedAt: new Date(),
            },
            upsert: true,
          },
        })),
      );
      await db.collection("bookingCapacity").deleteMany({
        _id: { $nin: activeGroups.map((group) => group._id) },
      });
    } else {
      await db.collection("bookingCapacity").deleteMany({});
    }

    await Promise.all([
      db
        .collection("appointments")
        .createIndex(
          { idempotencyKey: 1 },
          { unique: true, sparse: true, name: "booking_idempotency" },
        ),
      db
        .collection("appointments")
        .createIndex(
          { coachId: 1, startAt: 1, endAt: 1, status: 1 },
          { name: "booking_conflicts" },
        ),
      db
        .collection("appointments")
        .createIndex(
          { studentId: 1, startAt: 1, status: 1 },
          { name: "student_schedule" },
        ),
      db
        .collection("calendarconnections")
        .createIndex(
          { ownerType: 1, ownerId: 1 },
          { unique: true, name: "calendar_owner_unique" },
        ),
      db
        .collection("notificationOutbox")
        .createIndex(
          { idempotencyKey: 1 },
          { unique: true, name: "notification_idempotency" },
        ),
      db
        .collection("calendarOutbox")
        .createIndex(
          { idempotencyKey: 1 },
          { unique: true, name: "calendar_idempotency" },
        ),
    ]);
    console.log(JSON.stringify({ ...summary, backupDirectory }, null, 2));
  }
} finally {
  await client.close();
}
