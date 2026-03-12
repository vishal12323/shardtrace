import type { JobManifest, OperatorResult, ProofBundle } from "@shardtrace/shared";

export function buildProofBundle(args: {
  jobId: string;
  manifest: JobManifest;
  operatorResults: OperatorResult[];
  finalOutputHash: string;
  recompositionValid: boolean;
  createdAt: string;
  dispute?: ProofBundle["dispute"];
}): ProofBundle {
  return {
    jobId: args.jobId,
    manifest: args.manifest,
    operatorResults: args.operatorResults,
    finalOutputHash: args.finalOutputHash,
    recompositionValid: args.recompositionValid,
    createdAt: args.createdAt,
    dispute: args.dispute
  };
}

