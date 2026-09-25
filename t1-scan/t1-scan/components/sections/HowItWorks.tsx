"use client";

import { UploadCloud } from "lucide-react";
import { DnaBackground } from "@/components/backgrounds/DnaBackground";

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden px-6 py-20 lg:py-28">
      <DnaBackground
        angle={-14}
        amplitude={75}
        wavelength={360}
        opacity={0.45}
        speed={28}
        className="hidden sm:block"
      />

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <h2 className="text-[32px] font-extrabold tracking-tight text-ink sm:text-[44px]">
          Three steps. Five minutes.
          <span className="mt-1 block bg-gradient-to-r from-[#B24BE0] to-[#E8558C] bg-clip-text text-transparent">
            Complete breakdown.
          </span>
        </h2>

        <div className="mt-14 grid gap-6 md:grid-cols-3 text-left">
          {/* Step 1 */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-violet-100/80 bg-white/90 p-7 shadow-[0_16px_36px_rgba(108,92,231,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(108,92,231,0.12)] hover:border-violet-300/60">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/70 bg-violet-50/80 text-[14px] font-bold text-violet-700 shadow-sm">
                1
              </div>
              <h3 className="mt-5 text-[19px] font-bold tracking-tight text-ink">
                Upload your photo
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                Front-facing, with even lighting and a neutral expression. Everything processes locally in your browser: never stored on any server.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-dashed border-violet-200/90 bg-violet-50/40 p-4 text-center transition-colors group-hover:border-violet-400 group-hover:bg-violet-50/70">
              <div className="flex items-center justify-center gap-2 text-[13px] font-semibold text-violet-700">
                <UploadCloud className="h-4 w-4 stroke-[2.2]" />
                <span>Drop your photo here</span>
              </div>
            </div>
          </div>
          {/* Step 2 */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-violet-100/80 bg-white/90 p-7 shadow-[0_16px_36px_rgba(108,92,231,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(108,92,231,0.12)] hover:border-violet-300/60">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200/70 bg-violet-50/80 text-[14px] font-bold text-violet-700 shadow-sm">
                2
              </div>
              <h3 className="mt-5 text-[19px] font-bold tracking-tight text-ink">
                Set anatomical landmarks
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                Our AI detects key facial points automatically while allowing manual adjustments. Exact proportions and ratios calculate in real time.
              </p>
            </div>
            <div className="mt-8 flex h-[58px] items-center justify-center rounded-2xl border border-violet-100/80 bg-violet-50/40 px-4">
              <div className="flex items-center justify-center gap-4">
                <span className="h-2 w-2 rounded-full bg-[#6C5CE7] shadow-[0_0_8px_rgba(108,92,231,0.6)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] opacity-75" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#B24BE0] shadow-[0_0_10px_rgba(178,75,224,0.6)]" />
                <span className="h-2 w-2 rounded-full bg-[#E8558C] shadow-[0_0_8px_rgba(232,85,140,0.6)]" />
                <span className="h-3 w-3 rounded-full bg-[#E8558C] shadow-[0_0_12px_rgba(232,85,140,0.7)]" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="group relative flex flex-col justify-between rounded-3xl border border-violet-100/80 bg-white/90 p-7 shadow-[0_16px_36px_rgba(108,92,231,0.06)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(108,92,231,0.12)] hover:border-violet-300/60">
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-200/70 bg-pink-50/80 text-[14px] font-bold text-[#E8558C] shadow-sm">
                3
              </div>
              <h3 className="mt-5 text-[19px] font-bold tracking-tight text-ink">
                Receive your results
              </h3>
              <p className="mt-3 text-[14px] leading-relaxed text-ink-muted">
                Overall harmony score and breakdown for each individual ratio, complete with reference ranges and a clear explanation of each dimension.
              </p>
            </div>
            <div className="mt-8 flex flex-col justify-center gap-2.5 rounded-2xl border border-violet-100/80 bg-violet-50/40 p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-2 rounded-full bg-gradient-to-r from-[#F4A73C] via-[#7CD67A] to-[#34B87C]">
                  <span className="absolute top-1/2 left-[78%] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-violet-600 bg-white shadow-sm" />
                </div>
                <span className="w-6 text-right text-[11px] font-extrabold text-[#0F8A4C]">9.8</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-2 rounded-full bg-gradient-to-r from-[#F4A73C] via-[#7CD67A] to-[#34B87C]">
                  <span className="absolute top-1/2 left-[58%] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-violet-600 bg-white shadow-sm" />
                </div>
                <span className="w-6 text-right text-[11px] font-extrabold text-[#23A55A]">8.4</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 h-2 rounded-full bg-gradient-to-r from-[#F4A73C] via-[#7CD67A] to-[#34B87C]">
                  <span className="absolute top-1/2 left-[82%] h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-violet-600 bg-white shadow-sm" />
                </div>
                <span className="w-6 text-right text-[11px] font-extrabold text-[#23A55A]">8.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
