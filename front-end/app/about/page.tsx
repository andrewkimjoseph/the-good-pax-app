"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGift,
  faWandMagicSparkles,
  faCircleCheck,
  faCoins,
  faArrowsRotate,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "@/components/ui/button";
import { analytics } from "@/services/analytics";
import { getFbclid, appendFbclidToUrl } from "@/services/fbclid";

export default function AboutPage() {
  const router = useRouter();

  // Track page view on mount and capture fbclid
  useEffect(() => {
    analytics.trackOnboardingPageViewed();
    // Capture fbclid if present in URL
    getFbclid();
  }, []);

  const handleGetStarted = () => {
    // Set cookie to mark onboarding as complete
    document.cookie = "hasSeenOnboarding=true; path=/; max-age=31536000"; // 1 year
    // Navigate to home page with fbclid preserved
    const homeUrl = appendFbclidToUrl("/");
    router.push(homeUrl);
  };
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-start pt-4 gap-6">
        {/* Logo and Welcome */}
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to The Good Pax App! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Your gateway to Universal Basic Income (UBI) on the Celo blockchain
          </p>
        </div>

        {/* What is this? */}
        <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCoins} className="h-6 w-6 text-blue-600" />
            What is this?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The Good Pax App is a decentralized application (dApp) built on{" "}
            <span className="font-semibold text-blue-600">GoodDollar</span>,
            enabling you to claim free cryptocurrency daily, and connecting you
            to <span className="font-semibold text-gray-900">Pax</span>-where you can complete
            tasks and earn <span className="font-semibold text-gray-900">G$</span> and stablecoins.
            It&apos;s real money, real crypto, and it&apos;s designed to help everyone participate
            in the digital economy.
          </p>
        </div>

        {/* Key Features */}
        <div className="w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
            What You Can Do
          </h2>

          <div className="space-y-4">
            {/* Feature 1: Daily UBI */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faGift} className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Claim UBI
                    <span className="ml-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Every single day
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get free G$ (GoodDollar) tokens every single day.
                    No catch, no tricks — just free money for being human!
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Swap */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faArrowsRotate} className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Swap Your G$
                    <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Always available
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Convert your G$ into other tokens anytime using the built-in swap.
                    Turn your daily UBI into stablecoins or other assets at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Engage */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Engage &amp; Earn
                    <span className="ml-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      Based on availability
                    </span>
                  </h3>
                  <p className="text-sm text-gray-600">
                    Earn extra G$ rewards by engaging with the app through special campaigns.
                    Availability is limited — check back regularly so you don&apos;t miss out.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-md bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 shadow-md border border-orange-100">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6 text-orange-600" />
            How to Get Started
          </h2>
          <ol className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600 flex-shrink-0">1.</span>
              <span>Connect your crypto wallet (we&apos;ll help you set one up if needed)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600 flex-shrink-0">2.</span>
              <span>Complete facial verification to prove you&apos;re human</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-orange-600 flex-shrink-0">3.</span>
              <span>Claim your daily UBI, swap your G$ anytime, and engage when campaigns are available!</span>
            </li>
          </ol>
        </div>

        {/* CTA Button */}
        <div className="w-full max-w-md flex flex-col gap-3 mt-4">
          <Button
            onClick={handleGetStarted}
            className="w-full text-lg px-8 py-6 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
            style={{
              background: "linear-gradient(90deg, #4C9FFF 0%, #5C86FF 100%)",
            }}
          >
            Get Started Now! 🚀
          </Button>

          <p className="text-xs text-center text-gray-500 mt-2">
            By continuing, you agree to participate in the GoodDollar ecosystem
          </p>
        </div>

        {/* Additional Info */}
        <div className="mt-4 text-center max-w-md">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Powered by GoodDollar</span>
            <br />
            A protocol for deploying universal basic income at scale
          </p>
        </div>
      </div>
    </div>
  );
}
