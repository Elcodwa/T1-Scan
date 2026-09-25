"use client";

import { DnaBackground } from "@/components/backgrounds/DnaBackground";
import { useLanguage } from "@/lib/i18n";

export function Dimensions() {
  const { t } = useLanguage();

  const dimensions = [
    {
      name: t.dimensions.harmonyTitle,
      dot: "#22C55E",
      description: t.dimensions.harmonyDesc,
      highlight: false,
    },
    {
      name: t.dimensions.traitsTitle,
      dot: "#6C5CE7",
      description: t.dimensions.traitsDesc,
      highlight: false,
    },
    {
      name: t.dimensions.angularityTitle,
      dot: "#3B82F6",
      description: t.dimensions.angularityDesc,
      highlight: false,
    },
    {
      name: t.dimensions.dimorphismTitle,
      dot: "#E8558C",
      description: t.dimensions.dimorphismDesc,
      highlight: true,
    },
  ];

  return (
    <section className="relative overflow-hidden px-6 py-20 lg:py-28">
      <DnaBackground
        angle={-22}
        amplitude={80}
        wavelength={340}
        opacity={0.6}
        className="hidden sm:block"
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <h2 className="text-center text-[32px] font-extrabold tracking-tight text-ink dark:text-white sm:text-[38px] transition-colors">
          {t.dimensions.titlePre}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            {t.dimensions.titleGradient}
          </span>
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {dimensions.map((d) => (
            <div
              key={d.name}
              className={`rounded-2xl border bg-white/90 dark:bg-white/[0.04] p-6 text-left shadow-card-soft dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${
                d.highlight
                  ? "border-[#E8558C]/60 dark:border-[#E8558C]/80"
                  : "border-[rgba(31,27,58,0.08)] dark:border-white/10"
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: d.dot }}
                />
                <span className="text-[17px] font-semibold text-ink dark:text-white transition-colors">
                  {d.name}
                </span>
              </div>
              <p className="text-[14.5px] leading-relaxed text-ink-muted dark:text-slate-300 transition-colors">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

