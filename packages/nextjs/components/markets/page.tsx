"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

const MarketListPage = () => {
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  const { data: markets } = useScaffoldReadContract({
    contractName: "PerpetualTrading",
    functionName: "getAllMarkets",
    watch: true,
  });

  useEffect(() => {
    if (markets) {
      setLoading(false);
    }
  }, [markets]);

  if (loading) {
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
        {markets?.map((market: any, index: any) => (
          <Link key={index} href={`/perps/${market.marketId}`}>
            <div className="card bg-base-200 shadow-lg cursor-pointer hover:bg-base-300">
              <div className="card-body">
                <p>{market.baseToken}</p>
                <p>Max Leverage: {market.maxLeverage}</p>
                <p>Maintenance Margin: {market.maintenanceMargin}</p>
                <p>Liquidation Fee: {market.liquidationFee}</p>
                <p>Funding Rate Multiplier: {market.fundingRateMultiplier}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MarketListPage;
