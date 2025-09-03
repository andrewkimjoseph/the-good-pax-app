import { NextResponse } from 'next/server'
import { createWalletClient, http, createPublicClient } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { EngagementRewardsSDK } from '@goodsdks/engagement-sdk'

// App configuration from environment variables
const APP_PRIVATE_KEY = process.env.APP_PRIVATE_KEY! as `0x${string}`
const APP_ADDRESS = process.env.APP_ADDRESS! as `0x${string}`
const REWARDS_CONTRACT = process.env.REWARDS_CONTRACT! as `0x${string}`

// Initialize viem clients
const account = privateKeyToAccount(APP_PRIVATE_KEY)

// Create clients for Celo blockchain
const publicClient = createPublicClient({ 
  chain: celo,
  transport: http()
})

const walletClient = createWalletClient({ 
  chain: celo,
  transport: http(),
  account
})

// Function to initialize SDK when needed
function getEngagementRewardsSDK() {
  // Version compatibility issue between viem v2.37.1 and @goodsdks/engagement-sdk v1.0.1
  // The SDK expects a different transaction type interface than the current viem version provides
  // @ts-ignore - Suppress constructor argument type mismatch
  const sdk = new EngagementRewardsSDK(
    // @ts-ignore - Suppress publicClient type mismatch
    publicClient,
    // @ts-ignore - Suppress walletClient type mismatch  
    walletClient,
    REWARDS_CONTRACT
  )
  return sdk
}



// Helper function to log signature requests for auditing
async function logSignatureRequest(data: {
  app: string
  user: string
  inviter?: string
  validUntilBlock: string
  signature: string
}): Promise<void> {
  // This is a placeholder - implement your actual logging logic
  // Examples: save to database, send to logging service, etc.
  console.log('Signature request:', {
    timestamp: new Date().toISOString(),
    ...data
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user, validUntilBlock, inviter } = body

    // Validate required parameters
    if (!user || !validUntilBlock) {
      return NextResponse.json(
        { error: 'Missing required parameters: user and validUntilBlock are required' },
        { status: 400 }
      )
    }



    // Validate user address format
    if (!user.startsWith('0x') || user.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid user address format' },
        { status: 400 }
      )
    }

    // Validate validUntilBlock is a valid number
    const blockNumber = BigInt(validUntilBlock)
    if (blockNumber <= 0) {
      return NextResponse.json(
        { error: 'validUntilBlock must be a positive number' },
        { status: 400 }
      )
    }

    // Initialize and use SDK to prepare signature data
    const engagementRewards = getEngagementRewardsSDK()
    const { domain, types, message } = await engagementRewards.prepareAppSignature(
      APP_ADDRESS,
      user as `0x${string}`,
      blockNumber
    )

    // Sign the prepared data
    const signature = await walletClient.signTypedData({
      domain,
      types, 
      primaryType: 'AppClaim',
      message
    })

    // Log signature request for auditing
    await logSignatureRequest({
      app: APP_ADDRESS,
      user,
      inviter: inviter || '',
      validUntilBlock,
      signature
    })

    return NextResponse.json({ 
      signature,
      message: 'Signature generated successfully'
    })

  } catch (error) {
    console.error('Error signing message:', error)
    
    // Return appropriate error message
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to sign message: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to sign message' },
      { status: 500 }
    )
  }
}

// Optional: Add GET method for health check
export async function GET() {
  return NextResponse.json({ 
    message: 'getAppSignature API endpoint is running',
    timestamp: new Date().toISOString()
  })
}
