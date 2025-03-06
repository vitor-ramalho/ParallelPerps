import * as dotenv from "dotenv";
dotenv.config();
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { task } from "hardhat/config";
import generateTsAbis from "./scripts/generateTsAbis";

const chainId = Number(process.env.MONAD_CHAIN_ID) || 1;
const rpcUrl = process.env.MONAD_RPC_URL || "";
const deployerPrivateKey = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  defaultNetwork: "monadTestnet",
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    monadTestnet: {
      url: rpcUrl,
      accounts: [deployerPrivateKey],
      chainId: chainId,
      mining: {
        auto: true,
        interval: 1000,
        mempool: {
          order: "fifo",
        },
      },
    },
  },
  mocha: {
    timeout: 40000,
    parallel: true,
  },
  sourcify: {
    enabled: false,
  },
};

// Extend the deploy task
task("deploy").setAction(async (args, hre, runSuper) => {
  await runSuper(args);
  await generateTsAbis(hre);
});

export default config;
