"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { LiFiWidget, WidgetSkeleton, type WidgetConfig } from "@lifi/widget";

import { Button } from "@/components/ui/button";
import { analytics } from "@/services/analytics";
import { appendFbclidToUrl } from "@/services/fbclid";
import { getTokenAddress } from "@/lib/utils";

function subscribe() {
  return () => {};
}

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

export default function SwapPage() {
  const hydrated = useHydrated();
  const widgetConfig: Partial<WidgetConfig> = {
    appearance: "light",
    theme: {
      container: {
        border: "1px solid rgb(234, 234, 234)",
        borderRadius: "16px",
      },
    },
    fromChain: 42220,
    toChain: 42220,
    fromToken: getTokenAddress("G$"),
    toToken: getTokenAddress("USDT"),
  };

  useEffect(() => {
    analytics.trackSwapViewed();
  }, []);

  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-6">
      <div className="w-full flex justify-start items-center pt-8">
        <Link href={appendFbclidToUrl("/")}>
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Swap your G$</h2>
        <p className="text-sm text-gray-600">
          Use LI.FI to swap across chains from one place.
        </p>
      </div>

      <div className="w-full">
        {hydrated ? (
          <LiFiWidget integrator="the-good-pax-app" config={widgetConfig} />
        ) : (
          <WidgetSkeleton config={widgetConfig} />
        )}
      </div>
    </div>
  );
}
