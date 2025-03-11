"use client";

import { useEffect, useState } from "react";
import { AdvancedRealTimeChart, TickerTape } from "react-ts-tradingview-widgets";
import PerpetualTrading from "~~/components/pages/PerpTrading";

const TradingPage = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <TickerTape
          symbols={[
            { proName: "BITSTAMP:BTCUSD", title: "BTC/USD" },
            { proName: "BITSTAMP:ETHUSD", title: "ETH/USD" },
          ]}
          showSymbolLogo={true}
          colorTheme="dark"
          isTransparent={true}
          displayMode="adaptive"
          copyrightStyles={{
            parent: { display: "none" },
            link: { display: "none" },
            span: { display: "none" },
          }}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-4 rounded shadow-lg md:col-span-2 h-[600px]">
          <AdvancedRealTimeChart
            copyrightStyles={{
              parent: { display: "none" },
              link: { display: "none" },
              span: { display: "none" },
            }}
            allow_symbol_change={false}
            autosize
            enable_publishing={false}
            interval="180"
            style="1"
            symbol={"BITSTAMP:BTCUSD"}
            withdateranges={true}
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
