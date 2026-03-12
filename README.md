# ShardTrace

People pay for AI compute but cannot verify what actually ran. ShardTrace creates a verifiable receipt for any distributed inference job — cryptographic proof of exactly what ran, on what input, producing what output. The coordinator runs in EigenCompute TEE so the receipt generation itself is tamper-proof.

## Live Deployment

Coordinator deployed to EigenCompute TEE on Sepolia.

Verify: https://verify-sepolia.eigencloud.xyz/app/0xfd35d56978B8511611d16DE635Fd079AB7aB3A64

Application ID: 0xfd35d56978b8511611d16de635fd079ab7ab3a64

## The Trust Problem

If you outsource inference to third parties, you want confidence that:

* the input was sharded as claimed,
* each shard was processed deterministically,
* operators can't silently swap outputs,
* recomposition followed an agreed rule,
* a portable artifact exists to audit what happened.

ShardTrace produces a **proof bundle** (JSON) containing the manifest, shard hashes, operator attestations, output hashes, and the final recomposed output hash.

## How the Prototype Works

1. Web UI submits `documents[]` to the coordinator (`POST /run-job`).
2. Coordinator splits into **3 shards** (`shard-1..3`) and creates a **JobManifest**:
   * shard IDs
   * per-shard hash
   * recomposition rule (`concat`)
3. Coordinator dispatches **ShardTask** messages to 3 simulated operators (`POST /task`).
4. Each operator runs deterministic inference and returns:
   * `output`
   * `outputHash`
   * `signature` (HMAC over `{jobId, shardId, operatorId, outputHash}`)
5. Coordinator verifies hashes and signatures, recomposes outputs in manifest order, computes `finalOutputHash`, and stores a **ProofBundle** under `data/proofs/{jobId}.json`.

### Redundant Execution

This POC performs **redundant execution for shard-2** (sent to operator-2 and operator-3) and reports a dispute object if output hashes mismatch — simulating Byzantine fault detection.

## Why This Is EigenCloud-Native

The code explicitly mirrors the EigenLayer AVS execution pattern:

* **consumer/client** submits work (web UI)
* **operators** perform off-chain tasks (3 local operator services)
* **service/coordinator** verifies and accepts work (coordinator service + proof bundle)

The coordinator is deployed to EigenCompute TEE on Sepolia — producing real hardware attestation that the verification and proof generation logic runs in a tamper-proof environment.

In production, operators would belong to an **Operator Set**, stake allocation would back correctness and liveness, and incorrect behavior would be slashable. This POC simulates those concepts at the interface and flow level.

See:

* `docs/avs-mapping.md`
* `docs/architecture.md`

## What ShardTrace Proves Today

* **Pipeline integrity** — the workflow happened consistently and outputs weren't tampered with
* **Operator consistency** — every operator signed their output and hashes match
* **Recomposition validity** — outputs were combined according to the agreed rule
* **Tamper-proof verification** — coordinator runs in EigenCompute TEE proving receipt generation wasn't manipulated

## What ShardTrace Does Not Prove Yet

* Model identity — which specific model binary ran
* Semantic correctness — that the correct model was used not just a consistent one

That's the honest limitation and the roadmap — binding proof bundles to model hash, container hash, and input commitment. EigenCompute TEE is the foundation that makes that next step possible.

## Competitive Context

Inference Labs raised $6.3M to prove AI inference with ZK proofs — mathematically strongest but computationally prohibitive for production scale models today. ShardTrace uses EigenCompute TEE — works with any model at production scale right now, no distillation required. Different trust assumptions. Complementary approaches to the same problem.

## Repo Structure
```
apps/
  web/           Next.js UI + API proxy routes
  coordinator/   Fastify service (manifest, dispatch, verify, recomposition, proof write)
services/
  operator-1/    Fastify operator service
  operator-2/
  operator-3/
packages/
  shared/        Types, Zod schemas, hashing/signing helpers
  shard-engine/  Sharding + manifest creation
  inference-engine/  Deterministic embedding
  proof-engine/  Proof bundle builder + verification helpers
data/
  sample-docs.json
  jobs/          Saved job inputs/manifests
  proofs/        Saved proof bundles
docs/
  architecture.md
  avs-mapping.md
  demo-flow.md
```

## Local Setup

### Prereqs

* Node.js 18+ (Node 20+ recommended)
* `pnpm`

### Install
```
cd shardtrace
pnpm install
```

### Configure
```
copy .env.example .env
```

Defaults:

* coordinator: `http://localhost:4000`
* operators: `http://localhost:5001..5003`
* web: `http://localhost:3000`

### Run
```
pnpm dev
```

Open `http://localhost:3000`.

## Demo

Follow `docs/demo-flow.md`.

## Production Roadmap

* Bind proof bundles to model hash and container hash for semantic verification
* Operator Set membership and stake allocation
* Slashable correctness and liveness enforcement
* On-chain settlement and proof anchoring
* Real model inference via EigenAI
* Stronger signature scheme (public-key not HMAC)

## Architecture-diagram
<img width="757" height="742" alt="image" src="https://github.com/user-attachments/assets/dd2bed57-77c5-466e-a91f-89aa4e4a7d01" />

