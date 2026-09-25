export function HeroGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] overflow-hidden [contain:layout_style_paint]"
    >
      <div className="absolute -left-24 -top-32 h-[560px] w-[560px] animate-blob-drift transform-gpu rounded-full bg-violet-200/70 blur-[80px] will-change-transform" />
      <div
        className="absolute -right-32 top-10 h-[520px] w-[520px] animate-blob-drift transform-gpu rounded-full bg-gradient-to-br from-[#f3d9ee] to-[#f7e3d6] blur-[90px] will-change-transform"
        style={{ animationDelay: "-6s" }}
      />
      <div className="absolute inset-0 bg-hero-glow" />
    </div>
  );
}
