import { ethers } from "ethers";

// Minimal ABI — only the functions the coordinator needs to call
const ABI = [
  "function submitJob(string calldata jobId, address[] calldata operators) external payable",
  "function settleJob(string calldata jobId, bool verified) external",
  "function getJob(string calldata jobId) external view returns (address submitter, uint256 amount, address[] memory operators, bool settled)"
] as const;

function getContract(): ethers.Contract | null {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.COORDINATOR_PRIVATE_KEY;
  const contractAddress = process.env.PROOFPAY_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) return null;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(contractAddress, ABI, signer);
}

/** Escrow ETH for a job. Called at job submission time.
 *  Amount defaults to PROOFPAY_JOB_VALUE_ETH env var, or 0.001 ETH. */
export async function submitJobOnChain(
  jobId: string,
  operatorWallets: string[]
): Promise<string | null> {
  const contract = getContract();
  if (!contract) return null;

  const valueEth = process.env.PROOFPAY_JOB_VALUE_ETH ?? "0.001";
  const valueWei = ethers.parseEther(valueEth);

  const tx = await contract.submitJob(jobId, operatorWallets, { value: valueWei });
  const receipt = await (tx as ethers.TransactionResponse).wait();
  console.log(`[ProofPay] submitJob tx: ${receipt?.hash}`);
  return receipt?.hash ?? null;
}

/** Release escrowed ETH based on verification result. Called after proof is written. */
export async function settleJobOnChain(
  jobId: string,
  verified: boolean
): Promise<string | null> {
  const contract = getContract();
  if (!contract) return null;

  const tx = await contract.settleJob(jobId, verified);
  const receipt = await (tx as ethers.TransactionResponse).wait();
  console.log(`[ProofPay] settleJob tx: ${receipt?.hash} (verified=${verified})`);
  return receipt?.hash ?? null;
}
