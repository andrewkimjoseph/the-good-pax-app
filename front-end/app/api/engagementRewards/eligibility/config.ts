import { createPublicClient, http, type Address } from "viem";
import { celo } from "viem/chains";

export const IDENTITY_PROXY_CONTRACT_ADDRESS =
  "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42" as Address;

export const PUBLIC_CLIENT = createPublicClient({
  chain: celo,
  transport: http(),
});
