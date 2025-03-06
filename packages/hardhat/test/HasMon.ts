import { ethers } from "hardhat";
import { expect } from "chai";
import { HasMon } from "../typechain-types";
import { Signer } from "ethers";

describe("HasMon", function () {
  let hasmon: HasMon;
  let owner: any;
  let stakingContract: Signer;
  let ownerAddress: string;

  beforeEach(async function () {
    [owner, stakingContract] = await ethers.getSigners();
    const stakingAddress = await stakingContract.getAddress();
    ownerAddress = await owner.getAddress;
    const HasMon = await ethers.getContractFactory("HasMon");
    hasmon = (await HasMon.deploy("Hashed Monad", "hasMON", stakingAddress)) as HasMon;
    await hasmon.waitForDeployment();
  });

  describe("Basic functionalities", function () {
    it("Should have correct initial state", async function () {
      expect(await hasmon.name()).to.equal("Hashed Monad");
      expect(await hasmon.symbol()).to.equal("hasMON");
      expect(await hasmon.stakingContract()).to.equal(ownerAddress);
    });

    it("Should handle minting and burning correctly", async function () {
      // Mint
      await expect(hasmon.mint(ownerAddress, ethers.parseEther("100")))
        .to.emit(hasmon, "Transfer")
        .withArgs(ethers.ZeroAddress, ownerAddress, ethers.parseEther("100"));

      expect(await hasmon.balanceOf(ownerAddress)).to.equal(ethers.parseEther("100"));

      // Burn
      await expect(hasmon.burn(ownerAddress, ethers.parseEther("50")))
        .to.emit(hasmon, "Transfer")
        .withArgs(ownerAddress, ethers.ZeroAddress, ethers.parseEther("50"));

      expect(await hasmon.balanceOf(ownerAddress)).to.equal(ethers.parseEther("50"));
    });
  });
});
