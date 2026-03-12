"use client";

import { useMemo, useState } from "react";
import { InputPanel } from "../components/InputPanel";
import { ManifestPanel } from "../components/ManifestPanel";
import { OperatorPanel } from "../components/OperatorPanel";
import { ProofPanel } from "../components/ProofPanel";

type RunJobResponse = {
  jobId: string;
  manifest: unknown;
  operatorResults: unknown[];
  finalOutputHash: string;
  proofPath: string;
  dispute?: unknown;
};

export default function Page() {
  const [documents, setDocuments] = useState<string[]>([]);
  const [run, setRun] = useState<RunJobResponse | null>(null);
  const [proof, setProof] = useState<unknown | null>(null);
  const [status, setStatus] = useState<string>("");
  const canRun = documents.length > 0;

  const shardsSummary = useMemo(() => {
    const m = run?.manifest as any;
    if (!m?.shardIds) return null;
    const shardIds: string[] = m.shardIds;
    const shardHashes: Record<string, string> = m.shardHashes ?? {};
    return shardIds.map((id) => ({ shardId: id, shardHash: shardHashes[id] }));
  }, [run]);

  async function loadSample() {
    setStatus("Loading sample documents…");
    setRun(null);
    setProof(null);
    const res = await fetch("/api/sample-docs");
    const json = (await res.json()) as { documents: string[] };
    setDocuments(json.documents);
    setStatus("");
  }

  async function runJob() {
    setStatus("Running job (dispatching shards to operators)…");
    setRun(null);
    setProof(null);
    const res = await fetch("/api/run-job", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ documents })
    });
    const json = (await res.json()) as RunJobResponse;
    if (!res.ok) {
      setStatus(`Run failed: ${(json as any)?.error ?? "unknown"}`);
      return;
    }
    setRun(json);
    setStatus("Fetching proof bundle…");
    const proofRes = await fetch(`/api/get-proof/${encodeURIComponent(json.jobId)}`);
    setProof(await proofRes.json());
    setStatus("");
  }

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>ShardTrace</h1>
        <span style={{ opacity: 0.75 }}>verifiable sharded inference POC</span>
      </header>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={loadSample}
          style={{
            background: "#1d2b52",
            color: "white",
            border: "1px solid #2a3c72",
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer"
          }}
        >
          Load sample documents
        </button>
        <button
          onClick={runJob}
          disabled={!canRun}
          style={{
            background: canRun ? "#2b7a3d" : "#1d2b52",
            color: "white",
            border: "1px solid " + (canRun ? "#3aa656" : "#2a3c72"),
            padding: "10px 12px",
            borderRadius: 10,
            cursor: canRun ? "pointer" : "not-allowed",
            opacity: canRun ? 1 : 0.65
          }}
        >
          Run Job
        </button>
        <div style={{ alignSelf: "center", opacity: 0.85 }}>{status}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <InputPanel documents={documents} setDocuments={setDocuments} />
        <ManifestPanel manifest={run?.manifest ?? null} shardsSummary={shardsSummary} />
        <OperatorPanel operatorResults={run?.operatorResults ?? null} dispute={run?.dispute ?? null} />
        <ProofPanel jobId={run?.jobId ?? null} proof={proof} />
      </div>
    </main>
  );
}

