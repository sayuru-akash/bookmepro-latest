export async function GET() {
  return Response.json(
    { message: "Coach reminders are managed by the unified BookMePro cron." },
    { status: 410 },
  );
}
