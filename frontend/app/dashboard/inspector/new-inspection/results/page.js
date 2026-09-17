"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  FileCheck2,
  FileText,
  Info,
  Eye,
  X,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

function ConfidenceBadge({ confidence }) {
  const color = confidence > 90 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : confidence >= 70 ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-red-50 text-red-700 ring-red-200";
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-bold ring-1 ring-inset ${color}`}>{confidence}%</span>;
}

function Status({ status }) {
  if (status === "found") return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check size={15} strokeWidth={3} /> Found</span>;
  if (status === "low") return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle size={15} /> Low Confidence</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><X size={15} /> Not Found</span>;
}

export default function ResultsPage() {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadResults() {
      const inspectionId = new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} };
      const token = sessionData?.session?.access_token;
      if (!inspectionId || !apiUrl || !token) {
        setError("Live inspection results require a signed-in session.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/inspections/${inspectionId}`, {
          headers: { Authorization: "Bearer " + token },
        });
        if (!response.ok) throw new Error("Unable to load inspection results.");
        const result = await response.json();
        if (!cancelled) {
          setImageUrl(result.image_url || result.images?.find((image) => image.url)?.url || "");
          setImageLoading(Boolean(result.image_url || result.images?.some((image) => image.url)));
          setDeclarations((result.declarations || []).map((item, index) => ({
            id: item.id || `${item.declaration_type}-${index}`,
            type: item.declaration_type,
            value: item.normalized_value || item.extracted_value || "Not detected",
            confidence: Math.round(item.confidence_score > 1 ? item.confidence_score : item.confidence_score * 100),
            status: item.normalized_value ? "found" : "not-found",
            box: null,
            color: "#168cae",
          })));
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
          setLoading(false);
        }
      }
    }
    loadResults();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10">                <BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection/upload" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> New Inspection</Link></nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Extraction Results</h1></div><Link href="/dashboard/inspector/new-inspection/analysis" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to AI Processing</Link></header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          {loading && <p className="mb-5 rounded-md border border-[#b8d7e8] bg-[#edf7fb] px-4 py-3 text-sm text-[#0f6584]">Loading live inspection results...</p>}
          {error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d18a26]">Step 3 of 3</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Extraction Results</h2><p className="mt-1 text-sm text-slate-500">Review declarations identified by PaddleOCR and normalized by Groq.</p></div><div className="hidden items-center gap-2 sm:flex"><span className="size-2.5 rounded-full bg-emerald-500" /><span className="h-px w-12 bg-emerald-400" /><span className="size-2.5 rounded-full bg-emerald-500" /><span className="h-px w-12 bg-[#d18a26]" /><span className="size-2.5 rounded-full bg-[#d18a26]" /></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-full rounded-full bg-[#d18a26]" /></div></div>
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Source image</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Detected text regions</h2></div><div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6">{imageUrl && !imageError ? <div className="relative max-w-full">{imageLoading && <div className="absolute inset-0 animate-pulse rounded-lg bg-slate-200" aria-label="Loading source image" />}<img src={imageUrl} alt="Uploaded product label" onLoad={() => setImageLoading(false)} onError={() => { setImageLoading(false); setImageError(true); }} className={`max-h-[520px] max-w-full rounded-lg object-contain ${imageLoading ? "opacity-0" : "opacity-100"}`} /></div> : !imageLoading && <p className="text-sm font-semibold text-slate-500">Image unavailable</p>}</div></section>
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">OCR + semantic extraction</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Extracted Declarations</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><Check size={13} /> {declarations.length} found</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-bold">Declaration Type</th><th className="px-5 py-3 font-bold">Extracted Value</th><th className="px-5 py-3 font-bold">Confidence</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody>{declarations.map((item) => <tr key={item.id} className="border-b border-slate-50 transition last:border-0 hover:bg-slate-50"><td className="px-5 py-4 text-xs font-bold text-slate-600">{item.type}</td><td className="max-w-[240px] px-5 py-4 text-xs leading-5 text-slate-600">{item.value}</td><td className="px-5 py-4"><ConfidenceBadge confidence={item.confidence} /></td><td className="px-5 py-4"><Status status={item.status} /></td></tr>)}</tbody></table></div><div className="m-5 flex gap-2 rounded-lg border border-[#f0d8ae] bg-[#fff9ed] p-3 text-xs leading-5 text-[#805b1e]"><Info size={16} className="mt-0.5 shrink-0" /><span>AI confidence below 80% requires manual verification before a compliance decision.</span></div><p className="px-5 pb-5 text-[11px] text-slate-400">Extraction powered by PaddleOCR + Groq API.</p></section>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row"><Link href="/dashboard/inspector/new-inspection/analysis" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"><ArrowLeft size={16} /> Back</Link><Link href="/dashboard/inspector/new-inspection/compliance" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b]">Proceed to Compliance Check <ArrowRight size={17} /></Link></div>
        </main>
      </div>
    </div>
  );
}
