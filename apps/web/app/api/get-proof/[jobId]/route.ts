import { NextResponse } from "next/server";

export async function GET(_req: Request, ctx: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await ctx.params;
  const coordinatorUrl = process.env.COORDINATOR_URL ?? "http://localhost:4000";
  const res = await fetch(`${coordinatorUrl}/proof/${encodeURIComponent(jobId)}`, { method: "GET" });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": "application/json" }
  });
}

