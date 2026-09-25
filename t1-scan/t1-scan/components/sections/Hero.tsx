import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroGlow } from "@/components/backgrounds/HeroGlow";

interface HeroProps {
  onScanClick?: () => void;
}

export function Hero({ onScanClick }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-16 text-center lg:pb-28 lg:pt-20">
      <HeroGlow />

      <div className="mx-auto max-w-3xl px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,27,58,0.1)] bg-white px-4 py-1.5 text-[13px] font-semibold text-ink shadow-sm">
          <span className="rounded-full bg-[#0B0A16] px-2.5 py-0.5 text-[11px] font-bold text-white">
            Scan
          </span>
          Facial analysis based on real proportions
        </span>

        <h1 className="mt-8 text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-[52px] lg:text-[60px]">
          Scan your face with{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            absolute precision.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted">
          Upload your photo and get a complete analysis with a score, facial
          proportions, strengths, and areas to improve, along with a detailed
          breakdown of your features.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button onClick={onScanClick}>
            Scan my face
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/pricing">
            <Button variant="ghost">View plans</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}


