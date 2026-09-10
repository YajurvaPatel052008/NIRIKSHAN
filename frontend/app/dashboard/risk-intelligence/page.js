"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ClipboardList,
  Flag,
  History,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const manufacturers = [
  ["Hindustan Unilever Ltd.", 89, 31, 12, "02 Sep 2026"],
  ["PepsiCo India Holdings", 78, 18, 7, "18 Aug 2026"],
  ["Bharat Foods Pvt. Ltd.", 64, 11, 4, "10 Sep 2026"],
  ["Dabur India Ltd.", 43, 7, 2, "29 Aug 2026"],
  ["Bisleri International Pvt. Ltd.", 27, 3, 0, "05 Sep 2026"],
  ["Tata Consumer Products", 18, 2, 0, "01 Sep 2026"],
];

const priorities = [
  ["Surf Excel Matic 2 kg", "Hindustan Unilever Ltd.", "3 unresolved violations, not inspected in 90 days", 94],
  ["Kurkure Masala Munch 90 g", "PepsiCo India Holdings", "Repeat MRP mismatch found in 4 inspections", 86],
  ["Bharat Foods Whole Wheat Flour", "Bharat Foods Pvt. Ltd.", "High-severity declaration missing on latest scan", 79],
  ["Dabur Red Toothpaste 200 g", "Dabur India Ltd.", "Risk score increased 18 points this month", 61],
  ["Lux Soft Touch Soap 100 g", "Hindustan Unilever Ltd.", "Multiple products from manufacturer need review", 58],
];

const distribution = [
  { label: "Low (0-39)", count: 22, color: "#16a36a" },
  { label: "Medium (40-69)", count: 31, color: "#d18a26" },
  { label: "High (70-100)", count: 18, color: "#dc4c4c" },
];

function RiskScore({ score }) {
  const tone = score >= 70 ? ["bg-red-500", "text-red-700"] : score >= 40 ? ["bg-amber-500", "text-amber-700"] : ["bg-emerald-500", "text-emerald-700"];
  return <div className="flex min-w-[145px] items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone[0]}`} style={{ width: `${score}%` }} /></div><span className={`w-7 text-right text-sm font-bold ${tone[1]}`}>{score}</span></div>;
}

export default function RiskIntelligencePage() {
  const [recommended, setRecommended] = useState([]);

  function recommend(name) {
    setRecommended((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/45">Supervisor workspace</p><Link href="/dashboard/supervisor" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><BarChart3 size={17} /> Dashboard</Link><Link href="/dashboard/products" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ClipboardList size={17} /> Product Repository</Link><Link href="/dashboard/risk-intelligence" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><AlertTriangle size={17} /> Risk Intelligence</Link></nav>
        <div className="mt-auto border-t border-white/10 p-4"><p className="px-3 text-[10px] leading-4 text-blue-100/35">Smart India Hackathon<br />Internal prototype</p></div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Proactive enforcement</p><h1 className="text-lg font-bold text-[#0f3d63]">Risk Intelligence</h1></div><Link href="/dashboard/supervisor" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ArrowLeft size={16} /> Back to dashboard</Link></header>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold text-[#0f3d63]">Manufacturer Risk Ranking</h2><p className="mt-1 text-sm text-slate-500">AI-assisted prioritisation based on violations, recurrence, and inspection recency.</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#edf7fb] px-3 py-2 text-xs font-bold text-[#0f6584]"><TrendingUp size={15} /> Updated today, 10 Sep 2026</span></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary label="Manufacturers Tracked" value="71" note="Across 12 categories" icon={Users} tone="teal" /><Summary label="High-Risk Manufacturers" value="18" note="Score above 70" icon={AlertTriangle} tone="red" /><Summary label="Repeat Offenders" value="11" note="Multiple repeat violations" icon={History} tone="amber" /><Summary label="Priority Inspections" value="27" note="Recommended this week" icon={Target} tone="blue" /></div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-base font-bold text-[#0f3d63]">Manufacturer Risk Ranking</h2><p className="mt-1 text-xs text-slate-400">Higher scores indicate greater enforcement priority.</p></div><span className="text-xs font-semibold text-slate-400">71 tracked</span></div><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-3">Manufacturer</th><th className="px-3 py-3">Risk score</th><th className="px-3 py-3">Violations</th><th className="px-3 py-3">Repeat</th><th className="px-3 py-3">Last inspected</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{manufacturers.map(([name, score, violations, repeats, last]) => <tr key={name} className="border-b border-slate-50 last:border-0 hover:bg-slate-50"><td className="px-5 py-4 font-semibold text-slate-700">{name}</td><td className="px-3 py-4"><RiskScore score={score} /></td><td className="px-3 py-4 text-slate-600">{violations}</td><td className="px-3 py-4 font-semibold text-slate-600">{repeats}</td><td className="px-3 py-4 text-xs text-slate-500">{last}</td><td className="px-5 py-4 text-right"><button onClick={() => recommend(name)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition ${recommended.includes(name) ? "bg-emerald-50 text-emerald-700" : "border border-[#9ccddd] text-[#0f6584] hover:bg-[#edf7fb]"}`}>{recommended.includes(name) ? <><Check size={14} /> Recommended</> : <><Flag size={14} /> Recommend</>}</button></td></tr>)}</tbody></table></div></section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Risk distribution</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Tracked manufacturers</h2></div><BarChart3 size={19} className="text-slate-400" /></div><div className="mt-5 h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={distribution} margin={{ top: 5, right: 5, left: -25, bottom: 25 }}><CartesianGrid stroke="#edf2f4" vertical={false} /><XAxis dataKey="label" angle={-20} textAnchor="end" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" radius={[5, 5, 0, 0]}>{distribution.map((entry) => <Cell key={entry.label} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div><p className="text-xs leading-5 text-slate-500">Risk scores combine recent findings, repeat violations, severity, and days since last inspection.</p></section>
          </div>
          <section className="mt-6 rounded-xl border border-[#b8d7e8] bg-white shadow-sm"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2"><Target size={19} className="text-[#d18a26]" /><h2 className="text-base font-bold text-[#0f3d63]">Smart Inspection Priority</h2></div><p className="mt-1 text-xs text-slate-500">Recommended next actions generated from current enforcement signals.</p></div><span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-200">5 recommendations</span></div><div className="grid gap-3 p-5 lg:grid-cols-2">{priorities.map(([product, manufacturer, reason, score], index) => <div key={product} className="flex items-center gap-4 rounded-lg border border-slate-200 p-4 hover:border-[#9ccddd]"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf7fb] text-sm font-bold text-[#0f6584]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-[#0f3d63]">{product}</h3><span className="text-[10px] font-bold text-slate-400">Risk {score}</span></div><p className="mt-1 text-xs text-slate-500">{manufacturer} · {reason}</p></div><button onClick={() => recommend(manufacturer)} className="shrink-0 text-xs font-bold text-[#0f6584] hover:underline">{recommended.includes(manufacturer) ? "Added" : "Add"} <ArrowRight size={13} className="ml-1 inline" /></button></div>)}</div></section>
        </main>
      </div>
    </div>
  );
}

function Summary({ label, value, note, icon: Icon, tone }) {
  const styles = { teal: "bg-cyan-50 text-cyan-700", red: "bg-red-50 text-red-700", amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700" };
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-sm font-semibold text-slate-500">{label}</p><span className={`flex size-9 items-center justify-center rounded-lg ${styles[tone]}`}><Icon size={18} /></span></div><p className="mt-4 text-3xl font-bold tracking-tight text-[#0f3d63]">{value}</p><p className="mt-1 text-xs text-slate-400">{note}</p></div>;
}
