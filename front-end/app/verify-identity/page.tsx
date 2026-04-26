"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useWalletVerification } from "@/services/checkWalletVerification";
import { useAccount } from "wagmi";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faCircleExclamation,
  faCircleCheck,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
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
        <FontAwesomeIcon icon={faCircleExclamation} className="h-12 w-12 text-red-500" />
        <p className="text-center text-gray-700">{error}</p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  // Returned from FV: show result (green check or amber warning)
  if (isReturnFromFV && verificationSuccess !== null) {
    const success = verificationSuccess === true;
    return (
      <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {success ? (
            <>
              <FontAwesomeIcon icon={faCircleCheck} className="h-16 w-16 text-green-500" aria-hidden />
              <FontAwesomeIcon icon={faSpinner} spin className="h-6 w-6 text-blue-500" aria-hidden />
            </>
          ) : (
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-16 w-16 text-amber-500" aria-hidden />
          )}
        </div>
        <p className="text-center text-lg text-gray-700">
          {success
            ? "Verification completed successfully. Please do not close this window until your verification is fully confirmed - be patient!"
            : "Verification didn’t go as expected. You can try again."}
        </p>
        {!success && (
          <Link href="/verify-identity">
            <Button variant="outline">Retry</Button>
          </Link>
        )}
      </div>
    );
  }

  // Decode failed or missing: show amber and offer retry
  if (isReturnFromFV) {
    return (
      <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
        <FontAwesomeIcon icon={faTriangleExclamation} className="h-16 w-16 text-amber-500" aria-hidden />
        <p className="text-center text-lg text-gray-700">
          We couldn’t determine your verification result. You can try again.
        </p>
        <Link href="/verify-identity">
          <Button variant="outline">Retry</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="font-sans flex flex-col min-h-[60vh] p-6 gap-6 items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} spin className="h-12 w-12 text-blue-500" />
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
          <FontAwesomeIcon icon={faSpinner} spin className="h-12 w-12 text-blue-500" />
          <p className="text-center text-lg text-gray-700">Loading…</p>
        </div>
      }
    >
      <VerifyIdentityContent />
    </Suspense>
  );
}
