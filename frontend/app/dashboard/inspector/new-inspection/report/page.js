"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, MapPin, Printer, Share2, ChevronLeft, LoaderCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import BrandLogo from "@/components/brand-logo";

function DocumentHeader({ title, page }) {
  return <div className="border-b-2 border-[#0f3d63] pb-4"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded bg-[#0f3d63]"><BrandLogo className="h-8 w-9" /></span><div><p className="text-base font-bold tracking-[0.16em] text-[#0f3d63]">NIRIKSHA</p><p className="text-[9px] uppercase tracking-widest text-slate-500">Legal Metrology Enforcement</p></div></div><p className="text-right text-[10px] text-slate-500">Compliance Report<br />Page {page} of 4</p></div><h2 className="mt-6 text-xl font-bold text-[#0f3d63]">{title}</h2></div>;
}

export default function ReportPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const inspectionId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id") : "";

  useEffect(() => {
    async function load() {
      const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
      if (!inspectionId || !process.env.NEXT_PUBLIC_API_URL || !token) {
        setError("A completed inspection and active session are required.");
        return;
      }
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inspections/${inspectionId}`, { headers: { Authorization: "Bearer " + token } });
        if (!response.ok) throw new Error("Unable to load the inspection report.");
        const result = await response.json();
        setData(result);
        const sourceUrl = result.image_url || result.images?.find((image) => image.url)?.url || "";
        setImageLoading(Boolean(sourceUrl));
      } catch (loadError) {
        setError(loadError.message);
      }
    }
    load();
  }, [inspectionId]);

  async function downloadPdf() {
    setReportGenerating(true);
    setError("");
    try {
      const token = (await supabase?.auth.getSession())?.data?.session?.access_token;
      if (!token || !inspectionId || !process.env.NEXT_PUBLIC_API_URL) throw new Error("An active inspection session is required to generate the report.");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inspections/${inspectionId}/generate-report`, { method: "POST", headers: { Authorization: "Bearer " + token } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.detail || "Unable to generate the PDF report.");
      const fileResponse = await fetch(result.url);
      if (!fileResponse.ok) throw new Error("The generated PDF could not be downloaded.");
      const blobUrl = URL.createObjectURL(await fileResponse.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `niriksha-inspection-${inspectionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (downloadError) {
      setError(downloadError.message || "Unable to generate the PDF report.");
    } finally {
      setReportGenerating(false);
    }
  }

  const inspection = data?.inspection || {};
  const declarations = data?.declarations || [];
  const violations = data?.violations || [];
  const imageUrl = data?.image_url || data?.images?.find((image) => image.url)?.url || "";
  const evidenceImages = violations.filter((item) => item.evidence_image_url);
  const summary = [
    ["Inspection ID", inspection.id || "Not available"],
    ["Product", inspection.products?.name || inspection.manufacturer || "Not available"],
    ["Date", inspection.created_at ? new Date(inspection.created_at).toLocaleString() : "Not available"],
    ["Inspector", inspection.inspector_id || "Not available"],
    ["Category", inspection.category || "Not available"],
    ["Location", inspection.location || "Not available"],
  ];

  return <div className="min-h-screen bg-[#e9f0f3] text-slate-800"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Evidence Engine</p><h1 className="text-lg font-bold text-[#0f3d63]">Compliance Report Preview</h1></div><div className="flex flex-wrap gap-2"><button onClick={downloadPdf} disabled={reportGenerating} className="toolbar-button primary disabled:cursor-not-allowed disabled:opacity-60">{reportGenerating ? <LoaderCircle size={15} className="animate-spin" /> : <Download size={15} />} {reportGenerating ? "Generating PDF..." : "Download PDF"}</button><button onClick={() => window.print()} className="toolbar-button"><Printer size={15} /> Print</button><button onClick={() => navigator.share?.({ title: "NIRIKSHA Compliance Report", text: "Inspection report" })} className="toolbar-button"><Share2 size={15} /> Share</button></div></div></header><div className="mx-auto flex max-w-7xl gap-6 px-5 py-6 sm:px-8"><aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 text-sm text-blue-100/65"><ChevronLeft size={17} /> Dashboard</Link><Link href={`/dashboard/inspector/new-inspection/compliance?inspectionId=${inspectionId}`} className="mt-2 flex items-center gap-3 text-sm text-blue-100/65"><FileText size={17} /> Inspection Report</Link></nav></aside><main className="w-full lg:ml-64">{error && <p className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<div className="mb-5"><Link href={`/dashboard/inspector/new-inspection/verify?inspectionId=${inspectionId}`} className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584]"><ArrowLeft size={16} /> Back to verification</Link></div><div className="mx-auto max-w-[820px]"><div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">{["Summary", "Declarations", "Violations", "Evidence"].map((label, index) => <button key={label} onClick={() => setPage(index + 1)} className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-bold ${page === index + 1 ? "bg-[#0f3d63] text-white" : "text-slate-500"}`}>Page {index + 1} · {label}</button>)}</div><article className="report-paper min-h-[760px] bg-white p-7 shadow sm:p-12">{page === 1 && <><DocumentHeader title="Inspection Summary" page={1}/>  <div className="mt-8 rounded border border-slate-200 p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Compliance status</p><div className="mt-3 flex flex-wrap items-center gap-4"><div className="flex size-28 flex-col items-center justify-center rounded-full border-[10px] border-[#d18a26]"><span className="text-2xl font-bold text-[#0f3d63]">{inspection.compliance_score ?? "—"}</span><span className="text-[10px] text-slate-400">out of 100</span></div><div><p className="text-2xl font-bold text-[#0f3d63]">{inspection.compliance_status || "Awaiting analysis"}</p><p className="mt-1 text-sm text-slate-600">Compliance score: {inspection.compliance_score ?? "Not available"} / 100</p></div></div></div><div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">{summary.map(([key, value]) => <div key={key} className="border-b border-slate-100 pb-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>)}</div></>}{page === 2 && <><DocumentHeader title="Declaration Analysis" page={2}/><table className="mt-8 w-full text-left text-xs"><thead><tr className="border-b-2 border-[#0f3d63] text-[10px] uppercase tracking-wider text-slate-500"><th className="pb-3">Declaration checked</th><th className="pb-3">Extracted value</th><th className="pb-3">Status</th></tr></thead><tbody>{declarations.map((item) => <tr key={item.id} className="border-b border-slate-100"><td className="py-4 pr-3 font-semibold text-slate-700">{item.declaration_type}</td><td className="py-4 pr-3 text-slate-600">{item.normalized_value || item.extracted_value || "Not detected"}</td><td className="py-4">{item.normalized_value ? "Found" : "Not detected"}</td></tr>)}</tbody></table></>}{page === 3 && <><DocumentHeader title="Violations & Applicable Rules" page={3}/><div className="mt-8 space-y-5">{violations.length ? violations.map((item, index) => <div key={`${item.rule_id}-${index}`} className="border-b border-slate-100 pb-5"><p className="text-sm font-bold text-[#0f3d63]">{index + 1}. {item.description || "Rule violation"}</p><p className="mt-2 text-xs text-slate-500">Declaration: {item.declaration_type || "Not specified"} · Severity: {item.severity || "Not specified"}</p><p className="mt-2 text-xs text-slate-600">Rule ID: {item.rule_id || "Not specified"}</p></div>) : <p className="text-sm text-slate-500">No violations returned by the rule engine.</p>}</div></>}{page === 4 && <><DocumentHeader title="Evidence Register" page={4}/>  <p className="mt-6 text-sm leading-6 text-slate-600">Original label photo and evidence captured during this inspection.</p><div className="mt-7 space-y-6">{imageUrl && !imageError ? <div><div className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">{imageLoading && <div className="absolute inset-3 animate-pulse rounded bg-slate-200" />}<img src={imageUrl} alt="Original uploaded product label" onLoad={() => setImageLoading(false)} onError={() => { setImageLoading(false); setImageError(true); }} className={`max-h-80 max-w-full rounded object-contain ${imageLoading ? "opacity-0" : "opacity-100"}`} /></div><p className="mt-2 text-xs font-semibold text-[#0f3d63]">Original label photo</p></div> : <p className="rounded border border-dashed border-slate-300 p-6 text-sm font-semibold text-slate-500">{imageLoading ? <span className="inline-flex items-center gap-2"><LoaderCircle size={15} className="animate-spin" /> Loading original image...</span> : "Image unavailable"}</p>}{evidenceImages.map((item) => <div key={item.id} className="flex items-start gap-3 border-b border-slate-100 pb-4"><img src={item.evidence_image_url} alt={`${item.declaration_type || "Violation"} evidence`} className="h-24 w-32 rounded border border-slate-200 object-contain bg-slate-50" /><div className="pt-2 text-xs text-slate-600"><p className="font-bold text-[#0f3d63]">{item.declaration_type || "Violation"}</p><p className="mt-1">{item.description || "Evidence crop from the inspected label."}</p></div></div>)}</div></>}</article></div></main></div></div>;
}
