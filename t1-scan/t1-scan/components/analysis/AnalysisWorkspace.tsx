"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, CircleAlert, CloudUpload, Loader2, LockKeyhole, RotateCcw, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { analyzeFace } from "@/lib/vision/faceLandmarker";
import type { ImageQualityResult, ImageView, VisionAnalysis } from "@/lib/vision/types";

type ScanStage = "upload" | "validating" | "review";
type ImageAsset = { file: File; url: string; preflight?: ImageQualityResult };

const steps = ["Images", "Validate", "Review"];

const scanPasses = [
  { title: "LANDMARK FIELD", copy: "468 facial reference points", color: "#8b7bea" },
  { title: "POSE GATE", copy: "Rotation and framing check", color: "#56d4cf" },
  { title: "CANONICAL SPACE", copy: "Geometry is separated from screen position", color: "#b24be0" },
];

function scoreTone(value: number) {
  return value >= 75 ? "text-emerald-300" : value >= 52 ? "text-amber-200" : "text-rose-300";
}

export function AnalysisWorkspace() {
  const [front, setFront] = useState<ImageAsset>();
  const [profile, setProfile] = useState<ImageAsset>();
  const [stage, setStage] = useState<ScanStage>("upload");
  const [frontResult, setFrontResult] = useState<VisionAnalysis>();
  const [profileResult, setProfileResult] = useState<VisionAnalysis>();
  const [error, setError] = useState<string>();
  const [activePass, setActivePass] = useState(0);
  const inputs = useRef<Record<ImageView, HTMLInputElement | null>>({ front: null, profile: null });

  useEffect(() => () => { front && URL.revokeObjectURL(front.url); profile && URL.revokeObjectURL(profile.url); }, [front, profile]);
  useEffect(() => {
    if (stage !== "review") return;
    const timer = window.setInterval(() => setActivePass((pass) => (pass + 1) % scanPasses.length), 2400);
    return () => window.clearInterval(timer);
  }, [stage]);

  const setImage = (view: ImageView, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG, PNG, or WebP)."); return; }
    setError(undefined);
    const asset = { file, url: URL.createObjectURL(file) };
    if (view === "front") { if (front) URL.revokeObjectURL(front.url); setFront(asset); } else { if (profile) URL.revokeObjectURL(profile.url); setProfile(asset); }
    setStage("upload"); setFrontResult(undefined); setProfileResult(undefined);
  };

  const choose = (view: ImageView) => inputs.current[view]?.click();
  const onChange = (view: ImageView) => (event: ChangeEvent<HTMLInputElement>) => setImage(view, event.target.files?.[0]);
  const onDrop = (view: ImageView) => (event: DragEvent<HTMLButtonElement>) => { event.preventDefault(); setImage(view, event.dataTransfer.files?.[0]); };

  const beginAnalysis = async () => {
    if (!front || !profile) return;
    setStage("validating"); setError(undefined);
    try {
      const [frontAnalysis, profileAnalysis] = await Promise.all([analyzeFace(front.file, "front"), analyzeFace(profile.file, "profile")]);
      setFrontResult(frontAnalysis); setProfileResult(profileAnalysis); setStage("review");
    } catch {
      setStage("upload");
      setError("The local vision model could not start. Check your connection and try again; your images are never uploaded to this app.");
    }
  };

  const canBegin = Boolean(front && profile);
  const active = scanPasses[activePass];

  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0a16] text-white selection:bg-violet-500/60">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_16%_0%,rgba(108,92,231,.23),transparent_30%),radial-gradient(circle_at_90%_28%,rgba(80,213,205,.12),transparent_26%),linear-gradient(115deg,#0b0a16_20%,#111024_60%,#0b0a16)]" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:44px_44px]" />

      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="group inline-flex items-center gap-2.5 text-sm font-semibold text-white/80 transition hover:text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.06] transition group-hover:border-violet-300/50 group-hover:bg-violet-500/15"><ArrowLeft className="h-4 w-4" /></span>
          <span className="hidden sm:inline">Back to T1-Scan</span>
        </Link>
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap text-[15px] font-bold tracking-tight"><span className="text-white">T1</span><span className="text-violet-400">—</span><span className="text-white/75">ANALYSIS</span></div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-200"><LockKeyhole className="h-3.5 w-3.5" /> LOCAL ONLY</div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[.08] px-3 py-1.5 text-[11px] font-bold tracking-[.16em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> PRIVATE GEOMETRY WORKSPACE</motion.div>
          <h1 className="text-balance text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">Measure with context,<br /><span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-teal-200 bg-clip-text text-transparent">not false precision.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-white/52 sm:text-base">Upload a front view and a clean side profile. T1 validates image quality and head pose before it reveals any geometric result.</p>
        </div>

        <nav aria-label="Analysis progress" className="mx-auto mt-10 flex max-w-lg items-center justify-between">
          {steps.map((step, index) => {
            const current = stage === "upload" ? 0 : stage === "validating" ? 1 : 2;
            const complete = index < current;
            return <div key={step} className="flex flex-1 items-center last:flex-none"><div className="flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${complete ? "border-violet-400 bg-violet-500 text-white" : index === current ? "border-teal-300/70 bg-teal-300/10 text-teal-100" : "border-white/15 bg-white/[.03] text-white/35"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className={`text-[11px] font-bold tracking-[.12em] ${index <= current ? "text-white/80" : "text-white/30"}`}>{step.toUpperCase()}</span></div>{index < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${index < current ? "bg-violet-400" : "bg-white/10"}`} />}</div>;
          })}
        </nav>

        <AnimatePresence mode="wait">
          {stage !== "review" ? <motion.div key="input" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-10 max-w-6xl">
            <div className="grid gap-4 lg:grid-cols-2">
              <UploadCard title="Front view" hint="Look straight ahead · neutral expression" badge="01" image={front} onChoose={() => choose("front")} onDrop={onDrop("front")} />
              <UploadCard title="Side profile" hint="One clear side · eye-level camera" badge="02" image={profile} onChoose={() => choose("profile")} onDrop={onDrop("profile")} />
            </div>
            <input ref={(node) => { inputs.current.front = node; }} onChange={onChange("front")} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" />
            <input ref={(node) => { inputs.current.profile = node; }} onChange={onChange("profile")} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" />
            {error && <div role="alert" className="mx-auto mt-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <div className="mt-7 flex flex-col items-center gap-4"><button onClick={beginAnalysis} disabled={!canBegin || stage === "validating"} className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-[#18152c] shadow-[0_10px_40px_rgba(160,147,255,.18)] transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40">{stage === "validating" ? <><Loader2 className="h-4 w-4 animate-spin" /> Validating locally</> : <>Run quality check <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}</button><p className="flex items-center gap-1.5 text-xs text-white/38"><ShieldCheck className="h-3.5 w-3.5 text-teal-300" /> Images remain in this browser session.</p></div>
          </motion.div> : <motion.div key="review" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mt-10 grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <ScanViewer image={front!} result={frontResult} pass={active} />
            <ReviewPanel front={frontResult} profile={profileResult} active={active} onReset={() => { setStage("upload"); setFrontResult(undefined); setProfileResult(undefined); }} />
          </motion.div>}
        </AnimatePresence>
      </section>
    </main>
  );
}

function UploadCard({ title, hint, badge, image, onChoose, onDrop }: { title: string; hint: string; badge: string; image?: ImageAsset; onChoose: () => void; onDrop: (event: DragEvent<HTMLButtonElement>) => void }) {
  return <button type="button" onClick={onChoose} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="group relative min-h-[290px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.045] p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300/45 hover:bg-white/[.065] focus:outline-none focus:ring-2 focus:ring-violet-400/70 sm:min-h-[340px]">
    {image ? <><Image src={image.url} alt={`${title} selected for analysis`} fill unoptimized className="object-cover opacity-65 transition duration-500 group-hover:scale-[1.025]" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0a16] via-[#0b0a16]/10 to-[#0b0a16]/20" /><div className="absolute inset-[16%_20%] rounded-[45%] border border-teal-300/50 shadow-[0_0_60px_rgba(86,212,207,.12)]" /><div className="absolute left-1/2 top-1/2 h-[58%] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-teal-300/45" /><div className="absolute left-[22%] right-[22%] top-1/2 h-[1px] -translate-y-1/2 bg-teal-300/45" /></> : <><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,123,234,.18),transparent_26%),linear-gradient(120deg,transparent_32%,rgba(255,255,255,.04)_50%,transparent_68%)]" /><div className="absolute left-1/2 top-[55%] h-36 w-28 -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-dashed border-violet-300/30" /></>}
    <div className="relative flex h-full min-h-[250px] flex-col justify-between"><div className="flex items-start justify-between"><span className="rounded-full border border-white/15 bg-[#0b0a16]/55 px-2.5 py-1 text-[10px] font-bold tracking-[.18em] text-white/65 backdrop-blur">{badge}</span>{image && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-200 backdrop-blur"><Check className="h-3 w-3" /> READY</span>}</div><div>{!image && <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-100"><CloudUpload className="h-5 w-5" /></span>}<h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2><p className="mt-1 text-xs text-white/50">{image ? image.file.name : hint}</p></div></div>
  </button>;
}

function ScanViewer({ image, result, pass }: { image: ImageAsset; result?: VisionAnalysis; pass: typeof scanPasses[number] }) {
  const points = result?.landmarks ?? [];
  return <section className="relative min-h-[520px] overflow-hidden rounded-[30px] border border-white/10 bg-[#100f20] shadow-2xl shadow-black/25"><Image src={image.url} alt="Front image with facial analysis overlay" fill unoptimized className="object-cover opacity-75" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,8,18,.62),transparent_35%,rgba(9,8,18,.24)),linear-gradient(0deg,rgba(9,8,18,.6),transparent_32%)]" />
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="glow"><feGaussianBlur stdDeviation=".7" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs><AnimatePresence mode="wait"><motion.g key={pass.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ellipse cx="50" cy="51" rx="25" ry="35" fill="none" stroke={pass.color} strokeWidth=".32" opacity=".8" filter="url(#glow)" /><line x1="50" y1="17" x2="50" y2="86" stroke={pass.color} strokeWidth=".2" opacity=".85" /><line x1="27" y1="51" x2="73" y2="51" stroke={pass.color} strokeWidth=".2" opacity=".65" /><path d="M31 40 Q50 31 69 40 M31 64 Q50 75 69 64" fill="none" stroke={pass.color} strokeWidth=".25" strokeDasharray="1.2 1.3" opacity=".85" />{points.map((point, index) => <circle key={index} cx={point.x * 100} cy={point.y * 100} r=".2" fill={pass.color} opacity={index % 3 === 0 ? .85 : .35} />)}</motion.g></AnimatePresence></svg>
    <div className="absolute left-5 top-5 rounded-xl border border-white/10 bg-[#0b0a16]/75 px-3 py-2 backdrop-blur"><p className="text-[9px] font-bold tracking-[.18em] text-white/45">LIVE PASS</p><p className="mt-0.5 text-xs font-bold" style={{ color: pass.color }}>{pass.title}</p></div><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[.15em] text-white/50">FRONT / CANONICAL PREVIEW</p><p className="mt-1 text-sm text-white/80">{pass.copy}</p></div><ScanFace className="h-7 w-7 text-white/60" /></div>
  </section>;
}

function ReviewPanel({ front, profile, active, onReset }: { front?: VisionAnalysis; profile?: VisionAnalysis; active: typeof scanPasses[number]; onReset: () => void }) {
  const valid = Boolean(front?.quality.valid && profile?.quality.valid);
  return <aside className="flex flex-col rounded-[30px] border border-white/10 bg-white/[.045] p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold tracking-[.18em] text-violet-200">VALIDATION RESULT</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">{valid ? "Geometry ready" : "Retake guidance"}</h2></div><span className={`grid h-10 w-10 place-items-center rounded-xl border ${valid ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{valid ? <Check className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}</span></div>
    <p className="mt-3 text-sm leading-6 text-white/50">{valid ? "Both captures passed the confidence gate. Metrics with a defined formula can now be calculated from normalized landmarks." : "No measurements are shown for a capture that cannot support them reliably. Address the guidance below, then rescan."}</p>
    <div className="mt-6 space-y-3"><QualityRow label="Front capture" result={front} /><QualityRow label="Profile capture" result={profile} /></div>
    <MeasurementList measurements={front?.measurements ?? []} />
    <div className="mt-6 rounded-2xl border border-white/8 bg-[#0a0914]/50 p-4"><div className="flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.14em] text-white/45">CURRENT OVERLAY</span><span className="h-2 w-2 rounded-full" style={{ background: active.color, boxShadow: `0 0 12px ${active.color}` }} /></div><p className="mt-2 text-sm font-semibold text-white/85">{active.title}</p><p className="mt-1 text-xs leading-5 text-white/45">Overlay geometry is driven by the same landmark result used for each check.</p></div>
    <div className="mt-auto pt-6"><button onClick={onReset} className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Choose different photos</button></div>
  </aside>;
}

function MeasurementList({ measurements }: { measurements: NonNullable<VisionAnalysis["measurements"]> }) {
  if (!measurements.length) return null;
  return <div className="mt-6"><div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-bold tracking-[.14em] text-white/45">MEASUREMENT REGISTRY</span><span className="text-[10px] text-white/35">Metric-specific confidence</span></div><div className="max-h-[250px] space-y-2 overflow-y-auto pr-1">{measurements.map((metric) => <div key={metric.metricId} className="rounded-xl border border-white/8 bg-white/[.025] px-3 py-2.5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-white/82">{metric.displayName}</p><p className="mt-0.5 text-[10px] text-white/38">{metric.status === "definition_required" ? "No formula registered" : `${Math.round(metric.confidence * 100)}% confidence${metric.uncertainty ? ` · ±${metric.uncertainty}` : ""}`}</p></div><span className={`whitespace-nowrap text-xs font-bold ${metric.status === "reliable" ? "text-emerald-200" : metric.status === "definition_required" ? "text-white/35" : "text-amber-100"}`}>{metric.formattedValue}</span></div></div>)}</div></div>;
}

function QualityRow({ label, result }: { label: string; result?: VisionAnalysis }) {
  const q = result?.quality;
  const messages = q?.warnings?.slice(0, 2) ?? [];
  return <div className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white/90">{label}</span><span className={`text-xs font-bold ${scoreTone(q?.overallConfidence ?? 0)}`}>{q ? `${q.overallConfidence}% confidence` : "Not evaluated"}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8"><motion.div initial={{ width: 0 }} animate={{ width: `${q?.overallConfidence ?? 0}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-400 to-teal-300" /></div><div className="mt-3 space-y-1.5">{q?.valid ? <p className="flex items-center gap-1.5 text-xs text-emerald-200"><Check className="h-3.5 w-3.5" /> One face and acceptable pose detected.</p> : messages.length ? messages.map((message) => <p key={message} className="flex items-start gap-1.5 text-xs leading-5 text-amber-100/80"><CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />{message}</p>) : <p className="text-xs text-white/35">Waiting for validation.</p>}</div></div>;
}
