import Fastify from "fastify";
import { runJobRoute } from "./routes/runJob.js";
import { getProofRoute } from "./routes/getProof.js";

const app = Fastify({ logger: true });

app.get("/health", async () => ({ ok: true }));
app.post("/run-job", runJobRoute);
app.get("/proof/:jobId", getProofRoute);

const port = Number(process.env.PORT ?? 4000);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

