"use client";

import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";

/**
 * Component that handles Farcaster miniapp integration.
 * Automatically detects if the app is running inside a Farcaster miniapp
 * and connects the MetaMask wallet if so.
 */
export function FarcasterMiniAppIntegration() {

  useEffect(() => {
    // Initialize Farcaster miniapp SDK after the app is fully loaded
    const initializeFarcasterSDK = async () => {
      try {
        await sdk.actions.ready();
      } catch (error) {
        console.error("Failed to initialize Farcaster miniapp SDK:", error);
      }
    };

    initializeFarcasterSDK();
  }, []);

  return null; // This component doesn't render anything
}
