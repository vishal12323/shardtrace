import Fastify from "fastify";
import { ShardTaskSchema, hashJson, signPayload } from "@shardtrace/shared";
import { embedDocuments } from "@shardtrace/inference-engine";

const OPERATOR_ID = "operator-3";
const OPERATOR_PRIVATE_KEY = "operator-3-demo-private-key";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true, operatorId: OPERATOR_ID }));

app.post("/task", async (req, reply) => {
  const task = ShardTaskSchema.parse(req.body);

  const output = embedDocuments(task.shardData);
  const outputHash = hashJson(output);
  const signature = signPayload(
    { jobId: task.jobId, shardId: task.shardId, operatorId: OPERATOR_ID, outputHash },
    OPERATOR_PRIVATE_KEY
  );

  return reply.send({
    jobId: task.jobId,
    shardId: task.shardId,
    operatorId: OPERATOR_ID,
    output,
    outputHash,
    signature
  });
});

const port = Number(process.env.PORT ?? 5003);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

