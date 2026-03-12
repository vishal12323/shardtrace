function boxStyle(): React.CSSProperties {
  return {
    background: "#0f1730",
    border: "1px solid #1f2b55",
    borderRadius: 12,
    padding: 14,
    minHeight: 220
  };
}

export function OperatorPanel({
  operatorResults,
  dispute
}: {
  operatorResults: unknown[] | null;
  dispute: unknown | null;
}) {
  const results = Array.isArray(operatorResults) ? operatorResults : null;

  return (
    <section style={boxStyle()}>
      <h2 style={{ margin: 0, fontSize: 16 }}>Operator results</h2>
      <p style={{ margin: "8px 0 10px", opacity: 0.75, fontSize: 13 }}>
        Each operator returns output + output hash + signature. (Optional) shard-2 redundant execution is compared.
      </p>

      {dispute ? (
        <div
          style={{
            background: "#0b0f1a",
            border: "1px solid #1f2b55",
            borderRadius: 10,
            padding: 10,
            marginBottom: 10
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Redundant check</div>
          <pre style={{ margin: 0, fontSize: 12, overflow: "auto" }}>{JSON.stringify(dispute, null, 2)}</pre>
        </div>
      ) : null}

      {results ? (
        <div style={{ display: "grid", gap: 8 }}>
          {results.map((r: any, idx) => (
            <div
              key={`${r?.operatorId ?? "op"}-${r?.shardId ?? "sh"}-${idx}`}
              style={{
                background: "#0b0f1a",
                border: "1px solid #1f2b55",
                borderRadius: 10,
                padding: 10
              }}
            >
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6, opacity: 0.9 }}>
                <span>
                  <strong>{r?.operatorId}</strong>
                </span>
                <span>{r?.shardId}</span>
              </div>
              <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}>
                outputHash: {r?.outputHash}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ opacity: 0.7, fontSize: 13 }}>Run a job to see operator results.</div>
      )}
    </section>
  );
}

