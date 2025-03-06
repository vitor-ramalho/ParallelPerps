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
  console.log("MonStaking deployed to:", monStaking.address);
};

export default deployContracts;
deployContracts.tags = ["MonStaking"];
