import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const coordinatorUrl = process.env.COORDINATOR_URL ?? "http://localhost:4000";
  const res = await fetch(`${coordinatorUrl}/run-job`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
}

