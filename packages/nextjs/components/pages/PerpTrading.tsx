"use-client"

import { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";

const PerpetualTrading = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [marketId, setMarketId] = useState("");
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState("");
  const [isLong, setIsLong] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const contractAddress = "0xDaF57A903ff4157D7c139F422bdb0b40f1f473a4"; // Replace with your contract address
  const abi = [
    // Add the ABI of the PerpetualTrading contract here
  ];

  const depositCollateral = async () => {
    if (!contract) return;

    const tx = await contract.depositCollateral(ethers.utils.parseUnits(collateralAmount, 18));
    await tx.wait();
    alert("Collateral deposited");
  };

  const openPosition = async () => {
    if (!contract) return;

    const tx = await contract.openPosition(
      ethers.utils.formatBytes32String(marketId),
      ethers.utils.parseUnits(margin, 18),
      leverage,
      isLong,
    );
    await tx.wait();
    alert("Position opened");
  };

  const closePosition = async () => {
    if (!contract) return;

    const tx = await contract.closePosition(ethers.utils.formatBytes32String(marketId));
    await tx.wait();
    alert("Position closed");
  };

  const withdrawCollateral = async () => {
    if (!contract) return;

    const tx = await contract.withdrawCollateral(ethers.utils.parseUnits(withdrawAmount, 18));
    await tx.wait();
    alert("Collateral withdrawn");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Perpetual Trading</h1>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">User Address</label>
        <input type="text" value={userAddress} readOnly className="input input-bordered w-full" />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Collateral Amount</label>
        <input
          type="text"
          value={collateralAmount}
          onChange={e => setCollateralAmount(e.target.value)}
          className="input input-bordered w-full"
        />
        <button onClick={depositCollateral} className="btn btn-primary mt-2">
          Deposit Collateral
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Market ID</label>
        <input
          type="text"
          value={marketId}
          onChange={e => setMarketId(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Margin</label>
        <input
          type="text"
          value={margin}
          onChange={e => setMargin(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Leverage</label>
        <input
          type="text"
          value={leverage}
          onChange={e => setLeverage(e.target.value)}
          className="input input-bordered w-full"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Position Type</label>
        <select
          value={isLong}
          onChange={e => setIsLong(e.target.value === "true")}
          className="select select-bordered w-full"
        >
          <option value="true">Long</option>
          <option value="false">Short</option>
        </select>
        <button onClick={openPosition} className="btn btn-primary mt-2">
          Open Position
        </button>
      </div>
      <div className="mb-4">
        <button onClick={closePosition} className="btn btn-primary">
          Close Position
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Withdraw Amount</label>
        <input
          type="text"
          value={withdrawAmount}
          onChange={e => setWithdrawAmount(e.target.value)}
          className="input input-bordered w-full"
        />
        <button onClick={withdrawCollateral} className="btn btn-primary mt-2">
          Withdraw Collateral
        </button>
      </div>
    </div>
  );
};

export default PerpetualTrading;
