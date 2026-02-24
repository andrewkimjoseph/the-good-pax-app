"use client";

import { useEffect, useState } from "react";
import { useWalletVerification } from "@/services/checkWalletVerification";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyIdentityPage() {
  const { generateFVLink, sdkReady } = useWalletVerification();
  const { isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sdkReady || !isConnected) {
      setError("Please connect your wallet first.");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await generateFVLink();
        // Navigation happens inside generateFVLink via window.location.href
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to start verification.");
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [generateFVLink, sdkReady, isConnected]);

  if (error) {
    return (
      <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-center text-gray-700">{error}</p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      <p className="text-center text-lg text-gray-700">
        Redirecting to GoodDollar Identity
      </p>
    </div>
  );
}
