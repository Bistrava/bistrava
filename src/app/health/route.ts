export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Process liveness only: no secrets, customer data, database writes or mail.
export function GET() {
  return Response.json({ status: "ok" }, {
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
