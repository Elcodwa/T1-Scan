import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingTable } from "@/components/pricing/PricingTable";
import { HeroGlow } from "@/components/backgrounds/HeroGlow";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — T1-Scan",
  description: "Plans and pricing for the T1-Scan precision facial analysis.",
};

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-white">
      <Navbar />
      <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:py-16">
        <HeroGlow />
        <div className="relative z-10 mx-auto max-w-5xl">
          <PricingTable />
        </div>
      </div>
      <Footer />
    </main>
  );
}

