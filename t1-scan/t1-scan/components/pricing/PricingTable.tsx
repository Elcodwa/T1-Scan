"use client";

import { useRef } from "react";
import { Check, X, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import CursorGlow from "@/components/backgrounds/CursorGlow";


export const featuresList = [
  { name: "Harmony", basic: true, completo: true, premium: true },
  { name: "Traits", basic: false, completo: true, premium: true },
  { name: "Angularity", basic: false, completo: true, premium: true },
  { name: "Dimorphism", basic: false, completo: true, premium: true },
  { name: "Full Score Report", basic: true, completo: true, premium: true },
  { name: "Multiple Scans", basic: false, completo: false, premium: true },
];

export const plans = [
  { id: "basic", name: "Basic", price: "$2.99", subtext: "One-time payment" },
  { id: "completo", name: "Complete", badge: "Popular", price: "$6.99", subtext: "One-time payment" },
  { id: "premium", name: "Premium", price: "$11.99", subtext: "Monthly" },
] as const;

export type PlanId = (typeof plans)[number]["id"];

const PLAN_IDS: readonly PlanId[] = plans.map((p) => p.id);
/** Idle plan: the spotlight rests here whenever nothing is hovered. */
const DEFAULT_PLAN: PlanId = "completo";
/** One label column + one column per plan. */
const COLUMN_RATIO = 1 / (PLAN_IDS.length + 1);

interface PricingTableProps {
  onSelect?: (planId: PlanId) => void;
  className?: string;
}

export function PricingTable({ onSelect, className = "" }: PricingTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // The spotlight is written straight to the DOM instead of living in React
  // state: re-rendering the ~40 cells of this grid on every mouseenter is what
  // made the highlight stutter. Nothing here re-renders while hovering — the
  // pointer only bumps a transform and a data attribute.
  const selectedRef = useRef<PlanId>(DEFAULT_PLAN);
  const activeRef = useRef<PlanId>(DEFAULT_PLAN);
  const frameRef = useRef(0);
  const pointerXRef = useRef<number | null>(null);

  const planAtX = (clientX: number): PlanId | null => {
    const surface = surfaceRef.current;
    if (!surface) return null;
    const rect = surface.getBoundingClientRect();
    if (!rect.width) return null;
    const t = (clientX - rect.left) / rect.width;
    if (t < COLUMN_RATIO) return null;
    const index = Math.min(PLAN_IDS.length - 1, Math.floor((t - COLUMN_RATIO) / COLUMN_RATIO));
    return PLAN_IDS[index];
  };

  const applyActive = (id: PlanId) => {
    if (activeRef.current === id) return;
    activeRef.current = id;
    if (highlightRef.current) {
      highlightRef.current.style.transform = `translate3d(${PLAN_IDS.indexOf(id) * 100}%, 0, 0)`;
    }
    if (containerRef.current) containerRef.current.dataset.active = id;
  };

  const flushPointer = () => {
    frameRef.current = 0;
    const x = pointerXRef.current;
    if (x === null) return;
    applyActive(planAtX(x) ?? selectedRef.current);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    pointerXRef.current = e.clientX;
    if (!frameRef.current) frameRef.current = requestAnimationFrame(flushPointer);
  };

  const handlePointerLeave = () => {
    pointerXRef.current = null;
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    }
    applyActive(selectedRef.current);
  };

  const handleChoose = (id: PlanId) => {
    selectedRef.current = id;
    applyActive(id);
    onSelect?.(id);
  };

  return (
    <div className={`relative mx-auto w-full max-w-4xl select-none ${className}`}>
      <style>{TABLE_CSS}</style>

      <div
        ref={containerRef}
        data-active={DEFAULT_PLAN}
        className="pt-root relative overflow-hidden rounded-[32px] border border-violet-200/80 bg-[#C8C0EC] p-6 shadow-[0_24px_50px_rgba(108,92,231,0.18)] sm:p-10"
      >
        {/* Subtle grid pattern */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(108, 92, 231, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(108, 92, 231, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: "36px 36px",
          }}
        />

        {/* Mouse cursor glow following the pointer */}
        <CursorGlow
          containerRef={containerRef}
          color="108, 92, 231"
          size={520}
          intensity={1}
          zIndex={1}
        />

        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#B24BE0]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#6C5CE7]/20 blur-3xl" />

        <div className="relative z-10 text-center">
          <h2 className="text-[28px] font-extrabold tracking-tight text-ink sm:text-[38px]">
            Ready to see your score?
          </h2>
          <p className="mx-auto mt-2 text-[15px] font-medium text-ink-soft/80">
            Choose the analysis level for your complete precision facial report.
          </p>
        </div>

        <div className="relative z-10 mt-8 overflow-x-auto">
          <div
            ref={surfaceRef}
            className="min-w-[540px]"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onClick={(e) => {
              const id = planAtX(e.clientX);
              if (id) handleChoose(id);
            }}
          >
            <div className="grid grid-cols-4 items-end pb-4 pt-2">
              <div className="px-3" />
              {plans.map((p) => (
                <div key={p.id} data-plan={p.id} className="cursor-pointer text-center">
                  {"badge" in p && p.badge && (
                    <span className="mb-1 inline-block rounded-full bg-brand-gradient px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                      {p.badge}
                    </span>
                  )}
                  <div className="pt-name text-[22px] font-extrabold text-ink">{p.name}</div>
                </div>
              ))}
            </div>

            {/* No backdrop-blur here: the box covers the CursorGlow, so a
                backdrop-filter would re-blur a moving animated backdrop every
                single frame while the pointer travels across the table. */}
            <div className="relative rounded-2xl border border-violet-300/40 bg-violet-100/30 p-2 shadow-inner">
              {/* Ultra smooth sliding spotlight highlight */}
              <div className="pointer-events-none absolute inset-y-2 left-[25%] right-2">
                <div
                  ref={highlightRef}
                  aria-hidden="true"
                  className="pt-highlight h-full w-1/3 rounded-2xl bg-white shadow-[0_10px_30px_rgba(108,92,231,0.22)] ring-2 ring-violet-500/40 will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                />
              </div>

              <div className="relative z-10 divide-y divide-violet-200/50">
                {featuresList.map((f) => (
                  <div key={f.name} className="grid grid-cols-4 items-center py-3.5 transition-colors">
                    <div className="px-4 text-left font-semibold text-ink">{f.name}</div>
                    {PLAN_IDS.map((id) => (
                      <div
                        key={id}
                        data-plan={id}
                        className="flex cursor-pointer items-center justify-center py-1"
                      >
                        {f[id] ? (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm transition-transform hover:scale-110">
                            <Check className="h-4 w-4 stroke-[2.8]" />
                          </div>
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-400 opacity-70">
                            <X className="h-4 w-4 stroke-[2.4]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>


              <div className="relative z-10 grid grid-cols-4 items-center border-t border-violet-200/60 pb-3 pt-5">
                <div className="px-4 text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Price
                </div>
                {plans.map((p) => (
                  <div key={`price-${p.id}`} data-plan={p.id} className="cursor-pointer text-center">
                    <div className="pt-price text-[21px] font-black tracking-tight text-ink">{p.price}</div>
                    <div className="pt-sub text-[12px] font-semibold text-ink-muted">{p.subtext}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-3">
          <Button
            onClick={() => handleChoose(activeRef.current)}
            className="h-12 rounded-full bg-brand-gradient px-12 py-3 text-[16px] font-bold text-white shadow-[0_10px_28px_rgba(108,92,231,0.38)] transition-all hover:scale-105 hover:shadow-[0_14px_34px_rgba(108,92,231,0.48)]"
          >
            Choose your plan
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4 text-xs font-medium text-ink-soft/75">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Secure payment
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-violet-600" />
              Instant results
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Scoped styling for the plan spotlight. The active column is communicated
 * through `data-active` on the root plus `data-plan` on the cells, so hovering
 * only ever touches a transform and an attribute — never React state.
 */
const TABLE_CSS = `
/* Idle position of the spotlight. React never renders the transform — script
   only ever overwrites it inline — so nothing can snap it back mid-hover. */
.pt-highlight {
  transform: translate3d(${PLAN_IDS.indexOf(DEFAULT_PLAN) * 100}%, 0, 0);
}
.pt-root .pt-name,
.pt-root .pt-price,
.pt-root .pt-sub {
  transition: color 200ms ease;
}
.pt-root[data-active="basic"] [data-plan="basic"] .pt-name,
.pt-root[data-active="completo"] [data-plan="completo"] .pt-name,
.pt-root[data-active="premium"] [data-plan="premium"] .pt-name,
.pt-root[data-active="basic"] [data-plan="basic"] .pt-price,
.pt-root[data-active="completo"] [data-plan="completo"] .pt-price,
.pt-root[data-active="premium"] [data-plan="premium"] .pt-price {
  color: #6d28d9;
}
.pt-root[data-active="basic"] [data-plan="basic"] .pt-sub,
.pt-root[data-active="completo"] [data-plan="completo"] .pt-sub,
.pt-root[data-active="premium"] [data-plan="premium"] .pt-sub {
  color: #7c3aed;
}
`;

