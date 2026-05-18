"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAccount, useChainId } from "wagmi";
import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
} from "viem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useNotification } from "@blockscout/app-sdk";
import { checkIfEngagementRewardsTransactionReverted } from "@/services/checkIfEngagementRewardsTransactionReverted";
import { getAppSignature } from "@/services/getAppSignature";
import { analytics } from "@/services/analytics";
import { getFbclid, getStoredFbclid, appendFbclidToUrl } from "@/services/fbclid";

// Engagement page flow:
// 1) Parse participantId from URL query params.
// 2) Run backend eligibility precheck and show a user-friendly status.
// 3) Only enable claim once precheck passes and wallet/sdk are ready.
// 4) Execute signed claim flow and track analytics outcomes.
const APP_ADDRESS = process.env.NEXT_PUBLIC_APP_ADDRESS as `0x${string}`;
const CANVASSING_BUSINESS_ADDRESS = process.env
  .NEXT_PUBLIC_CANVASSING_BUSINESS_ADDRESS as `0x${string}`;
const WAND_ICON_CLASS = "h-[100px] w-[100px] text-[#FF9C4C]";

// Backend returns a compact response shape that works for both success and
// ineligible states. `eligibleAt` is only included when cooldown has not lapsed.
type EligibilityResponse = {
  eligible: boolean;
  participantExists: boolean;
  reasonCode: string;
  eligibleAt?: number;
};
// Precheck lifecycle for UX rendering and button gating.
type PrecheckState = "idle" | "checking" | "eligible" | "ineligible" | "error";
type Countdown = {
  hours: string;
  minutes: string;
  seconds: string;
};

function formatDuration(remainingMs: number): Countdown {
  // Clamp at zero so minor timer drift never renders negative countdown values.
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return { hours, minutes, seconds };
}

function useCountdown(eligibleAt?: number): Countdown | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!eligibleAt) {
      setRemaining(null);
      return;
    }

    const updateRemaining = () => {
      const nextRemaining = Math.max(0, eligibleAt - Date.now());
      setRemaining(nextRemaining);
    };

    // Update immediately to avoid a one-second blank before first interval tick.
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 1000);

    return () => {
      // Cleanup prevents leaking intervals after unmount/re-render.
      window.clearInterval(timer);
    };
  }, [eligibleAt]);

  if (remaining === null || remaining <= 0) {
    return null;
  }

  return formatDuration(remaining);
}

function getPrecheckBannerClass(state: PrecheckState): string {
  if (state === "eligible") {
    return "bg-green-50 text-[#34A853] border border-green-100";
  }

  if (state === "ineligible" || state === "error") {
    return "bg-red-100 text-red-800 border border-red-200";
  }

  return "bg-[#18AEFA]/10 text-[#18AEFA] border border-[#18AEFA]/20";
}

function getStatusBannerClass(status: string): string {
  if (status.includes("successful")) {
    return "bg-green-100 text-green-800 border border-green-200";
  }

  if (status.includes("failed") || status.includes("error")) {
    return "bg-red-100 text-red-800 border border-red-200";
  }

  return "bg-[#18AEFA]/10 text-[#18AEFA] border border-[#18AEFA]/20";
}

function PrecheckBanner({
  state,
  message,
  reasonCode,
  countdown,
  eligibleAt,
}: {
  state: PrecheckState;
  message: string;
  reasonCode: string;
  countdown: Countdown | null;
  eligibleAt?: number;
}) {
  return (
    <div
      className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${getPrecheckBannerClass(
        state
      )}`}
    >
      {message}
      {state === "ineligible" &&
        reasonCode === "REWARD_ON_COOLDOWN" &&
        countdown && (
          <p className="mt-2 font-semibold">
            {countdown.hours}:{countdown.minutes}:{countdown.seconds} until
            eligible
          </p>
        )}
      {state === "ineligible" &&
        reasonCode === "ENGAGEMENT_CLAIM_ON_COOLDOWN" &&
        typeof eligibleAt === "number" && (
          <p className="mt-2 font-semibold">
            Eligible again on {formatEligibleAtDate(eligibleAt)}
          </p>
        )}
    </div>
  );
}

function StatusBanner({ status }: { status: string }) {
  return (
    <div
      className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${getStatusBannerClass(
        status
      )}`}
    >
      {status}
    </div>
  );
}

export default function EngagePage() {
  // `useSearchParams` in App Router should be wrapped in Suspense.
  return (
    <Suspense fallback={<EngagePageLoadingState />}>
      <EngagePageContent />
    </Suspense>
  );
}

function EngagePageContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  // Guard query param reads to post-mount to avoid hydration mismatch.
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
            <div className="w-full p-[2px] rounded-xl bg-gradient-to-r from-[#FF9C4C] to-[#FF5C86]">
              <div className="w-full rounded-[10px] bg-white px-4 py-6">
                <div className="text-center mb-6">
                  <div className="mb-6 flex justify-center">
                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className={WAND_ICON_CLASS}
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-[#363062] mb-2">
                    Engagement Rewards
                  </h2>
                  <p className="text-sm text-[#625C89]">Loading...</p>
                </div>
              </div>
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
          <div className="w-full p-[2px] rounded-xl bg-gradient-to-r from-[#FF9C4C] to-[#FF5C86]">
            <div className="w-full rounded-[10px] bg-white px-4 py-6">
              <div className="text-center mb-6">
                <div className="mb-6 flex justify-center">
                  <FontAwesomeIcon
                    icon={faWandMagicSparkles}
                    className={WAND_ICON_CLASS}
                  />
                </div>
                <h2 className="text-2xl font-bold text-[#363062] mb-2">
                  Engagement Rewards
                </h2>
                <p className="text-sm text-[#625C89]">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mirrors every reasonCode from /api/engagementRewards/eligibility plus
// client-only codes (ERROR, UNKNOWN). Keep backend codes in sync with
// EligibilityReason in route.ts.
const statusByReasonCode = {
  MISSING_PARTICIPANT_ID:
    "Your id is missing. Please use a valid link from Pax.",
  MISSING_WALLET_ADDRESS: "Please connect your wallet to check eligibility.",
  MISSING_APP_ADDRESS:
    "Rewards are temporarily unavailable. Please try again later or contact support.",
  PARTICIPANT_NOT_FOUND: "It seems you are not registered on Pax yet.",
  INSUFFICIENT_TASK_COMPLETIONS:
    "Complete at least two tasks on Pax before claiming engagement rewards.",
  INVALID_TASK_COMPLETION_DATA:
    "We could not verify your task history. Please contact support.",
  REWARD_ON_COOLDOWN:
    "Your latest task was completed recently. You can claim 24 hours after that completion.",
  UNREGISTERED_WITHDRAWAL_WALLET:
    "Your connected wallet is not registered as your withdrawal method on Pax.",
  WALLET_NOT_WHITELISTED:
    "Your wallet is not whitelisted. Please complete face verification first.",
  ENGAGEMENT_CLAIM_ON_COOLDOWN:
    "You have already claimed your engagement reward. You can claim again after the 180-day cooldown.",
  ELIGIBLE: "Eligible for engagement rewards.",
  SERVER_ERROR: "Unable to verify eligibility right now. Please try again.",
  ERROR: "Unable to verify eligibility right now.",
  UNKNOWN: "Unable to verify eligibility. Please try again.",
} as const satisfies Record<string, string>;

function getStatusMessage(reason: string): string {
  return (
    statusByReasonCode[reason as keyof typeof statusByReasonCode] ??
    statusByReasonCode.UNKNOWN
  );
}

// Renders a long-duration cooldown as a human-readable date instead of
// HH:MM:SS, because a 180-day countdown displayed as "4319:59:59" gives the
// user no useful information at a glance.
function formatEligibleAtDate(eligibleAt: number): string {
  return new Date(eligibleAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

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
  // We store reason + eligibleAt separately so UI can show rich context
  // (like countdown) without overloading the message string.
  const [precheckReasonCode, setPrecheckReasonCode] = useState<string>("");
  const [precheckEligibleAt, setPrecheckEligibleAt] = useState<number | undefined>(
    undefined
  );
  const countdown = useCountdown(
    precheckState === "ineligible" && precheckReasonCode === "REWARD_ON_COOLDOWN"
      ? precheckEligibleAt
      : undefined
  );
  // Claim is only possible after precheck confirms eligibility and all runtime
  // dependencies are available.
  const canClaim =
    precheckState === "eligible" &&
    isConnected &&
    !isLoading &&
    Boolean(participantId) &&
    Boolean(engagementRewards);

  const fetchEligibility = async (
    targetParticipantId: string,
    targetWalletAddress: string
  ) => {
    const eligibilityResponse = await fetch(
      "/api/engagementRewards/eligibility",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId: targetParticipantId,
          walletAddress: targetWalletAddress,
        }),
      }
    );
    // Backend can omit fields in error states, so we parse as Partial.
    const eligibility =
      (await eligibilityResponse.json()) as Partial<EligibilityResponse>;
    return { eligibilityResponse, eligibility };
  };

  useEffect(() => {
    if (!participantId) {
      setPrecheckState("ineligible");
      setPrecheckMessage(getStatusMessage("MISSING_PARTICIPANT_ID"));
      setPrecheckReasonCode("MISSING_PARTICIPANT_ID");
      setPrecheckEligibleAt(undefined);
      return;
    }

    if (!userAddress) {
      setPrecheckState("ineligible");
      setPrecheckMessage(getStatusMessage("MISSING_WALLET_ADDRESS"));
      setPrecheckReasonCode("MISSING_WALLET_ADDRESS");
      setPrecheckEligibleAt(undefined);
      return;
    }

    let cancelled = false;

    const runPrecheck = async () => {
      setPrecheckState("checking");
      setPrecheckMessage("Checking engagement eligibility...");
      try {
        const { eligibilityResponse, eligibility } = await fetchEligibility(
          participantId,
          userAddress
        );
        if (cancelled) return;

        if (!eligibilityResponse.ok || !eligibility.eligible) {
          const reason = eligibility.reasonCode ?? "UNKNOWN";
          setPrecheckState("ineligible");
          setPrecheckReasonCode(reason);
          setPrecheckEligibleAt(
            typeof eligibility.eligibleAt === "number"
              ? eligibility.eligibleAt
              : undefined
          );
          setPrecheckMessage(getStatusMessage(reason));
          return;
        }

        setPrecheckState("eligible");
        setPrecheckReasonCode("ELIGIBLE");
        setPrecheckEligibleAt(undefined);
        setPrecheckMessage(getStatusMessage("ELIGIBLE"));
      } catch {
        if (cancelled) return;
        setPrecheckState("error");
        setPrecheckReasonCode("ERROR");
        setPrecheckEligibleAt(undefined);
        setPrecheckMessage(getStatusMessage("ERROR"));
      }
    };

    runPrecheck();
    return () => {
      // Prevent older async calls from mutating state after dependency changes.
      cancelled = true;
    };
  }, [participantId, userAddress]);

  const handleClaim = async () => {
    if (!engagementRewards) {
      setStatus("Engagement rewards SDK is still loading. Please try again.");
      return;
    }

    if (!participantId) {
      setStatus(getStatusMessage("MISSING_PARTICIPANT_ID"));
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
      // Re-run eligibility at click time to avoid stale page-level precheck.
      const { eligibilityResponse, eligibility } = await fetchEligibility(
        participantId,
        userAddress
      );

      if (!eligibilityResponse.ok || !eligibility.eligible) {
        const reason = eligibility.reasonCode ?? "UNKNOWN";
        setStatus(getStatusMessage(reason));
        return;
      }

      setStatus("User eligible, preparing claim...");
      // Short block window keeps signatures fresh while allowing wallet signing.
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
      // Distinguish ad-attributed conversions when fbclid exists.
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
      // Extract concise revert reasons from viem errors to avoid showing
      // low-level call details in the UI.
      let revertReason: string | undefined;
      if (error instanceof ContractFunctionExecutionError) {
        const cause = error.cause;
        if (cause instanceof ContractFunctionRevertedError) {
          revertReason = cause.reason;
        }
      }

      const message =
        revertReason ??
        (error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "");

      const cleanClaimErrorPrefix = (value: string) =>
        value.replace(/^(?:claim failed:\s*)+/i, "").trim();

      if (message.includes("Claim cooldown not reached")) {
        setStatus("You already claimed. Try again after the cooldown period.");
      } else if (message === "App not approved or registered") {
        setStatus(
          "This app is not approved for engagement rewards. Please contact support."
        );
      } else if (revertReason) {
        const normalizedRevertReason = cleanClaimErrorPrefix(revertReason);
        setStatus(
          normalizedRevertReason
            ? `Claim failed: ${normalizedRevertReason}`
            : "Claim failed."
        );
      } else {
        const normalizedMessage = cleanClaimErrorPrefix(message);
        setStatus(
          normalizedMessage ? `Claim failed: ${normalizedMessage}` : "Claim failed."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      <div className="w-full rounded-xl bg-white px-4 py-6">
          <div className="text-center mb-6">
            <div className="mb-6 flex justify-center">
              <FontAwesomeIcon
                icon={faWandMagicSparkles}
                className={WAND_ICON_CLASS}
              />
            </div>
            <h2 className="text-2xl font-bold text-[#363062] mb-2">
              Engagement Rewards
            </h2>
            <p className="text-sm text-[#625C89]">Claim your 750 G$ for being awesome!</p>
          </div>

          <div className="w-full flex justify-center">
            <Button
              onClick={handleClaim}
              disabled={!canClaim}
              className="w-full text-sm px-6 py-3"
            >
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Processing...
                </>
              ) : (
                "Claim G$ NOW!"
              )}
            </Button>
          </div>
      </div>

      {precheckState !== "idle" && (
        <PrecheckBanner
          state={precheckState}
          message={precheckMessage}
          reasonCode={precheckReasonCode}
          countdown={countdown}
          eligibleAt={precheckEligibleAt}
        />
      )}

      {status && <StatusBanner status={status} />}

      {!participantId && (
        <p className="text-sm text-[#625C89] text-center">
          Missing participantId in the URL.
        </p>
      )}

      {!isConnected && (
        <p className="text-sm text-[#625C89] text-center">
          Connect your wallet to claim rewards
        </p>
      )}
    </div>
  );
}