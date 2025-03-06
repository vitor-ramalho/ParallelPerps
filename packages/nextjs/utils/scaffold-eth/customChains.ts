import { defineChain } from "viem";

const MONAD_RPC_URL = process.env.NEXT_PUBLIC_MONAD_RPC_URL || "";
const MONAD_CHAIN_ID = Number(process.env.NEXT_PUBLIC_MONAD_CHAIN_ID) || 1;
const MONAD_BLOCK_EXPLORER_URL = process.env.NEXT_PUBLIC_MONAD_BLOCK_EXPLORER_URL || "";

export const monadTestnet = defineChain({
  id: MONAD_CHAIN_ID,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [MONAD_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Blockscout",
      url: MONAD_BLOCK_EXPLORER_URL,
    },
  },
});
