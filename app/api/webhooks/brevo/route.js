import crypto from "node:crypto";
import connectToDatabase from "../../../../Lib/mongodb";

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(request) {
  const configured = process.env.BREVO_WEBHOOK_SECRET;
  const provided =
    new URL(request.url).searchParams.get("token") ||
    request.headers.get("x-bookmepro-webhook-secret");
  if (!configured || !safeEqual(configured, provided)) {
    return Response.json({ message: "Unauthorized." }, { status: 401 });
  }
  const event = await request.json();
  const messageId = event["message-id"] || event.messageId;
  if (!messageId || !event.event)
    return Response.json({ message: "Invalid event." }, { status: 400 });
  const connection = await connectToDatabase();
  const db = connection.db;
  const timestamp = Number(
    event.ts_event || event.ts || event.date || Date.now(),
  );
  await db.collection("emailDeliveries").updateOne(
    { messageId, event: event.event, timestamp },
    {
      $setOnInsert: {
        messageId,
        event: event.event,
        timestamp,
        recipient: event.email || null,
        subject: event.subject || null,
        tags: event.tags || event.tag || [],
        receivedAt: new Date(),
      },
    },
    { upsert: true },
  );
  await db
    .collection("notificationOutbox")
    .updateMany(
      { providerMessageId: messageId },
      { $set: { providerStatus: event.event, providerUpdatedAt: new Date() } },
    );
  return new Response(null, { status: 204 });
}
