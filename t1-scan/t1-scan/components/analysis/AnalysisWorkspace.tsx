"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronRight, CircleAlert, CloudUpload, Loader2, LockKeyhole, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { analyzeImages, REMOTE_3D_ENABLED } from "@/lib/analysis/pipeline";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/analysis/format";
import type { AnalysisResult, ImageView, ProgressStage, ViewAnalysis } from "@/lib/types/analysis";
import { MeasurementOverlay } from "./MeasurementOverlay";
import { scoreAll } from "@/lib/scoring/score";
import type { Answer, Answers, Sex } from "@/lib/scoring/types";
import { FaceChooser } from "./FaceChooser";
import { FinalResults } from "./FinalResults";
import { ResultsPanel } from "./ResultsPanel";

type Stage = "upload" | "analyzing" | "review" | "results";
type ImageAsset = { file: File; url: string };

const steps = ["Images", "Analyze", "Review", "Results"];
const AUTOPLAY_MS = 3600;

export function AnalysisWorkspace() {
  const [images, setImages] = useState<Partial<Record<ImageView, ImageAsset>>>({});
  const [stage, setStage] = useState<Stage>("upload");
  const [result, setResult] = useState<AnalysisResult>();
  const [progress, setProgress] = useState<{ stage: ProgressStage; view?: ImageView }>();
  const [error, setError] = useState<string>();
  const [view, setView] = useState<ImageView>("front");
  const [activeId, setActiveId] = useState<string>();
  const [pinned, setPinned] = useState(false);
  const [busyView, setBusyView] = useState<ImageView>();
  const [sex, setSex] = useState<Sex | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const answer = useCallback((id: string, a: Answer | undefined) => setAnswers((prev) => { const next = { ...prev }; if (a) next[id] = a; else delete next[id]; return next; }), []);
  const inputs = useRef<Record<ImageView, HTMLInputElement | null>>({ front: null, profile: null });
  const abort = useRef<AbortController>();
  const urls = useRef<string[]>([]);

  useEffect(() => () => { urls.current.forEach(URL.revokeObjectURL); abort.current?.abort(); }, []);

  const current: ViewAnalysis | undefined = result?.analysis[view];
  const measured = current?.metrics.filter((m) => m.value !== null) ?? [];

  // Sequential showcase of real measurements until the user picks one.
  useEffect(() => {
    if (stage !== "review" || pinned || measured.length === 0) return;
    let i = Math.max(0, measured.findIndex((m) => m.id === activeId));
    if (!activeId) setActiveId(measured[0].id);
    const timer = window.setInterval(() => { i = (i + 1) % measured.length; setActiveId(measured[i].id); }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pinned, view, result]);

  const setImage = (v: ImageView, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please choose an image file (JPG, PNG, or WebP)."); return; }
    setError(undefined);
    const url = URL.createObjectURL(file); urls.current.push(url);
    setImages((prev) => { if (prev[v]) URL.revokeObjectURL(prev[v]!.url); return { ...prev, [v]: { file, url } }; });
    setStage("upload"); setResult(undefined);
  };
  const onChange = (v: ImageView) => (e: ChangeEvent<HTMLInputElement>) => { setImage(v, e.target.files?.[0]); e.target.value = ""; };
  const onDrop = (v: ImageView) => (e: DragEvent<HTMLButtonElement>) => { e.preventDefault(); setImage(v, e.dataTransfer.files?.[0]); };

  const begin = useCallback(async () => {
    if (!images.front && !images.profile) return;
    abort.current?.abort(); const ctl = new AbortController(); abort.current = ctl;
    setStage("analyzing"); setError(undefined); setProgress({ stage: "uploading" }); setPinned(false); setActiveId(undefined);
    try {
      const r = await analyzeImages({ front: images.front?.file, profile: images.profile?.file }, { signal: ctl.signal, onProgress: (s, v) => setProgress({ stage: s, view: v }) });
      if (ctl.signal.aborted) return;
      setResult(r); setView(r.analysis.front ? "front" : "profile"); setStage("review");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setStage("upload"); setError("The analysis could not start. Check your connection (the face model downloads on first use) and try again.");
    }
  }, [images]);

  /** Re-analyze a single view after the user picked a face; the other view is kept as is. */
  const chooseFace = useCallback(async (v: ImageView, index: number) => {
    const file = images[v]?.file; if (!file || !result) return;
    setBusyView(v);
    try {
      const r = await analyzeImages({ [v]: file }, { faceSelection: { [v]: index } });
      setResult((prev) => { if (!prev) return prev; const analysis = { ...prev.analysis, [v]: r.analysis[v] }; return { ...prev, analysis, scores: scoreAll(analysis) }; });
      setActiveId(undefined); setPinned(false);
    } finally { setBusyView(undefined); }
  }, [images, result]);

  const reset = () => { abort.current?.abort(); setStage("upload"); setResult(undefined); setActiveId(undefined); setAnswers({}); };
  const canBegin = Boolean(images.front || images.profile);
  const asset = images[view];
  const activeMetric = current?.metrics.find((m) => m.id === activeId);

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
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-200"><LockKeyhole className="h-3.5 w-3.5" /> {REMOTE_3D_ENABLED ? "3D SERVICE · NOT STORED" : "LOCAL ONLY"}</div>
      </header>


      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[.08] px-3 py-1.5 text-[11px] font-bold tracking-[.16em] text-violet-200"><Sparkles className="h-3.5 w-3.5" /> PRIVATE GEOMETRY WORKSPACE</motion.div>
          <h1 className="text-balance text-4xl font-semibold tracking-[-.045em] text-white sm:text-5xl lg:text-6xl">Measure with context,<br /><span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-teal-200 bg-clip-text text-transparent">not false precision.</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-6 text-white/52 sm:text-base">Upload any front photo and any side photo — selfies, crops and off-angle shots are fine. T1 finds the face, corrects for pose and scale, and tells you how much to trust each measurement. Better lighting helps, but isn&apos;t required.</p>
        </div>
        <nav aria-label="Analysis progress" className="mx-auto mt-10 flex max-w-lg items-center justify-between">
          {steps.map((step, index) => {
            const current = stage === "upload" ? 0 : stage === "analyzing" ? 1 : stage === "review" ? 2 : 3;
            const complete = index < current;
            return <div key={step} className="flex flex-1 items-center last:flex-none"><div className="flex items-center gap-2.5"><span className={`grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${complete ? "border-violet-400 bg-violet-500 text-white" : index === current ? "border-teal-300/70 bg-teal-300/10 text-teal-100" : "border-white/15 bg-white/[.03] text-white/35"}`}>{complete ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className={`text-[11px] font-bold tracking-[.12em] ${index <= current ? "text-white/80" : "text-white/30"}`}>{step.toUpperCase()}</span></div>{index < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${index < current ? "bg-violet-400" : "bg-white/10"}`} />}</div>;
          })}
        </nav>

        <AnimatePresence mode="wait">
          {stage === "results" && result ? <motion.div key="results" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><FinalResults result={result} photos={{ front: images.front?.url, profile: images.profile?.url }} assessment={{ sex, answers, onSex: setSex, onAnswer: answer }} onBack={() => setStage("review")} /></motion.div> : stage !== "review" ? <motion.div key="input" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mx-auto mt-10 max-w-6xl">
            <div className="grid gap-4 lg:grid-cols-2">
              <UploadCard title="Front photo" hint="Any clear photo of the face" badge="01" image={images.front} onChoose={() => inputs.current.front?.click()} onDrop={onDrop("front")} />
              <UploadCard title="Side photo" hint="Left or right — we detect the side" badge="02" image={images.profile} onChoose={() => inputs.current.profile?.click()} onDrop={onDrop("profile")} />
            </div>
            <input ref={(n) => { inputs.current.front = n; }} onChange={onChange("front")} className="hidden" type="file" accept="image/*" />
            <input ref={(n) => { inputs.current.profile = n; }} onChange={onChange("profile")} className="hidden" type="file" accept="image/*" />
            {error && <div role="alert" className="mx-auto mt-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-rose-300/20 bg-rose-300/[.07] px-4 py-3 text-sm text-rose-100"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            {stage === "analyzing" && progress && <ProgressList progress={progress} />}
            <div className="mt-7 flex flex-col items-center gap-4"><button onClick={begin} disabled={!canBegin || stage === "analyzing"} className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-[#18152c] shadow-[0_10px_40px_rgba(160,147,255,.18)] transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40">{stage === "analyzing" ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing</> : <>Analyze geometry <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>}</button><p className="flex items-center gap-1.5 text-xs text-white/38"><ShieldCheck className="h-3.5 w-3.5 text-teal-300" />{REMOTE_3D_ENABLED ? "Photos are processed in memory and never stored." : "Photos are processed on this device and never uploaded."}</p></div>
          </motion.div> : result && <motion.div key="review" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto mt-10 max-w-6xl">
            <div className="mb-4 flex items-center justify-center gap-2">{(["front", "profile"] as const).filter((v) => result.analysis[v]).map((v) => <button key={v} onClick={() => { setView(v); setActiveId(undefined); setPinned(false); }} className={`rounded-full border px-4 py-1.5 text-xs font-bold tracking-wide transition ${view === v ? "border-violet-300/50 bg-violet-400/15 text-white" : "border-white/10 text-white/50 hover:text-white"}`}>{v === "front" ? "FRONT" : "SIDE"}</button>)}</div>
            {current?.status === "failed" ? (current.failure?.candidates && asset ? <div aria-busy={busyView === view}><FaceChooser analysis={current} src={asset.url} onChoose={(i) => chooseFace(view, i)} />{busyView === view && <p className="mt-3 flex items-center justify-center gap-2 text-xs text-white/55"><Loader2 className="h-3.5 w-3.5 animate-spin" />Analyzing selected face</p>}</div> : <FailureCard analysis={current} onReset={reset} />) : current && asset && <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <MeasurementOverlay src={asset.url} analysis={current} metric={activeMetric} />
              <ResultsPanel analysis={current} activeId={activeId} onSelect={(id) => { setPinned(true); setActiveId(id); }} />
            </div>}
            <div className="mt-7 flex flex-col items-center gap-4"><button onClick={() => setStage("results")} className="group inline-flex min-w-[240px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-[#18152c] shadow-[0_10px_40px_rgba(160,147,255,.18)] transition hover:bg-violet-100">See final results <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></button><button onClick={reset} className="inline-flex items-center gap-2 text-xs font-bold text-white/55 transition hover:text-white"><RotateCcw className="h-3.5 w-3.5" /> Choose different photos</button></div>
          </motion.div>}
        </AnimatePresence>
      </section>
    </main>
  );
}

function ProgressList({ progress }: { progress: { stage: ProgressStage; view?: ImageView } }) {
  const idx = STAGE_ORDER.indexOf(progress.stage);
  return <div role="status" aria-live="polite" className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-white/[.035] p-4">
    <p className="text-[10px] font-bold tracking-[.16em] text-white/45">{progress.view ? `${progress.view.toUpperCase()} PHOTO` : "STARTING"}</p>
    <ul className="mt-3 space-y-1.5">{STAGE_ORDER.slice(0, -1).map((s, i) => <li key={s} className={`flex items-center gap-2 text-xs ${i < idx ? "text-emerald-200/80" : i === idx ? "text-white" : "text-white/30"}`}>{i < idx ? <Check className="h-3.5 w-3.5" /> : i === idx ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className="h-3.5 w-3.5 rounded-full border border-white/15" />}{STAGE_LABEL[s]}</li>)}</ul>
  </div>;
}

function FailureCard({ analysis, onReset }: { analysis: ViewAnalysis; onReset: () => void }) {
  return <div role="alert" className="mx-auto max-w-xl rounded-[28px] border border-amber-300/20 bg-amber-300/[.06] p-7 text-center">
    <CircleAlert className="mx-auto h-6 w-6 text-amber-200" /><h2 className="mt-3 text-xl font-semibold">{analysis.failure?.message}</h2><p className="mt-2 text-sm leading-6 text-white/55">{analysis.failure?.guidance}</p>
    <button onClick={onReset} className="mt-5 text-xs font-bold text-white/60 hover:text-white">Choose a different photo</button>
  </div>;
}

function UploadCard({ title, hint, badge, image, onChoose, onDrop }: { title: string; hint: string; badge: string; image?: ImageAsset; onChoose: () => void; onDrop: (event: DragEvent<HTMLButtonElement>) => void }) {
  return <button type="button" onClick={onChoose} onDragOver={(event) => event.preventDefault()} onDrop={onDrop} className="group relative min-h-[290px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.045] p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300/45 hover:bg-white/[.065] focus:outline-none focus:ring-2 focus:ring-violet-400/70 sm:min-h-[340px]">
    {image ? <><Image src={image.url} alt={`${title} selected for analysis`} fill unoptimized className="object-cover opacity-80 transition duration-500 group-hover:scale-[1.025]" /><div className="absolute inset-0 bg-gradient-to-t from-[#0b0a16] via-[#0b0a16]/10 to-[#0b0a16]/20" /></> : <><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(139,123,234,.18),transparent_26%),linear-gradient(120deg,transparent_32%,rgba(255,255,255,.04)_50%,transparent_68%)]" /></>}
    <div className="relative flex h-full min-h-[250px] flex-col justify-between"><div className="flex items-start justify-between"><span className="rounded-full border border-white/15 bg-[#0b0a16]/55 px-2.5 py-1 text-[10px] font-bold tracking-[.18em] text-white/65 backdrop-blur">{badge}</span>{image && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-200 backdrop-blur"><Check className="h-3 w-3" /> READY</span>}</div><div>{!image && <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl border border-violet-300/20 bg-violet-300/10 text-violet-100"><CloudUpload className="h-5 w-5" /></span>}<h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2><p className="mt-1 text-xs text-white/50">{image ? image.file.name : hint}</p></div></div>
  </button>;
}

