import { Dispatch, SetStateAction, useMemo } from "react";

function boxStyle(): React.CSSProperties {
  return {
    background: "#0f1730",
    border: "1px solid #1f2b55",
    borderRadius: 12,
    padding: 14,
    minHeight: 220
  };
}

export function InputPanel({
  documents,
  setDocuments
}: {
  documents: string[];
  setDocuments: Dispatch<SetStateAction<string[]>>;
}) {
  const text = useMemo(() => documents.join("\n"), [documents]);

  return (
    <section style={boxStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Input documents</h2>
        <span style={{ opacity: 0.7 }}>{documents.length} docs</span>
      </div>

      <p style={{ margin: "8px 0 10px", opacity: 0.75, fontSize: 13 }}>
        One document per line. The coordinator shards into 3 shards (round-robin).
      </p>

      <textarea
        value={text}
        onChange={(e) => {
          const next = e.target.value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          setDocuments(next);
        }}
        placeholder="Paste docs here (one per line)…"
        style={{
          width: "100%",
          height: 140,
          background: "#0b0f1a",
          color: "#e7eefc",
          border: "1px solid #1f2b55",
          borderRadius: 10,
          padding: 10,
          resize: "vertical"
        }}
      />
    </section>
  );
}

