import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTIONS = {
  PARTICIPANTS: "participants",
  TASK_COMPLETIONS: "task_completions",
} as const;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"
  | "PARTICIPANT_NOT_FOUND"
  | "NO_VALID_TASK_COMPLETION"
  | "ELIGIBLE";

function computeEligibleAt(timeCreated: Timestamp): number {
  return timeCreated.toMillis() + TWENTY_FOUR_HOURS_MS;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // Trim guards against accidental leading/trailing whitespace in links.
    const participantId = searchParams.get("participantId")?.trim();

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
    const isTimestamp = timeCreated instanceof Timestamp;

    if (!isTimestamp) {
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
