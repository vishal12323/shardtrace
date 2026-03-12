import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MODEL_VERSION } from "@shardtrace/shared";
import { createShards, createManifest } from "@shardtrace/shard-engine";
import type { JobManifest } from "@shardtrace/shared";
import type { Shard } from "@shardtrace/shard-engine";

function makeJobId(): string {
  return `job_${crypto.randomBytes(8).toString("hex")}`;
}

export async function createJob(args: { documents: string[] }): Promise<{
  jobId: string;
  shards: Shard[];
  manifest: JobManifest;
}> {
  const jobId = makeJobId();
  const createdAt = new Date().toISOString();
  const shards = createShards(args.documents, 3);
  const manifest = createManifest({ jobId, modelVersion: MODEL_VERSION, shards, createdAt });

  const jobDir = path.resolve(process.cwd(), "../../data/jobs");
  await mkdir(jobDir, { recursive: true });
  await writeFile(
    path.join(jobDir, `${jobId}.json`),
    JSON.stringify({ jobId, createdAt, documents: args.documents, shards, manifest }, null, 2),
    "utf8"
  );

  return { jobId, shards, manifest };
}

