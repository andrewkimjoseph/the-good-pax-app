import { createCelinaClient } from "@andrewkimjoseph/celina-sdk";

type CelinaClient = ReturnType<typeof createCelinaClient>;

let cachedClient: CelinaClient | undefined;

function resolveRpcUrl(): string {
  if (process.env.CELO_RPC_URL_MAINNET) {
    return process.env.CELO_RPC_URL_MAINNET;
  }
  if (process.env.NEXT_PUBLIC_DRPC_API_KEY) {
    return `https://lb.drpc.live/celo/${process.env.NEXT_PUBLIC_DRPC_API_KEY}`;
  }
  return "https://forno.celo.org";
}

/**
 * Server-side Celina SDK client for `/api/claim`.
 * RPC: `CELO_RPC_URL_MAINNET`, else DRPC via `NEXT_PUBLIC_DRPC_API_KEY`, else Forno.
 */
export function getCelinaClient() {
  cachedClient ??= createCelinaClient({
    rpcUrl: resolveRpcUrl(),
    analyticsDeviceId: "thegoodpax",
    attributionTags: ["thegoodpax"],
  });
  return cachedClient;
}
