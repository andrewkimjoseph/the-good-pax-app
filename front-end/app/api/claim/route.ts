import { NextRequest, NextResponse } from "next/server";
import { isAddress, type Address } from "viem";
import { getCelinaClient } from "@/lib/celina";

function parseAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value)) {
    return null;
  }
  return value;
}

/**
 * GET /api/claim?address=0x…
 * Returns GoodDollar UBI eligibility via Celina.
 */
export async function GET(request: NextRequest) {
  const address = parseAddress(request.nextUrl.searchParams.get("address"));
  if (!address) {
    return NextResponse.json(
      { error: "Valid address query param is required" },
      { status: 400 },
    );
  }

  try {
    const celina = getCelinaClient();
    const eligibility = await celina.gooddollar.getUbiClaimEligibility(address);

    return NextResponse.json({
      isEligibleToClaim: eligibility.isEligibleToClaim,
      claimableAmount: eligibility.claimableAmount,
      claimableAmountFormatted: eligibility.claimableAmountFormatted,
      alreadyClaimedToday: eligibility.alreadyClaimedToday,
      nextClaimAvailableAt: eligibility.nextClaimAvailableAt,
      secondsUntilNextClaim: eligibility.secondsUntilNextClaim,
      reasons: eligibility.reasons,
      isWhitelisted: eligibility.identity.isWhitelisted,
      whitelistedRoot: eligibility.whitelistedRoot,
    });
  } catch (error) {
    console.error("GET /api/claim eligibility failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to check eligibility";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/claim
 * Body: { address }
 * Returns unsigned Celina SerializedPreparedFlow for daily UBI claim.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const address = parseAddress(
    body && typeof body === "object" && "address" in body
      ? (body as { address: unknown }).address
      : null,
  );
  if (!address) {
    return NextResponse.json(
      { error: "Valid address is required" },
      { status: 400 },
    );
  }

  try {
    const celina = getCelinaClient();
    const prepared = await celina.gooddollar.prepareClaimUbi(address);
    return NextResponse.json(prepared);
  } catch (error) {
    console.error("POST /api/claim prepare failed:", error);
    const message =
      error instanceof Error ? error.message : "Failed to prepare claim";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
