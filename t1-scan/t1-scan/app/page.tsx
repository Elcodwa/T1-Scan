"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AnalysisPreview } from "@/components/sections/AnalysisPreview";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Dimensions } from "@/components/sections/Dimensions";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { PricingModal } from "@/components/pricing/PricingModal";

export default function Home() {
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const handleOpenPricing = () => {
    setIsPricingOpen(true);
  };

  return (
    <main className="relative">
      <Navbar onScanClick={handleOpenPricing} />
      <Hero onScanClick={handleOpenPricing} />
      <AnalysisPreview />
      <HowItWorks />
      <Dimensions />
      <CtaBanner onScanClick={handleOpenPricing} />
      <Footer />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        onSelectPlan={(planId) => {
          console.log("Selected plan:", planId);
        }}
      />
    </main>
  );
}

