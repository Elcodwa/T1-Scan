"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AnalysisPreview } from "@/components/sections/AnalysisPreview";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Dimensions } from "@/components/sections/Dimensions";
import { CtaBanner } from "@/components/sections/CtaBanner";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <AnalysisPreview />
      <HowItWorks />
      <Dimensions />
      <CtaBanner />
      <Footer />
    </main>
  );
}

