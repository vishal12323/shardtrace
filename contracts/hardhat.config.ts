import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL ?? "";
const COORDINATOR_PRIVATE_KEY = process.env.COORDINATOR_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: COORDINATOR_PRIVATE_KEY ? [COORDINATOR_PRIVATE_KEY] : []
    }
  }
};

export default config;
