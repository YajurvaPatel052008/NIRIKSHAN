"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  FileCheck2,
  FileText,
  LoaderCircle,
  Eye,
  Sparkles,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const stages = [
  ["Enhancing Image", "OpenCV — brightness, contrast, noise reduction, perspective correction"],
  ["Running OCR — Extracting Text", "PaddleOCR — reading declarations from the label"],
  ["Classifying Declarations", "Groq API — semantic analysis and normalization"],
  ["Applying Legal Metrology Rule Engine", "Python — category-specific versioned rules"],
  ["Calculating Compliance Score & Marking Evidence", "Evidence Engine — linking findings to the source image"],
  ["Finalizing Report", "Preparing an inspection report for officer review"],
];

export default function AnalysisPage() {
  const [inspectionId, setInspectionId] = useState("");
  const [activeStage, setActiveStage] = useState(0);
  const [finished, setFinished] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

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
    return () => clearInterval(stageTimer);
  }, []);

  useEffect(() => {
    if (!finished) return undefined;
    let cancelled = false;
    async function runAnalysis() {
      const currentInspectionId = new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id");
      setInspectionId(currentInspectionId || "");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} };
      const token = sessionData?.session?.access_token;
      if (!currentInspectionId || !apiUrl || !token) {
        setAnalysisError("Live analysis requires a signed-in session and a saved inspection.");
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/inspections/${currentInspectionId}/analyze`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        });
        if (!response.ok) {
          let detail = "The analysis service could not process this inspection.";
          try {
            const body = await response.json();
            if (typeof body.detail === "string") detail = body.detail;
            else if (body.detail?.message) detail = body.detail.message;
          } catch {
            // Keep the generic message when the server response is not JSON.
          }
          throw new Error(detail);
        }
        const result = await response.json();
        if (!cancelled) {
          window.sessionStorage.setItem("niriksha-analysis-result", JSON.stringify(result));
          setAnalysisComplete(true);
        }
      } catch (error) {
        if (!cancelled) setAnalysisError(error.message);
      }
    }
    runAnalysis();
    return () => { cancelled = true; };
  }, [finished]);

  return (
    <main className="min-h-screen bg-[#f4f8fa] px-4 py-8 text-slate-800 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between"><Link href="/dashboard/inspector/new-inspection/upload" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to image</Link><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#0f3d63]">                <BrandLogo className="h-5 w-5" /> NIRIKSHA AI</div></div>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_70px_-25px_rgba(15,61,99,0.3)] sm:p-8">
          <div className="mb-7 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#edf7fb] text-[#168cae]"><BrainCircuit size={24} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d18a26]">Step 3 of 3</p><h1 className="mt-1 text-2xl font-bold text-[#0f3d63] sm:text-3xl">AI Processing</h1><p className="mt-2 text-sm text-slate-500">NIRIKSHA is examining the label against Legal Metrology requirements.</p></div>
          <div className="mt-7 rounded-xl border border-slate-200 bg-[#fbfdfe] p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">AI &amp; Processing Layer</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Analysis pipeline</h2></div>{!finished ? <LoaderCircle size={20} className="animate-spin text-[#168cae]" /> : <Sparkles size={20} className="text-[#d18a26]" />}</div>
            <div className="space-y-4">{stages.map(([title, detail], index) => { const complete = index < activeStage || finished; const running = index === activeStage && !finished; return <div key={title} className="flex gap-3"><div className="relative flex w-6 justify-center">{index < stages.length - 1 && <span className={`absolute top-6 h-full w-px ${complete ? "bg-emerald-300" : "bg-slate-200"}`} />}{complete ? <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={14} strokeWidth={3} /></span> : running ? <span className="relative z-10 flex size-6 items-center justify-center rounded-full bg-[#e1f1f4] text-[#168cae]"><LoaderCircle size={14} className="animate-spin" /></span> : <span className="relative z-10 mt-1 size-4 rounded-full border-2 border-slate-200 bg-white" />}</div><div className={`pb-1 ${running ? "text-[#0f3d63]" : complete ? "text-slate-700" : "text-slate-400"}`}><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{detail}</p></div></div>; })}</div>
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-[#b8d7e8] bg-[#edf7fb] px-3 py-2.5 text-xs text-[#0f6584]"><FileText size={15} /><span>OCR text will appear here after the backend returns detected declarations.</span></div>
          </div>
          {analysisError && <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{analysisError}</p>}
          {analysisComplete ? <div className="mt-6 flex flex-col items-center gap-3"><p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><FileCheck2 size={18} /> Processing complete</p><Link href={`/dashboard/inspector/new-inspection/results?inspectionId=${encodeURIComponent(inspectionId)}`} className="inline-flex items-center gap-2 rounded-md bg-[#0f3d63] px-6 py-3 text-sm font-bold text-white hover:bg-[#0b2e4b]">View Results <ArrowRight size={17} /></Link></div> : <p className="mt-6 text-center text-xs text-slate-400">{analysisError ? "Analysis did not complete." : "Waiting for the backend analysis response..."}</p>}
        </section>
      </div>
    </main>
  );
}
