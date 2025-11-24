"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't show header on onboarding page
  if (pathname === "/onboarding") {
    return null;
  }
  
  return (
    <>
      <Navigation />
      <Header />
    </>
  );
}

