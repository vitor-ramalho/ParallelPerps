"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const ETH_USD = "0x4554482d55534400000000000000000000000000000000000000000000000000";
const BTC_USD = "0x4244432d55534400000000000000000000000000000000000000000000000000";

const MarketListPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: markets } = useScaffoldReadContract({
    contractName: "PerpetualTrading",
    functionName: "markets",
    args: [ETH_USD, BTC_USD],
    watch: true,
  });

  if (!markets) {
    return <div className="container mx-auto p-4">Loading markets...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-error">{error}</div>;
  }

  console.log("markets", markets);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Select a Market</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets?.map(market => (
          <Link key={market.id} href={`/perps/${market.id}`}>
            <div className="card bg-base-200 shadow-lg cursor-pointer hover:bg-base-300">
              <div className="card-body">
                <h2 className="card-title">{market.name}</h2>
                <p>{ethers.decodeBytes32String(market.marketId)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MarketListPage;
