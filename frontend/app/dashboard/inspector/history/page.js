"use client";

import Link from "next/link";
import { ArrowLeft, Eye, FileText, History, Search, ShieldCheck } from "lucide-react";

const inspections = [
  ["INS-2026-0910-024", "Aashirvaad Atta 5 kg", "ITC Limited", "10 Sep 2026", "Compliant", "96"],
  ["INS-2026-0910-023", "FreshDrop Sunflower Oil", "FreshDrop Foods", "10 Sep 2026", "Violation", "68"],
  ["INS-2026-0909-022", "Bharat Tea Premium", "Bharat Beverages", "09 Sep 2026", "Pending", "—"],
  ["INS-2026-0909-021", "Natura Basmati Rice", "PureFields Foods", "09 Sep 2026", "Compliant", "94"],
  ["INS-2026-0908-020", "Shakti Detergent Bar", "Shakti Consumer Products", "08 Sep 2026", "Violation", "72"],
];

const statusStyles = {
  Compliant: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Violation: "bg-red-50 text-red-700 ring-red-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default function InspectionHistoryPage() {
  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><img src="/Firefly.png" alt="NIRIKSHAN logo" className="h-8 w-9 object-contain" /></span>
          <span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span>
        </div>
        <nav className="space-y-1 px-4 pt-8">
          <Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ArrowLeft size={17} /> Dashboard</Link>
          <Link href="/dashboard/inspector/history" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><History size={17} /> Inspection History</Link>
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection records</p><h1 className="text-lg font-bold text-[#0f3d63]">Inspection History</h1></div>
          <Link href="/dashboard/inspector/new-inspection" className="inline-flex items-center gap-2 rounded-md bg-[#0f3d63] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0b2e4b]"><FileText size={15} /> New Inspection</Link>
        </header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total inspections</p><p className="mt-2 text-3xl font-bold text-[#0f3d63]">186</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Compliant</p><p className="mt-2 text-3xl font-bold text-emerald-700">142</p></div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Requires action</p><p className="mt-2 text-3xl font-bold text-red-600">31</p></div>
          </div>
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><h2 className="text-base font-bold text-[#0f3d63]">Recent inspections</h2><p className="mt-1 text-xs text-slate-400">Demo inspection records for the officer workspace.</p></div><label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-400"><Search size={15} /><input className="w-44 outline-none" placeholder="Search product or ID" /></label></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 bg-[#fbfdfe] text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-4 font-bold">Inspection ID</th><th className="px-5 py-4 font-bold">Product</th><th className="px-5 py-4 font-bold">Manufacturer</th><th className="px-5 py-4 font-bold">Date</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Score</th><th className="px-5 py-4 text-right font-bold">Action</th></tr></thead><tbody>{inspections.map((inspection) => <tr key={inspection[0]} className="border-b border-slate-50 last:border-0 hover:bg-slate-50"><td className="px-5 py-4 text-xs font-semibold text-[#0f6584]">{inspection[0]}</td><td className="px-5 py-4 text-sm font-bold text-[#0f3d63]">{inspection[1]}</td><td className="px-5 py-4 text-xs text-slate-500">{inspection[2]}</td><td className="px-5 py-4 text-xs text-slate-500">{inspection[3]}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[inspection[4]]}`}>{inspection[4]}</span></td><td className="px-5 py-4 text-sm font-bold text-slate-600">{inspection[5]}</td><td className="px-5 py-4 text-right"><button className="inline-flex items-center gap-1.5 rounded-md border border-[#9ccddd] px-3 py-2 text-xs font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Eye size={14} /> View</button></td></tr>)}</tbody></table></div>
          </section>
        </main>
      </div>
    </div>
  );
}
