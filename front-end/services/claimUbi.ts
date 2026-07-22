import type { Address, Hex, PublicClient, WalletClient } from "viem";

export type ClaimEligibility = {
  isEligibleToClaim: boolean;
  claimableAmount: string;
  claimableAmountFormatted: string;
  alreadyClaimedToday: boolean;
  nextClaimAvailableAt: string;
  secondsUntilNextClaim: string;
  reasons: string[];
  isWhitelisted: boolean;
  whitelistedRoot: `0x${string}` | null;
};

export type PreparedClaimStep = {
  kind: string;
  to: `0x${string}`;
  data?: `0x${string}`;
  value?: string;
  description: string;
};

export type PreparedClaimFlow = {
  preparedFlow: true;
  steps: PreparedClaimStep[];
  summary: string;
  chainId: number;
  from: `0x${string}`;
};

export async function fetchClaimEligibility(
  address: Address,
): Promise<ClaimEligibility> {
  const response = await fetch(
    `/api/claim?address=${encodeURIComponent(address)}`,
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to check eligibility",
    );
  }
  return data as ClaimEligibility;
}

export async function prepareAndSendClaimUbi({
  address,
  walletClient,
  publicClient,
}: {
  address: Address;
  walletClient: WalletClient;
  publicClient: PublicClient;
}): Promise<{ transactionHash: Hex; status: "success" | "reverted" }> {
  const response = await fetch("/api/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Failed to prepare claim",
    );
  }

  const prepared = data as PreparedClaimFlow;
  if (!prepared.preparedFlow || !Array.isArray(prepared.steps) || prepared.steps.length === 0) {
    throw new Error("Prepare claim returned no transaction steps");
  }

  let lastHash: Hex | undefined;
  let lastStatus: "success" | "reverted" = "success";

  for (const step of prepared.steps) {
    if (!step.to) {
      throw new Error("Prepared claim step is missing `to`");
    }

    const hash = await walletClient.sendTransaction({
      account: address,
      chain: walletClient.chain,
      to: step.to,
      data: step.data,
      value: step.value ? BigInt(step.value) : undefined,
    });

    lastHash = hash;
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    lastStatus = receipt.status === "success" ? "success" : "reverted";
    if (lastStatus === "reverted") {
      break;
    }
  }

  if (!lastHash) {
    throw new Error("No transaction was submitted");
  }

  return { transactionHash: lastHash, status: lastStatus };
}
