// import { DeployFunction } from "hardhat-deploy/types";
// import { HardhatRuntimeEnvironment } from "hardhat/types";
// import { ethers } from "hardhat";

// const MARKET_CONFIGS = {
//   "BTC-USD": {
//     baseToken: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c", // Example base token address
//     maxLeverage: 100, // 100x
//     maintenanceMargin: 500, // 5%
//     liquidationFee: 10, // 0.1%
//     fundingRateMultiplier: 100, // 1%
//   },
//   "ETH-USD": {
//     baseToken: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", // Example base token address
//     maxLeverage: 100,
//     maintenanceMargin: 500,
//     liquidationFee: 10,
//     fundingRateMultiplier: 100,
//   },
// };

// const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
//   const { deployer } = await hre.getNamedAccounts();
//   const { deploy } = hre.deployments;

//   // Deploy the PerpetualTrading contract
//   const perpetualTrading = await deploy("PerpetualTrading", {
//     from: deployer,
//     args: [],
//     log: true,
//     autoMine: true,
//   });
//   console.log("PerpetualTrading deployed to:", perpetualTrading.address);

//   const perpetualTradingContract = await hre.ethers.getContractAt("PerpetualTrading", perpetualTrading.address);

//   console.log("\nSetting up markets...");
//   for (const [symbol, config] of Object.entries(MARKET_CONFIGS)) {
//     try {
//       console.log(`\nCreating market ${symbol}...`);
//       const tx = await perpetualTradingContract.createMarket(
//         ethers.encodeBytes32String(symbol),
//         config.baseToken,
//         config.maxLeverage,
//         config.maintenanceMargin,
//         config.liquidationFee,
//         config.fundingRateMultiplier,
//       );
//       await tx.wait();
//       console.log(`✅ Market ${symbol} created successfully`);
//       const marketID = ethers.encodeBytes32String(symbol);ß
//       console.log(`Market ID: ${marketID}`);
//     } catch (error) {
//       console.error(`❌ Failed to create market ${symbol}:`, error);
//     }
//   }
// };ß
// export default deployContracts;
// deployContracts.tags = ["PerpetualTrading"];

import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const monStaking = await deploy("MonStaking", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });


  const monStakingContract = await hre.ethers.getContractAt("MonStaking", monStaking.address);
  const hasMonTokenAddress = await monStakingContract.hasMonToken();
  console.log("HasMon token address:", hasMonTokenAddress);

  const hasMonCollateral = await deploy("HasMonCollateral", {
    from: deployer,
    args: [hasMonTokenAddress],
    log: true,
    autoMine: true,
  });

  console.log("HasMONCollateral deployed to:", hasMonCollateral.address);

  const perpEngine = await deploy("PerpEngine", {
    from: deployer,
    args: [hasMonCollateral.address],
    log: true,
    autoMine: true,
  });
  console.log("PerpEngine deployed to:", perpEngine.address);

  const hasMonCollateralContract = await hre.ethers.getContractAt("HasMonCollateral", hasMonCollateral.address);

  const tx = await hasMonCollateralContract.setPerpEngine(perpEngine.address);
  await tx.wait();
  console.log("PerpEngine address set in HasMONCollateral");
};

export default deployContracts;
deployContracts.tags = ["PerpetualTrading"];
