export const identityABI = [
  {
    name: "identities",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [
      { name: "dateAuthenticated", type: "uint256" },
      { name: "dateAdded", type: "uint256" },
      { name: "did", type: "string" },
      { name: "whitelistedOnChainId", type: "uint256" },
      { name: "status", type: "uint8" },
      { name: "authCount", type: "uint32" },
    ],
  },
  // EngagementRewards keys claim records by the whitelisted root rather than
  // the EOA, so we need this getter to look up cooldown state for any wallet
  // that belongs to an identity with a different root.
  {
    name: "getWhitelistedRoot",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "root", type: "address" }],
  },
] as const;
