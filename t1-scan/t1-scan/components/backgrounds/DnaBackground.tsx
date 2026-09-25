"use client";

import { useEffect, useRef } from "react";

type DnaBackgroundProps = {
  angle?: number;
  amplitude?: number;
  wavelength?: number;
  rungsPerWave?: number;
  speed?: number;
  twist?: number;
  opacity?: number;
  strandColor?: string;
  rungColors?: string[];
  className?: string;
  style?: React.CSSProperties;
};

export function DnaBackground({
  angle = -22,
  amplitude = 80,
  wavelength = 340,
  rungsPerWave = 12,
  speed = 38,
  twist = 0.25,
  opacity = 0.6,
  strandColor = "#8b5cf6",
  rungColors = ["#22c55e", "#ec4899", "#3b82f6", "#8b5cf6"],
  className,
  style,
}: DnaBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let isVisible = true;
    let lastTime = performance.now();
    let accumulatedElapsed = 0;
    const waveNumber = (2 * Math.PI) / wavelength;
    const rungStep = wavelength / rungsPerWave;
    const dotStep = 7;
    const radians = (angle * Math.PI) / 180;

    const draw = (elapsed: number) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(radians);

      const half = Math.hypot(width, height) / 2 + wavelength;
      const shift = speed * elapsed;
      const phase = (position: number) => waveNumber * position + twist * elapsed;
      const minRung = Math.floor((-half - shift) / rungStep);
      const maxRung = Math.ceil((half - shift) / rungStep);

      // Draw rungs batched by color for maximum rendering throughput
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (let i = 0; i < rungColors.length; i++) {
        const color = rungColors[i];
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let rung = minRung; rung <= maxRung; rung++) {
          if (((rung % rungColors.length) + rungColors.length) % rungColors.length === i) {
            const helixPosition = rung * rungStep;
            const x = helixPosition + shift;
            const y = amplitude * Math.sin(phase(helixPosition));
            ctx.moveTo(x, y);
            ctx.lineTo(x, -y);
          }
        }
        ctx.stroke();
      }

      for (const sign of [1, -1]) {
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = strandColor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let x = -half; x <= half; x += 8) {
          const y = sign * amplitude * Math.sin(phase(x - shift));
          if (x === -half) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.fillStyle = strandColor;
        const minDot = Math.floor((-half - shift) / dotStep);
        const maxDot = Math.ceil((half - shift) / dotStep);
        for (let dot = minDot; dot <= maxDot; dot++) {
          const helixPosition = dot * dotStep;
          const dotPhase = phase(helixPosition);
          const depth = (sign * Math.cos(dotPhase) + 1) * 0.5;
          ctx.globalAlpha = 0.25 + 0.45 * depth;
          ctx.beginPath();
          ctx.arc(
            helixPosition + shift,
            sign * amplitude * Math.sin(dotPhase),
            0.9 + 0.7 * depth,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      // Fast layered glow endpoints without software shadowBlur lag
      for (let rung = minRung; rung <= maxRung; rung++) {
        const helixPosition = rung * rungStep;
        const x = helixPosition + shift;
        const rungPhase = phase(helixPosition);
        const color = rungColors[((rung % rungColors.length) + rungColors.length) % rungColors.length];
        ctx.fillStyle = color;

        for (const sign of [1, -1]) {
          const depth = (sign * Math.cos(rungPhase) + 1) * 0.5;
          const y = sign * amplitude * Math.sin(rungPhase);
          const radius = 2.4 + 1.8 * depth;

          // Soft ambient halo
          ctx.globalAlpha = 0.18 + 0.22 * depth;
          ctx.beginPath();
          ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
          ctx.fill();

          // Crisp core
          ctx.globalAlpha = 0.55 + 0.4 * depth;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };

    const resize = () => {
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * devicePixelRatio);
      canvas.height = Math.round(height * devicePixelRatio);
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      if (reduceMotion) draw(0);
    };

    const tick = (now: number) => {
      if (!isVisible) {
        animationFrame = 0;
        return;
      }
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      accumulatedElapsed += Math.min(delta, 0.1);
      draw(accumulatedElapsed);
      animationFrame = requestAnimationFrame(tick);
    };

    // Pause animation entirely when scrolled out of view to preserve 60/120fps UI smoothness
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry.isIntersecting;
        if (isVisible && !reduceMotion && !animationFrame) {
          lastTime = performance.now();
          animationFrame = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    if (!reduceMotion && isVisible) {
      lastTime = performance.now();
      animationFrame = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [angle, amplitude, wavelength, rungsPerWave, speed, twist, strandColor, rungColors]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity,
        ...style,
      }}
    />
  );
}