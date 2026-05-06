import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTIONS = {
  PARTICIPANTS: "participants",
  TASK_COMPLETIONS: "task_completions",
} as const;

type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"
  | "PARTICIPANT_NOT_FOUND"
  | "NO_VALID_TASK_COMPLETION"
  | "ELIGIBLE";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    const eligibleAt = timeCreated.toMillis() + 24 * 60 * 60 * 1000;

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
