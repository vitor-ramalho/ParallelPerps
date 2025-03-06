"use client";

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import PerpetualTrading from "~~/components/pages/PerpTrading";

const TradingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded shadow-lg md:col-span-2 h-[600px]">
          <AdvancedRealTimeChart
            allow_symbol_change={false}
            autosize
            enable_publishing={false}
            interval="180"
            style="1"
            symbol={"PYTH:BTCUSD"}
            withdateranges={true}
            copyrightStyles={{ display: "none" }}
            theme={"dark"}
          />
        </div>
        <div className="bg-gray-800 p-4 rounded shadow-lg md:col-span-1 h-[600px]">
          <PerpetualTrading />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
