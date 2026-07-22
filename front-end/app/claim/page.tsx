"use client";
import { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient, useChainId } from "wagmi";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCircleCheck, faCircleExclamation, faGift } from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { useNotification } from "@blockscout/app-sdk";
import { analytics } from "@/services/analytics";
import { getFbclid, appendFbclidToUrl } from "@/services/fbclid";
import {
  fetchClaimEligibility,
  prepareAndSendClaimUbi,
} from "@/services/claimUbi";

export default function ClaimPage() {
  useEffect(() => {
    analytics.trackClaimPageViewed();
    getFbclid();
  }, []);

  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-start items-center pt-8">
        <Link href={appendFbclidToUrl("/")}>
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center pt-12">
        <ClaimComponent />
      </div>
    </div>
  );
}

const ClaimComponent = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto">
        <FontAwesomeIcon icon={faSpinner} spin className="h-6 w-6 text-blue-500" />
        <p className="text-sm text-gray-600">Loading claim page...</p>
      </div>
    );
  }

  return <ClaimContent />;
};

const ClaimContent = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [entitlement, setEntitlement] = useState<bigint | null>(null);
  const [entitlementFormatted, setEntitlementFormatted] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const { openTxToast } = useNotification();
  const chainId = useChainId();

  const checkEntitlement = useCallback(async () => {
    if (!userAddress || !isConnected) {
      setEntitlement(null);
      setEntitlementFormatted(null);
      setNextClaimTime(null);
      return;
    }

    setIsCheckingEntitlement(true);
    setError("");
    try {
      const eligibility = await fetchClaimEligibility(userAddress);
      const amount = BigInt(eligibility.claimableAmount || "0");
      setEntitlement(amount);
      setEntitlementFormatted(eligibility.claimableAmountFormatted);

      if (amount === BigInt(0) && eligibility.nextClaimAvailableAt) {
        const next = new Date(eligibility.nextClaimAvailableAt);
        if (!Number.isNaN(next.getTime()) && next.getTime() > Date.now()) {
          setNextClaimTime(next);
        } else {
          setNextClaimTime(null);
        }
      } else {
        setNextClaimTime(null);
      }
    } catch (err) {
      console.error("Entitlement check failed:", err);
      setError("Failed to check entitlement");
      setEntitlement(null);
      setEntitlementFormatted(null);
      setNextClaimTime(null);
    } finally {
      setIsCheckingEntitlement(false);
    }
  }, [userAddress, isConnected]);

  useEffect(() => {
    checkEntitlement();
  }, [checkEntitlement]);

  useEffect(() => {
    if (!nextClaimTime) {
      setCountdown("");
      return;
    }

    const updateCountdown = () => {
      const difference = nextClaimTime.getTime() - Date.now();

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown(
          `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
        );
      } else {
        setCountdown("");
        setNextClaimTime(null);
        if (userAddress && isConnected) {
          checkEntitlement();
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextClaimTime, userAddress, isConnected, checkEntitlement]);

  const formatEntitlement = (amount: bigint) => {
    if (entitlementFormatted) {
      const parsed = Number(entitlementFormatted);
      if (!Number.isNaN(parsed)) {
        return parsed.toFixed(4);
      }
      return entitlementFormatted;
    }
    return (Number(amount) / Math.pow(10, 18)).toFixed(4);
  };

  const handleClaim = async () => {
    if (!userAddress || !isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!walletClient || !publicClient) {
      setStatus("Claim system not ready. Please try again.");
      return;
    }

    if (!entitlement || entitlement === BigInt(0)) {
      setStatus("No entitlement available to claim");
      return;
    }

    setIsLoading(true);
    setStatus("Processing claim...");
    setError("");

    try {
      const result = await prepareAndSendClaimUbi({
        address: userAddress,
        walletClient,
        publicClient,
      });

      openTxToast(chainId.toString(), result.transactionHash);

      if (result.status === "success") {
        setStatus(`Claim successful! Transaction: ${result.transactionHash}`);
        analytics.trackUBIClaim({
          transactionHash: result.transactionHash,
          amount: formatEntitlement(entitlement),
          tokenSymbol: "G$",
        });
        await checkEntitlement();
      } else {
        setStatus(
          `Claim failed: Transaction reverted. Transaction: ${result.transactionHash}`,
        );
        setError("Transaction was reverted by the network");
        analytics.trackUBIClaimFailed({
          errorMessage: "Transaction reverted",
          errorCode: "TX_REVERTED",
          walletAddress: userAddress,
        });
      }
    } catch (err) {
      console.error("Claim failed:", err);
      const rawMessage = err instanceof Error ? err.message : "Unknown error";
      const errorMessage =
        rawMessage.replace(/^(?:claim failed:\s*)+/i, "").trim() || "Unknown error";
      setStatus(`Claim failed: ${errorMessage}`);
      setError(errorMessage);
      analytics.trackUBIClaimFailed({
        errorMessage,
        walletAddress: userAddress,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const hasEntitlement = entitlement !== null && entitlement > BigInt(0);
  const claimReady = Boolean(walletClient && publicClient);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="text-center mb-6">
        <div className="mb-6 flex justify-center">
          <FontAwesomeIcon icon={faGift} className="h-[100px] w-[100px] text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Claim Your UBI
        </h2>
        <p className="text-sm text-gray-600">
          Check your entitlement and claim available G$ (GoodDollar)
        </p>
      </div>

      <div className="w-full">
        <div className="flex items-center justify-center gap-3 mb-4">
          {isCheckingEntitlement ? (
            <FontAwesomeIcon icon={faSpinner} spin className="h-5 w-5 text-blue-500" />
          ) : hasEntitlement ? (
            <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5 text-green-500" />
          ) : (
            <FontAwesomeIcon icon={faCircleExclamation} className="h-5 w-5 text-orange-500" />
          )}
          <span className="text-sm text-gray-600">
            {isCheckingEntitlement
              ? "Checking your UBI status..."
              : hasEntitlement
                ? `Ready to claim: ${formatEntitlement(entitlement!)} G$`
                : countdown
                  ? "UBI will be available soon"
                  : "Check back later for UBI"}
          </span>
        </div>

        {entitlement !== null && !isCheckingEntitlement && (
          <div
            className={`text-xs p-3 rounded-md w-full text-center mb-4 ${
              hasEntitlement
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {hasEntitlement
              ? `You have ${formatEntitlement(entitlement)} G$ available to claim`
              : countdown
                ? "Your next UBI is coming up - see countdown below"
                : "No UBI available right now - check back daily"}
          </div>
        )}
      </div>

      <div className="w-full flex justify-center">
        <Button
          onClick={handleClaim}
          disabled={!isConnected || isLoading || !claimReady || !hasEntitlement}
          className="w-full text-sm px-6 py-3"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2 h-4 w-4" />
              Processing...
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !claimReady || isCheckingEntitlement ? (
            "Checking..."
          ) : !hasEntitlement ? (
            countdown ? `Available in ${countdown}` : "Check again later"
          ) : (
            "Claim UBI"
          )}
        </Button>
      </div>

      {status && (
        <div
          className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${
            status.includes("successful")
              ? "bg-green-100 text-green-800 border border-green-200"
              : status.includes("failed") || status.includes("error") || error
                ? "bg-red-100 text-red-800 border border-red-200"
                : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          {status}
        </div>
      )}

      {error && !status && (
        <div className="text-xs p-3 rounded-md w-full text-center bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {!isConnected && (
        <p className="text-sm text-gray-600 text-center">
          Connect your wallet to check your daily UBI status
        </p>
      )}
    </div>
  );
};
