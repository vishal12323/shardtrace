## ShardTrace architecture (POC)

### Actors

- **Consumer (web client)**: submits a small batch of documents and requests work.
- **Coordinator (service)**: splits work into shards, dispatches tasks to operators, verifies responses, recomposes outputs, and produces a proof bundle.
- **Operators (simulated services)**: perform deterministic off-chain inference on assigned shard data and return attestations.

### Flow

1. The **consumer** sends `documents[]` to the **coordinator** (`POST /run-job`).
2. The **coordinator**:
   - creates exactly 3 shards (`shard-1..3`) from the document list,
   - computes a hash for each shard,
   - creates a **JobManifest** containing shard IDs + shard hashes and the recomposition rule (`concat`).
3. The **coordinator** sends each **ShardTask** to an **operator** (`POST /task`).
4. Each **operator**:
   - runs deterministic embedding on its shard documents (no real ML model),
   - returns `output`, `outputHash`, and an HMAC-style `signature` over `{jobId, shardId, operatorId, outputHash}`.
5. The **coordinator** verifies:
   - shard IDs exist in the manifest,
   - shard hashes match the manifest,
   - output hashes match returned outputs,
   - signatures match the operator’s configured key,
   - all required shard results are present,
   - recomposition is consistent with the manifest rule.
6. The **coordinator** recomposes shard outputs (manifest order) and computes `finalOutputHash`.
7. The **coordinator** writes a **ProofBundle** JSON to `data/proofs/{jobId}.json`.

### What is “verifiable” here?

The proof bundle makes the execution **auditable**:

- the manifest binds shards and shard hashes,
- each operator result binds its output via `outputHash`,
- each operator attests via `signature`,
- the coordinator’s recomposition is checkable and hashed.

This POC demonstrates **verifiable distributed execution with reduced full-dataset exposure** (operators only see their shard), not confidential compute.

