"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const PerpetualTrading = () => {
  const [activeTab, setActiveTab] = useState("market");
  const [contract] = useState(null);
  const [collateralAmount, setCollateralAmount] = useState<number>();
  const [marketId, setMarketId] = useState("");
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState("");
  const [isLong, setIsLong] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [positions] = useState([]);
  const [collateralBalance] = useState(0);
  const [price, setPrice] = useState("");

  const { address } = useAccount();

  const { writeContractAsync: collateralContract } = useScaffoldWriteContract({
    contractName: "HasMonCollateral",
  });

  const { data: hasMonBalance } = useScaffoldReadContract({
    contractName: "MonStaking",
    functionName: "getHasMonBalance",
    args: [address],
    watch: true,
  });

  const depositCollateral = async () => {
    if (!collateralContract) return;

    try {
      alert("Collateral deposited");
    } catch (error) {
      console.error("Error depositing collateral:", error);
    }
  };

  const openPosition = async () => {
    if (!contract) return;

    alert("Position opened");
  };

  const closePosition = async () => {
    if (!contract) return;

    alert("Position closed");
  };

  const withdrawCollateral = async () => {
    if (!contract) return;

    alert("Collateral withdrawn");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 border-b border-gray-700">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "market" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("market")}
          >
            Collateral
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "openclose" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("openclose")}
          >
            Open/Close Position
          </button>
          <button
            className={`px-4 py-2 font-semibold ${activeTab === "withdraw" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400"}`}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {activeTab === "market" && (
          <div className="bg-gray-800 p-4 rounded shadow-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Collateral Amount</label>
              <input
                type="text"
                value={collateralAmount}
                onChange={e => setCollateralAmount(Number(e.target.value))}
                className="input input-bordered w-full"
              />
              <button onClick={() => depositCollateral()} className="btn btn-primary mt-2">
                Deposit Collateral
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Collateral Balance</label>
              <input type="text" value={collateralBalance} readOnly className="input input-bordered w-full" />
            </div>
            <div className="mb-4">
              <p>HasMON Balance: {formatEther(hasMonBalance || 0n)} hasMON</p>
            </div>
          </div>
        )}
        {activeTab === "openclose" && (
          <div className="bg-gray-800 p-4 rounded shadow-lg">
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
                value={String(isLong)}
                onChange={e => setIsLong(e.target.value === "true")}
                className="select select-bordered w-full"
              >
                <option value="true">Long</option>
                <option value="false">Short</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Price</label>
              <input
                type="text"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="input input-bordered w-full"
              />
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
              <h2 className="text-lg font-bold mb-2">Open Positions</h2>
              {positions.map((position: any) => (
                <div key={position.id} className="mb-2">
                  <p>Market ID: {position.id}</p>
                  <p>Size: {position.size}</p>
                  <p>Margin: {position.margin}</p>
                  <p>Entry Price: {position.entryPrice}</p>
                  <p>Is Long: {position.isLong ? "Yes" : "No"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "withdraw" && (
          <div className="bg-gray-800 p-4 rounded shadow-lg">
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
        )}
      </div>
    </div>
  );
};

export default PerpetualTrading;
