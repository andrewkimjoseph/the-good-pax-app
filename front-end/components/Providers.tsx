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
  valoraWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { useState } from "react";
import { FarcasterMiniAppIntegration } from "@/components/FarcasterMiniAppIntegration";
import { NotificationProvider } from "@blockscout/app-sdk";

const DRPC_API_KEY = process.env.NEXT_PUBLIC_DRPC_API_KEY;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        walletConnectWallet,
        injectedWallet,
        rabbyWallet,
        metaMaskWallet,
        valoraWallet
      ],
    },
  ],
  {
    appName: "The Good Pax App",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID as string,
  }
);

export const config = createConfig({
  connectors,
  chains: [celo],
  transports: {
    [celo.id]: http(`https://lb.drpc.live/celo/${DRPC_API_KEY}`),
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
          <NotificationProvider>{children}</NotificationProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
