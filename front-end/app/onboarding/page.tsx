"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Gift, Sparkles, CheckCircle, Users, Coins, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/services/analytics";
import { getFbclid, appendFbclidToUrl } from "@/services/fbclid";

export default function OnboardingPage() {
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
              width={120}
              height={120}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to The Good Pax App! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Your gateway to Universal Basic Income (UBI) on Celo the blockchain
          </p>
        </div>

        {/* What is this? */}
        <div className="w-full max-w-md bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-md border border-blue-100">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Coins className="h-6 w-6 text-blue-600" />
            What is this?
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The Good Pax App is a decentralized application (dApp) built on{" "}
            <span className="font-semibold text-blue-600">GoodDollar</span>, 
            enabling you to claim free cryptocurrency daily and earn rewards 
            for engaging with the platform. It&apos;s real money, real crypto, 
            and it&apos;s designed to help everyone participate in the digital economy.
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
                  <Gift className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Claim Daily UBI
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get free G$ (GoodDollar) tokens every single day. 
                    No catch, no tricks—just free money for being human!
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Engagement Rewards */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Sparkles className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Earn 3,000 G$ Rewards
                  </h3>
                  <p className="text-sm text-gray-600">
                    Engage with the platform and claim 3,000 G$ (0.3 USD) 
                    every 180 days. That&apos;s on top of your daily UBI!
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Human Verification */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Shield className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Verified & Secure
                  </h3>
                  <p className="text-sm text-gray-600">
                    We use facial verification to ensure one person = one account. 
                    This keeps the system fair and prevents abuse.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Community Powered */}
            <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">
                    Join a Global Movement
                  </h3>
                  <p className="text-sm text-gray-600">
                    You&apos;re joining thousands of people worldwide who believe 
                    everyone deserves access to basic income and financial freedom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-md bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6 shadow-md border border-orange-100">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-orange-600" />
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
              <span>Start claiming your daily UBI and engagement rewards!</span>
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
          
          {/* <Button
            onClick={handleGetStarted}
            variant="ghost"
            className="w-full text-sm px-6 py-2 text-gray-600 hover:text-gray-800"
          >
            Skip for now
          </Button> */}
          
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

