"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { Balance, TokenInfo } from "@/components/Balance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Token list
const TOKENS: TokenInfo[] = [
  {
    name: "GoodDollar",
    address: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
    icon: "/tokens/gooddollar_icon.svg",
    symbol: "G$",
  },
  {
    name: "Celo Dollar",
    address: "0x765de816845861e75a25fca122bb6898b8b1282a",
    icon: "/tokens/cusd_icon.svg",
    symbol: "cUSD",
  },

  {
    name: "Tether",
    address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
    icon: "/tokens/tether_usd_icon.svg",
    symbol: "USDT",
  },

  {
    name: "USD Coin",
    address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
    icon: "/tokens/usd_coin_icon.svg",
    symbol: "USDC",
  },
];

export function Header() {
  const { address, isConnected } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Hide header on onboarding page
  if (pathname === "/onboarding") {
    return null;
  }

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-20 shadow-md">
      <div className="flex justify-center">
        <div className="w-full max-w-lg">
          <Card className="rounded-none border-x-0 border-t-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base">My Balances</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <CardDescription className="text-xs">
                {address.slice(0, 6)}...{address.slice(-4)}
              </CardDescription>
            </CardHeader>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut",
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <CardContent className="space-y-2">
                    {TOKENS.map((token) => (
                      <Balance key={token.address} token={token} />
                    ))}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}

