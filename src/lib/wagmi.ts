import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { defineChain } from "viem";
import { createConfig, http } from "wagmi";

const projectId = "ritual_genesis_demo";

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

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: [
        injectedWallet(),
        metaMaskWallet({ projectId }),
        walletConnectWallet({ projectId }),
      ],
    },
  ],
  {
    appName: "Siggy Soul",
    projectId,
  },
);

export const wagmiConfig = createConfig({
  chains: [ritualTestnet],
  connectors,
  ssr: true,
  transports: {
    [ritualTestnet.id]: http(ritualTestnet.rpcUrls.default.http[0]),
  },
});
