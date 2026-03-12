import type { OperatorResult } from "@shardtrace/shared";

export function recomposeConcat(manifestShardIds: string[], results: OperatorResult[]): number[][] {
  const out: number[][] = [];
  for (const shardId of manifestShardIds) {
    const shardOut = results.find((r) => r.shardId === shardId)?.output;
    if (!shardOut) throw new Error(`Missing output for ${shardId}`);
    out.push(...shardOut);
  }
  return out;
}

export function verifyRecompositionConcat(args: {
  manifestShardIds: string[];
  results: OperatorResult[];
  recomposed: number[][];
}): boolean {
  const expected = recomposeConcat(args.manifestShardIds, args.results);
  return JSON.stringify(expected) === JSON.stringify(args.recomposed);
}

