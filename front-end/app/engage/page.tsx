"use client";
import { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useEngagementRewards } from "@goodsdks/engagement-sdk";
import { checkIfEngagementRewardsTransactionReverted } from "@/services/checkIfEngagementRewardsTransactionReverted";
import { getAppSignature } from "@/services/getAppSignature";
import { useNotification } from "@blockscout/app-sdk";
import { analytics } from "@/services/analytics";
import { getFbclid, getStoredFbclid, appendFbclidToUrl } from "@/services/fbclid";

// Configuration constants - replace with your actual values
const APP_ADDRESS =
  (process.env.NEXT_PUBLIC_APP_ADDRESS as `0x${string}`) 
const INVITER_ADDRESS =
  (process.env.NEXT_PUBLIC_INVITER_ADDRESS as `0x${string}`) 
export default function EngagePage() {
  // Track page view on mount and capture fbclid
  useEffect(() => {
    analytics.trackEngagementPageViewed();
    // Capture fbclid if present in URL
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
        <ProductionRewardsEngagementButton />
      </div>
    </div>
  );
}

const ProductionRewardsEngagementButton = () => {
  const { address: userAddress, isConnected } = useAccount();
  const engagementRewards = useEngagementRewards(
    "0x25db74CF4E7BA120526fd87e159CF656d94bAE43"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const { openTxToast } = useNotification();

  const chainId = useChainId();
  // SDK is ready when hook returns non-null
  if (!engagementRewards) return null;

  const handleClaim = async () => {
    if (!userAddress || !isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }
    setIsLoading(true);
    setStatus("Processing claim...");

    try {
      // First check if user can claim

      // console.log("Checking user eligibility...");
      // console.log("APP_ADDRESS", APP_ADDRESS);
      // console.log("userAddress", userAddress);
      // const isEligible = await engagementRewards.canClaim(APP_ADDRESS, userAddress).catch(_ => false)
      // if (!isEligible) {
      //   throw new Error("User not eligible to claim")
      // }

      setStatus("User eligible, preparing claim...");

      // Get current block and prepare signature if needed
      const currentBlock = await engagementRewards.getCurrentBlockNumber();
      const validUntilBlock = currentBlock + BigInt(20); // Valid for 10 blocks

      setStatus("Generating user signature...");

      // Generate user signature (required for nonContractAppClaim)
      const userSignature = await engagementRewards.signClaim(
        APP_ADDRESS,
        INVITER_ADDRESS,
        validUntilBlock
      );

      setStatus("Getting app signature...");

      // Get app signature from backend
      const appSignature = await getAppSignature({
        user: userAddress,
        validUntilBlock: validUntilBlock.toString(),
        inviter: INVITER_ADDRESS,
      });

      setStatus("Submitting claim...");

      // Submit claim
      const receipt = await engagementRewards.nonContractAppClaim(
        APP_ADDRESS,
        INVITER_ADDRESS,
        validUntilBlock,
        userSignature as `0x${string}`,
        appSignature as `0x${string}`
      );

      // Check if transaction reverted
      setStatus("Checking transaction status...");

      openTxToast(chainId.toString(), receipt.transactionHash);
      const transactionReverted =
        await checkIfEngagementRewardsTransactionReverted(
          receipt.transactionHash
        );

      if (transactionReverted) {
        setStatus(
          `Claim failed: Transaction reverted. Transaction: ${receipt.transactionHash}`
        );
      } else {
        setStatus(`Claim successful! Transaction: ${receipt.transactionHash}`);
        // Track successful engagement - use special event if from ad
        const fbclid = getStoredFbclid();
        if (fbclid) {
          analytics.trackEngagementFromAd({
            transactionHash: receipt.transactionHash,
            amount: '3000',
            success: true,
            fbclid: fbclid, // Explicitly pass fbclid for attribution
          });
        } else {
          analytics.trackEngagement({
            transactionHash: receipt.transactionHash,
            amount: '3000',
            success: true,
          });
        }
      }
    } catch (error) {
      // console.error("Claim failed:", error);

      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "";

      if (message.includes("Claim cooldown not reached")) {
        setStatus("You already claimed. Try again after the cooldown period.");
        return;
      }
      setStatus(`Claim failed: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-6">
        <div className="mb-6 flex justify-center">
          <Sparkles className="h-20 w-20 text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Engagement Rewards
        </h2>
        <p className="text-sm text-gray-600">
          Claim your 3,000 G$ engagement rewards
        </p>
      </div>

      <div className="w-full flex justify-center">
        <Button
          onClick={handleClaim}
          disabled={!isConnected || isLoading}
          className="w-full text-sm px-6 py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Processing...
            </>
          ) : (
            "Claim 3K G$ NOW!"
          )}
        </Button>
      </div>

      {status && (
        <div
          className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${
            status.includes("successful")
              ? "bg-green-100 text-green-800 border border-green-200"
              : status.includes("failed") || status.includes("error")
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          {status}
        </div>
      )}

      {!isConnected && (
        <p className="text-sm text-gray-600 text-center">
          Connect your wallet to claim rewards
        </p>
      )}
    </div>
  );
};
