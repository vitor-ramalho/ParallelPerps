import { monadTestnet } from "./customChains";
import { ChainWithAttributes, getAlchemyHttpUrl } from "./networks";
import { CurrencyAmount, Token } from "@uniswap/sdk-core";
import { Pair, Route } from "@uniswap/v2-sdk";
import { Address, createPublicClient, fallback, http, parseAbi } from "viem";
import { mainnet } from "viem/chains";

// const monadRpcUrl = process.env.NEXT_PUBLIC_MONAD_RPC_URL;

const alchemyHttpUrl = getAlchemyHttpUrl(monadTestnet.id);
const rpcFallbacks = alchemyHttpUrl ? [http(alchemyHttpUrl), http()] : [http()];
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: fallback(rpcFallbacks),
});

const ABI = parseAbi([
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
]);

export const fetchPriceFromUniswap = async (targetNetwork: ChainWithAttributes): Promise<number> => {
  if (targetNetwork.nativeCurrency.symbol !== "MON") {
    return 0;
  }
  try {
    const ETH = new Token(1, "0x0B924f975F67632C1b8Af61B5B63415976a88791", 18);
    const TOKEN = new Token(
      1,
      targetNetwork.nativeCurrencyTokenAddress || "0x3aE6D8A282D67893e17AA70ebFFb33EE5aa65893",
      18,
    );
    const pairAddress = Pair.getAddress(TOKEN, ETH) as Address;

    console.log("pairAddress", pairAddress);

    const wagmiConfig = {
      address: pairAddress,
      abi: ABI,
    };

    const reserves = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "getReserves",
    });

    const token0Address = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "token0",
    });

    const token1Address = await publicClient.readContract({
      ...wagmiConfig,
      functionName: "token1",
    });

    console.log("token0Address", token0Address);
    console.log("token1Address", token1Address);
    const token0 = [TOKEN, ETH].find(token => token.address === token0Address) as Token;
    const token1 = [TOKEN, ETH].find(token => token.address === token1Address) as Token;
    console.log("token0", token0);
    console.log("token1", token1);
    console.log("reserves", reserves);
    const pair = new Pair(
      CurrencyAmount.fromRawAmount(token0, reserves[0].toString()),
      CurrencyAmount.fromRawAmount(token1, reserves[1].toString()),
    );
    const route = new Route([pair], TOKEN, ETH);
    const price = parseFloat(route.midPrice.toSignificant(6));
    return price;
  } catch (error) {
    console.error(
      `useNativeCurrencyPrice - Error fetching ${targetNetwork.nativeCurrency.symbol} price from Uniswap: `,
      error,
    );
    return 0;
  }
};
