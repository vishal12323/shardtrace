import { hashJson } from "@shardtrace/shared";

export function computeShardHash(shardId: string, shardData: string[]): string {
  return hashJson({ shardId, documents: shardData });
}

export function verifyManifestShardHash(args: {
  shardId: string;
  shardData: string[];
  expectedHash: string;
}): boolean {
  const got = computeShardHash(args.shardId, args.shardData);
  return got === args.expectedHash;
}

