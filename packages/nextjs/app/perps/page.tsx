"use client";

import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import CrossbarTradingView from "~~/components/TradingView";
import PerpetualTrading from "~~/components/pages/PerpTrading";

const TradingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Trading Dashboard</h1>
      <div className="bg-gray-800 p-4 rounded shadow-lg">
        <AdvancedRealTimeChart
          allow_symbol_change={false}
          autosize
          enable_publishing={false}
          interval="180"
          style="1"
          symbol={"PYTH:BTCUSD"}
          withdateranges={true}
          theme={"dark"}
        />
      </div>
      {/* <div className="bg-gray-800 p-4 rounded shadow-lg">
          <PerpetualTrading />
        </div> */}
    </div>
  );
};

export default TradingPage;
