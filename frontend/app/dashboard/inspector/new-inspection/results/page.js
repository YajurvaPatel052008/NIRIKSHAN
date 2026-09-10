"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  FileCheck2,
  FileText,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";

const declarations = [
  {
    id: "manufacturer",
    type: "Manufacturer / Packer / Importer Name & Address",
    value: "Bharat Foods Pvt. Ltd., New Delhi, India",
    confidence: 96,
    status: "found",
    box: { top: "24%", left: "13%", width: "74%", height: "17%" },
    color: "#168cae",
  },
  {
    id: "quantity",
    type: "Net Quantity",
    value: "250 g",
    confidence: 98,
    status: "found",
    box: { top: "45%", left: "17%", width: "52%", height: "11%" },
    color: "#0f8a68",
  },
  {
    id: "mrp",
    type: "MRP (Maximum Retail Price)",
    value: "₹149.00 (Inclusive of all taxes)",
    confidence: 94,
    status: "found",
    box: { top: "59%", left: "15%", width: "70%", height: "12%" },
    color: "#d18a26",
  },
  {
    id: "date",
    type: "Month & Year of Manufacture / Packing",
    value: "03/2025",
    confidence: 91,
    status: "found",
    box: { top: "74%", left: "12%", width: "46%", height: "10%" },
    color: "#7566b3",
  },
  {
    id: "consumer",
    type: "Consumer Care Details",
    value: "1800 123 4567 | care@bharatfoods.in",
    confidence: 84,
    status: "low",
    box: { top: "85%", left: "12%", width: "76%", height: "9%" },
    color: "#c47d20",
  },
  {
    id: "origin",
    type: "Country of Origin (if imported)",
    value: "Not applicable — Indian manufacturer identified",
    confidence: 72,
    status: "not-found",
    box: null,
    color: "#c94b4b",
  },
];

function MockLabel({ selected, onSelect }) {
  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-[390px] overflow-hidden rounded-lg bg-[#dcecef] p-[11%] shadow-inner">
      <div className="relative h-full w-full rotate-[-2deg] rounded-md border border-slate-300 bg-white p-4 shadow-xl">
        <div className="flex h-9 items-center gap-2 rounded bg-[#0f3d63] px-2">
          <ShieldCheck size={15} className="text-white" />
          <span className="text-[8px] font-bold tracking-[0.13em] text-white">NIRIKSHA SAMPLE LABEL</span>
        </div>
        <div className="mt-5 rounded bg-[#e1f1f4] p-3">
          <p className="text-[10px] font-bold text-[#0f3d63]">PREMIUM WHOLE WHEAT FLOUR</p>
          <div className="mt-2 h-1.5 w-3/4 rounded bg-[#168cae]/40" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-slate-300" />
        </div>
        <div className="mt-5 space-y-2"><div className="h-1.5 w-full rounded bg-slate-200" /><div className="h-1.5 w-5/6 rounded bg-slate-200" /><div className="h-1.5 w-2/3 rounded bg-slate-200" /></div>
        <div className="mt-6 h-14 rounded bg-[#f4f7f8] p-2"><div className="h-1.5 w-3/4 rounded bg-slate-300" /><div className="mt-2 h-1.5 w-1/2 rounded bg-slate-200" /><div className="mt-2 h-1.5 w-2/3 rounded bg-slate-200" /></div>
        <div className="mt-5 flex items-end justify-between"><div className="space-y-1"><div className="h-1.5 w-14 rounded bg-slate-300" /><div className="h-1.5 w-20 rounded bg-slate-200" /></div><div className="grid grid-cols-4 gap-0.5">{Array.from({ length: 20 }).map((_, index) => <span key={index} className="size-1.5 bg-[#0f3d63]" />)}</div></div>
      </div>
      {declarations.filter((item) => item.box).map((item) => (
        <button
          key={item.id}
          type="button"
          aria-label={`Highlight ${item.type}`}
          onClick={() => onSelect(item.id)}
          className={`absolute rounded border-2 text-left transition ${selected === item.id ? "z-10 shadow-[0_0_0_3px_rgba(22,140,174,0.25)]" : "hover:z-10"}`}
          style={{ ...item.box, borderColor: item.color }}
        >
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ backgroundColor: item.color }}>{item.id === "manufacturer" ? "Manufacturer" : item.id === "quantity" ? "Net Qty" : item.id === "mrp" ? "MRP" : item.id === "date" ? "Mfg Date" : "Consumer Care"}</span>
        </button>
      ))}
      <span className="absolute bottom-3 left-3 rounded bg-[#0f3d63]/85 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">OCR evidence regions</span>
    </div>
  );
}

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
  const [selected, setSelected] = useState("manufacturer");

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection/upload" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> New Inspection</Link></nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Extraction Results</h1></div><Link href="/dashboard/inspector/new-inspection/analysis" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to AI Processing</Link></header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d18a26]">Step 3 of 3</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Extraction Results</h2><p className="mt-1 text-sm text-slate-500">Review declarations identified by PaddleOCR and normalized by Groq.</p></div><div className="hidden items-center gap-2 sm:flex"><span className="size-2.5 rounded-full bg-emerald-500" /><span className="h-px w-12 bg-emerald-400" /><span className="size-2.5 rounded-full bg-emerald-500" /><span className="h-px w-12 bg-[#d18a26]" /><span className="size-2.5 rounded-full bg-[#d18a26]" /></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-full rounded-full bg-[#d18a26]" /></div></div>
          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Source image</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Detected text regions</h2></div><span className="rounded-full bg-[#edf7fb] px-2.5 py-1 text-[10px] font-bold text-[#0f6584]">{declarations.filter((item) => item.box).length} regions</span></div><MockLabel selected={selected} onSelect={setSelected} /><p className="mt-4 text-center text-xs text-slate-400">Select a colored region to highlight its extracted declaration.</p></section>
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">OCR + semantic extraction</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Extracted Declarations</h2></div><span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><Check size={13} /> 5 found</span></div><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3 font-bold">Declaration Type</th><th className="px-5 py-3 font-bold">Extracted Value</th><th className="px-5 py-3 font-bold">Confidence</th><th className="px-5 py-3 font-bold">Status</th></tr></thead><tbody>{declarations.map((item) => <tr key={item.id} className={`border-b border-slate-50 transition last:border-0 ${selected === item.id ? "bg-[#f2fafb]" : "hover:bg-slate-50"}`}><td className="px-5 py-4"><button type="button" onClick={() => item.box && setSelected(item.id)} className={`text-left text-xs font-bold ${item.box ? "text-[#0f6584] hover:underline" : "text-slate-600"}`}>{item.type}</button></td><td className="max-w-[240px] px-5 py-4 text-xs leading-5 text-slate-600">{item.value}</td><td className="px-5 py-4"><ConfidenceBadge confidence={item.confidence} /></td><td className="px-5 py-4"><Status status={item.status} /></td></tr>)}</tbody></table></div><div className="m-5 flex gap-2 rounded-lg border border-[#f0d8ae] bg-[#fff9ed] p-3 text-xs leading-5 text-[#805b1e]"><Info size={16} className="mt-0.5 shrink-0" /><span>AI confidence below 80% requires manual verification before a compliance decision.</span></div><p className="px-5 pb-5 text-[11px] text-slate-400">Extraction powered by PaddleOCR + Groq API. Values shown are prototype extraction data pending officer verification.</p></section>
          </div>
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row"><Link href="/dashboard/inspector/new-inspection/analysis" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"><ArrowLeft size={16} /> Back</Link><Link href="/dashboard/inspector/new-inspection/compliance" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b]">Proceed to Compliance Check <ArrowRight size={17} /></Link></div>
        </main>
      </div>
    </div>
  );
}
