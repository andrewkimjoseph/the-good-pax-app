"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useWalletVerification,
  VerificationStatus,
} from "@/services/checkWalletVerification";
import { analytics } from "@/services/analytics";
import { getFbclid, appendFbclidToUrl } from "@/services/fbclid";

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

  // Track page view on mount and capture fbclid
  useEffect(() => {
    analytics.trackHomePageViewed();
    // Capture fbclid if present in URL
    getFbclid();
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
            Where Canvassing (Pax) and GoodDollar meet.
          </p>
          <Link href={appendFbclidToUrl("/onboarding")}>
            <Button
              variant="outline"
              className="mt-4 text-sm px-6 py-2"
            >
              ℹ️ What is this? Learn more
            </Button>
          </Link>
        </div>

        {/* Pax CTA */}
        <div className="w-full max-w-md bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-5 shadow-md border border-orange-100 text-center">
          <p className="text-sm text-gray-700 leading-relaxed">
            Use <span className="font-semibold text-gray-900">Pax</span> to complete tasks and earn{" "}
            <span className="font-semibold text-gray-900">G$</span> and stablecoins.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://thepax.site"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full sm:w-auto">
                Visit Pax (Web)
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://thepax.app/thegoodpaxapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full sm:w-auto">
                Get Pax (Android)
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
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
                <Link href={appendFbclidToUrl("/claim")}>
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
                <a
                  href="https://gooddapp.org/#/swap/celoReserve"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => analytics.trackSwapViewed()}
                >
                  <Button
                    className="w-full text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
                    style={{
                      background:
                        "linear-gradient(90deg, #00C853 0%, #00A651 100%)",
                    }}
                  >
                    Swap your G$ (All day)
                    <ExternalLink className="ml-2 h-5 w-5" />
                  </Button>
                </a>

                {/* Engagement Rewards (Ended) */}
                <Link href={appendFbclidToUrl("/engage")}>
                  <Button variant="outline" className="w-full">
                    Engagement rewards (ended)
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
      </div>
    </div>
  );
}
