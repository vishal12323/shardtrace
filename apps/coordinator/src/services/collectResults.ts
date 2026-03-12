import { OperatorResultSchema, ShardTaskSchema } from "@shardtrace/shared";
import type { OperatorResult } from "@shardtrace/shared";
import type { DispatchPlan } from "./dispatchShards.js";

export async function collectResults(args: { dispatchPlan: DispatchPlan }): Promise<OperatorResult[]> {
  const results = await Promise.all(
    args.dispatchPlan.targets.map(async (t) => {
      ShardTaskSchema.parse(t.task);
      const res = await fetch(`${t.operatorUrl}/task`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(t.task)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Operator ${t.operatorId} failed: ${res.status} ${txt}`);
      }
      const json = (await res.json()) as unknown;
      return OperatorResultSchema.parse(json);
    })
  );
  return results;
}

