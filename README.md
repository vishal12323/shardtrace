# ProofPay

People pay for AI compute but cannot verify what actually ran. **ProofPay** solves the payment problem end-to-end: it escrows ETH when a job is submitted, verifies distributed inference cryptographically, and releases payment to operators only if proof passes — or refunds the submitter if it doesn't.

Built on **ShardTrace** — a verifiable sharded inference engine running inside EigenCompute TEE.

## Live Deployments

**Coordinator (EigenCompute TEE, Sepolia)**
Verify: https://verify-sepolia.eigencloud.xyz/app/0xfd35d56978B8511611d16DE635Fd079AB7aB3A64
Application ID: `0xfd35d56978b8511611d16de635fd079ab7ab3a64`

**ProofPayEscrow contract (Sepolia)**
Address: [`0x29c70d2F30C5314932A927b62EB8c4A68F13b41C`](https://sepolia.etherscan.io/address/0x29c70d2F30C5314932A927b62EB8c4A68F13b41C)

## The Trust Problem

If you outsource inference to third parties, you want confidence that:

* the input was sharded as claimed,
* each shard was processed deterministically,
* operators can't silently swap outputs,
* recomposition followed an agreed rule,
* payment is only released when execution is verified.

ProofPay produces a **proof bundle** (JSON) containing the manifest, shard hashes, operator attestations, output hashes, and the final recomposed output hash — and settles payment on-chain based on that proof.

## On-Chain Settlement Flow

```
Client                 Coordinator (TEE)          ProofPayEscrow (Sepolia)
  |                          |                              |
  |-- POST /run-job -------->|                              |
  |                          |-- submitJob(jobId, ops) ---->|  escrow ETH
  |                          |                              |
  |                          |  [dispatch → operators]      |
  |                          |  [collect results]           |
  |                          |  [verify hashes + sigs]      |
  |                          |  [write proof bundle]        |
  |                          |                              |
  |                          |  verified=true:              |
  |                          |-- settleJob(jobId, true) --->|  pay operators
  |                          |                              |
  |                          |  verified=false:             |
  |                          |-- settleJob(jobId, false) -->|  refund submitter
  |<-- proof + txHash -------|                              |
```

`settleJob` is restricted to the coordinator address — only the TEE-attested coordinator can trigger settlement. Operators receive equal shares of the escrowed ETH; dust goes to the first operator.

## How the Prototype Works

1. Web UI submits `documents[]` to the coordinator (`POST /run-job`).
2. Coordinator splits into **3 shards** (`shard-1..3`), creates a **JobManifest**, and calls `submitJob` on the escrow contract.
3. Coordinator dispatches **ShardTask** messages to 3 simulated operators (`POST /task`).
4. Each operator runs deterministic inference and returns:
   * `output`
   * `outputHash`
   * `signature` (HMAC over `{jobId, shardId, operatorId, outputHash}`)
5. Coordinator verifies hashes and signatures, recomposes outputs in manifest order, computes `finalOutputHash`, and stores a **ProofBundle** under `data/proofs/{jobId}.json`.
6. Coordinator calls `settleJob(jobId, verified)` — payment is released or refunded on-chain.

### Redundant Execution

Shard-2 is sent to both operator-2 and operator-3. If output hashes mismatch, a dispute object is recorded in the proof bundle — simulating Byzantine fault detection.

## Why This Is EigenCloud-Native

The code explicitly mirrors the EigenLayer AVS execution pattern:

* **consumer/client** submits work (web UI)
* **operators** perform off-chain tasks (3 local operator services)
* **service/coordinator** verifies and accepts work (coordinator service + proof bundle)

The coordinator runs in EigenCompute TEE on Sepolia — producing real hardware attestation that verification and proof generation logic runs in a tamper-proof environment. The `settleJob` call can only come from the coordinator's attested address, so the escrow is as trustworthy as the TEE attestation.

In production, operators would belong to an **Operator Set**, stake allocation would back correctness and liveness, and incorrect behavior would be slashable. This prototype simulates those concepts at the interface and flow level.

See:

* `docs/avs-mapping.md`
* `docs/architecture.md`

## What ProofPay Proves Today

* **Pipeline integrity** — the workflow happened consistently and outputs weren't tampered with
* **Operator consistency** — every operator signed their output and hashes match
* **Recomposition validity** — outputs were combined according to the agreed rule
* **Tamper-proof verification** — coordinator runs in EigenCompute TEE proving receipt generation wasn't manipulated
* **On-chain settlement** — ETH is escrowed at job submission and released/refunded based on cryptographic proof

## What ProofPay Does Not Prove Yet

* Model identity — which specific model binary ran
* Semantic correctness — that the correct model was used, not just a consistent one

That's the honest limitation and the roadmap — binding proof bundles to model hash, container hash, and input commitment. EigenCompute TEE is the foundation that makes that next step possible.

## Competitive Context

Inference Labs raised $6.3M to prove AI inference with ZK proofs — mathematically strongest but computationally prohibitive for production-scale models today. ProofPay uses EigenCompute TEE — works with any model at production scale right now, no distillation required, with payment enforcement on top. Different trust assumptions. Complementary approaches to the same problem.

## Repo Structure
```
apps/
  web/           Next.js UI + API proxy routes
  coordinator/   Fastify service (manifest, dispatch, verify, recomposition, proof write, on-chain settlement)
services/
  operator-1/    Fastify operator service
  operator-2/
  operator-3/
packages/
  shared/        Types, Zod schemas, hashing/signing helpers
  shard-engine/  Sharding + manifest creation
  inference-engine/  Deterministic embedding
  proof-engine/  Proof bundle builder + verification helpers
contracts/
  contracts/ProofPayEscrow.sol   Escrow + settlement contract (deployed to Sepolia)
  scripts/deploy.ts              Hardhat deploy script
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

Fill in Sepolia credentials to enable on-chain settlement (optional — omitting them runs in off-chain-only mode):

```
SEPOLIA_RPC_URL=...
COORDINATOR_PRIVATE_KEY=...
PROOFPAY_CONTRACT_ADDRESS=0x29c70d2F30C5314932A927b62EB8c4A68F13b41C
OPERATOR_1_WALLET=...
OPERATOR_2_WALLET=...
OPERATOR_3_WALLET=...
```

### Run
```
pnpm dev
```

Open `http://localhost:3000`.

## Deploy Contract

```
cd contracts
pnpm deploy:sepolia
```

## Demo

Follow `docs/demo-flow.md`.

## Production Roadmap

* ✅ On-chain escrow and settlement (ProofPayEscrow on Sepolia)
* ✅ TEE-attested coordinator via EigenCompute
* Bind proof bundles to model hash and container hash for semantic verification
* Operator Set membership and stake allocation
* Slashable correctness and liveness enforcement
* Real model inference via EigenAI
* Stronger signature scheme (public-key not HMAC)
* Client-side wallet integration for submitter-funded escrow

## Architecture Diagram
<img width="757" height="742" alt="image" src="https://github.com/user-attachments/assets/dd2bed57-77c5-466e-a91f-89aa4e4a7d01" />
