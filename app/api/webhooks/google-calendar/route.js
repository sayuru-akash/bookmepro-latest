import connectToDatabase from "../../../../Lib/mongodb";
import CalendarConnection from "../../../../models/CalendarConnection";
import { syncGoogleDestinationCalendar } from "../../../../Lib/integrations/googleCalendar";

export async function POST(request) {
  const channelId = request.headers.get("x-goog-channel-id");
  const token = request.headers.get("x-goog-channel-token");
  const resourceId = request.headers.get("x-goog-resource-id");
  if (!channelId || !token || !resourceId)
    return new Response(null, { status: 400 });
  await connectToDatabase();
  const connection = await CalendarConnection.findOne({
    watchChannels: { $elemMatch: { channelId, resourceId, token } },
  });
  if (!connection) return new Response(null, { status: 404 });
  try {
    await syncGoogleDestinationCalendar(connection);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Google Calendar webhook synchronization failed:", error);
    return new Response(null, { status: 500 });
  }
}
