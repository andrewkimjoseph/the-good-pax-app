"use client";

import { useEffect, useState } from "react";
import { getBalance } from "@wagmi/core";
import { config } from "@/components/Providers";
import Image from "next/image";
import { useAccount } from "wagmi";

export interface TokenInfo {
  name: string;
  address: `0x${string}`;
  icon: string;
  symbol?: string;
}

interface BalanceProps {
  token: TokenInfo;
}

export function Balance({ token }: BalanceProps) {
  const { address: connectedAddress } = useAccount();
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!connectedAddress) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const result = await getBalance(config, {
          address: connectedAddress,
          token: token.address,
        });

        // Format balance to 2 decimal places
        const formattedBalance = parseFloat(result.formatted).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        );

        setBalance(formattedBalance);
      } catch (err) {
        console.error(`Error fetching balance for ${token.name}:`, err);
        setError("Failed to fetch balance");
        setBalance("0.00");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [connectedAddress, token.address, token.name]);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative w-8 h-8 flex-shrink-0">
          <Image
            src={token.icon}
            alt={`${token.name} icon`}
            width={32}
            height={32}
            className="rounded-full"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{token.name}</span>
          {token.symbol && (
            <span className="text-xs text-muted-foreground">{token.symbol}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </div>
        ) : error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : (
          <div className="font-semibold text-sm">{balance}</div>
        )}
      </div>
    </div>
  );
}

