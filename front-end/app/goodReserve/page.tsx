"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  GoodReserveProvider,
  GoodReserveWidget,
  flatTheme,
  type GoodReserveWidgetMode,
} from "@cnvlabskoxyz/goodreservekit";

import { Button } from "@/components/ui/button";
import { analytics } from "@/services/analytics";
import { appendFbclidToUrl } from "@/services/fbclid";

function subscribe() {
  return () => {};
}

function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

const theme = flatTheme({
  colors: { primary: "#363062" },
});

const rpcUrl = process.env.NEXT_PUBLIC_DRPC_API_KEY
  ? `https://lb.drpc.live/celo/${process.env.NEXT_PUBLIC_DRPC_API_KEY}`
  : undefined;

export default function GoodReservePage() {
  const hydrated = useHydrated();
  const [mode, setMode] = useState<GoodReserveWidgetMode>("swap");

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
        <div className="mb-2 flex justify-center">
          <Image
            src="/thegoodpaxapp.svg"
            alt="The Good Pax App Logo"
            width={100}
            height={100}
            className="drop-shadow-lg"
          />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">GoodReserve</h2>
        <div className="flex justify-center gap-2" role="group" aria-label="GoodReserve mode">
          {(["swap", "quote"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
              className="rounded-lg border px-4 py-1.5 text-sm font-semibold capitalize"
              style={
                mode === value
                  ? { background: "#363062", color: "#ffffff", borderColor: "#363062" }
                  : { background: "#ffffff", color: "#363062", borderColor: "#e4e4e7" }
              }
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-full justify-center">
        {hydrated ? (
          <GoodReserveProvider attributionTags={["thegoodpaxapp"]} rpcUrl={rpcUrl} theme={theme} analyticsDeviceId="the_good_pax_app">
            <GoodReserveWidget mode={mode} />
          </GoodReserveProvider>
        ) : (
          <div className="h-80 w-full" />
        )}
      </div>
    </div>
  );
}
