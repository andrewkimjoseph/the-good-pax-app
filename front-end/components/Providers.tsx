"use client";

import {
  connectorsForWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { createConfig, http, injected, useConnect, WagmiProvider } from "wagmi";
import { celo } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import {
  injectedWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { Navigation } from "@/components/Navigation";
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [walletConnectWallet, injectedWallet],
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

  const { connect } = useConnect();

  useEffect(() => {
    // Initialize Farcaster miniapp SDK after the app is fully loaded
    const initializeFarcasterSDK = async () => {
      try {
        await sdk.actions.ready();

        const isInMiniApp = await sdk.isInMiniApp();
        console.log("isInMiniApp", isInMiniApp);

        if (isInMiniApp) {
          connect({ connector: injected({ target: "metaMask" }) });
        }
        console.log("Farcaster miniapp SDK initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Farcaster miniapp SDK:", error);
      }
    };

    initializeFarcasterSDK();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Navigation />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
