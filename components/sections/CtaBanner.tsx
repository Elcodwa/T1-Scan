"use client";

import { useRef } from "react";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Activity, ScanFace, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CursorGlow from "@/components/backgrounds/CursorGlow";
import { useLanguage } from "@/lib/i18n";

export function CtaBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  return (
    <section className="relative px-4 pb-20 sm:px-6 lg:pb-28">
      <div
        ref={containerRef}
        className="group relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 dark:border-white/15 bg-[#0B0A16] p-8 sm:p-12 lg:p-16 shadow-[0_35px_80px_rgba(11,10,22,0.6)]"
      >
        {/* Subtle grid pattern background */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Mouse Cursor Glow scoped inside this dark card */}
        <CursorGlow
          containerRef={containerRef}
          color="139, 92, 246"
          size={560}
          intensity={1.2}
          zIndex={1}
        />

        {/* Ambient background glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-600/20 blur-[80px] transform-gpu will-change-transform" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#E8558C]/15 blur-[90px] transform-gpu will-change-transform" />

        {/* Content Container */}
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>{t.ctaBanner.badge}</span>
            </div>

            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t.ctaBanner.titlePre}
              <span className="bg-gradient-to-r from-violet-400 via-[#C084FC] to-[#F472B6] bg-clip-text text-transparent">
                {t.ctaBanner.titleGradient}
              </span>
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {t.ctaBanner.subtitle}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.07] hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400">
                <ScanFace className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{t.ctaBanner.feature1Title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {t.ctaBanner.feature1Desc}
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.07] hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/20 text-pink-400">
                <Activity className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{t.ctaBanner.feature2Title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {t.ctaBanner.feature2Desc}
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.07] hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{t.ctaBanner.feature3Title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {t.ctaBanner.feature3Desc}
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm transition-all hover:border-violet-400/40 hover:bg-white/[0.07] hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{t.ctaBanner.feature4Title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {t.ctaBanner.feature4Desc}
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-center sm:flex-row">
            <Button
              href="/analysis"
              className="h-12 px-8 text-base font-semibold shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t.ctaBanner.button}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.ctaBanner.badge1}</span>
            </div>
            <span className="hidden text-slate-600 sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.ctaBanner.badge2}</span>
            </div>
            <span className="hidden text-slate-600 sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.ctaBanner.badge3}</span>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}

