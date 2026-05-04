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
  /** When false, only token icon and amount (no name/symbol). */
  showLabel?: boolean;
  className?: string;
}

export function Balance({
  token,
  showLabel = true,
  className = "",
}: BalanceProps) {
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

  if (!showLabel) {
    const compactAmount = isLoading ? (
      <div className="animate-pulse text-xs text-muted-foreground">…</div>
    ) : error ? (
      <div className="text-center text-xs text-destructive">—</div>
    ) : (
      <div className="text-xs font-semibold tabular-nums">{balance}</div>
    );

    return (
      <div
        role="group"
        aria-label={`${token.symbol ?? token.name} balance`}
        className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg bg-muted/50 px-1.5 py-1.5 transition-colors hover:bg-muted ${className}`}
      >
        <div className="relative h-7 w-7 shrink-0">
          <Image
            src={token.icon}
            alt=""
            width={28}
            height={28}
            className="rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        </div>
        <div className="w-full text-center leading-none">{compactAmount}</div>
      </div>
    );
  }

  const amount = isLoading ? (
    <div className="animate-pulse text-sm text-muted-foreground">
      Loading...
    </div>
  ) : error ? (
    <div className="text-sm text-destructive">{error}</div>
  ) : (
    <div className="text-base font-semibold tabular-nums tracking-tight">
      {balance}
    </div>
  );

  return (
    <div
      role="group"
      aria-label={`${token.name} balance`}
      className={`flex min-w-0 flex-col items-center gap-1 rounded-lg bg-muted/50 px-3 py-2 text-center transition-colors hover:bg-muted ${className}`}
    >
      <div className="relative h-9 w-9 shrink-0">
        <Image
          src={token.icon}
          alt=""
          width={36}
          height={36}
          className="rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />
      </div>
      <div className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-0 leading-none">
        <span className="text-sm font-semibold">{token.name}</span>
        {token.symbol && (
          <span className="text-[11px] text-muted-foreground">{token.symbol}</span>
        )}
      </div>
      <div className="tabular-nums leading-none">{amount}</div>
    </div>
  );
}

