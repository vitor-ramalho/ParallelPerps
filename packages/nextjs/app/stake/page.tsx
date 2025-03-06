"use client";

import { useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { useScaffoldReadContract, useScaffoldWriteContract, useWatchBalance } from "~~/hooks/scaffold-eth";

const StakingPage = () => {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [isStaking, setIsStaking] = useState(true);

  const { data: balance } = useWatchBalance({
    address,
  });

  // Contract reads
  const { data: stakedBalance } = useScaffoldReadContract({
    contractName: "MonStaking",
    functionName: "stakedBalances",
    args: [address],
    watch: true,
  });

  const { data: hasMonBalance } = useScaffoldReadContract({
    contractName: "MonStaking",
    functionName: "getHasMonBalance",
    args: [address],
    watch: true,
  });

  const { data: totalStaked } = useScaffoldReadContract({
    contractName: "MonStaking",
    functionName: "totalStaked",
    watch: true,
  });

  // Contract writes
  const { writeContractAsync: stakeContract } = useScaffoldWriteContract({
    contractName: "MonStaking",
  });

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;
  const formattedStakedBalance = stakedBalance ? Number(formatEther(stakedBalance)) : 0;

  const handlePercentageClick = (percentage: number) => {
    if (isStaking) {
      setAmount(((formattedBalance * percentage) / 100).toFixed(3).toString());
    } else {
      // Handle unstaking percentage of staked balance
      setAmount(((formattedStakedBalance * percentage) / 100).toFixed(3).toString());
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 gradient-box">
      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* TVL Card */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium text-base-content/60">TVL</h3>
          <p className="text-3xl font-bold my-2">{formatEther(totalStaked || 0n)} MON</p>
          <p className="text-sm text-base-content/60">Total MON in staking</p>
        </Card>

        {/* APY Card */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium text-base-content/60">Current APY</h3>
          <p className="text-3xl font-bold my-2">12%</p>
          <p className="text-sm text-base-content/60">Estimated APY</p>
        </Card>

        {/* Exchange Ratio Card */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h3 className="text-lg font-medium text-base-content/60">Exchange Ratio</h3>
          <p className="text-3xl font-bold my-2">1:1</p>
          <p className="text-sm text-base-content/60">MON : hasMON</p>
        </Card>
      </div>

      {/* Stake/Unstake Card */}
      <Card className="p-6 max-w-lg mx-auto">
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setIsStaking(true)} className={`flex-1 ${isStaking ? "btn-primary" : "btn-ghost"}`}>
            Stake
          </Button>
          <Button onClick={() => setIsStaking(false)} className={`flex-1 ${!isStaking ? "btn-primary" : "btn-ghost"}`}>
            Unstake
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Amount to {isStaking ? "Stake" : "Unstake"}</label>
            <Input
              type="number"
              placeholder="0.0"
              min={0}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              showPercentages={true}
              onPercentageClick={handlePercentageClick}
              className="w-full"
            />
          </div>
          <Button
            onClick={async () => {
              if (isStaking) {
                await stakeContract({
                  functionName: "stake",
                  value: parseEther(amount || "0"),
                });
              } else {
                await stakeContract({
                  functionName: "unstake",
                  args: [parseEther(amount || "0")],
                });
              }
            }}
            disabled={!isConnected || !amount}
            className="w-full btn-primary"
          >
            {isStaking ? "Stake MON" : "Unstake MON"}
          </Button>

          <div className="mt-4 text-sm space-y-1">
            <p>Staked Balance: {formatEther(stakedBalance || 0n)} MON</p>
            <p>HasMON Balance: {formatEther(hasMonBalance || 0n)} hasMON</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StakingPage;
