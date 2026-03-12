import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET() {
  const p = path.resolve(process.cwd(), "../../data/sample-docs.json");
  const raw = await readFile(p, "utf8");
  const documents = JSON.parse(raw) as unknown;
  return NextResponse.json({ documents });
}

