"use client";

import ScanPreview from "@/components/analysis/ScanPreview";
import chadImage from "@/app/assets/chad.png";
import { useLanguage } from "@/lib/i18n";

export function AnalysisPreview() {
  const { t } = useLanguage();

  return (
    <section className="px-6 pb-20 lg:pb-28">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-[32px] font-extrabold tracking-tight text-ink dark:text-white sm:text-[38px] transition-colors">
          {t.analysisPreview.titlePre}
          <span className="bg-gradient-to-r from-[#B24BE0] to-[#E8558C] bg-clip-text text-transparent">
            {t.analysisPreview.titleGradient}
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-ink-muted dark:text-slate-300 transition-colors">
          {t.analysisPreview.description}
        </p>

        <div className="mt-12 text-left">
          <ScanPreview imageSrc={chadImage} />
        </div>
      </div>
    </section>
  );
}


