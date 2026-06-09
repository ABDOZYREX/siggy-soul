import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const ritualTestnet = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.ritualfoundation.org/"] },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: "https://rpc.ritualfoundation.org/" },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Siggy Soul",
  projectId: "ritual_genesis_demo",
  chains: [ritualTestnet],
  ssr: true,
});
