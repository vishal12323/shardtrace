## ProofPay architecture

ProofPay adds on-chain payment settlement to the ShardTrace verifiable inference engine. The coordinator escrows ETH at job submission and releases it — to operators on proof success, or back to the submitter on failure — after cryptographic verification inside a TEE.

### Deployed contracts

| Component | Address | Network |
|---|---|---|
| ProofPayEscrow | `0x29c70d2F30C5314932A927b62EB8c4A68F13b41C` | Sepolia |
| Coordinator (EigenCompute TEE) | `0xfd35d56978b8511611d16de635fd079ab7ab3a64` | Sepolia |

---

## ShardTrace foundation

ShardTrace is the verifiable distributed inference layer ProofPay builds on.

### Actors

- **Consumer (web client)**: submits a small batch of documents and requests work.
- **Coordinator (service)**: splits work into shards, dispatches tasks to operators, verifies responses, recomposes outputs, produces a proof bundle, and triggers on-chain settlement.
- **Operators (simulated services)**: perform deterministic off-chain inference on assigned shard data and return attestations.
- **ProofPayEscrow (contract)**: holds escrowed ETH and releases it based on the coordinator's settlement call.

### Full job flow

1. The **consumer** sends `documents[]` to the **coordinator** (`POST /run-job`).
2. The **coordinator**:
   - creates exactly 3 shards (`shard-1..3`) from the document list,
   - computes a hash for each shard,
   - creates a **JobManifest** containing shard IDs + shard hashes and the recomposition rule (`concat`),
   - calls `submitJob(jobId, operatorWallets)` on **ProofPayEscrow**, locking ETH in escrow.
3. The **coordinator** sends each **ShardTask** to an **operator** (`POST /task`).
4. Each **operator**:
   - runs deterministic embedding on its shard documents,
   - returns `output`, `outputHash`, and an HMAC-style `signature` over `{jobId, shardId, operatorId, outputHash}`.
5. The **coordinator** verifies:
   - shard IDs exist in the manifest,
   - shard hashes match the manifest,
   - output hashes match returned outputs,
   - signatures match the operator's configured key,
   - all required shard results are present,
   - recomposition is consistent with the manifest rule.
6. The **coordinator** recomposes shard outputs (manifest order) and computes `finalOutputHash`.
7. The **coordinator** writes a **ProofBundle** JSON to `data/proofs/{jobId}.json`.
8. The **coordinator** calls `settleJob(jobId, verified)` on **ProofPayEscrow**:
   - `verified=true` → ETH split equally among operator wallets.
   - `verified=false` → ETH refunded to the submitter.

### On-chain settlement detail

```
ProofPayEscrow.submitJob(jobId, operators[])   payable  — called at job start
ProofPayEscrow.settleJob(jobId, bool verified) external — onlyCoordinator
```

`settleJob` is restricted to the coordinator address. Since the coordinator runs in EigenCompute TEE, settlement authority is backed by hardware attestation — only the attested coordinator binary can release funds.

Operator shares are equal (`amount / n`); integer remainder goes to the first operator.

### What is "verifiable" here?

The proof bundle makes execution **auditable**:

- the manifest binds shards and shard hashes,
- each operator result binds its output via `outputHash`,
- each operator attests via `signature`,
- the coordinator's recomposition is checkable and hashed,
- on-chain settlement is gated on that verification result.

This prototype demonstrates **verifiable distributed execution with payment enforcement**. Operators only see their shard (reduced full-dataset exposure), and they only get paid when proof passes.

### Redundant execution

Shard-2 is dispatched to both operator-2 and operator-3. If their `outputHash` values differ, a `dispute` object is recorded in the proof bundle — simulating Byzantine fault detection. In production this would trigger slashing.

### Trust hierarchy

```
Hardware attestation (EigenCompute TEE)
  └── Coordinator verification logic is tamper-proof
        └── ProofBundle is a trustworthy receipt
              └── settleJob is gated on that receipt
                    └── Operators get paid iff execution was correct
```
