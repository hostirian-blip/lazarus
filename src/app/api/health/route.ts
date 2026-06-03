export async function GET() {
  return Response.json({ ok: true, service: "lazarus", phase: 1 });
}
