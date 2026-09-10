"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  Download,
  FileText,
  MapPin,
  Printer,
  Share2,
  ShieldCheck,
} from "lucide-react";

const declarations = [
  ["Manufacturer / Packer / Importer", "Bharat Foods Pvt. Ltd., New Delhi", "Found"],
  ["Net Quantity", "250 g", "Found"],
  ["MRP", "₹149.00 (Inclusive of all taxes)", "Found"],
  ["Month & Year of Packing", "03/2025", "Found"],
  ["Consumer Care Details", "1800 123 4567", "Found"],
  ["Country of Origin", "Not detected", "Missing"],
];

const violations = [
  ["Missing Declaration", "Country of Origin", "High", "Rules, 2011 — Rule 6"],
  ["Small Font Size", "Consumer Care Details", "Medium", "Rules, 2011 — Rule 9"],
  ["Incorrect Format", "Month & Year of Packing", "Low", "Rules, 2011 — Rule 6"],
];

function DocumentHeader({ title, page }) {
  return (
    <div className="border-b-2 border-[#0f3d63] pb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded bg-[#0f3d63] text-white"><ShieldCheck size={20} /></span><div><p className="text-base font-bold tracking-[0.16em] text-[#0f3d63]">NIRIKSHA</p><p className="text-[9px] uppercase tracking-widest text-slate-500">Legal Metrology Enforcement</p></div></div>
        <p className="text-right text-[10px] text-slate-500">Compliance Report<br />Page {page} of 4</p>
      </div>
      <h2 className="mt-6 text-xl font-bold text-[#0f3d63]">{title}</h2>
    </div>
  );
}

function EvidenceCard({ label, color }) {
  return <div className="rounded border border-slate-200 p-3"><div className="relative flex h-28 items-center justify-center overflow-hidden rounded bg-[#e5f0f2]"><div className="w-20 rotate-[-4deg] rounded bg-white p-2 shadow"><div className="h-2 rounded bg-[#0f3d63]" /><div className="mt-2 h-1 w-full rounded bg-slate-200" /><div className="mt-2 h-5 rounded border-2 bg-red-50" style={{ borderColor: color }} /><div className="mt-2 h-1 w-3/4 rounded bg-slate-200" /></div></div><p className="mt-2 text-xs font-bold text-[#0f3d63]">{label}</p><p className="mt-1 text-[10px] text-slate-500">Annotated evidence crop</p></div>;
}

export default function ReportPage() {
  const [page, setPage] = useState(1);
  const [shared, setShared] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const generatedDate = "10 Sep 2026";

  function downloadPdf() {
    if (apiUrl) {
      window.open(`${apiUrl}/api/inspections/demo-inspection/report.pdf`, "_blank");
      return;
    }
    window.print();
  }

  async function shareReport() {
    if (navigator.share) {
      await navigator.share({ title: "NIRIKSHA Compliance Report", text: "NIRIKSHA inspection report preview" });
    }
    setShared(true);
  }

  return (
    <div className="min-h-screen bg-[#e9f0f3] text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-[76px] max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Evidence Engine</p><h1 className="text-lg font-bold text-[#0f3d63]">Compliance Report Preview</h1></div>
          <div className="flex flex-wrap items-center gap-2"><button onClick={downloadPdf} className="toolbar-button primary"><Download size={15} /> Download PDF</button><button onClick={shareReport} className="toolbar-button"><Share2 size={15} /> {shared ? "Shared" : "Share"}</button><button onClick={() => window.print()} className="toolbar-button"><Printer size={15} /> Print</button></div>
        </div>
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-5 pb-3 text-[11px] text-slate-400 sm:px-8"><span className="size-1.5 rounded-full bg-[#d18a26]" /> Generated on {generatedDate} by NIRIKSHA · Prototype report for authorised officer review</div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-5 py-6 sm:px-8">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection/compliance" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> Inspection Report</Link></nav></aside>
        <main className="w-full lg:ml-64">
          <div className="mb-5 flex items-center justify-between"><Link href="/dashboard/inspector/new-inspection/verify" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ArrowLeft size={16} /> Back to verification</Link><div className="hidden items-center gap-2 text-xs font-semibold text-slate-500 sm:flex"><span>Document preview</span><span className="text-slate-300">|</span><span>Official format</span></div></div>
          <div className="mx-auto max-w-[820px]">
            <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-sm">{["Summary", "Declarations", "Violations", "Evidence"].map((label, index) => <button key={label} onClick={() => setPage(index + 1)} className={`whitespace-nowrap rounded-md px-4 py-2 text-xs font-bold transition ${page === index + 1 ? "bg-[#0f3d63] text-white" : "text-slate-500 hover:bg-slate-50"}`}>Page {index + 1} · {label}</button>)}</div>
            <article className="report-paper min-h-[760px] bg-white p-7 shadow-[0_10px_35px_-12px_rgba(15,61,99,0.35)] sm:p-12">
              {page === 1 && <><DocumentHeader title="Inspection Summary" page={1} /><div className="mt-9 rounded border border-amber-200 bg-amber-50 p-5 text-center"><p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Compliance status</p><p className="mt-2 text-2xl font-bold text-amber-800">MINOR VIOLATIONS</p><p className="mt-1 text-sm text-amber-700">Compliance score: <strong>72 / 100</strong></p></div><div className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">{[["Inspection ID", "NIR-2026-000184"], ["Product", "Bharat Foods Premium Whole Wheat Flour"], ["Date", "10 September 2026, 10:42 AM"], ["Inspector", "Yajurva Patel"], ["Category", "Food & Beverages"], ["Location", "New Delhi, India"]].map(([key, value]) => <div key={key} className="border-b border-slate-100 pb-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{key}</p><p className="mt-1 text-sm font-semibold text-slate-700">{value}</p></div>)}</div><p className="mt-16 text-center text-xs italic text-slate-400">Generated from the NIRIKSHA Rule Engine and Evidence Engine.</p></>}
              {page === 2 && <><DocumentHeader title="Declaration Analysis" page={2} /><table className="mt-8 w-full text-left text-xs"><thead><tr className="border-b-2 border-[#0f3d63] text-[10px] uppercase tracking-wider text-slate-500"><th className="pb-3">Declaration checked</th><th className="pb-3">Extracted value</th><th className="pb-3">Status</th></tr></thead><tbody>{declarations.map(([name, value, status]) => <tr key={name} className="border-b border-slate-100"><td className="py-4 pr-3 font-semibold text-slate-700">{name}</td><td className="py-4 pr-3 text-slate-600">{value}</td><td className="py-4"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${status === "Found" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{status}</span></td></tr>)}</tbody></table><div className="mt-10 rounded border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">Declarations were extracted using PaddleOCR and semantically normalized by Groq. Low-confidence fields require officer verification.</div></>}
              {page === 3 && <><DocumentHeader title="Violations & Applicable Rules" page={3} /><div className="mt-8 space-y-5">{violations.map(([type, declaration, severity, rule], index) => <div key={type} className="border-b border-slate-100 pb-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-[#0f3d63]">{index + 1}. {type}</p><p className="mt-1 text-xs text-slate-500">Related declaration: {declaration}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${severity === "High" ? "bg-red-50 text-red-700" : severity === "Medium" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700"}`}>{severity} severity</span></div><p className="mt-3 text-xs leading-5 text-slate-600"><strong>Applicable reference:</strong> Legal Metrology (Packaged Commodities) {rule}</p></div>)}</div><p className="mt-12 text-[10px] italic text-slate-400">Rule references must be checked against the currently notified version before enforcement action.</p></>}
              {page === 4 && <><DocumentHeader title="Evidence Register" page={4} /><p className="mt-6 text-sm leading-6 text-slate-600">Annotated evidence crops associated with the findings in this inspection.</p><div className="mt-7 grid gap-4 sm:grid-cols-2"><EvidenceCard label="Country of Origin · Missing" color="#dc2626" /><EvidenceCard label="Consumer Care · Font" color="#d18a26" /><EvidenceCard label="Packing Date · Format" color="#d18a26" /><EvidenceCard label="MRP · Verified" color="#168cae" /></div><div className="mt-10 flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400"><MapPin size={13} /> Evidence linked to inspection NIR-2026-000184</div></>}
              <div className="mt-16 flex items-center justify-between border-t border-slate-200 pt-3 text-[9px] text-slate-400"><span>NIRIKSHA · Government Compliance Intelligence</span><span>Confidential · Internal use</span></div>
            </article>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="disabled:opacity-30">Previous page</button><span>Page {page} of 4</span><button onClick={() => setPage((current) => Math.min(4, current + 1))} disabled={page === 4} className="disabled:opacity-30">Next page</button></div>
          </div>
        </main>
      </div>
    </div>
  );
}
