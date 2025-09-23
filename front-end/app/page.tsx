"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button"

export default function Home() {
  const { isConnected } = useAccount();
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Welcome to The Good Pax App
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Claim your G$ reward for engaging with the Canvassing ecosystem
          </p>
        </div>
        {isConnected ? (
          <Link href="/engage">
            <Button className="text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105" style={{background: 'linear-gradient(90deg, #FF9C4C 0%, #FF5C86 100%)'}}>
              Engage
            </Button>
          </Link>
        ) : (
          <p className="text-lg text-gray-500 text-center">
            Please connect your GoodDollar-verified wallet to continue ...
          </p>
        )}
      </div>
    </div>
  );
}