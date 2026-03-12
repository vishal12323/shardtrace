import { useMemo } from "react";

function boxStyle(): React.CSSProperties {
  return {
    background: "#0f1730",
    border: "1px solid #1f2b55",
    borderRadius: 12,
    padding: 14,
    minHeight: 220
  };
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProofPanel({ jobId, proof }: { jobId: string | null; proof: unknown | null }) {
  const finalHash = useMemo(() => (proof as any)?.finalOutputHash as string | undefined, [proof]);

  return (
    <section style={boxStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Final proof bundle</h2>
        {jobId ? <span style={{ opacity: 0.7 }}>{jobId}</span> : null}
      </div>
      <p style={{ margin: "8px 0 10px", opacity: 0.75, fontSize: 13 }}>
        Coordinator verifies shard hashes, output hashes, and signatures, recomposes outputs, and stores the bundle.
      </p>

      {finalHash ? (
        <div
          style={{
            background: "#0b0f1a",
            border: "1px solid #1f2b55",
            borderRadius: 10,
            padding: 10,
            marginBottom: 10
          }}
        >
          <div style={{ opacity: 0.8, fontSize: 12, marginBottom: 4 }}>finalOutputHash</div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
            {finalHash}
          </div>
        </div>
      ) : null}

      {proof ? (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <button
              onClick={() => downloadJson(`proof_${jobId ?? "job"}.json`, proof)}
              style={{
                background: "#1d2b52",
                color: "white",
                border: "1px solid #2a3c72",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer"
              }}
            >
              Download proof JSON
            </button>
          </div>
          <pre
            style={{
              margin: 0,
              background: "#0b0f1a",
              border: "1px solid #1f2b55",
              borderRadius: 10,
              padding: 10,
              overflow: "auto",
              maxHeight: 260,
              fontSize: 12
            }}
          >
            {JSON.stringify(proof, null, 2)}
          </pre>
        </>
      ) : (
        <div style={{ opacity: 0.7, fontSize: 13 }}>Run a job to generate and view a proof bundle.</div>
      )}
    </section>
  );
}

