import { hashJson } from "@shardtrace/shared";
import type { JobManifest } from "@shardtrace/shared";
import type { Shard } from "./createShards.js";

export function createManifest(args: {
  jobId: string;
  modelVersion: string;
  shards: Shard[];
  createdAt: string;
}): JobManifest {
  const shardIds = args.shards.map((s) => s.shardId);
  const shardHashes: Record<string, string> = {};
  for (const shard of args.shards) {
    shardHashes[shard.shardId] = hashJson({
      shardId: shard.shardId,
      documents: shard.documents
    });
  }

  return {
    jobId: args.jobId,
    modelVersion: args.modelVersion,
    shardIds,
    shardHashes,
    recompositionRule: "concat",
    createdAt: args.createdAt
  };
}

