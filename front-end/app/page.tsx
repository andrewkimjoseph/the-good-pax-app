"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import Image from "next/image";
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isConnected } = useAccount();
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-start pt-16 gap-6">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/thegoodpaxapp.svg"
              alt="The Good Pax App Logo"
              width={180}
              height={180}
              className="drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to The Good Pax App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Claim your G$ reward for engaging with the Canvassing ecosystem and more!
          </p>
        </div>
        {isConnected ? (
          <Link href="/engage">
            <Button className="text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105" style={{background: 'linear-gradient(90deg, #FF9C4C 0%, #FF5C86 100%)'}}>
              Engage
            </Button>
          </Link>
        ) : (
          <div className="text-center">
            <p className="text-lg text-gray-500 mb-6">
              Please connect your GoodDollar-verified wallet to continue ...
            </p>
            <p className="text-sm text-gray-400">
              Don't have a wallet?{" "}
              <a 
                href="https://goodwallet.xyz?inviteCode=2TWZbDwPWN" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 underline"
              >
                Get the GoodWallet here
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}