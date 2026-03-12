export type Shard = {
  shardId: string;
  documents: string[];
};

export function createShards(documents: string[], shardCount = 3): Shard[] {
  if (shardCount !== 3) throw new Error("ShardTrace POC requires exactly 3 shards");
  const shardIds = ["shard-1", "shard-2", "shard-3"];
  const shards: Shard[] = shardIds.map((shardId) => ({ shardId, documents: [] }));
  for (let i = 0; i < documents.length; i++) {
    shards[i % shardCount]!.documents.push(documents[i]!);
  }
  return shards;
}

