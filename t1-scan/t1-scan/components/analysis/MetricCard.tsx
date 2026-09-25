import { evaluateMetric, type Metric } from "@/lib/metrics";

export function MetricCard({
  metric,
  active,
  onEnter,
  onLeave,
  onToggle,
}: {
  metric: Metric;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onToggle: () => void;
}) {
  const result = evaluateMetric(metric);
  const shownScore =
    result.score % 1 === 0 ? result.score.toFixed(0) : result.score.toFixed(1);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`group flex flex-1 cursor-pointer select-none flex-col justify-center rounded-[18px] px-6 py-6 transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500 ${
        active
          ? "-translate-y-1 bg-white shadow-card ring-2 ring-violet-400/40"
          : "bg-panel shadow-card-soft hover:-translate-y-0.5 hover:bg-white/80"
      }`}
    >
      <div className="mb-4 flex min-h-[30px] flex-wrap items-baseline justify-between gap-2.5">
        <span
          className={`text-[18px] font-semibold transition-colors duration-300 ${
            active ? "text-ink" : "text-ink-muted group-hover:text-ink-soft"
          }`}
        >
          {metric.name}
        </span>

        <span
          className={`flex items-baseline gap-2.5 transition-all duration-300 ${
            active ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
          }`}
        >
          <span className="text-[18px] font-extrabold text-ink">
            {metric.value.toFixed(metric.dec)}
            {metric.unit}
          </span>
          <span
            className="rounded-full px-3 py-1.5 text-[13px] font-bold shadow-sm"
            style={{ color: result.fg, background: result.bg }}
          >
            {result.label} · {shownScore}
          </span>
        </span>
      </div>

      <div
        className="relative h-2.5 rounded-full transition-[background] duration-300"
        style={{
          background: active
            ? "linear-gradient(90deg,#F4A73C 0%,#7CD67A 35%,#34B87C 50%,#7CD67A 65%,#F4A73C 100%)"
            : "#E3E1EE",
        }}
      >
        <div
          className="absolute top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full border-[3.5px] border-violet-600 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-[left,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            left: active ? `${result.pos}%` : "8%",
            opacity: active ? 1 : 0,
            transform: "translate(-50%,-50%)",
          }}
        />
      </div>

      <div
        className={`mt-3 flex justify-between text-[12.5px] font-medium transition-colors duration-300 ${
          active ? "text-ink-muted" : "text-ink-faint"
        }`}
      >
        <span>{metric.minLabel}</span>
        <span>{metric.midLabel}</span>
        <span>{metric.maxLabel}</span>
      </div>
    </div>
  );
}
