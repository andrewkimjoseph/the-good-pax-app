"use client";

import {
  connectorsForWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { celo } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import {
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Navigation } from "@/components/Navigation";
import { useState } from "react";
import { FarcasterMiniAppIntegration } from "@/components/FarcasterMiniAppIntegration";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [walletConnectWallet, injectedWallet, rabbyWallet, metaMaskWallet],
    },
  ],
  {
    appName: "The Good Pax App",
    projectId: "7cd38e5b3ee172070ca8ce157688d9c9",
  }
);

const config = createConfig({
  connectors,
  chains: [celo],
  transports: {
    [celo.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside component to avoid hydration issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <FarcasterMiniAppIntegration />
          <Navigation />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
