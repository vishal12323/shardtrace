export type JobManifest = {
  jobId: string;
  modelVersion: string;
  shardIds: string[];
  shardHashes: Record<string, string>;
  recompositionRule: "concat";
  createdAt: string;
};

export type ShardTask = {
  jobId: string;
  shardId: string;
  shardData: string[];
  shardHash: string;
  modelVersion: string;
};

export type OperatorResult = {
  jobId: string;
  shardId: string;
  operatorId: string;
  output: number[][];
  outputHash: string;
  signature: string;
};

export type ProofBundle = {
  jobId: string;
  manifest: JobManifest;
  operatorResults: OperatorResult[];
  finalOutputHash: string;
  recompositionValid: boolean;
  createdAt: string;
  dispute?: {
    enabled: boolean;
    shardId: string;
    comparedOperatorIds: string[];
    match: boolean;
    details?: string;
  };
};
