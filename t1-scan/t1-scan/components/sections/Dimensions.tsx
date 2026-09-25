import { DnaBackground } from "@/components/backgrounds/DnaBackground";

const dimensions = [
  {
    name: "Harmony",
    dot: "#22C55E",
    description:
      "Golden ratio, facial thirds and fifths, and proportional balance from precise anatomical landmark measurements.",
    highlight: false,
  },
  {
    name: "Traits",
    dot: "#6C5CE7",
    description:
      "Skin, hair, eyes, nose, jawline, lips, brow structure, and more — each feature scored individually.",
    highlight: false,
  },
  {
    name: "Angularity",
    dot: "#3B82F6",
    description:
      "Eye depth, jaw definition, cheekbone sharpness, chin shape, and overall facial angularity.",
    highlight: false,
  },
  {
    name: "Dimorphism",
    dot: "#E8558C",
    description:
      "Visual dimorphism markers scored from ratios: coloring, brow density, and jaw shape and structure.",
    highlight: true,
  },
];

export function Dimensions() {
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
        <h2 className="text-center text-[32px] font-extrabold tracking-tight text-ink sm:text-[38px]">
          Four dimensions.{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            One complete picture.
          </span>
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {dimensions.map((d) => (
            <div
              key={d.name}
              className={`rounded-2xl border bg-white p-6 text-left shadow-card-soft ${
                d.highlight
                  ? "border-[#E8558C]/60"
                  : "border-[rgba(31,27,58,0.08)]"
              }`}
            >
              <div className="mb-3 flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: d.dot }}
                />
                <span className="text-[17px] font-semibold text-ink">
                  {d.name}
                </span>
              </div>
              <p className="text-[14.5px] leading-relaxed text-ink-muted">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
