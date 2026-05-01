import { NextRequest, NextResponse } from "next/server";
import { paxDB } from "@/lib/firebaseAdmin";

const COLLECTIONS = {
  PARTICIPANTS: "participants",
} as const;

type EligibilityReason =
  | "MISSING_PARTICIPANT_ID"
  | "PARTICIPANT_NOT_FOUND"
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
          reasonCode: "MISSING_PARTICIPANT_ID" satisfies EligibilityReason,
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
          reasonCode: "PARTICIPANT_NOT_FOUND" satisfies EligibilityReason,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      eligible: true,
      participantExists: true,
      reasonCode: "ELIGIBLE" satisfies EligibilityReason,
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
