"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroGlow } from "@/components/backgrounds/HeroGlow";
import { useLanguage } from "@/lib/i18n";

interface HeroProps {
  onScanClick?: () => void;
}

export function Hero({ onScanClick }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-16 text-center lg:pb-28 lg:pt-20">
      <HeroGlow />

      <div className="mx-auto max-w-3xl px-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(31,27,58,0.1)] dark:border-white/10 bg-white/90 dark:bg-white/[0.06] backdrop-blur-md px-4 py-1.5 text-[13px] font-semibold text-ink dark:text-slate-200 shadow-sm transition-colors">
          <span className="rounded-full bg-[#0B0A16] dark:bg-violet-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
            {t.hero.badgeTag}
          </span>
          {t.hero.badgeText}
        </span>

        <h1 className="mt-8 text-[40px] font-extrabold leading-[1.1] tracking-tight text-ink dark:text-white sm:text-[52px] lg:text-[60px] transition-colors">
          {t.hero.titlePre}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            {t.hero.titleGradient}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-ink-muted dark:text-slate-300 transition-colors">
          {t.hero.description}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button onClick={onScanClick}>
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Link href="/pricing">
            <Button variant="ghost">{t.hero.ctaSecondary}</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}



