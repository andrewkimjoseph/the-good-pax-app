"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWalletVerification } from "@/services/checkWalletVerification";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyIdentityPage() {
  const searchParams = useSearchParams();
  const { generateFVLink, sdkReady } = useWalletVerification();
  const { isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const isReady = isConnected && sdkReady;

  // Return from FV flow: already verified, don't create another link
  const verified = searchParams.get("verified");
  const chain = searchParams.get("chain");
  const isReturnFromFV = verified != null && chain != null;

  useEffect(() => {
    if (!isReady || isReturnFromFV) return;

    let cancelled = false;
    setError(null);

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
  }, [generateFVLink, isReady, isReturnFromFV]);

  // Returned from FV with verified + chain → redirect to home
  useEffect(() => {
    if (!isReturnFromFV) return;
    window.location.href = "/";
  }, [isReturnFromFV]);

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
        {isReturnFromFV
          ? "Taking you back…"
          : isReady
            ? "Redirecting to GoodDollar Identity"
            : "Waiting for wallet…"}
      </p>
    </div>
  );
}
