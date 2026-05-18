// Minimal ABI for the on-chain claim-cooldown precheck.
// The full EngagementRewards contract is large; we only need the public
// userRegistrations mapping getter to learn when the user last claimed for
// our app, plus the CLAIM_COOLDOWN constant so the cooldown window stays in
// sync with the contract without being hard-coded in two places.
export const engagementRewardsABI = [
  {
    name: "userRegistrations",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "app", type: "address" },
      { name: "user", type: "address" },
    ],
    outputs: [
      { name: "isRegistered", type: "uint32" },
      { name: "lastClaimTimestamp", type: "uint32" },
    ],
  },
  {
    name: "CLAIM_COOLDOWN",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
