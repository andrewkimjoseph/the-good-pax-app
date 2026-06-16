import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="font-sans flex flex-col min-h-screen p-6 gap-8">
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
        <div className="mb-2 flex justify-center">
          <Image
            src="/thegoodpaxapp.svg"
            alt="The Good Pax App Logo"
            width={80}
            height={80}
            className="drop-shadow-lg opacity-80"
          />
        </div>

        <p className="text-7xl font-black text-[#363062]/20 tabular-nums">404</p>

        <div>
          <h1 className="text-2xl font-black text-[#363062] mb-3">
            Page not found
          </h1>
          <p className="text-lg text-[#625C89] max-w-xs mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        <Link href="/" className="mt-2">
          <Button
            className="text-lg px-8 py-4 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 hover:opacity-90"
            style={{ background: "#363062" }}
          >
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
