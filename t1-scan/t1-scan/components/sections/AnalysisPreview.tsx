import ScanPreview from "@/components/analysis/ScanPreview";
import chadImage from "@/app/assets/chad.png";

export function AnalysisPreview() {
  return (
    <section className="px-6 pb-20 lg:pb-28">
      <div className="mx-auto max-w-6xl text-center">
        <h2 className="text-[32px] font-extrabold tracking-tight text-ink sm:text-[38px]">
          Preview of the{" "}
          <span className="bg-gradient-to-r from-[#B24BE0] to-[#E8558C] bg-clip-text text-transparent">
            analysis
          </span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-ink-muted">
          This is what a full scan looks like: proportions, features, and
          harmony visualized in real time.
        </p>

        <div className="mt-12 text-left">
          <ScanPreview imageSrc={chadImage} />
        </div>
      </div>
    </section>
  );
}

