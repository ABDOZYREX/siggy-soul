import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { wagmiConfig, ritualTestnet } from "@/lib/wagmi";

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        initialChain={ritualTestnet}
        theme={darkTheme({
          accentColor: "oklch(0.78 0.22 145)",
          accentColorForeground: "black",
          borderRadius: "small",
          overlayBlur: "small",
        })}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
