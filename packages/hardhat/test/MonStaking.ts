import { ethers, network } from "hardhat";
import { expect } from "chai";
import { MonStaking, HasMon } from "../typechain-types";
import { Signer } from "ethers";

describe("MonStaking", function () {
  let monStaking: MonStaking;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let hasMonToken: HasMon;
  let signers: Signer[];
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let ownerAddress: string;
  let user1Address: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let user2Address: string;

  beforeEach(async function () {
    // Get signers and addresses
    signers = await ethers.getSigners();
    [owner, user1, user2] = signers;

    ownerAddress = await owner.getAddress();
    user1Address = await user1.getAddress();
    user2Address = await user2.getAddress();

    // Deploy contracts
    const MonStaking = await ethers.getContractFactory("MonStaking");
    monStaking = (await MonStaking.deploy()) as MonStaking;
    await monStaking.waitForDeployment();

    const hasMonAddress = await monStaking.hasMonToken();
    hasMonToken = (await ethers.getContractAt("HasMon", hasMonAddress)) as HasMon;
  });
  describe("Unstaking", function () {
    beforeEach(async function () {
      await monStaking.connect(user1).stake({ value: ethers.parseEther("1.0") });
    });

    it("should correctly unstake tokens", async function () {
      const unstakeAmount = ethers.parseEther("0.5");

      await monStaking.connect(user1).unstake(unstakeAmount);
      expect(await monStaking.stakedBalances(user1Address)).to.equal(ethers.parseEther("0.5"));
    });

    it("should fail when unstaking more than staked", async function () {
      await expect(monStaking.connect(user1).unstake(ethers.parseEther("2.0"))).to.be.revertedWith(
        "Insufficient balance",
      );
    });

    it("should fail when contract has insufficient balance", async function () {
      // Simulate contract balance drain
      await network.provider.send("hardhat_setBalance", [await monStaking.getAddress(), "0x0"]);

      await expect(monStaking.connect(user1).unstake(ethers.parseEther("1.0"))).to.be.revertedWith(
        "Insufficient contract balance",
      );
    });

    it("should emit Unstaked event", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(monStaking.connect(user1).unstake(amount))
        .to.emit(monStaking, "Unstaked")
        .withArgs(user1Address, amount);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency unstake", async function () {
      const stakeAmount = ethers.parseEther("1");
      await monStaking.connect(user1).stake({ value: stakeAmount });

      await expect(monStaking.connect(user1).emergencyUnstake())
        .to.emit(monStaking, "EmergencyUnstake")
        .withArgs(user1Address, stakeAmount);
    });
  });
});
