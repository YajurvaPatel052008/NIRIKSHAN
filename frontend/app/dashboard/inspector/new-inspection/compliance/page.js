"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  ShieldCheck,
  User,
  X,
} from "lucide-react";

const fallback = {
  score: 72,
  status: "MINOR VIOLATIONS",
  summary: {
    product_name: "Bharat Foods Premium Whole Wheat Flour",
    category: "Food & Beverages",
    manufacturer: "Bharat Foods Pvt. Ltd.",
    inspection_date: "10 Sep 2026, 10:42 AM",
    inspector: "Yajurva Patel",
    location: "New Delhi, India",
  },
  violations: [
    { type: "Missing Declaration", declaration: "Country of Origin", severity: "High", rule: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6", evidence: "Country-of-origin declaration region", confidence: 93 },
    { type: "Small Font Size", declaration: "Consumer Care Details", severity: "Medium", rule: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 9", evidence: "Consumer-care text crop", confidence: 87 },
    { type: "Incorrect Format", declaration: "Month & Year of Manufacture", severity: "Low", rule: "Legal Metrology (Packaged Commodities) Rules, 2011 - Rule 6", evidence: "Date declaration crop", confidence: 81 },
  ],
  compliant_declarations: ["Manufacturer / Packer / Importer name and address", "Net quantity declaration", "Maximum Retail Price (MRP)", "Product identity and common name"],
};

const severityStyles = {
  High: "bg-red-50 text-red-700 ring-red-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  Low: "bg-sky-50 text-sky-700 ring-sky-200",
};

function EvidenceThumbnail({ label }) {
  return (
    <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-[#e5f0f2]">
      <div className="w-14 rotate-[-5deg] rounded bg-white p-1.5 shadow-sm">
        <div className="h-2 rounded-sm bg-[#0f3d63]" />
        <div className="mt-1 h-1 w-10 rounded bg-slate-200" />
        <div className="mt-1 h-1 w-8 rounded bg-slate-200" />
        <div className="mt-2 h-3 rounded-sm border border-red-400 bg-red-50" />
        <div className="mt-1 h-1 w-9 rounded bg-slate-200" />
      </div>
      <span className="absolute bottom-1 left-1 right-1 truncate rounded bg-[#0f3d63]/80 px-1 py-0.5 text-center text-[8px] text-white">{label}</span>
    </div>
  );
}

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
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(Boolean(process.env.NEXT_PUBLIC_API_URL));
  const [expanded, setExpanded] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return undefined;
    fetch(`${apiUrl}/api/inspections/demo-inspection/results`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("Unable to load results"))))
      .then((result) => setData(result))
      .catch(() => setData(fallback))
      .finally(() => setLoading(false));
    return undefined;
  }, []);

  const summaryItems = [
    ["Product Name", data.summary.product_name, FileText],
    ["Category", data.summary.category, Scale],
    ["Manufacturer", data.summary.manufacturer, ShieldCheck],
    ["Inspection Date", data.summary.inspection_date, FileText],
    ["Inspector Name", data.summary.inspector, User],
    ["Location", data.summary.location, MapPin],
  ];

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> New Inspection</Link></nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Compliance Result</h1></div><Link href="/dashboard/inspector/new-inspection/results" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to extraction</Link></header>
        <main className="mx-auto max-w-[1350px] p-5 sm:p-8">
          {loading && <div className="mb-5 flex items-center gap-2 rounded-lg border border-[#b8d7e8] bg-[#edf7fb] px-4 py-3 text-xs text-[#0f6584]"><LoaderCircle size={15} className="animate-spin" /> Loading Rule Engine results...</div>}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center justify-between gap-7 md:flex-row"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Rule Engine + Evidence Engine</p><h2 className="mt-2 text-2xl font-bold text-[#0f3d63]">Compliance Result</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">The result below is an AI-assisted assessment. An authorised officer must review findings against the applicable versioned rules.</p></div><div className="flex flex-col items-center gap-3"><Gauge score={data.score} /><span className="rounded-full bg-amber-50 px-4 py-1.5 text-xs font-bold tracking-wider text-amber-700 ring-1 ring-inset ring-amber-200">{data.status}</span></div></div>
            <div className="mt-8 grid gap-3 border-t border-slate-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">{summaryItems.map(([label, value, Icon]) => <div key={label} className="rounded-lg bg-[#f7fafb] p-3"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Icon size={13} /> {label}</div><p className="mt-2 truncate text-sm font-semibold text-[#0f3d63]">{value}</p></div>)}</div>
          </section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-600">Review required</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Violations Detected <span className="ml-2 rounded-full bg-red-50 px-2 py-1 text-xs text-red-700">{data.violations.length}</span></h2></div><AlertTriangle className="text-amber-500" size={24} /></div><div className="mt-5 space-y-4">{data.violations.map((violation, index) => <article key={`${violation.type}-${index}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-[#b8d7e8] sm:p-5"><div className="flex flex-col gap-4 sm:flex-row"><EvidenceThumbnail label={violation.declaration} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-bold text-[#0f3d63]">{violation.type}</h3><p className="mt-1 text-xs text-slate-500">Declaration: <span className="font-semibold text-slate-700">{violation.declaration}</span></p></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${severityStyles[violation.severity]}`}>{violation.severity} severity</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">{violation.confidence}% AI confidence</span></div></div><div className="mt-3 rounded-md bg-[#f7fafb] px-3 py-2 text-xs text-slate-600"><span className="font-bold text-[#0f6584]">Applicable rule: </span>{violation.rule}</div></div></div></article>)}</div></section>
          <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"><button type="button" onClick={() => setExpanded((current) => !current)} className="flex w-full items-center justify-between p-6 text-left sm:px-8"><span><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">Passed checks</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Compliant Declarations <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">{data.compliant_declarations.length}</span></h2></span><ChevronDown size={21} className={`text-slate-400 transition ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="grid gap-3 border-t border-slate-100 px-6 pb-6 pt-5 sm:grid-cols-2 sm:px-8">{data.compliant_declarations.map((item) => <div key={item} className="flex items-center gap-2 rounded-lg bg-emerald-50/70 px-3 py-3 text-sm text-emerald-800"><Check size={17} strokeWidth={3} />{item}</div>)}</div>}</section>
          <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><Link href="/dashboard/inspector/new-inspection/verify" className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-5 text-sm font-bold ${flagged ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}><Flag size={16} /> Flag for Human Verification</Link><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={() => window.print()} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccddd] bg-white px-5 text-sm font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Download size={16} /> Generate Report (PDF)</button><Link href="/dashboard/inspector" onClick={() => setSaved(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b]"><Check size={17} /> {saved ? "Saved" : "Save & Return to Dashboard"}</Link></div></div>
        </main>
      </div>
    </div>
  );
}
