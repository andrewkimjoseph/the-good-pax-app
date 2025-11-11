"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
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

// Token list - you can expand this array to add more tokens
const TOKENS: TokenInfo[] = [
  {
    name: "GoodDollar",
    address: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
    icon: "/tokens/gooddollar_icon.svg",
    symbol: "G$",
  },
];

export function Header() {
  const { address, isConnected } = useAccount();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if no wallet is connected
  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur shadow-md">
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

            {isExpanded && (
              <CardContent className="space-y-2">
                {TOKENS.map((token) => (
                  <Balance key={token.address} token={token} />
                ))}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

