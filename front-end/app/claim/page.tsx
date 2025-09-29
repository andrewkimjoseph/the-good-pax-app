"use client";
import { useState, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdentitySDK, ClaimSDK } from '@goodsdks/citizen-sdk';

export default function ClaimPage() {
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-start items-center">
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center pt-12">
        <ClaimComponent />
      </div>
    </div>
  );
}

const ClaimComponent = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [claimSDK, setClaimSDK] = useState<ClaimSDK | null>(null);
  const [entitlement, setEntitlement] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEntitlement, setIsCheckingEntitlement] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Initialize ClaimSDK when dependencies are ready
  useEffect(() => {
    const initClaimSDK = async () => {
      if (publicClient && walletClient && userAddress && isConnected) {
        try {
          // Create IdentitySDK instance using static init method
          const identitySDK = await IdentitySDK.init({
            publicClient,
            walletClient,
            env: 'production',
          });
          
          // Initialize ClaimSDK
          const sdk = await ClaimSDK.init({
            publicClient,
            walletClient,
            identitySDK,
            env: 'production',
          });
          setClaimSDK(sdk);
        } catch (error) {
          console.error('Failed to initialize ClaimSDK:', error);
          setError('Failed to initialize claim system');
        }
      }
    };

    initClaimSDK();
  }, [publicClient, walletClient, userAddress, isConnected]);

  // Check entitlement when SDK is ready and user is connected
  useEffect(() => {
    const checkEntitlement = async () => {
      if (claimSDK && userAddress && isConnected) {
        setIsCheckingEntitlement(true);
        setError("");
        try {
          const entitlementResult = await claimSDK.checkEntitlement();
          setEntitlement(entitlementResult.amount);
          console.log('Entitlement:', entitlementResult.amount.toString());
        } catch (error) {
          console.error('Entitlement check failed:', error);
          setError('Failed to check entitlement');
          setEntitlement(null);
        } finally {
          setIsCheckingEntitlement(false);
        }
      }
    };

    checkEntitlement();
  }, [claimSDK, userAddress, isConnected]);

  const handleClaim = async () => {
    if (!userAddress || !isConnected) {
      setStatus("Please connect your wallet first");
      return;
    }

    if (!claimSDK) {
      setStatus("Claim system not ready. Please try again.");
      return;
    }

    if (!entitlement || entitlement === BigInt(0)) {
      setStatus("No entitlement available to claim");
      return;
    }

    setIsLoading(true);
    setStatus("Processing claim...");
    setError("");

    try {
      await claimSDK.claim();
      setStatus("Claim successful! Check your wallet for the G$ tokens.");
      // Refresh entitlement after successful claim
      const newEntitlementResult = await claimSDK.checkEntitlement();
      setEntitlement(newEntitlementResult.amount);
    } catch (error) {
      console.error('Claim failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Claim failed: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatEntitlement = (amount: bigint) => {
    // Assuming the entitlement is in wei or similar base units
    // Convert to a more readable format
    const formatted = Number(amount) / Math.pow(10, 18); // Assuming 18 decimals
    return formatted.toFixed(4);
  };

  const hasEntitlement = entitlement && entitlement > BigInt(0);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
      <div className="text-center mb-6">
        <div className="mb-6 flex justify-center">
          <Gift className="h-20 w-20 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Claim Your UBI
        </h2>
        <p className="text-sm text-gray-600">
          Check your entitlement and claim available G$ (GoodDollar)
        </p>
      </div>

      {/* Entitlement Status */}
      <div className="w-full">
        <div className="flex items-center justify-center gap-3 mb-4">
          {isCheckingEntitlement ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          ) : hasEntitlement ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )}
          <span className="text-sm text-gray-600">
            {isCheckingEntitlement
              ? "Checking entitlement..."
              : hasEntitlement
            ? `Entitlement: ${formatEntitlement(entitlement!)} G$`
            : "No entitlement available"}
          </span>
        </div>

        {entitlement !== null && !isCheckingEntitlement && (
          <div className={`text-xs p-3 rounded-md w-full text-center mb-4 ${
            hasEntitlement
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            {hasEntitlement
              ? `You have ${formatEntitlement(entitlement)} G$ available to claim`
              : "No G$ currently available for claiming for you"}
          </div>
        )}
      </div>

      {/* Claim Button */}
      <div className="w-full flex justify-center">
        <Button 
          onClick={handleClaim} 
          disabled={!isConnected || isLoading || !claimSDK || !hasEntitlement}
          className="w-full text-sm px-6 py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !claimSDK ? (
            "Initializing..."
          ) : !hasEntitlement ? (
            "Check again later"
          ) : (
            "Claim UBI"
          )}
        </Button>
      </div>
      
      {/* Status Messages */}
      {status && (
        <div className={`text-xs p-3 rounded-md w-full text-center break-words overflow-wrap-anywhere ${
          status.includes('successful') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : status.includes('failed') || status.includes('error') || error
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {status}
        </div>
      )}

      {error && !status && (
        <div className="text-xs p-3 rounded-md w-full text-center bg-red-100 text-red-800 border border-red-200">
          {error}
        </div>
      )}
      
      {!isConnected && (
        <p className="text-sm text-gray-600 text-center">
          Connect your wallet to check entitlement and claim UBI
        </p>
      )}
    </div>
  );
};
