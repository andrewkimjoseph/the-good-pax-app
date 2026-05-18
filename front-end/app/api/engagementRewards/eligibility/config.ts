import { createPublicClient, http, type Address } from "viem";
import { celo } from "viem/chains";

export const IDENTITY_PROXY_CONTRACT_ADDRESS =
  "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as Address;

// EngagementRewards UUPS proxy on Celo. This is the same address the
// front-end uses via `useEngagementRewards`. Hard-coding it here mirrors the
// identity contract pattern so the precheck endpoint stays self-contained.
export const ENGAGEMENT_REWARDS_PROXY_CONTRACT_ADDRESS =
  "0x25db74CF4E7BA120526fd87e159CF656d94bAE43" as Address;

// The on-chain claim ledger is keyed by (app, user). NEXT_PUBLIC_APP_ADDRESS
// is the address registered with the EngagementRewards contract for this app
// and is available server-side because Next.js inlines NEXT_PUBLIC_* into
// every runtime, including route handlers.
export const APP_ADDRESS = process.env.NEXT_PUBLIC_APP_ADDRESS as
  | Address
  | undefined;

export const PUBLIC_CLIENT = createPublicClient({
  chain: celo,
  transport: http(),
});
