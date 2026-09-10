"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  Circle,
  FileCheck2,
  FileText,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const stages = [
  ["Enhancing Image", "OpenCV — brightness, contrast, noise reduction, perspective correction"],
  ["Running OCR — Extracting Text", "PaddleOCR — reading declarations from the label"],
  ["Classifying Declarations", "Groq API — semantic analysis and normalization"],
  ["Applying Legal Metrology Rule Engine", "Python — category-specific versioned rules"],
  ["Calculating Compliance Score & Marking Evidence", "Evidence Engine — linking findings to the source image"],
  ["Finalizing Report", "Preparing an inspection report for officer review"],
];

const snippets = ["MRP: ₹149", "Net Qty: 250g", "Mfg Date: 03/2025", "Packer: Bharat Foods Ltd."];

function DemoLabel() {
  return (
    <div className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-lg bg-[#dcecef] sm:h-[260px]">
      <div className="w-[170px] rotate-[-4deg] rounded-md border border-slate-300 bg-white p-3 shadow-2xl sm:w-[195px]">
        <div className="flex h-7 items-center gap-2 rounded bg-[#0f3d63] px-2"><ShieldCheck size={12} className="text-white" /><span className="text-[7px] font-bold tracking-[0.14em] text-white">NIRIKSHA SAMPLE</span></div>
        <div className="mt-3 rounded bg-[#e1f1f4] p-3"><p className="text-[9px] font-bold text-[#0f3d63]">PREMIUM WHOLE WHEAT</p><div className="mt-2 h-1 w-3/4 rounded bg-[#168cae]/40" /><div className="mt-2 h-1 w-1/2 rounded bg-slate-300" /></div>
        <div className="mt-3 space-y-1.5"><div className="h-1 w-full rounded bg-slate-200" /><div className="h-1 w-5/6 rounded bg-slate-200" /><div className="h-1 w-2/3 rounded bg-slate-200" /></div>
        <div className="mt-4 flex justify-between"><div className="space-y-1"><div className="h-1 w-12 rounded bg-slate-300" /><div className="h-1 w-16 rounded bg-slate-200" /></div><div className="grid grid-cols-4 gap-0.5">{Array.from({ length: 16 }).map((_, index) => <span key={index} className="size-1.5 bg-[#0f3d63]" />)}</div></div>
      </div>
      <div className="scanner-line absolute inset-x-0 top-0 h-0.5 bg-[#72d2d1] shadow-[0_0_16px_4px_rgba(114,210,209,0.8)]" />
      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-[#0f3d63]/80 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white"><Circle size={7} className="fill-[#72d2d1] text-[#72d2d1]" /> AI scanning image</span>
    </div>
  );
}

export default function AnalysisPage() {
  const [activeStage, setActiveStage] = useState(0);
  const [snippet, setSnippet] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const stageTimer = setInterval(() => {
      setActiveStage((current) => {
        if (current >= stages.length - 1) {
          clearInterval(stageTimer);
          setFinished(true);
          return current;
        }
        return current + 1;
      });
    }, 780);
    const snippetTimer = setInterval(() => setSnippet((current) => (current + 1) % snippets.length), 900);
    return () => {
      clearInterval(stageTimer);
      clearInterval(snippetTimer);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f8fa] px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between"><Link href="/dashboard/inspector/new-inspection/upload" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to image</Link><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0f3d63]"><ShieldCheck size={18} className="text-[#168cae]" /> NIRIKSHA AI</div></div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_70px_-25px_rgba(15,61,99,0.3)] sm:p-8">
          <div className="mb-7 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#edf7fb] text-[#168cae]"><BrainCircuit size={24} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d18a26]">Step 3 of 3</p><h1 className="mt-1 text-2xl font-bold text-[#0f3d63] sm:text-3xl">AI Processing</h1><p className="mt-2 text-sm text-slate-500">NIRIKSHA is examining the label against Legal Metrology requirements.</p></div>
          <DemoLabel />
          <div className="mt-7 rounded-xl border border-slate-200 bg-[#fbfdfe] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">AI &amp; Processing Layer</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Analysis pipeline</h2></div>{!finished ? <LoaderCircle size={20} className="animate-spin text-[#168cae]" /> : <Sparkles size={20} className="text-[#d18a26]" />}</div>
            <div className="space-y-4">{stages.map(([title, detail], index) => { const complete = index < activeStage || finished; const running = index === activeStage && !finished; return <div key={title} className="flex gap-3"><div className="relative flex w-6 justify-center">{index < stages.length - 1 && <span className={`absolute top-6 h-full w-px ${complete ? "bg-emerald-300" : "bg-slate-200"}`} />}{complete ? <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={14} strokeWidth={3} /></span> : running ? <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[#e1f1f4] text-[#168cae]"><LoaderCircle size={14} className="animate-spin" /></span> : <span className="relative z-10 mt-1 size-4 rounded-full border-2 border-slate-200 bg-white" />}</div><div className={`pb-1 ${running ? "text-[#0f3d63]" : complete ? "text-slate-700" : "text-slate-400"}`}><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div></div>; })}</div>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#b8d7e8] bg-[#edf7fb] px-3 py-2.5 text-xs text-[#0f6584]"><FileText size={15} /><span>Extracted text:</span><span key={snippets[snippet]} className="font-bold text-[#0f3d63] ticker-text">{snippets[snippet]}</span></div>
          </div>
          {finished ? <div className="mt-6 flex flex-col items-center gap-3"><p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><FileCheck2 size={18} /> Processing complete</p><Link href="/dashboard/inspector/new-inspection/results" className="inline-flex items-center gap-2 rounded-md bg-[#0f3d63] px-6 py-3 text-sm font-bold text-white hover:bg-[#0b2e4b]">View Results <ArrowRight size={17} /></Link></div> : <p className="mt-6 text-center text-xs text-slate-400">This usually takes a few seconds. Please keep this window open.</p>}
        </section>
      </div>
    </main>
  );
}
