export async function GET() {
  return Response.json(
    {
      error: "SSE stream disabled. Admin live updates now use periodic polling of /api/orders.",
    },
    { status: 410 },
  );
}
