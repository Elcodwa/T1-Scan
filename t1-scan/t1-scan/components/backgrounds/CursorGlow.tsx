"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, summary";

interface CursorGlowProps {
  color?: string; // "r, g, b" of the glow. Default is a deep violet
  size?: number; // diameter of the outer halo in px
  intensity?: number; // 0.5 = subtler, 1.5 = stronger
  smoothing?: number; // 0-1: lower = floatier lag, 1 = locked to the cursor
  zIndex?: number; // z-index
  containerRef?: React.RefObject<HTMLElement | null>; // optional scoped parent container
}

export default function CursorGlow({
  color = "139, 92, 246",
  size = 560,
  intensity = 1,
  smoothing = 0.09,
  zIndex = 0,
  containerRef,
}: CursorGlowProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(hover: none)").matches) return;

    const wrap = wrapRef.current;
    const halo = haloRef.current;
    const core = coreRef.current;
    if (!wrap || !halo || !core) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ease = reduceMotion ? 1 : smoothing;
    const coreSize = size * 0.36;

    const target = { x: 0, y: 0, s: 1 };
    const h = { x: 0, y: 0, s: 1 };
    const c = { x: 0, y: 0 };
    let raf = 0;
    let seen = false;

    const render = () => {
      halo.style.transform = `translate3d(${h.x - size / 2}px, ${h.y - size / 2}px, 0) scale(${h.s})`;
      core.style.transform = `translate3d(${c.x - coreSize / 2}px, ${c.y - coreSize / 2}px, 0)`;
    };

    const tick = () => {
      h.x += (target.x - h.x) * ease;
      h.y += (target.y - h.y) * ease;
      h.s += (target.s - h.s) * 0.12;
      c.x += (target.x - c.x) * Math.min(1, ease * 2.6);
      c.y += (target.y - c.y) * Math.min(1, ease * 2.6);
      render();

      const settled =
        Math.abs(target.x - h.x) < 0.1 &&
        Math.abs(target.y - h.y) < 0.1 &&
        Math.abs(target.s - h.s) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(tick);
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const containerEl = containerRef ? containerRef.current : null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        target.x = e.clientX - rect.left;
        target.y = e.clientY - rect.top;
      } else {
        target.x = e.clientX;
        target.y = e.clientY;
      }

      target.s = e.target instanceof Element && e.target.closest(INTERACTIVE) ? 1.3 : 1;
      if (!seen) {
        seen = true;
        h.x = c.x = target.x;
        h.y = c.y = target.y;
        render();
      }
      wrap.style.opacity = "1";
      kick();
    };

    const onLeave = () => {
      wrap.style.opacity = "0";
    };

    const targetEl = containerEl ? containerEl : window;

    targetEl.addEventListener("pointermove", onMove as EventListener, { passive: true });
    if (containerEl) {
      containerEl.addEventListener("pointerleave", onLeave);
    } else {
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      targetEl.removeEventListener("pointermove", onMove as EventListener);
      if (containerEl) {
        containerEl.removeEventListener("pointerleave", onLeave);
      } else {
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      cancelAnimationFrame(raf);
    };
  }, [size, smoothing, containerRef]);

  const a = (v: number) => Math.min(1, v * intensity).toFixed(3);
  const layer: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: "50%",
    willChange: "transform",
  };

  const isScoped = Boolean(containerRef);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: isScoped ? "absolute" : "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex,
        opacity: 0,
        transition: "opacity 0.5s ease",
      }}
    >
      {/* wide, faint halo */}
      <div
        ref={haloRef}
        style={{
          ...layer,
          width: size,
          height: size,
          background: `radial-gradient(closest-side, rgba(${color}, ${a(0.28)}) 0%, rgba(${color}, ${a(0.1)}) 45%, rgba(${color}, 0) 100%)`,
        }}
      />
      {/* tighter, slightly brighter core */}
      <div
        ref={coreRef}
        style={{
          ...layer,
          width: size * 0.36,
          height: size * 0.36,
          background: `radial-gradient(closest-side, rgba(${color}, ${a(0.42)}) 0%, rgba(${color}, 0) 100%)`,
        }}
      />
    </div>
  );
}

