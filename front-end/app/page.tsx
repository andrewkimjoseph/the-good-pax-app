"use client";
import { useState } from "react";
import { useAccount } from "wagmi";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList
} from "@/components/ui/navigation-menu";

export default function Home() {
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <ConnectButton />
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <DevRewards />
      </div>
    </div>
  );
}

import { useEngagementRewards } from '@goodsdks/engagement-sdk'
import { checkIfEngagementRewardsTransactionReverted } from '@/services/checkIfEngagementRewardsTransactionReverted'

// Configuration constants - replace with your actual values
const APP_ADDRESS = process.env.NEXT_PUBLIC_APP_ADDRESS as `0x${string}` || "0x1234567890abcdef1234567890abcdef12345678"
const INVITER_ADDRESS = process.env.NEXT_PUBLIC_INVITER_ADDRESS as `0x${string}` || "0xabcdef1234567890abcdef1234567890abcdef12"

// Helper function to call our API route
async function getAppSignature(params: {
  user: string
  validUntilBlock: string
  inviter: string
}): Promise<string> {
  const response = await fetch('/api/getAppSignature', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get app signature')
  }

  const data = await response.json()
  return data.signature
}

const DevRewards = () => {
  const { address: userAddress, isConnected } = useAccount()
  const engagementRewards = useEngagementRewards("0x25db74CF4E7BA120526fd87e159CF656d94bAE43")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<string>("")
  
  // SDK is ready when hook returns non-null
  if (!engagementRewards) return null

  const handleClaim = async () => {
    if (!userAddress || !isConnected) {
      setStatus("Please connect your wallet first")
      return
    }

    setIsLoading(true)
    setStatus("Processing claim...")

    try {
      // First check if user can claim

      console.log("Checking user eligibility...")
      console.log("APP_ADDRESS", APP_ADDRESS)
      console.log("userAddress", userAddress)
      // const isEligible = await engagementRewards.canClaim(APP_ADDRESS, userAddress).catch(_ => false)
      // if (!isEligible) {
      //   throw new Error("User not eligible to claim")
      // }

      setStatus("User eligible, preparing claim...")

      // Get current block and prepare signature if needed
      const currentBlock = await engagementRewards.getCurrentBlockNumber()
      const validUntilBlock = currentBlock + BigInt(20) // Valid for 10 blocks

      setStatus("Generating user signature...")

      // Generate user signature (required for nonContractAppClaim)
      const userSignature = await engagementRewards.signClaim(
        APP_ADDRESS,
        INVITER_ADDRESS,
        validUntilBlock
      )

      setStatus("Getting app signature...")

      // Get app signature from backend
      const appSignature = await getAppSignature({
        user: userAddress,
        validUntilBlock: validUntilBlock.toString(),
        inviter: INVITER_ADDRESS
      })
        
      setStatus("Submitting claim...")

      // Submit claim
      const receipt = await engagementRewards.nonContractAppClaim(
        APP_ADDRESS,
        INVITER_ADDRESS,
        validUntilBlock,
        userSignature as `0x${string}`,
        appSignature as `0x${string}`
      )

      // Check if transaction reverted
      setStatus("Checking transaction status...")
      const transactionReverted = await checkIfEngagementRewardsTransactionReverted(receipt.transactionHash)
      
      if (transactionReverted) {
        setStatus(`Claim failed: Transaction reverted. Transaction: ${receipt.transactionHash}`)
      } else {
        setStatus(`Claim successful! Transaction: ${receipt.transactionHash}`)
      }
      
    } catch (error) {
      console.error("Claim failed:", error)
      setStatus(`Claim failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs mx-auto px-4">
      <div className="w-full flex justify-center">
        <Button 
          onClick={handleClaim} 
          disabled={!isConnected || isLoading}
          className="w-full max-w-xs text-sm px-4 py-2"
        >
          {isLoading ? "Processing..." : "Claim 3,000 GoodDollar Tokens NOW"}
        </Button>
      </div>
      
      {status && (
        <div className={`text-xs p-3 rounded-md w-full text-left break-words overflow-wrap-anywhere ${
          status.includes('successful') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : status.includes('failed') || status.includes('error')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {status}
        </div>
      )}
      
      {!isConnected && (
        <p className="text-sm text-gray-600 text-center">
          Connect your wallet to claim rewards
        </p>
      )}
    </div>
  )
}
