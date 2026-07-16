export async function GET() {
  return Response.json(
    { message: "Reminders are managed by the unified BookMePro cron." },
    { status: 410 },
  );
}
