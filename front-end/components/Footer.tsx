"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 backdrop-blur  shadow-lg">
      <div className="flex flex-col justify-center items-center py-4">
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
            className="h-36 w-auto max-w-full"
          />
        </a>
      </div>
    </footer>
  );
}
