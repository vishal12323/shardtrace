import type { RouteHandlerMethod } from "fastify";
import { z } from "zod";
import { createJob } from "../services/createJob.js";
import { dispatchShards } from "../services/dispatchShards.js";
import { collectResults } from "../services/collectResults.js";
import { recomposeResults } from "../services/recomposeResults.js";
import { verifyJob } from "../services/verifyJob.js";
import { OPERATORS } from "../services/operatorRegistry.js";
import { submitJobOnChain } from "../services/onChainSettlement.js";

const RunJobBodySchema = z.object({
  documents: z.array(z.string()).min(1)
});

export const runJobRoute: RouteHandlerMethod = async (req, reply) => {
  const body = RunJobBodySchema.parse(req.body);

  const job = await createJob({ documents: body.documents });

  // Escrow ETH for this job. Collects wallet addresses from the operator registry.
  // No-ops gracefully if PROOFPAY_CONTRACT_ADDRESS or COORDINATOR_PRIVATE_KEY are not set.
  const operatorWallets = Object.values(OPERATORS)
    .map((op) => op.walletAddress)
    .filter((addr) => addr.length > 0);
  if (operatorWallets.length > 0) {
    submitJobOnChain(job.manifest.jobId, operatorWallets).catch((err) => {
      console.error("[ProofPay] submitJobOnChain failed:", err);
    });
  }

  const dispatchPlan = await dispatchShards({ manifest: job.manifest, shards: job.shards });
  const operatorResults = await collectResults({ dispatchPlan });

  const shard2Dispute =
    dispatchPlan.redundantShard2?.enabled === true
      ? (() => {
          const shardId = dispatchPlan.redundantShard2!.shardId;
          const primaryId = dispatchPlan.redundantShard2!.primaryOperatorId;
          const secondaryId = dispatchPlan.redundantShard2!.secondaryOperatorId;
          const primary = operatorResults.find((r) => r.shardId === shardId && r.operatorId === primaryId);
          const secondary = operatorResults.find((r) => r.shardId === shardId && r.operatorId === secondaryId);
          if (!primary || !secondary) {
            return {
              enabled: true,
              shardId,
              comparedOperatorIds: [primaryId, secondaryId],
              match: false,
              details: "Redundant execution missing one result"
            };
          }
          const match = primary.outputHash === secondary.outputHash;
          return {
            enabled: true,
            shardId,
            comparedOperatorIds: [primaryId, secondaryId],
            match,
            details: match ? undefined : "Output hashes mismatch across independent operators"
          };
        })()
      : undefined;

  const verification = await verifyJob({
    manifest: job.manifest,
    shards: job.shards,
    operatorResults
  });
  if (!verification.ok) {
    return reply.code(400).send({
      error: "verification_failed",
      details: verification.details
    });
  }

  const recomposed = recomposeResults({
    manifest: job.manifest,
    operatorResults,
    pickShard2OperatorId: dispatchPlan.redundantShard2?.primaryOperatorId
  });

  const proof = await verification.persistProof({
    operatorResults,
    recomposedOutput: recomposed.recomposedOutput,
    dispute: shard2Dispute
  });

  return reply.send({
    jobId: proof.jobId,
    manifest: proof.manifest,
    operatorResults: proof.operatorResults,
    finalOutputHash: proof.finalOutputHash,
    proofPath: `data/proofs/${proof.jobId}.json`,
    dispute: proof.dispute
  });
};

