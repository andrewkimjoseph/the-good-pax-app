import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { type Address } from "viem";
import { IDENTITY_PROXY_CONTRACT_ADDRESS, PUBLIC_CLIENT } from "./config";
import { identityABI } from "./abis/identity";

const COLLECTIONS = {
  PARTICIPANTS: "participants",
  TASK_COMPLETIONS: "task_completions",
  PAYMENT_METHODS: "payment_methods",
} as const;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"
  | "MISSING_WALLET_ADDRESS"
  | "PARTICIPANT_NOT_FOUND"
  | "NO_VALID_TASK_COMPLETION"
  | "NO_MATCHING_WITHDRAWAL_METHOD"
  | "WALLET_NOT_WHITELISTED"
  | "ELIGIBLE";

function computeEligibleAt(timeCreated: Timestamp): number {
  return timeCreated.toMillis() + TWENTY_FOUR_HOURS_MS;
}

async function isWalletWhitelisted(eoAddress: Address): Promise<boolean> {
  const identity = await PUBLIC_CLIENT.readContract({
    address: IDENTITY_PROXY_CONTRACT_ADDRESS,
    abi: identityABI,
    functionName: "identities",
    args: [eoAddress],
  });

  const status = Number(identity[4]);
  return status === 1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const participantId = body?.participantId?.trim();
    const walletAddress = body?.walletAddress?.trim();

    if (!participantId) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: false,
          reasonCode: "MISSING_PARTICIPANT_ID" as EligibilityReason,
        },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: false,
          reasonCode: "MISSING_WALLET_ADDRESS" as EligibilityReason,
        },
        { status: 400 }
      );
    }

    // We verify participant existence first because all eligibility checks are scoped
    // to a known participant in Pax.
    const participantDoc = await paxDB
      .collection(COLLECTIONS.PARTICIPANTS)
      .doc(participantId)
      .get();

    if (!participantDoc.exists) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: false,
          reasonCode: "PARTICIPANT_NOT_FOUND" as EligibilityReason,
        },
        { status: 404 }
      );
    }

    // Fetch only the newest valid completion. If the latest valid item has already
    // passed the 24-hour delay, older items are guaranteed to pass as well.
    const latestValidTaskCompletionSnapshot = await paxDB
      .collection(COLLECTIONS.TASK_COMPLETIONS)
      .where("participantId", "==", participantId)
      .where("isValid", "==", true)
      .orderBy("timeCreated", "desc")
      .limit(1)
      .get();

    if (latestValidTaskCompletionSnapshot.empty) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "NO_VALID_TASK_COMPLETION" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    const latestValidTaskCompletion = latestValidTaskCompletionSnapshot.docs[0].data();
    const timeCreated = latestValidTaskCompletion.timeCreated;
    // Firestore Admin should return Timestamp for Firestore timestamp fields.
    // Keep this guard to avoid runtime crashes from malformed historical data.
    if (!(timeCreated instanceof Timestamp)) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "NO_VALID_TASK_COMPLETION" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    // Compute and return the exact unlock time so the client can render a live
    // countdown without issuing additional API calls.
    const eligibleAt = computeEligibleAt(timeCreated);

    if (Date.now() < eligibleAt) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "NO_VALID_TASK_COMPLETION" as EligibilityReason,
          eligibleAt,
        },
        { status: 403 }
      );
    }

    const paymentMethodsSnapshot = await paxDB
      .collection(COLLECTIONS.PAYMENT_METHODS)
      .where("participantId", "==", participantId)
      .get();

    const walletMatched = paymentMethodsSnapshot.docs.some((doc) => {
      const paymentMethod = doc.data();
      const paymentMethodWalletAddress = paymentMethod.walletAddress;

      return (
        typeof paymentMethodWalletAddress === "string" &&
        paymentMethodWalletAddress.toLowerCase() === walletAddress.toLowerCase()
      );
    });

    if (!walletMatched) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "NO_MATCHING_WITHDRAWAL_METHOD" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    const whitelisted = await isWalletWhitelisted(walletAddress as Address);

    if (!whitelisted) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "WALLET_NOT_WHITELISTED" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      eligible: true,
      participantExists: true,
      reasonCode: "ELIGIBLE" as EligibilityReason,
    });
  } catch (error) {
    console.error("Failed to check engagement rewards eligibility:", error);
    return NextResponse.json(
      {
        eligible: false,
        participantExists: false,
        reasonCode: "SERVER_ERROR",
        error: "Failed to check engagement eligibility",
      },
      { status: 500 }
    );
  }
}
