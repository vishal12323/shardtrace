import type { JobManifest, ShardTask, ProofBundle } from "@shardtrace/shared";
import type { Shard } from "@shardtrace/shard-engine";
import { OPERATORS } from "./operatorRegistry.js";

export type DispatchTarget = {
  operatorId: string;
  operatorUrl: string;
  task: ShardTask;
};

export type DispatchPlan = {
  manifest: JobManifest;
  targets: DispatchTarget[];
  redundantShard2?: {
    enabled: boolean;
    shardId: string;
    primaryOperatorId: string;
    secondaryOperatorId: string;
    dispute?: ProofBundle["dispute"];
  };
};

export async function dispatchShards(args: {
  manifest: JobManifest;
  shards: Shard[];
  enableRedundantShard2?: boolean;
}): Promise<DispatchPlan> {
  const enableRedundant = args.enableRedundantShard2 ?? true;
  const operatorIds: Record<string, string> = {
    "shard-1": "operator-1",
    "shard-2": "operator-2",
    "shard-3": "operator-3"
  };

  const targets: DispatchTarget[] = [];
  for (const shard of args.shards) {
    const operatorId = operatorIds[shard.shardId];
    if (!operatorId) throw new Error(`No operator assignment for ${shard.shardId}`);
    const operator = OPERATORS[operatorId];
    if (!operator) throw new Error(`Unknown operator ${operatorId}`);
    targets.push({
      operatorId,
      operatorUrl: operator.url,
      task: {
        jobId: args.manifest.jobId,
        shardId: shard.shardId,
        shardData: shard.documents,
        shardHash: args.manifest.shardHashes[shard.shardId]!,
        modelVersion: args.manifest.modelVersion
      }
    });
  }

  if (enableRedundant) {
    const shard2 = args.shards.find((s) => s.shardId === "shard-2");
    if (shard2) {
      const primary = OPERATORS["operator-2"];
      const secondary = OPERATORS["operator-3"];
      targets.push({
        operatorId: secondary.operatorId,
        operatorUrl: secondary.url,
        task: {
          jobId: args.manifest.jobId,
          shardId: shard2.shardId,
          shardData: shard2.documents,
          shardHash: args.manifest.shardHashes[shard2.shardId]!,
          modelVersion: args.manifest.modelVersion
        }
      });

      return {
        manifest: args.manifest,
        targets,
        redundantShard2: {
          enabled: true,
          shardId: "shard-2",
          primaryOperatorId: primary.operatorId,
          secondaryOperatorId: secondary.operatorId
        }
      };
    }
  }

  return { manifest: args.manifest, targets };
}

