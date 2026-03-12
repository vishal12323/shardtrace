import type { RouteHandlerMethod } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ProofBundleSchema } from "@shardtrace/shared";

export const getProofRoute: RouteHandlerMethod = async (req, reply) => {
  const jobId = (req.params as { jobId: string }).jobId;
  const proofPath = path.resolve(process.cwd(), "../../data/proofs", `${jobId}.json`);
  try {
    const raw = await readFile(proofPath, "utf8");
    const json = JSON.parse(raw) as unknown;
    const proof = ProofBundleSchema.parse(json);
    return reply.send(proof);
  } catch (err) {
    return reply.code(404).send({ error: "not_found", jobId });
  }
};

