import { createPublicClient, custom, http, keccak256 } from "viem";
import { celo } from "viem/chains";

export async function checkIfEngagementRewardsTransactionReverted(transactionHash: string) {

    const publicClient = createPublicClient({
        chain: celo,
        transport: custom(window.ethereum)
    })
    const txnReceipt = await publicClient.getTransactionReceipt({
        hash: transactionHash as `0x${string}`
    })
    return txnReceipt.status === "reverted";
}