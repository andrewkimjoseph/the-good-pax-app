"use client";
import Link from "next/link";
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";

import { Button } from "@/components/ui/button";
import { analytics } from "@/services/analytics";
import { getFbclid, appendFbclidToUrl } from "@/services/fbclid";
export default function EngagePage() {
  // Track page view on mount and capture fbclid
  useEffect(() => {
    analytics.trackEngagementPageViewed();
    // Capture fbclid if present in URL
    getFbclid();
  }, []);

  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="w-full flex justify-start items-center pt-8">
        <Link href={appendFbclidToUrl("/")}>
          <Button variant="outline" size="sm">
            ← Back to Home
          </Button>
        </Link>
      </div>
      <div className="flex-1 flex items-start justify-center pt-12">
        <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4">
          <div className="text-center mb-2">
            <div className="mb-6 flex justify-center">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="h-20 w-20 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Engagement Rewards
            </h2>
            <p className="text-sm text-gray-600 mb-2">Program Ended</p>
            <p className="text-xs text-gray-500">
              The engagement rewards program concluded after reaching the
              maximum rewards cap.
            </p>
          </div>

          <div className="w-full rounded-md bg-gray-100 text-gray-700 border border-gray-200 p-4 text-sm text-center">
            Want to earn more? Try Pax to complete tasks and earn G$ and
            stablecoins.
          </div>

          <div className="w-full flex flex-col gap-3">
            <a
              href="https://thepax.site"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                Visit Pax (Web) <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a
              href="https://thepax.app/thegoodpaxapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                Get Pax (Android) <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
