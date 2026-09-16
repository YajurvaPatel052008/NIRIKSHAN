"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  Download,
  Flag,
  FileText,
  LoaderCircle,
  MapPin,
  Scale,
  Eye,
  User,
  X,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const emptyData = {
  score: 0,
  status: "Awaiting analysis",
  summary: {},
  violations: [],
  compliant_declarations: [],
};

const severityStyles = {
  High: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-sky-50 text-sky-700 ring-sky-200",
};

function Gauge({ score }) {
  return (
    <div className="relative flex size-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#d18a26 ${score * 3.6}deg, #e7eef0 0deg)` }}>
      <div className="flex size-32 flex-col items-center justify-center rounded-full bg-white">
        <span className="text-4xl font-bold tracking-tight text-[#0f3d63]">{score}</span>
        <span className="text-xs font-semibold text-slate-400">out of 100</span>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [saved, setSaved] = useState(false);
  const [evidenceImage, setEvidenceImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const inspectionId = new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id");
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} };
      const token = sessionData?.session?.access_token;
      if (!apiUrl || !inspectionId || !token) {
        setError("Compliance results require a completed inspection and an active session.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/inspections/${inspectionId}`, { headers: { Authorization: "Bearer " + token } });
        if (!response.ok) throw new Error("Unable to load compliance results.");
        const result = await response.json();
        const inspection = result.inspection || {};
        const latestImage = [...(result.images || [])]
          .filter((image) => image.url || image.storage_path)
          .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0))[0];
        setEvidenceImage(latestImage || null);
        setImageLoading(Boolean(latestImage?.url));
        setData({
          score: inspection.compliance_score ?? 0,
          status: inspection.compliance_status || "Awaiting analysis",
          summary: {
            product_name: inspection.products?.name || inspection.manufacturer || "Not available",
            category: inspection.category || "Not available",
            manufacturer: inspection.manufacturer || "Not available",
            inspection_date: inspection.created_at ? new Date(inspection.created_at).toLocaleString() : "Not available",
            inspector: inspection.inspector_name || inspection.inspector_id || "Not available",
            location: inspection.location || "Not available",
          },
          violations: result.violations || [],
          compliant_declarations: (result.declarations || []).filter((item) => item.normalized_value).map((item) => item.declaration_type),
        });
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
    return undefined;
  }, []);

  const summaryItems = [
    ["Product Name", data.summary.product_name, FileText],
    ["Category", data.summary.category, Scale],
    ["Manufacturer", data.summary.manufacturer, BrandLogo],
    ["Inspection Date", data.summary.inspection_date, FileText],
    ["Inspector Name", data.summary.inspector, User],
    ["Location", data.summary.location, MapPin],
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10">                <BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> New Inspection</Link></nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Compliance Result</h1></div><Link href="/dashboard/inspector/new-inspection/results" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to extraction</Link></header>
        <main className="mx-auto max-w-[1350px] p-5 sm:p-8">
          {loading && <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#b8d7e8] bg-[#edf7fb] px-4 py-3 text-xs text-[#0f6584]"><LoaderCircle size={15} className="animate-spin" /> Loading Rule Engine results...</div>}
          {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center justify-between gap-7 md:flex-row"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Rule Engine + Evidence Engine</p><h2 className="mt-2 text-2xl font-bold text-[#0f3d63]">Compliance Result</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">The result below is an AI-assisted assessment. An authorised officer must review findings against the applicable versioned rules.</p></div><div className="flex flex-col items-center gap-3"><Gauge score={data.score} /><span className="rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">{data.status}</span></div></div>
            <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">{summaryItems.map(([label, value, Icon]) => <div key={label} className="rounded-lg bg-[#f7fafb] p-3"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Icon size={13} /> {label}</div><p className="mt-2 truncate text-sm font-semibold text-[#0f3d63]">{value}</p></div>)}</div>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Evidence</p>
              <h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Original Evidence Image</h2>
              <p className="mt-1 text-sm text-slate-500">The original label photo used for this inspection.</p>
            </div>
            <div className="mt-5 flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
              {evidenceImage?.url && !imageError && (
                <button type="button" onClick={() => setLightboxOpen(true)} className="group relative block max-w-md text-left">
                  {imageLoading && <span className="absolute inset-0 animate-pulse rounded-lg bg-slate-200" aria-label="Loading evidence image" />}
                  <img src={evidenceImage.url} alt="Original product label evidence" onLoad={() => setImageLoading(false)} onError={() => { setImageLoading(false); setImageError(true); }} className={`relative max-h-[360px] w-full rounded-lg object-contain shadow-sm transition group-hover:opacity-90 ${imageLoading ? "opacity-0" : "opacity-100"}`} />
                  <span className="mt-3 block text-xs text-slate-500">Original label photo — {data.summary.inspection_date}</span>
                  <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#0f6584]"><Eye size={14} /> Click to view full size</span>
                </button>
              )}
              {!imageLoading && (!evidenceImage?.url || imageError) && <p className="text-sm font-semibold text-slate-500">Image unavailable</p>}
            </div>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">Review required</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Violations Detected <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">{data.violations.length}</span></h2></div><AlertTriangle className="text-amber-500" size={24} /></div><div className="mt-5 space-y-4">{data.violations.length === 0 ? <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No violations were returned by the rule engine.</p> : data.violations.map((violation, index) => <article key={`${violation.rule_id || violation.declaration_type}-${index}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-[#b8d7e8] sm:p-5"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-[#0f3d63]">{violation.description || "Rule violation"}</h3><p className="mt-1 text-xs text-slate-500">Declaration: <span className="font-semibold text-slate-700">{violation.declaration_type || "Not specified"}</span></p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${severityStyles[violation.severity] || severityStyles.Low}`}>{violation.severity || "Unknown"} severity</span>          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{Math.round(violation.confidence_score > 1 ? violation.confidence_score : (violation.confidence_score || 0) * 100)}% confidence</span></div></div><div className="mt-3 rounded-md bg-[#f7fafb] px-3 py-2 text-xs text-slate-600"><span className="font-bold text-[#0f6584]">Rule ID: </span>{violation.rule_id || "Not specified"}</div></div></article>)}</div></section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between p-6 text-left sm:px-8"><span><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Passed checks</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Compliant Declarations <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{data.compliant_declarations.length}</span></h2></span><ChevronDown size={21} className={`text-slate-400 transition ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="grid gap-3 border-t border-slate-100 px-6 pb-6 pt-5 sm:grid-cols-2 sm:px-8">{data.compliant_declarations.map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50/70 px-3 py-3 text-sm text-emerald-800"><Check size={17} strokeWidth={3} />{item}</div>)}</div>}</section>
          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><Link href="/dashboard/inspector/new-inspection/verify" className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-bold ${flagged ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}><Flag size={16} /> Flag for Human Verification</Link><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccddd] bg-white px-5 text-sm font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Download size={16} /> Generate Report (PDF)</button><Link href="/dashboard/inspector" onClick={() => setSaved(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b]"><Check size={17} /> {saved ? "Saved" : "Save & Return to Dashboard"}</Link></div></div>
        </main>
      </div>
      {lightboxOpen && evidenceImage?.url && <div role="dialog" aria-modal="true" aria-label="Full-size original evidence image" className="fixed inset-0 z-50 flex items-center justify-center bg-[#061b2c]/85 p-5" onClick={() => setLightboxOpen(false)}><div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setLightboxOpen(false)} aria-label="Close image" className="absolute -right-2 -top-2 z-10 rounded-full bg-white p-2 text-slate-600 shadow-lg hover:text-[#0f3d63]"><X size={18} /></button><img src={evidenceImage.url} alt="Full-size original product label evidence" className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl" /><p className="mt-2 text-center text-xs text-white">Original label photo — {data.summary.inspection_date}</p></div></div>}
    </div>
  );
}
