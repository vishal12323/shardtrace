import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ProofPayEscrow with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const ProofPayEscrow = await ethers.getContractFactory("ProofPayEscrow");
  // The deployer wallet is also the coordinator — set COORDINATOR_PRIVATE_KEY accordingly
  const contract = await ProofPayEscrow.deploy(deployer.address);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ProofPayEscrow deployed to:", address);
  console.log("\nAdd to your .env:");
  console.log(`PROOFPAY_CONTRACT_ADDRESS=${address}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
