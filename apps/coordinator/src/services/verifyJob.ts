import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { JobManifest, OperatorResult, ProofBundle } from "@shardtrace/shared";
import { hashJson, verifySignature } from "@shardtrace/shared";
import type { Shard } from "@shardtrace/shard-engine";
import {
  buildProofBundle,
  computeShardHash,
  verifyRecompositionConcat
} from "@shardtrace/proof-engine";
import { OPERATORS } from "./operatorRegistry.js";

type VerifyOk = {
  ok: true;
  persistProof: (args: {
    operatorResults: OperatorResult[];
    recomposedOutput: number[][];
    dispute?: ProofBundle["dispute"];
  }) => Promise<ProofBundle>;
};

type VerifyFail = { ok: false; details: string[] };

export async function verifyJob(args: {
  manifest: JobManifest;
  shards: Shard[];
  operatorResults: OperatorResult[];
}): Promise<VerifyOk | VerifyFail> {
  const details: string[] = [];

  const manifestShardSet = new Set(args.manifest.shardIds);

  for (const shard of args.shards) {
    const expected = args.manifest.shardHashes[shard.shardId];
    if (!expected) details.push(`Manifest missing shard hash for ${shard.shardId}`);
    const got = computeShardHash(shard.shardId, shard.documents);
    if (expected && got !== expected) details.push(`Shard hash mismatch for ${shard.shardId}`);
  }

  for (const res of args.operatorResults) {
    if (res.jobId !== args.manifest.jobId) details.push(`OperatorResult jobId mismatch (${res.operatorId})`);
    if (!manifestShardSet.has(res.shardId))
      details.push(`Unknown shardId in result: ${res.shardId} (${res.operatorId})`);

    const expectedOutHash = hashJson(res.output);
    if (expectedOutHash !== res.outputHash)
      details.push(`Output hash mismatch for ${res.shardId} (${res.operatorId})`);

    const operator = OPERATORS[res.operatorId];
    if (!operator) {
      details.push(`Unknown operatorId: ${res.operatorId}`);
    } else {
      const signedPayload = {
        jobId: res.jobId,
        shardId: res.shardId,
        operatorId: res.operatorId,
        outputHash: res.outputHash
      };
      const sigOk = verifySignature(signedPayload, res.signature, operator.privateKey);
      if (!sigOk) details.push(`Bad signature for ${res.shardId} (${res.operatorId})`);
    }
  }

  for (const shardId of args.manifest.shardIds) {
    const count = args.operatorResults.filter((r) => r.shardId === shardId).length;
    if (count === 0) details.push(`Missing operator result for shard ${shardId}`);
  }

  if (details.length > 0) return { ok: false, details };

  return {
    ok: true,
    persistProof: async ({ operatorResults, recomposedOutput, dispute }) => {
      const createdAt = new Date().toISOString();
      const finalOutputHash = hashJson(recomposedOutput);

      const recompositionValid = verifyRecompositionConcat({
        manifestShardIds: args.manifest.shardIds,
        results: operatorResults,
        recomposed: recomposedOutput
      });

      const proof = buildProofBundle({
        jobId: args.manifest.jobId,
        manifest: args.manifest,
        operatorResults,
        finalOutputHash,
        recompositionValid,
        createdAt,
        dispute
      });

      const proofDir = path.resolve(process.cwd(), "../../data/proofs");
      await mkdir(proofDir, { recursive: true });
      await writeFile(path.join(proofDir, `${args.manifest.jobId}.json`), JSON.stringify(proof, null, 2), "utf8");
      return proof;
    }
  };
}

