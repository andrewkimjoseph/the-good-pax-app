"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useNotification } from "@blockscout/app-sdk";
import { checkIfEngagementRewardsTransactionReverted } from "@/services/checkIfEngagementRewardsTransactionReverted";
import { getAppSignature } from "@/services/getAppSignature";
import { analytics } from "@/services/analytics";
import { getFbclid, getStoredFbclid, appendFbclidToUrl } from "@/services/fbclid";

const APP_ADDRESS = process.env.NEXT_PUBLIC_APP_ADDRESS as `0x${string}`;
const CANVASSING_BUSINESS_ADDRESS = process.env
  .NEXT_PUBLIC_CANVASSING_BUSINESS_ADDRESS as `0x${string}`;

type EligibilityResponse = {
  eligible: boolean;
  participantExists: boolean;
  reasonCode: string;
};
type PrecheckState = "idle" | "checking" | "eligible" | "ineligible" | "error";

export default function EngagePage() {
  return (
    <Suspense fallback={<EngagePageLoadingState />}>
      <EngagePageContent />
    </Suspense>
  );
}

function EngagePageContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const participantId = useMemo(
    () => (isMounted ? searchParams.get("participantId")?.trim() || "" : ""),
    [isMounted, searchParams]
  );

  useEffect(() => {
    analytics.trackEngagementPageViewed();
    getFbclid();
    setIsMounted(true);
  }, []);

  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-start items-center pt-8">
        <Link href={appendFbclidToUrl("/")}>
          <Button variant="outline" size="sm">← Back to Home</Button>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center pt-12">
        {isMounted ? (
          <ProductionRewardsEngagementButton participantId={participantId} />
        ) : (
          <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
            <div className="text-center mb-6">
              <div className="mb-6 flex justify-center">
                <FontAwesomeIcon
                  icon={faWandMagicSparkles}
                  className="h-[100px] w-[100px] text-orange-500"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Engagement Rewards
              </h2>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EngagePageLoadingState() {
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-start items-center pt-8">
        <Link href={appendFbclidToUrl("/")}>
          <Button variant="outline" size="sm">← Back to Home</Button>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center pt-12">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
          <div className="text-center mb-6">
            <div className="mb-6 flex justify-center">
              <FontAwesomeIcon
                icon={faWandMagicSparkles}
                className="h-[100px] w-[100px] text-orange-500"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Engagement Rewards
            </h2>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const statusByReasonCode: Record<string, string> = {
  MISSING_PARTICIPANT_ID: "Missing participantId. Please use a valid engage link.",
  PARTICIPANT_NOT_FOUND: "Participant not found in Pax.",
  NOT_V2_USER: "This participant is not a v2 user yet.",
  MISSING_PAX_WALLET: "This participant does not have a pax_wallet yet.",
  NO_VALID_TASK_COMPLETION: "No valid task completion found for this participant.",
  NO_CLAIMED_REWARD: "No claimed reward found for this participant.",
};

function ProductionRewardsEngagementButton({
  participantId,
}: {
  participantId: string;
}) {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { openTxToast } = useNotification();
  const engagementRewards = useEngagementRewards(
    "0x25db74CF4E7BA120526fd87e159CF656d94bAE43"
  );

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [precheckState, setPrecheckState] = useState<PrecheckState>("idle");
  const [precheckMessage, setPrecheckMessage] = useState<string>("");

  const fetchEligibility = async (targetParticipantId: string) => {
    const eligibilityResponse = await fetch(
      `/api/engagementRewards/eligibility?participantId=${encodeURIComponent(
        targetParticipantId
      )}`
    );
    const eligibility =
      (await eligibilityResponse.json()) as Partial<EligibilityResponse>;
    return { eligibilityResponse, eligibility };
  };

  useEffect(() => {
    if (!participantId) {
      setPrecheckState("ineligible");
      setPrecheckMessage(statusByReasonCode.MISSING_PARTICIPANT_ID);
      return;
    }

    let cancelled = false;

    const runPrecheck = async () => {
      setPrecheckState("checking");
      setPrecheckMessage("Checking engagement eligibility...");
      try {
        const { eligibilityResponse, eligibility } = await fetchEligibility(
          participantId
        );
        if (cancelled) return;

        if (!eligibilityResponse.ok || !eligibility.eligible) {
          const reason = eligibility.reasonCode ?? "UNKNOWN";
          setPrecheckState("ineligible");
          setPrecheckMessage(
            statusByReasonCode[reason] ||
              `Engagement eligibility failed (${reason}).`
          );
          return;
        }

        setPrecheckState("eligible");
        setPrecheckMessage("Eligible for engagement rewards.");
      } catch {
        if (cancelled) return;
        setPrecheckState("error");
        setPrecheckMessage("Unable to verify eligibility right now.");
      }
    };

    runPrecheck();
    return () => {
      cancelled = true;
    };
  }, [participantId]);

  const handleClaim = async () => {
    if (!engagementRewards) {
      setStatus("Engagement rewards SDK is still loading. Please try again.");
      return;
    }

    if (!participantId) {
      setStatus(statusByReasonCode.MISSING_PARTICIPANT_ID);
      return;
    }

    if (!userAddress || !isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!APP_ADDRESS || !CANVASSING_BUSINESS_ADDRESS) {
      setStatus(
        "App is not configured. Missing NEXT_PUBLIC_APP_ADDRESS or NEXT_PUBLIC_CANVASSING_BUSINESS_ADDRESS."
      );
      return;
    }

    setIsLoading(true);
    setStatus("Checking engagement eligibility...");

    try {
      const { eligibilityResponse, eligibility } = await fetchEligibility(
        participantId
      );

      if (!eligibilityResponse.ok || !eligibility.eligible) {
        const reason = eligibility.reasonCode ?? "UNKNOWN";
        setStatus(
          statusByReasonCode[reason] ||
            `Engagement eligibility failed (${reason}).`
        );
        return;
      }

      setStatus("User eligible, preparing claim...");
      const currentBlock = await engagementRewards.getCurrentBlockNumber();
      const validUntilBlock = currentBlock + BigInt(20);

      setStatus("Generating user signature...");
      const userSignature = await engagementRewards.signClaim(
        APP_ADDRESS,
        CANVASSING_BUSINESS_ADDRESS,
        validUntilBlock
      );

      setStatus("Getting app signature...");
      const appSignature = await getAppSignature({
        user: userAddress,
        validUntilBlock: validUntilBlock.toString(),
        canvassingBusinessAddress: CANVASSING_BUSINESS_ADDRESS,
      });

      setStatus("Submitting claim...");
      const receipt = await engagementRewards.nonContractAppClaim(
        APP_ADDRESS,
        CANVASSING_BUSINESS_ADDRESS,
        validUntilBlock,
        userSignature as `0x${string}`,
        appSignature as `0x${string}`
      );

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
        return;
      }

      setStatus(`Claim successful! Transaction: ${receipt.transactionHash}`);
      const fbclid = getStoredFbclid();
      if (fbclid) {
        analytics.trackEngagementFromAd({
          transactionHash: receipt.transactionHash,
          amount: "3000",
          success: true,
          fbclid,
        });
      } else {
        analytics.trackEngagement({
          transactionHash: receipt.transactionHash,
          amount: "3000",
          success: true,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "";

      if (message.includes("Claim cooldown not reached")) {
        setStatus("You already claimed. Try again after the cooldown period.");
      } else {
        setStatus(`Claim failed: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-6">
        <div className="mb-6 flex justify-center">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="h-[100px] w-[100px] text-orange-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Engagement Rewards
        </h2>
        <p className="text-sm text-gray-600">Claim your 3,000 G$ Engagement Rewards</p>
      </div>

      <div className="w-full flex justify-center">
        <Button
          onClick={handleClaim}
          disabled={!isConnected || isLoading || !participantId || !engagementRewards}
          className="w-full text-sm px-6 py-3"
        >
          {isLoading ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              Processing...
            </>
          ) : (
            "Claim 3K G$ NOW!"
          )}
        </Button>
      </div>

      {precheckState !== "idle" && (
        <div
          className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${
            precheckState === "eligible"
              ? "bg-green-100 text-green-800 border border-green-200"
              : precheckState === "ineligible" || precheckState === "error"
              ? "bg-red-100 text-red-800 border border-red-200"
              : "bg-blue-100 text-blue-800 border border-blue-200"
          }`}
        >
          {precheckMessage}
        </div>
      )}

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

      {!participantId && (
        <p className="text-sm text-gray-600 text-center">
          Missing participantId in the URL.
        </p>
      )}

      {!isConnected && (
        <p className="text-sm text-gray-600 text-center">
          Connect your wallet to claim rewards
        </p>
      )}
    </div>
  );
}