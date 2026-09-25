// Decorative double-helix graphic. Two sine-wave strands with beaded nodes
// and cross-rungs, built once at render time (no randomness, so it's stable
// between server and client). The whole group drifts slowly via a CSS
// keyframe animation and each rung fades in and out on a staggered delay.

const WIDTH = 260;
const HEIGHT = 620;
const TURNS = 3.4;
const STEPS = 46;
const AMPLITUDE = 62;
const CENTER_X = WIDTH / 2;

function strandPoints(phase: number) {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const y = t * HEIGHT;
    const angle = t * TURNS * Math.PI * 2 + phase;
    const x = CENTER_X + Math.sin(angle) * AMPLITUDE;
    points.push({ x, y });
  }
  return points;
}

function toPath(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}

export function GeneticsBackground({ className = "" }: { className?: string }) {
  const strandA = strandPoints(0);
  const strandB = strandPoints(Math.PI);

  return (
    <div
      className={`pointer-events-none select-none animate-blob-drift ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height="100%"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="helix-a" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#B24BE0" />
          </linearGradient>
          <linearGradient id="helix-b" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B24BE0" />
            <stop offset="100%" stopColor="#E8558C" />
          </linearGradient>
        </defs>

        {/* rungs connecting the two strands */}
        {strandA.map((p, i) => {
          const q = strandB[i];
          if (i % 3 !== 0) return null;
          return (
            <line
              key={`rung-${i}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              stroke="#C9BFF2"
              strokeWidth="1"
              opacity="0.45"
            >
              <animate
                attributeName="opacity"
                values="0.15;0.5;0.15"
                dur="4.5s"
                begin={`${(i / STEPS) * 3}s`}
                repeatCount="indefinite"
              />
            </line>
          );
        })}

        <path
          d={toPath(strandA)}
          fill="none"
          stroke="url(#helix-a)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d={toPath(strandB)}
          fill="none"
          stroke="url(#helix-b)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {strandA.map((p, i) => (
          <circle key={`a-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 3.4 : 1.8} fill="#7C6AE8">
            <animate
              attributeName="r"
              values={`${i % 3 === 0 ? 2.4 : 1.2};${i % 3 === 0 ? 3.8 : 2};${
                i % 3 === 0 ? 2.4 : 1.2
              }`}
              dur="3.2s"
              begin={`${(i / STEPS) * 2}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
        {strandB.map((p, i) => (
          <circle key={`b-${i}`} cx={p.x} cy={p.y} r={i % 3 === 0 ? 3.4 : 1.8} fill="#D96FC0">
            <animate
              attributeName="r"
              values={`${i % 3 === 0 ? 2.4 : 1.2};${i % 3 === 0 ? 3.8 : 2};${
                i % 3 === 0 ? 2.4 : 1.2
              }`}
              dur="3.2s"
              begin={`${(i / STEPS) * 2 + 1}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </svg>
    </div>
  );
}
