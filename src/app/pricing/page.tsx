"use client";

import { Pricing } from "@/app/(landing-page)/components/Pricing";

// /pricing page reuses the same Pricing component from the landing page
export default function PricingPage() {
  return (
    <main className="bg-black min-h-screen">
      <Pricing />
    </main>
  );
}
