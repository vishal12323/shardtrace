# ShardTrace (POC)

ShardTrace is a **fellowship-grade proof of concept** demonstrating **verifiable sharded AI inference** in the same execution shape as an EigenLayer / EigenCloud AVS:

- a **consumer** requests work,
- **operators** perform off-chain tasks,
- a **service/coordinator** verifies returned work and accepts it.

This prototype is intentionally small and local-only. It **does not** implement smart contracts, staking, slashing, confidential compute, auth, or payments.

## The trust problem

If you outsource inference to third parties, you want confidence that:

- the input was sharded as claimed,
- each shard was processed deterministically,
- operators can’t silently swap outputs,
- recomposition followed an agreed rule,
- a portable artifact exists to audit what happened.

ShardTrace produces a **proof bundle** (JSON) containing the manifest, shard hashes, operator attestations, output hashes, and the final recomposed output hash.

## How the prototype works

1. Web UI submits `documents[]` to the coordinator (`POST /run-job`).
2. Coordinator splits into **3 shards** (`shard-1..3`) and creates a **JobManifest**:
   - shard IDs
   - per-shard hash
   - recomposition rule (`concat`)
3. Coordinator dispatches **ShardTask** messages to 3 simulated operators (`POST /task`).
4. Each operator runs deterministic “inference” (a simple token-hash embedding) and returns:
   - `output`
   - `outputHash`
   - `signature` (demo HMAC over `{jobId, shardId, operatorId, outputHash}`)
5. Coordinator verifies hashes/signatures, recomposes outputs in manifest order, computes `finalOutputHash`, and stores a **ProofBundle** under `data/proofs/{jobId}.json`.

### Nice-to-have included

This POC also performs **redundant execution for shard-2** (sent to operator-2 and operator-3) and reports a simple dispute object if output hashes mismatch.

## Why this is EigenCloud-native

The code explicitly mirrors the “Hello World AVS” pattern:

- **consumer/client** submits work (web UI)
- **operators** perform off-chain tasks (3 local operator services)
- **service/coordinator** verifies and accepts work (coordinator service + proof bundle)

In production, operators would belong to an **Operator Set**, stake allocation would back correctness/liveness, and incorrect/non-responsive behavior could be slashable. This POC simulates those concepts at the interface/flow level only.

See:

- `docs/avs-mapping.md`
- `docs/architecture.md`

## Repo structure

```text
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
  inference-engine/  Deterministic embedding (no ML model)
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

## Local setup

### Prereqs

- Node.js 18+ (Node 20+ recommended)
- `pnpm`

### Install

```bash
cd shardtrace
pnpm install
```

### Configure (optional)

Copy env example:

```bash
copy .env.example .env
```

Defaults:

- coordinator: `http://localhost:4000`
- operators: `http://localhost:5001..5003`
- web: `http://localhost:3000`

### Run

```bash
pnpm dev
```

Then open `http://localhost:3000`.

## Demo steps

Follow `docs/demo-flow.md`.

## Production roadmap (not implemented here)

- Operator Set membership + stake allocation
- Slashable correctness/liveness enforcement
- On-chain settlement / proof anchoring
- Real model inference and/or confidential compute
- Stronger signature scheme (public-key, not HMAC)

