import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const recipientAddress = "0x989d0faccf313a0d78b0d7fcb0216075eded94e7";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. Deploy MonStaking contract
  const monStaking = await deploy("MonStaking", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("MonStaking deployed to:", monStaking.address);

  // 2. Get HasMon token address from MonStaking
  const monStakingContract = await hre.ethers.getContractAt("MonStaking", monStaking.address);
  const hasMonTokenAddress = await monStakingContract.hasMonToken();
  console.log("HasMon token address:", hasMonTokenAddress);

  // 3. Deploy HasMonCollateral with HasMon token address
  const hasMonCollateral = await deploy("HasMonCollateral", {
    from: deployer,
    args: [hasMonTokenAddress, recipientAddress],
    log: true,
    autoMine: true,
  });
  console.log("HasMonCollateral deployed to:", hasMonCollateral.address);

  // 4. Deploy PerpEngine with all required addresses
  const perpEngine = await deploy("PerpEngine", {
    from: deployer,
    args: [
      hasMonCollateral.address, // hasMonCollateral address
      hasMonTokenAddress, // hasMon token address
      recipientAddress, // fee recipient
      hre.ethers.parseEther("0.1"), // minMargin - 0.1 MON
      500, // protocolFeeShare - 5%
    ],
    log: true,
    autoMine: true,
  });
  console.log("PerpEngine deployed to:", perpEngine.address);

  // 5. Set up contract relationships
  const hasMonCollateralContract = await hre.ethers.getContractAt("HasMonCollateral", hasMonCollateral.address);
  await hasMonCollateralContract.setPerpEngine(perpEngine.address);
  console.log("Set PerpEngine in HasMonCollateral");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("MonStaking:", monStaking.address);
  console.log("HasMon Token:", hasMonTokenAddress);
  console.log("HasMonCollateral:", hasMonCollateral.address);
  console.log("PerpEngine:", perpEngine.address);
};

export default deployContracts;

deployContracts.tags = ["Contracts"];
