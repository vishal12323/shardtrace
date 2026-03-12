## Demo flow

1. Start the system locally (coordinator + 3 operators + web).
2. Open the web UI.
3. Click **Load sample documents** (9 docs).
4. Click **Run Job**.
5. Inspect:
   - **Manifest**: shard IDs + shard hashes + recomposition rule.
   - **Operator results**: per-shard output hash + signature (and optional redundant shard check).
   - **Final proof bundle**: `finalOutputHash`, `recompositionValid`, and the full JSON proof.
6. Click **Download proof JSON** to export the proof bundle.

