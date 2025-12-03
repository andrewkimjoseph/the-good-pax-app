"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DRPCBadge } from "./DRPCBadge";

export function Footer() {
  const [isIOSOrMacOS, setIsIOSOrMacOS] = useState(false);

  useEffect(() => {
    // Detect iOS or macOS
    const userAgent = navigator.userAgent || navigator.platform || "";
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent);
    setIsIOSOrMacOS(isIOS || isMacOS);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 backdrop-blur  shadow-lg">
      <div className="flex flex-row justify-center items-center py-2 space-x-4">
        {isIOSOrMacOS ? (
          <a
            href="https://thepax.site"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline hover:opacity-80 transition-opacity px-4 py-2"
          >
            Check out Pax on the web
          </a>
        ) : (
          <a
            href="https://thepax.app/thegoodpaxapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center hover:opacity-80 transition-opacity hover:scale-105 transform"
          >
            <Image
              src="/get-it-on-google-play.svg"
              alt="Get it on Google Play"
              width={100}
              height={100}
              className="h-32 w-auto max-w-full"
            />
          </a>
        )}
        <DRPCBadge />
      </div>
    </footer>
  );
}
