import React, { useEffect, useState } from "react";
import { ChevronDown, Info, RefreshCw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Main component
const CrossbarTradingView = () => {
  const [timeframe, setTimeframe] = useState("1h");
  const [selectedToken, setSelectedToken] = useState("BTC/USD");
  const [chartType, setChartType] = useState("candlestick");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showIndicators, setShowIndicators] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState("MA");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);

  // Fetch data from Crossbar (simulated for this demo)
  useEffect(() => {
    setIsLoading(true);

    // Simulating API call to Crossbar
    const fetchCrossbarData = async () => {
      try {
        // In a real implementation, this would be:
        // const response = await fetch(`https://api.crossbar.switchboard.xyz/token/${selectedToken}/candles?timeframe=${timeframe}`);
        // const data = await response.json();

        // Simulation for demo purposes
        const mockData = generateMockData(selectedToken, timeframe);
        setTimeout(() => {
          setChartData(mockData);
          setTokenInfo({
            price: mockData[mockData.length - 1].close.toFixed(2),
            volume24h: "$324.5M",
            change24h: "+2.34%",
            high24h: "$43,250.00",
            low24h: "$41,890.50",
          });
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError("Failed to fetch data from Crossbar");
        setIsLoading(false);
      }
    };

    fetchCrossbarData();
  }, [selectedToken, timeframe]);

  // Mock data generator - would be replaced with actual Crossbar API calls
  const generateMockData = (token, tf) => {
    const data = [];
    const now = new Date();
    let price = token === "BTC/USD" ? 42500 : token === "ETH/USD" ? 2800 : 1.0;
    const volatility = token === "BTC/USD" ? 200 : token === "ETH/USD" ? 50 : 0.01;

    // Generate appropriate number of data points based on timeframe
    const dataPoints = tf === "1h" ? 24 : tf === "1d" ? 30 : 7;

    for (let i = dataPoints; i >= 0; i--) {
      const time = new Date(now);
      if (tf === "1h") time.setHours(time.getHours() - i);
      else if (tf === "1d") time.setDate(time.getDate() - i);
      else time.setDate(time.getDate() - i * 7);

      const open = price;
      const change = (Math.random() - 0.5) * volatility;
      price += change;
      const high = Math.max(open, price) + Math.random() * volatility * 0.3;
      const low = Math.min(open, price) - Math.random() * volatility * 0.3;
      const volume = Math.floor(Math.random() * 1000) + 500;

      data.push({
        time: time.toLocaleString(),
        timestamp: time.getTime(),
        open,
        close: price,
        high,
        low,
        volume,
        ma7: null,
        ma25: null,
      });
    }

    // Calculate moving averages
    for (let i = 0; i < data.length; i++) {
      if (i >= 7) {
        let sum = 0;
        for (let j = i - 6; j <= i; j++) {
          sum += data[j].close;
        }
        data[i].ma7 = sum / 7;
      }
      if (i >= 25) {
        let sum = 0;
        for (let j = i - 24; j <= i; j++) {
          sum += data[j].close;
        }
        data[i].ma25 = sum / 25;
      }
    }

    return data;
  };

  // Calculate indicators (moving averages, etc)
  const calculateIndicators = data => {
    // In a real implementation, this would calculate various technical indicators
    // Based on the raw price data
    return data;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded border border-gray-700 text-white text-sm">
          <p className="font-semibold">{label}</p>
          <p className="text-green-400">Open: ${payload[0]?.payload.open.toFixed(2)}</p>
          <p className="text-red-400">Close: ${payload[0]?.payload.close.toFixed(2)}</p>
          <p className="text-blue-400">High: ${payload[0]?.payload.high.toFixed(2)}</p>
          <p className="text-yellow-400">Low: ${payload[0]?.payload.low.toFixed(2)}</p>
          <p className="text-purple-400">Volume: {payload[0]?.payload.volume}</p>
          {payload[0]?.payload.ma7 && <p className="text-orange-400">MA7: ${payload[0]?.payload.ma7.toFixed(2)}</p>}
          {payload[0]?.payload.ma25 && <p className="text-indigo-400">MA25: ${payload[0]?.payload.ma25.toFixed(2)}</p>}
        </div>
      );
    }
    return null;
  };

  // Custom candle component
  const CandleStickChart = ({ data }) => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="time"
            scale="auto"
            tick={{ fill: "#aaa" }}
            tickFormatter={val => {
              const date = new Date(val);
              return timeframe === "1h"
                ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
                : `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#aaa" }}
            tickFormatter={val => `$${val.toFixed(timeframe === "1h" ? 0 : 2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Candlestick representation using composed elements */}
          {data.map((entry, index) => (
            <React.Fragment key={index}>
              {/* High-Low line */}
              <Line
                type="monotone"
                dataKey="high"
                stroke={entry.close > entry.open ? "#22c55e" : "#ef4444"}
                dot={false}
                activeDot={false}
                legendType="none"
              />
              {/* Open-Close rectangle */}
              <Bar
                dataKey="volume"
                fill={entry.close > entry.open ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                stroke="none"
                legendType="none"
              />
            </React.Fragment>
          ))}

          {/* Moving averages */}
          {showIndicators && (
            <>
              <Line type="monotone" dataKey="ma7" stroke="#f97316" dot={false} name="MA (7)" />
              <Line type="monotone" dataKey="ma25" stroke="#818cf8" dot={false} name="MA (25)" />
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Price chart (line)
  const PriceChart = ({ data }) => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" scale="auto" tick={{ fill: "#aaa" }} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "#aaa" }} tickFormatter={val => `$${val.toFixed(2)}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line type="monotone" dataKey="close" stroke="#4ade80" name="Price" activeDot={{ r: 8 }} />

          {/* Moving average indicators */}
          {showIndicators && (
            <>
              <Line type="monotone" dataKey="ma7" stroke="#f97316" dot={false} name="MA (7)" />
              <Line type="monotone" dataKey="ma25" stroke="#818cf8" dot={false} name="MA (25)" />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Volume chart
  const VolumeChart = ({ data }) => {
    return (
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" scale="auto" tick={{ fill: "#aaa" }} />
          <YAxis domain={["auto", "auto"]} tick={{ fill: "#aaa" }} />
          <Tooltip />
          <Bar dataKey="volume" fill="#9333ea" name="Volume" />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render function
  return (
    <div className="bg-base-200 text-base-content p-4 rounded shadow-lg w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <div className="relative">
            <button className="flex items-center bg-base-300 px-3 py-2 rounded hover:bg-base-100">
              {selectedToken} <ChevronDown className="ml-2 w-4 h-4" />
            </button>
            {/* Token dropdown would go here */}
          </div>

          {tokenInfo && (
            <div className="ml-4 flex space-x-4">
              <div>
                <span className="text-base-content text-sm">Price</span>
                <p className="font-bold">${tokenInfo.price}</p>
              </div>
              <div>
                <span className="text-base-content text-sm">24h</span>
                <p className={`font-bold ${tokenInfo.change24h.startsWith("+") ? "text-success" : "text-error"}`}>
                  {tokenInfo.change24h}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded ${chartType === "candlestick" ? "bg-primary" : "bg-base-300"}`}
            onClick={() => setChartType("candlestick")}
          >
            Candlestick
          </button>
          <button
            className={`px-3 py-1 rounded ${chartType === "line" ? "bg-primary" : "bg-base-300"}`}
            onClick={() => setChartType("line")}
          >
            Line
          </button>
          <button
            className={`px-3 py-1 rounded ${showIndicators ? "bg-primary" : "bg-base-300"}`}
            onClick={() => setShowIndicators(!showIndicators)}
          >
            Indicators
          </button>
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex space-x-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${timeframe === "1h" ? "bg-primary" : "bg-base-300"}`}
          onClick={() => setTimeframe("1h")}
        >
          1H
        </button>
        <button
          className={`px-3 py-1 rounded ${timeframe === "1d" ? "bg-primary" : "bg-base-300"}`}
          onClick={() => setTimeframe("1d")}
        >
          1D
        </button>
        <button
          className={`px-3 py-1 rounded ${timeframe === "1w" ? "bg-primary" : "bg-base-300"}`}
          onClick={() => setTimeframe("1w")}
        >
          1W
        </button>

        <div className="ml-auto flex space-x-2">
          <button className="p-1 rounded bg-base-300 hover:bg-base-100">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button className="p-1 rounded bg-base-300 hover:bg-base-100">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            className="p-1 rounded bg-base-300 hover:bg-base-100"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                setChartData(generateMockData(selectedToken, timeframe));
                setIsLoading(false);
              }, 1000);
            }}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main chart area */}
      <div className="mb-4">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-primary">Loading data from Crossbar...</div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-error">{error}</div>
          </div>
        ) : (
          <>
            {chartType === "candlestick" ? <CandleStickChart data={chartData} /> : <PriceChart data={chartData} />}
            <div className="mt-4">
              <VolumeChart data={chartData} />
            </div>
          </>
        )}
      </div>

      {/* Trading data information */}
      {tokenInfo && (
        <div className="grid grid-cols-4 gap-4 mb-4 bg-base-300 p-4 rounded">
          <div>
            <span className="text-base-content text-sm">24h High</span>
            <p className="font-bold text-success">{tokenInfo.high24h}</p>
          </div>
          <div>
            <span className="text-base-content text-sm">24h Low</span>
            <p className="font-bold text-error">{tokenInfo.low24h}</p>
          </div>
          <div>
            <span className="text-base-content text-sm">24h Volume</span>
            <p className="font-bold">{tokenInfo.volume24h}</p>
          </div>
          <div>
            <span className="text-base-content text-sm">Oracle Source</span>
            <p className="font-bold">Switchboard</p>
          </div>
        </div>
      )}

      {/* Footer with data source info */}
      <div className="text-base-content text-sm flex items-center">
        <Info className="w-4 h-4 mr-1" />
        Data provided by Switchboard Crossbar Oracle Network
      </div>
    </div>
  );
};

export default CrossbarTradingView;
