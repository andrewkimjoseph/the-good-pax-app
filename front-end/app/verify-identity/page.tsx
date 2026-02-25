"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useWalletVerification } from "@/services/checkWalletVerification";
import { useAccount } from "wagmi";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function decodeVerifiedParam(encoded: string | null): boolean | null {
  if (encoded == null || encoded === "") return null;
  try {
    const decoded = atob(encoded);
    return decoded === "true" || decoded === "1";
  } catch {
    return null;
  }
}

function VerifyIdentityContent() {
  const searchParams = useSearchParams();
  const { generateFVLink, sdkReady } = useWalletVerification();
  const { isConnected } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const isReady = isConnected && sdkReady;

  // Return from FV flow: already verified, don't create another link
  const verifiedParam = searchParams.get("verified");
  const chain = searchParams.get("chain");
  const isReturnFromFV = verifiedParam != null && chain != null;

  const verificationSuccess = useMemo(
    () => (isReturnFromFV ? decodeVerifiedParam(verifiedParam) : null),
    [isReturnFromFV, verifiedParam]
  );

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

  // Returned from FV: show result (green check or amber warning) then allow going home
  if (isReturnFromFV && verificationSuccess !== null) {
    const success = verificationSuccess === true;
    return (
      <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
        {success ? (
          <CheckCircle className="h-16 w-16 text-green-500" aria-hidden />
        ) : (
          <AlertTriangle className="h-16 w-16 text-amber-500" aria-hidden />
        )}
        <p className="text-center text-lg text-gray-700">
          {success
            ? "Verification completed successfully."
            : "Verification didn’t go as expected. You can try again from home."}
        </p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  // Decode failed or missing: show neutral/amber and go home
  if (isReturnFromFV) {
    return (
      <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
        <AlertTriangle className="h-16 w-16 text-amber-500" aria-hidden />
        <p className="text-center text-lg text-gray-700">
          We couldn’t determine your verification result. You can try again from home.
        </p>
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
        {isReady
          ? "Redirecting to GoodDollar Identity"
          : "Waiting for wallet…"}
      </p>
    </div>
  );
}

export default function VerifyIdentityPage() {
  return (
    <Suspense
      fallback={
        <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
          <p className="text-center text-lg text-gray-700">Loading…</p>
        </div>
      }
    >
      <VerifyIdentityContent />
    </Suspense>
  );
}
