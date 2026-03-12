import { readFile } from "node:fs/promises";
import { hashJson, ProofBundleSchema, verifySignature } from "@shardtrace/shared";
import { computeShardHash, recomposeConcat } from "@shardtrace/proof-engine";
import { OPERATORS } from "./services/operatorRegistry.js";

type JobFile = {
  jobId: string;
  createdAt: string;
  documents: string[];
  shards: Array<{
    shardId: string;
    documents: string[];
  }>;
  manifest: {
    jobId: string;
    modelVersion: string;
    shardIds: string[];
    shardHashes: Record<string, string>;
    recompositionRule: "concat";
    createdAt: string;
  };
};

async function main() {
  const proofPath = process.argv[2];
  const jobPath = process.argv[3];

  if (!proofPath || !jobPath) {
    console.error("Usage: pnpm verify:proof <proof.json> <job.json>");
    process.exit(1);
  }

  const proofRaw = await readFile(proofPath, "utf8");
  const jobRaw = await readFile(jobPath, "utf8");

  const proof = ProofBundleSchema.parse(JSON.parse(proofRaw));
  const job = JSON.parse(jobRaw) as JobFile;

  const failures: string[] = [];

  // 1) Manifest equality check
  if (JSON.stringify(proof.manifest) !== JSON.stringify(job.manifest)) {
    failures.push("Proof manifest does not match job manifest");
  }

  // 2) Shard hash verification
  for (const shard of job.shards) {
    const expectedHash = proof.manifest.shardHashes[shard.shardId];
    if (!expectedHash) {
      failures.push(`Missing shard hash in manifest for ${shard.shardId}`);
      continue;
    }

    const actualHash = computeShardHash(shard.shardId, shard.documents);
    if (actualHash !== expectedHash) {
      failures.push(`Shard hash mismatch for ${shard.shardId}`);
    }
  }

  // 3) Operator result verification
  const manifestShardSet = new Set(proof.manifest.shardIds);

  for (const res of proof.operatorResults) {
    if (res.jobId !== proof.jobId) {
      failures.push(`Operator result jobId mismatch for ${res.operatorId}/${res.shardId}`);
    }

    if (!manifestShardSet.has(res.shardId)) {
      failures.push(`Unknown shardId in operator result: ${res.shardId}`);
    }

    const expectedOutputHash = hashJson(res.output);
    if (expectedOutputHash !== res.outputHash) {
      failures.push(`Output hash mismatch for ${res.operatorId}/${res.shardId}`);
    }

    const operator = OPERATORS[res.operatorId];
    if (!operator) {
      failures.push(`Unknown operatorId: ${res.operatorId}`);
      continue;
    }

    const signedPayload = {
      jobId: res.jobId,
      shardId: res.shardId,
      operatorId: res.operatorId,
      outputHash: res.outputHash
    };

    const sigOk = verifySignature(signedPayload, res.signature, operator.privateKey);
    if (!sigOk) {
      failures.push(`Bad signature for ${res.operatorId}/${res.shardId}`);
    }
  }

  // 4) Ensure each shard has at least one result
  for (const shardId of proof.manifest.shardIds) {
    const count = proof.operatorResults.filter((r) => r.shardId === shardId).length;
    if (count === 0) {
      failures.push(`Missing operator result for shard ${shardId}`);
    }
  }

  // 5) Recompose and verify final output hash
  try {
    const canonicalResults = proof.manifest.shardIds.map((shardId) => {
      const result = proof.operatorResults.find((r) => r.shardId === shardId);
      if (!result) throw new Error(`Missing result for ${shardId}`);
      return result;
    });

    const recomposed = recomposeConcat(proof.manifest.shardIds, canonicalResults);
    const recomposedHash = hashJson(recomposed);

    if (recomposedHash !== proof.finalOutputHash) {
      failures.push("Final output hash mismatch");
    }
  } catch (err) {
    failures.push(
      err instanceof Error ? `Recomposition failed: ${err.message}` : "Recomposition failed"
    );
  }

  // 6) Optional dispute validation
  if (proof.dispute?.enabled) {
    const [a, b] = proof.dispute.comparedOperatorIds;
    const shardId = proof.dispute.shardId;

    const ra = proof.operatorResults.find((r) => r.shardId === shardId && r.operatorId === a);
    const rb = proof.operatorResults.find((r) => r.shardId === shardId && r.operatorId === b);

    const actualMatch = !!ra && !!rb && ra.outputHash === rb.outputHash;
    if (actualMatch !== proof.dispute.match) {
      failures.push(`Dispute metadata mismatch for ${shardId}`);
    }
  }

  if (failures.length > 0) {
    console.error("VERIFICATION FAILED");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("VERIFIED");
  console.log("- manifest matches");
  console.log("- shard hashes valid");
  console.log("- operator outputs valid");
  console.log("- signatures valid");
  console.log("- final output hash valid");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});