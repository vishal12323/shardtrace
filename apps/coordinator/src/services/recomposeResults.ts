import type { JobManifest, OperatorResult } from "@shardtrace/shared";
import { recomposeConcat } from "@shardtrace/proof-engine";

export function recomposeResults(args: {
  manifest: JobManifest;
  operatorResults: OperatorResult[];
  pickShard2OperatorId?: string;
}): { recomposedOutput: number[][]; usedOperatorResults: OperatorResult[] } {
  const results: OperatorResult[] = [];
  for (const shardId of args.manifest.shardIds) {
    const shardResults = args.operatorResults.filter((r) => r.shardId === shardId);
    if (shardResults.length === 0) throw new Error(`Missing operator result for ${shardId}`);

    if (shardId === "shard-2" && args.pickShard2OperatorId) {
      const preferred = shardResults.find((r) => r.operatorId === args.pickShard2OperatorId);
      results.push(preferred ?? shardResults[0]!);
    } else {
      results.push(shardResults[0]!);
    }
  }

  const recomposedOutput = recomposeConcat(args.manifest.shardIds, results);
  return { recomposedOutput, usedOperatorResults: results };
}

