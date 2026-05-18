import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { type Address, zeroAddress } from "viem";
import {
  APP_ADDRESS,
  ENGAGEMENT_REWARDS_PROXY_CONTRACT_ADDRESS,
  IDENTITY_PROXY_CONTRACT_ADDRESS,
  PUBLIC_CLIENT,
} from "./config";
import { identityABI } from "./abis/identity";
import { engagementRewardsABI } from "./abis/engagementRewards";

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

// The EngagementRewards contract enforces a 180-day claim cooldown per
// (app, user). We mirror the constant client-side so the precheck can compute
// the next eligible-at timestamp without an extra RPC round-trip; if the
// contract value ever drifts, the on-chain claim itself will still revert as
// the source of truth.
const CLAIM_COOLDOWN_MS = 180 * 24 * 60 * 60 * 1000;

// A discriminated union of every outcome this endpoint can return lets the
// client switch on a stable string code rather than interpreting HTTP status
// codes alone.  Each variant maps to exactly one failure mode so the client
// can surface the right message or UI without inspecting HTTP status codes.
// "SERVER_ERROR" is intentionally omitted here because it is only ever added
// inline at the catch site.
type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"           // participantId was absent or blank in the request body
  | "MISSING_WALLET_ADDRESS"           // walletAddress was absent or blank in the request body
  | "MISSING_APP_ADDRESS"              // server is missing NEXT_PUBLIC_APP_ADDRESS configuration
  | "PARTICIPANT_NOT_FOUND"            // no Firestore document exists for the given participantId
  | "INSUFFICIENT_TASK_COMPLETIONS"    // participant has fewer than 2 valid task completions
  | "INVALID_TASK_COMPLETION_DATA"     // the most recent completion has a malformed timeCreated field
  | "REWARD_ON_COOLDOWN"               // the 24-hour lock after the latest completion has not yet expired
  | "UNREGISTERED_WITHDRAWAL_WALLET"   // the supplied wallet is not saved as a payment method for this participant
  | "WALLET_NOT_WHITELISTED"           // the wallet has not been approved on the on-chain Identity contract
  | "ENGAGEMENT_CLAIM_ON_COOLDOWN"     // the wallet (resolved to its whitelisted root) has already claimed this app within the on-chain 180-day cooldown
  | "ELIGIBLE";                        // all conditions satisfied — reward can be claimed

// Returns the Unix-millisecond timestamp at which the participant becomes
// eligible based on when their most recent valid task completion was recorded.
// Keeping this calculation in a helper avoids duplicating the arithmetic and
// makes it trivial to change the unlock window in one place.
function computeEligibleAt(timeCreated: Timestamp): number {
  return timeCreated.toMillis() + TWENTY_FOUR_HOURS_MS;
}

// Result of the on-chain precheck. We resolve everything we need from the
// chain in one multicall so callers don't have to orchestrate parallel reads
// or distinguish "wallet not whitelisted" vs "already claimed" themselves.
type OnChainStatus =
  | { kind: "not_whitelisted" }
  | { kind: "on_cooldown"; eligibleAt: number }
  | { kind: "ok" };

// Performs the on-chain portion of the eligibility check in a single RPC
// round-trip:
//   1. `identities(wallet)` — status flag at tuple index 4 must be 1 for the
//      wallet to be considered whitelisted. Any other value (0, 2, …) means
//      the address has not been approved or has been revoked.
//   2. `getWhitelistedRoot(wallet)` — claim records on EngagementRewards are
//      keyed by the identity *root*, not the EOA. Resolving the root here
//      means we never miss a prior claim made from a different sub-wallet
//      bound to the same identity.
//   3. `userRegistrations(app, root)` — returns `(isRegistered,
//      lastClaimTimestamp)`. We only care about `lastClaimTimestamp`; a zero
//      value means the user has never claimed for this app.
async function checkOnChainStatus(
  walletAddress: Address,
  appAddress: Address
): Promise<OnChainStatus> {
  const [identityResult, rootResult, registrationResult] =
    await PUBLIC_CLIENT.multicall({
      // `allowFailure: true` keeps a single sub-call's revert from poisoning
      // the entire batch — we want to surface a precise reason rather than
      // bubbling up a generic multicall error.
      allowFailure: true,
      contracts: [
        {
          address: IDENTITY_PROXY_CONTRACT_ADDRESS,
          abi: identityABI,
          functionName: "identities",
          args: [walletAddress],
        },
        {
          address: IDENTITY_PROXY_CONTRACT_ADDRESS,
          abi: identityABI,
          functionName: "getWhitelistedRoot",
          args: [walletAddress],
        },
        {
          address: ENGAGEMENT_REWARDS_PROXY_CONTRACT_ADDRESS,
          abi: engagementRewardsABI,
          functionName: "userRegistrations",
          // The root must be resolved before we can key into this mapping,
          // but multicall evaluates all calls against the same block, so we
          // pre-compute with the wallet address and re-key below if the root
          // differs. Using the wallet here as a sentinel keeps the request
          // size constant; the response is only consulted when root == wallet.
          args: [appAddress, walletAddress],
        },
      ],
    });

  if (identityResult.status !== "success") {
    // If the identity read itself fails (e.g. RPC hiccup), treat the wallet
    // as not whitelisted so the user is told to verify rather than silently
    // erroring further down the pipeline.
    return { kind: "not_whitelisted" };
  }

  const status = Number(identityResult.result[4]);
  if (status !== 1) {
    return { kind: "not_whitelisted" };
  }

  // If `getWhitelistedRoot` reverts or returns the zero address, the wallet
  // isn't bound to a recognised identity root and we cannot resolve its
  // claim history. Erring on the side of "not whitelisted" is consistent
  // with the existing UX copy and matches what the contract would do at
  // claim time.
  if (
    rootResult.status !== "success" ||
    rootResult.result === zeroAddress
  ) {
    return { kind: "not_whitelisted" };
  }

  const root = rootResult.result as Address;

  // Re-read userRegistrations against the actual root if it differs from the
  // EOA we used in the initial multicall. This is the common case for users
  // who manage multiple wallets under a single Pax identity.
  let lastClaimTimestamp: number;
  if (root.toLowerCase() === walletAddress.toLowerCase()) {
    if (registrationResult.status !== "success") {
      // Treat an unreadable claim ledger as "no prior claim" so legitimate
      // first-time users aren't blocked by transient RPC failures; the
      // on-chain claim itself will revert if this turns out to be wrong.
      lastClaimTimestamp = 0;
    } else {
      lastClaimTimestamp = Number(registrationResult.result[1]);
    }
  } else {
    const rootRegistration = await PUBLIC_CLIENT.readContract({
      address: ENGAGEMENT_REWARDS_PROXY_CONTRACT_ADDRESS,
      abi: engagementRewardsABI,
      functionName: "userRegistrations",
      args: [appAddress, root],
    });
    lastClaimTimestamp = Number(rootRegistration[1]);
  }

  if (lastClaimTimestamp === 0) {
    return { kind: "ok" };
  }

  // Block timestamps and `CLAIM_COOLDOWN_MS` are both in seconds / ms since
  // the Unix epoch, so a direct addition gives the precise UTC instant the
  // 180-day cooldown elapses for this user.
  const eligibleAt = lastClaimTimestamp * 1000 + CLAIM_COOLDOWN_MS;
  if (Date.now() < eligibleAt) {
    return { kind: "on_cooldown", eligibleAt };
  }

  return { kind: "ok" };
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

    // The on-chain claim ledger lives in a contract that requires both the
    // EngagementRewards proxy and our registered app address to query. The
    // proxy is hard-coded in config; the app address comes from env. If env
    // isn't set the precheck cannot answer "has this user claimed?", so we
    // fail closed rather than silently letting users hit a reverting tx.
    if (!APP_ADDRESS) {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "MISSING_APP_ADDRESS" as EligibilityReason,
        },
        { status: 500 }
      );
    }

    // As the final gate, verify on-chain that (a) the wallet is whitelisted
    // by the Pax Identity contract and (b) the wallet's identity root has
    // not already claimed an engagement reward for this app within the
    // 180-day cooldown enforced by the EngagementRewards contract. These
    // checks are deliberately deferred until after the cheaper Firestore
    // gates so we only spend RPC quota on participants who have cleared
    // every off-chain condition.
    const onChainStatus = await checkOnChainStatus(
      walletAddress as Address,
      APP_ADDRESS
    );

    if (onChainStatus.kind === "not_whitelisted") {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "WALLET_NOT_WHITELISTED" as EligibilityReason,
        },
        { status: 403 }
      );
    }

    if (onChainStatus.kind === "on_cooldown") {
      return NextResponse.json(
        {
          eligible: false,
          participantExists: true,
          reasonCode: "ENGAGEMENT_CLAIM_ON_COOLDOWN" as EligibilityReason,
          eligibleAt: onChainStatus.eligibleAt,
        },
        { status: 403 }
      );
    }

    // All eligibility conditions are satisfied: the participant exists, has at
    // least two valid task completions with the most recent one older than
    // 24 hours, owns a registered withdrawal wallet, that wallet is
    // whitelisted on-chain, and the identity root has not claimed for this
    // app within the on-chain 180-day cooldown.
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
