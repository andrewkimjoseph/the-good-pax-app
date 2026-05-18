import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { type Address } from "viem";
import { IDENTITY_PROXY_CONTRACT_ADDRESS, PUBLIC_CLIENT } from "./config";
import { identityABI } from "./abis/identity";

// Collection name constants are centralised here so that a Firestore rename
// only requires a single-point change rather than hunting through the handler.
const COLLECTIONS = {
  PARTICIPANTS: "participants",
  TASK_COMPLETIONS: "task_completions",
  PAYMENT_METHODS: "payment_methods",
} as const;

// The engagement reward unlocks exactly 24 hours after the participant's most
// recent valid task completion.  Storing the duration as a named constant
// makes the business rule self-documenting and easy to adjust.
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// A discriminated union of every outcome this endpoint can return lets the
// client switch on a stable string code rather than interpreting HTTP status
// codes alone.  Each variant maps to exactly one failure mode so the client
// can surface the right message or UI without inspecting HTTP status codes.
// "SERVER_ERROR" is intentionally omitted here because it is only ever added
// inline at the catch site.
type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"           // participantId was absent or blank in the request body
  | "MISSING_WALLET_ADDRESS"           // walletAddress was absent or blank in the request body
  | "PARTICIPANT_NOT_FOUND"            // no Firestore document exists for the given participantId
  | "INSUFFICIENT_TASK_COMPLETIONS"    // participant has fewer than 2 valid task completions
  | "INVALID_TASK_COMPLETION_DATA"     // the most recent completion has a malformed timeCreated field
  | "REWARD_ON_COOLDOWN"               // the 24-hour lock after the latest completion has not yet expired
  | "UNREGISTERED_WITHDRAWAL_WALLET"   // the supplied wallet is not saved as a payment method for this participant
  | "WALLET_NOT_WHITELISTED"           // the wallet has not been approved on the on-chain Identity contract
  | "ELIGIBLE";                        // all conditions satisfied — reward can be claimed

// Returns the Unix-millisecond timestamp at which the participant becomes
// eligible based on when their most recent valid task completion was recorded.
// Keeping this calculation in a helper avoids duplicating the arithmetic and
// makes it trivial to change the unlock window in one place.
function computeEligibleAt(timeCreated: Timestamp): number {
  return timeCreated.toMillis() + TWENTY_FOUR_HOURS_MS;
}

// Calls the on-chain Identity proxy contract to verify that the given
// externally-owned address has been whitelisted by the Pax protocol.
// The identity tuple returned by the contract stores the account status at
// index 4; a value of 1 means the address is active and whitelisted.
async function isWalletWhitelisted(eoAddress: Address): Promise<boolean> {
  const identity = await PUBLIC_CLIENT.readContract({
    address: IDENTITY_PROXY_CONTRACT_ADDRESS,
    abi: identityABI,
    functionName: "identities",
    args: [eoAddress],
  });

  // Index 4 of the identity tuple is the numeric status flag.
  // 1 = whitelisted/active; any other value (0, 2, …) means the address
  // has not been approved or has been revoked.
  const status = Number(identity[4]);
  return status === 1;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Trim both inputs up-front so that accidental surrounding whitespace from
    // the client never causes a false-negative lookup in Firestore or an
    // address mismatch in the wallet comparison below.
    const participantId = body?.participantId?.trim();
    const walletAddress = body?.walletAddress?.trim();

    // Both fields are mandatory.  Return 400 immediately if either is absent
    // so downstream Firestore reads are never issued for a request that cannot
    // possibly succeed.
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

    // Verify participant existence before running any eligibility logic.
    // Every subsequent check is scoped to a known Pax participant, so there
    // is no meaningful result to return if the ID does not exist in Firestore.
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

    // Fetch the two most recent valid task completions for this participant.
    // Two documents are required because the engagement reward is only
    // available to participants who have completed at least two tasks — a
    // single completion is insufficient to qualify.  Ordering by timeCreated
    // descending guarantees that docs[0] is always the newest, which is the
    // one used to compute the 24-hour countdown: if the latest completion has
    // already passed the delay window, the earlier one is guaranteed to have
    // passed it too.  Limiting to 2 keeps the read cost minimal.
    const latestValidTaskCompletionSnapshot = await paxDB
      .collection(COLLECTIONS.TASK_COMPLETIONS)
      .where("participantId", "==", participantId)
      .where("isValid", "==", true)
      .orderBy("timeCreated", "desc")
      .limit(2)
      .get();

    // Fewer than 2 valid completions means the participant has not yet met the
    // minimum task threshold and is therefore not eligible for an engagement
    // reward regardless of timing.
    if (latestValidTaskCompletionSnapshot.size < 2) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "INSUFFICIENT_TASK_COMPLETIONS" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    // docs[0] is the most recent valid completion because the query is ordered
    // by timeCreated descending.
    const latestValidTaskCompletion =
      latestValidTaskCompletionSnapshot.docs[0].data();
    const timeCreated = latestValidTaskCompletion.timeCreated;

    // Firestore Admin SDK should always deserialise Firestore timestamp fields
    // as Timestamp instances.  This instanceof guard is a defensive check
    // against malformed or legacy documents in historical data that might have
    // stored the field as a plain number or string, which would cause
    // computeEligibleAt to crash at runtime.
    if (!(timeCreated instanceof Timestamp)) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "INVALID_TASK_COMPLETION_DATA" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    // Compute the exact millisecond at which the 24-hour lock expires.
    // Returning eligibleAt in the response body lets the client render a live
    // countdown timer without needing to poll this endpoint repeatedly — the
    // client can calculate the remaining time locally until the value expires.
    const eligibleAt = computeEligibleAt(timeCreated);

    if (Date.now() < eligibleAt) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "REWARD_ON_COOLDOWN" as EligibilityReason,
          eligibleAt,
        },
        { status: 403 }
      );
    }

    // Confirm that the wallet address supplied by the caller matches at least
    // one of the payment methods registered to this participant in Firestore.
    // The comparison is case-insensitive because Ethereum addresses are
    // conventionally checksummed (mixed-case) but may arrive in any casing
    // from different clients or wallets.
    const paymentMethodsSnapshot = await paxDB
      .collection(COLLECTIONS.PAYMENT_METHODS)
      .where("participantId", "==", participantId)
      .get();

    const walletMatched = paymentMethodsSnapshot.docs.some((doc) => {
      const paymentMethod = doc.data();
      const paymentMethodWalletAddress = paymentMethod.walletAddress;

      // Reject the document if walletAddress is not a string to guard against
      // malformed payment method records that would otherwise throw on
      // .toLowerCase().
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
          reasonCode: "UNREGISTERED_WITHDRAWAL_WALLET" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    // As the final gate, verify on-chain that the wallet is whitelisted by the
    // Pax Identity contract.  This check is intentionally deferred until after
    // all cheaper Firestore checks have passed so that on-chain RPC calls are
    // only made for participants who have already cleared every off-chain
    // eligibility condition.
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

    // All eligibility conditions are satisfied: the participant exists, has at
    // least two valid task completions with the most recent one older than
    // 24 hours, owns a registered withdrawal wallet, and that wallet is
    // whitelisted on-chain.
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
