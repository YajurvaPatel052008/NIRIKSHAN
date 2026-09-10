"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  FileText,
  Flag,
  MapPin,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const productMap = {
  "prod-001": ["Parle-G Biscuits 800 g", "Parle Products Pvt. Ltd.", "Food & Beverages", "biscuits"],
  "prod-002": ["Lux Soft Touch Soap 100 g", "Hindustan Unilever Ltd.", "Cosmetics", "soap"],
  "prod-003": ["Kurkure Masala Munch 90 g", "PepsiCo India Holdings", "Food & Beverages", "snacks"],
  "prod-004": ["Bisleri Mineral Water 1 L", "Bisleri International Pvt. Ltd.", "Food & Beverages", "water"],
  "prod-005": ["Surf Excel Matic 2 kg", "Hindustan Unilever Ltd.", "Household", "household"],
  "prod-006": ["Dabur Red Toothpaste 200 g", "Dabur India Ltd.", "Cosmetics", "personal"],
  "prod-007": ["Tata Salt Iodised 1 kg", "Tata Consumer Products", "Food & Beverages", "salt"],
  "prod-008": ["Amul Taaza Milk 1 L", "Gujarat Co-operative Milk Marketing", "Food & Beverages", "milk"],
};

const inspections = [
  ["10 Sep 2026", "Yajurva Patel", "New Delhi, India", 72, "MINOR VIOLATIONS", "NIR-2026-000184"],
  ["19 Jul 2026", "Meera Iyer", "Gurugram, Haryana", 88, "COMPLIANT", "NIR-2026-000121"],
  ["06 May 2026", "Arjun Patel", "Noida, Uttar Pradesh", 64, "NON-COMPLIANT", "NIR-2026-000073"],
  ["14 Mar 2026", "Sanjay Kumar", "New Delhi, India", 91, "COMPLIANT", "NIR-2026-000028"],
];

const trend = inspections.slice().reverse().map(([date, , , score]) => ({ date: date.slice(0, 6), score }));

function ProductIcon({ kind }) {
  const colors = { biscuits: "bg-amber-100", soap: "bg-pink-100", snacks: "bg-orange-100", water: "bg-sky-100", household: "bg-purple-100", personal: "bg-red-100", salt: "bg-slate-100", milk: "bg-blue-100" };
  return <div className={`flex size-16 items-center justify-center rounded-xl ${colors[kind] || "bg-slate-100"}`}><ShieldCheck size={28} className="text-[#0f6584]" /></div>;
}

function StatusBadge({ status }) {
  const styles = status === "COMPLIANT" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : status === "NON-COMPLIANT" ? "bg-red-50 text-red-700 ring-red-200" : "bg-amber-50 text-amber-700 ring-amber-200";
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 ring-inset ${styles}`}>{status}</span>;
}

export default function ProductHistoryPage() {
  const { id } = useParams();
  const product = productMap[id] || productMap["prod-001"];
  const [name, manufacturer, category, kind] = product;

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/products" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> Product Repository</Link></nav></aside>
      <div className="lg:pl-64"><header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Product intelligence</p><h1 className="text-lg font-bold text-[#0f3d63]">Inspection History</h1></div><Link href="/dashboard/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ArrowLeft size={16} /> Back to repository</Link></header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div className="flex items-center gap-4"><ProductIcon kind={kind} /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Product profile · {id}</p><h2 className="mt-1 text-2xl font-bold text-[#0f3d63]">{name}</h2><p className="mt-2 text-sm text-slate-500">{manufacturer} · {category}</p></div></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-200"><AlertTriangle size={15} /> Repeat Violations</span></div></section>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Inspection timeline</p><h2 className="mt-1 text-lg font-bold text-[#0f3d63]">All Product Inspections</h2></div><span className="text-xs text-slate-400">{inspections.length} records</span></div><div className="mt-6 space-y-0">{inspections.map(([date, inspector, location, score, status, report], index) => <div key={report} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex w-5 shrink-0 justify-center">{index < inspections.length - 1 && <span className="absolute top-5 h-full w-px bg-slate-200" />}<span className={`relative z-10 mt-1 size-3 rounded-full border-2 border-white shadow ${status === "COMPLIANT" ? "bg-emerald-500" : status === "NON-COMPLIANT" ? "bg-red-500" : "bg-amber-500"}`} /></div><div className="flex-1 rounded-lg border border-slate-200 p-4 hover:border-[#b8d7e8]"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-[#0f3d63]">{date}</h3><StatusBadge status={status} /></div><div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3"><span className="inline-flex items-center gap-1.5"><User size={13} />{inspector}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} />{location}</span><span className="inline-flex items-center gap-1.5"><TrendingUp size={13} />Score: <b className="text-slate-700">{score}/100</b></span></div></div><Link href="/dashboard/inspector/new-inspection/report" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f6584] hover:underline">View Full Report <ArrowLeft size={13} className="rotate-180" /></Link></div></div></div>)}</div></section>
            <div className="space-y-6"><section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#168cae]">Performance trend</p><h2 className="mt-1 text-base font-bold text-[#0f3d63]">Compliance Score</h2></div><CalendarDays size={18} className="text-slate-400" /></div><div className="mt-5 h-44"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}><CartesianGrid stroke="#edf2f4" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#168cae" strokeWidth={3} dot={{ r: 4, fill: "#168cae" }} /></LineChart></ResponsiveContainer></div></section>
              <section className="rounded-xl border border-red-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-red-600">Manufacturer intelligence</p><h2 className="mt-1 text-lg font-bold text-[#0f3d63]">Risk Indicator</h2></div><Flag size={20} className="text-red-500" /></div><div className="mt-5 flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle size={23} /></span><div><p className="text-xl font-bold text-red-700">High Risk</p><p className="text-xs text-slate-500">Requires closer monitoring</p></div></div><p className="mt-5 text-sm leading-6 text-slate-600"><b>3 violations</b> in the last 6 months across <b>2 products</b> from this manufacturer.</p><Link href="/dashboard/supervisor" className="mt-5 block text-xs font-bold text-[#0f6584] hover:underline">View risk intelligence →</Link></section></div></div>
        </main>
      </div>
    </div>
  );
}
