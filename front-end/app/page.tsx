"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useWalletVerification,
  VerificationStatus,
} from "@/services/checkWalletVerification";
import { analytics } from "@/services/analytics";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { checkVerificationStatus, generateFVLink, sdkReady } =
    useWalletVerification();
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>({
      isVerified: false,
      isWhitelisted: false,
      loading: false,
      isRedirecting: false,
    });
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Track page view on mount
  useEffect(() => {
    analytics.trackPageView('home');
  }, []);

  useEffect(() => {
    if (isConnected && address && sdkReady) {
      setVerificationStatus((prev) => ({ ...prev, loading: true }));
      checkVerificationStatus(address).then(setVerificationStatus);
      } else {
        setVerificationStatus({
          isVerified: false,
          isWhitelisted: false,
          loading: false,
          isRedirecting: false,
        });
      }
  }, [isConnected, address, sdkReady, checkVerificationStatus]);
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/thegoodpaxapp.svg"
              alt="The Good Pax App Logo"
              width={100}
              height={100}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-8">
            Welcome to The Good Pax App
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Claim 3,000 G$ (0.3 USD) and UBI here!
          </p>
          <Link href="/onboarding">
            <Button
              variant="outline"
              className="mt-4 text-sm px-6 py-2"
            >
              ℹ️ What is this? Learn more
            </Button>
          </Link>
        </div>
        {isConnected ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {verificationStatus.loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              ) : verificationStatus.isVerified ? (
                <div title="Verified wallet">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              ) : (
                <div title="Unverified wallet">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
              )}
              <span className="text-sm text-gray-600">
                {verificationStatus.loading
                  ? "Checking verification..."
                  : verificationStatus.isVerified
                  ? "You are human 👤"
                  : "You seem sus 🤖"}
              </span>
            </div>
            {verificationStatus.isVerified && !verificationStatus.loading && !verificationStatus.isRedirecting && (
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <Link href="/claim">
                  <Button
                    className="w-full text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(90deg, #4C9FFF 0%, #5C86FF 100%)",
                    }}
                  >
                    Claim UBI (Every day)
                  </Button>
                </Link>
                <Link href="/engage">
                  <Button
                    className="w-full text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(90deg, #FF9C4C 0%, #FF5C86 100%)",
                    }}
                  >
                    Engage (Every 180 days)
                  </Button>
                </Link>
              </div>
            )}
            {!verificationStatus.isVerified &&
              !verificationStatus.loading &&
              isConnected && (
                <Button
                  onClick={async () => {
                    setIsGeneratingLink(true);
                    try {
                      await generateFVLink();
                      // Link generated successfully, now redirecting
                      setIsGeneratingLink(false);
                      setVerificationStatus((prev) => ({ 
                        ...prev, 
                        isRedirecting: true 
                      }));
                      // Keep redirecting state active since user will be navigated away
                    } catch (error) {
                      // Only reset if link generation failed
                      setIsGeneratingLink(false);
                      setVerificationStatus((prev) => ({ 
                        ...prev, 
                        isRedirecting: false 
                      }));
                    }
                  }}
                  disabled={isGeneratingLink || verificationStatus.isRedirecting}
                  className="text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(90deg, #FF9C4C 0%, #FF7A00 100%)",
                  }}
                >
                  {isGeneratingLink || verificationStatus.isRedirecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isGeneratingLink ? "Preparing..." : "Redirecting..."}
                    </>
                  ) : (
                    "Get Verified"
                  )}
                </Button>
              )}
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-lg text-gray-500 flex items-center gap-2">
                Connect your wallet to continue
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </p>
              {isConnected && (
                <div className="flex items-center">
                  {verificationStatus.loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  ) : verificationStatus.isVerified ? (
                    <div title="Verified wallet">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ) : isConnected ? (
                    <div title="Unverified wallet">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            {/* <p className="text-sm text-gray-400">
              Not verified?{" "}
              <a 
                href="https://goodwallet.xyz?inviteCode=2TWZbDwPWN" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Get verified here.
              </a>
            </p> */}
          </div>
        )}
        
        {/* Pax Information - shown after buttons */}
        <div className="mt-8 text-center">
          <p className="text-md text-gray-600">
            Also, check out Pax (Android only) where you can complete tasks and earn G$ and
            stablecoins. Download Pax below! 👇
          </p>
        </div>
      </div>
    </div>
  );
}
