## AVS mapping (EigenLayer / EigenCloud “Hello World” pattern)

This prototype mirrors the documented AVS execution pattern:

- **Consumer/client submits work**: the Next.js web UI calls the coordinator with a job request.
- **Operators perform off-chain work**: each operator service runs deterministic inference over its shard.
- **Service/coordinator verifies and accepts work**: the coordinator verifies shard hashes, output hashes, operator attestations, and recomposition before writing a proof bundle.

### Prototype → AVS concepts

- **Consumer**: AVS consumer requesting work (job submission).
- **Operators**: EigenLayer operators performing off-chain tasks (here: local services).
- **Coordinator/service logic**: AVS business logic / verification logic (manifest creation, dispatch, verification, recomposition, proof bundle).

### What’s simulated (not implemented)

In production AVSs:

- Operators would be part of an **Operator Set**.
- **Allocated stake** would back correctness and liveness guarantees.
- **Slashing / redistribution** would be possible for incorrect execution, equivocation, or non-response.

This POC does **not** include on-chain contracts, stake allocation, or slashing. It focuses on the “request → off-chain execution → verification → acceptance” pipeline and produces a portable proof bundle demonstrating the pattern.

References:

- EigenCloud developer quickstart: `https://docs.eigencloud.xyz/eigenlayer/developers/howto/get-started-without-devkit/quickstart`
- EigenLayer core concepts: `https://docs.eigenlayer.xyz/developers/Concepts/eigenlayer-contracts/core-contracts`

