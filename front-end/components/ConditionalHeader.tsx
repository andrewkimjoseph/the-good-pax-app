"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";

export function ConditionalHeader() {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Keep server and first client render identical.
  if (!isMounted) {
    return null;
  }

  // Don't show header on onboarding page
  if (pathname === "/about" || pathname === "/verify-identity") {
    return null;
  }

  return (
    <>
      <Navigation />
      <Header />
    </>
  );
}

