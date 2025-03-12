import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

type NetworkType = "monad" | "monad_testnet";

const SWITCHBOARD_ADDRESSES: Record<NetworkType, string> = {
  monad: "0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C",
  monad_testnet: "0x33A5066f65f66161bEb3f827A3e40fce7d7A2e6C", // Change if testnet address differs
};

const MARKET_CONFIGS = {
  "BTC-USD": {
    aggregatorId: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", // Switchboard aggregator id
    maxLeverage: 100, // 100x
    liquidationThreshold: 500, // 5%
    fee: 10, // 0.1%
    fundingInterval: 3600, // 1 hour
    maxFundingRate: 100, // 1%
    maxPositionSize: ethers.parseEther("10"),
    maxOpenInterest: ethers.parseEther("100"),
    minInitialMargin: ethers.parseEther("100"),
  },
  "ETH-USD": {
    aggregatorId: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Switchboard aggregator id
    maxLeverage: 100,
    liquidationThreshold: 500,
    fee: 10,
    fundingInterval: 3600,
    maxFundingRate: 100,
    maxPositionSize: ethers.parseEther("100"),
    maxOpenInterest: ethers.parseEther("1000"),
    minInitialMargin: ethers.parseEther("50"),
  },
};

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. Optionally deploy MonStaking contract if required by your system.
  const monStaking = await deploy("MonStaking", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("MonStaking deployed to:", monStaking.address);

  // 2. Deploy PerpEngine without HasMonCollateral dependency.
  const perpEngine = await deploy("PerpEngine", {
    from: deployer,
    args: [
      deployer, // fee recipient
      hre.ethers.parseEther("0.1"), // minMargin - 0.1 ETH
      500, // protocolFeeShare - 5%
    ],
    log: true,
    autoMine: true,
  });
  console.log("PerpEngine deployed to:", perpEngine.address);

  const perpEngineContract = await hre.ethers.getContractAt("PerpEngine", perpEngine.address);

  console.log("\nSetting up markets...");
  for (const [symbol, config] of Object.entries(MARKET_CONFIGS)) {
    try {
      console.log(`\nAdding market ${symbol}...`);
      const tx = await perpEngineContract.addMarket(
        symbol,
        config.aggregatorId,
        config.maxLeverage,
        config.liquidationThreshold,
        config.fee,
        config.fundingInterval,
        config.maxFundingRate,
        config.maxPositionSize,
        config.maxOpenInterest,
        config.minInitialMargin,
      );
      await tx.wait();
      console.log(`✅ MarketId`, tx);
      console.log(`✅ Market ${symbol} added successfully`);
    } catch (error) {
      console.error(`❌ Failed to add market ${symbol}:`, error);
    }
  }

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("MonStaking:", monStaking.address);
  console.log("PerpEngine:", perpEngine.address);
  console.log("Switchboard Oracle (global fallback):", SWITCHBOARD_ADDRESSES["monad"]);
  console.log("Markets Initialized:", Object.keys(MARKET_CONFIGS).length);
};

export default deployContracts;
deployContracts.tags = ["Contracts"];
