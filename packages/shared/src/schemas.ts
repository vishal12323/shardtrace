import { z } from "zod";
import { RECOMPOSITION_RULES } from "./constants.js";

export const JobManifestSchema = z.object({
  jobId: z.string().min(1),
  modelVersion: z.string().min(1),
  shardIds: z.array(z.string().min(1)).length(3),
  shardHashes: z.record(z.string(), z.string().min(1)),
  recompositionRule: z.enum(RECOMPOSITION_RULES),
  createdAt: z.string().min(1)
});

export const ShardTaskSchema = z.object({
  jobId: z.string().min(1),
  shardId: z.string().min(1),
  shardData: z.array(z.string()),
  shardHash: z.string().min(1),
  modelVersion: z.string().min(1)
});

export const OperatorResultSchema = z.object({
  jobId: z.string().min(1),
  shardId: z.string().min(1),
  operatorId: z.string().min(1),
  output: z.array(z.array(z.number())),
  outputHash: z.string().min(1),
  signature: z.string().min(1)
});

export const ProofBundleSchema = z.object({
  jobId: z.string().min(1),
  manifest: JobManifestSchema,
  operatorResults: z.array(OperatorResultSchema),
  finalOutputHash: z.string().min(1),
  recompositionValid: z.boolean(),
  createdAt: z.string().min(1),
  dispute: z
    .object({
      enabled: z.boolean(),
      shardId: z.string(),
      comparedOperatorIds: z.array(z.string()),
      match: z.boolean(),
      details: z.string().optional()
    })
    .optional()
});

export type JobManifestZ = z.infer<typeof JobManifestSchema>;
export type ShardTaskZ = z.infer<typeof ShardTaskSchema>;
export type OperatorResultZ = z.infer<typeof OperatorResultSchema>;
export type ProofBundleZ = z.infer<typeof ProofBundleSchema>;
