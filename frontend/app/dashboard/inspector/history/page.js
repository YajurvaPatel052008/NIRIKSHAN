"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, FileText, History, LoaderCircle, Search } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { supabase } from "@/lib/supabaseClient";
import { getApiUrl } from "@/lib/api";

const statusStyles = {
  Compliant: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Violation: "bg-red-50 text-red-700 ring-red-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
};

function displayStatus(status) {
  if (status === "Compliant") return "Compliant";
  if (status) return "Violation";
  return "Pending";
}

export default function InspectionHistoryPage() {
  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({ total: 0, compliant: 0, action: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadInspections() {
      setLoading(true);
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const token = data?.session?.access_token;
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const params = new URLSearchParams({ page: "1", page_size: "100" });
        const productId = new URLSearchParams(window.location.search).get("productId");
        if (productId) params.set("product_id", productId);
        if (search.trim()) params.set("search", search.trim());
        const response = await fetch(`${getApiUrl()}/inspections?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || `Unable to load inspection history (HTTP ${response.status}).`);
        }
        const items = payload.items || [];
        setInspections(items);
        setSummary({
          total: payload.pagination?.total ?? items.length,
          compliant: items.filter((item) => item.compliance_status === "Compliant").length,
          action: items.filter((item) => item.compliance_status && item.compliance_status !== "Compliant").length,
        });
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadInspections();
    return () => controller.abort();
  }, [search]);

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ArrowLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/history" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><History size={17} /> Inspection History</Link></nav></aside>
      <div className="lg:pl-64"><header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection records</p><h1 className="text-lg font-bold text-[#0f3d63]">Inspection History</h1></div><Link href="/dashboard/inspector/new-inspection" className="inline-flex items-center gap-2 rounded-md bg-[#0f3d63] px-4 py-2.5 text-xs font-bold text-white"><FileText size={15} /> New Inspection</Link></header>
        <main className="mx-auto max-w-[1400px] p-5 sm:p-8">
          <div className="mb-6 grid gap-4 sm:grid-cols-3">{[["Total inspections", summary.total, "text-[#0f3d63]"], ["Compliant", summary.compliant, "text-emerald-700"], ["Requires action", summary.action, "text-red-600"]].map(([label, value, color]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p></div>)}</div>
          {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><h2 className="text-base font-bold text-[#0f3d63]">Recent inspections</h2><label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-400"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-44 outline-none" placeholder="Search product or ID" /></label></div>
            {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle size={16} className="animate-spin" /> Loading inspections...</div> : inspections.length === 0 ? <div className="p-12 text-center"><p className="font-semibold text-[#0f3d63]">No inspections yet</p><p className="mt-1 text-sm text-slate-500">Submit an inspection to see it here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead><tr className="border-b border-slate-100 bg-[#fbfdfe] text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-4 font-bold">Inspection ID</th><th className="px-5 py-4 font-bold">Product</th><th className="px-5 py-4 font-bold">Manufacturer</th><th className="px-5 py-4 font-bold">Date</th><th className="px-5 py-4 font-bold">Status</th><th className="px-5 py-4 font-bold">Score</th><th className="px-5 py-4 text-right font-bold">Action</th></tr></thead><tbody>{inspections.map((inspection) => { const status = displayStatus(inspection.compliance_status); return <tr key={inspection.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50"><td className="px-5 py-4 text-xs font-semibold text-[#0f6584]">{inspection.id}</td><td className="px-5 py-4 text-sm font-bold text-[#0f3d63]">{inspection.products?.name || inspection.manufacturer}</td><td className="px-5 py-4 text-xs text-slate-500">{inspection.manufacturer}</td><td className="px-5 py-4 text-xs text-slate-500">{inspection.created_at ? new Date(inspection.created_at).toLocaleDateString("en-IN") : "—"}</td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span></td><td className="px-5 py-4 text-sm font-bold text-slate-600">{inspection.compliance_score ?? "—"}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/inspector/new-inspection/compliance?inspectionId=${inspection.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#9ccddd] px-3 py-2 text-xs font-bold text-[#0f6584]"><Eye size={14} /> View</Link></td></tr>; })}</tbody></table></div>}
          </section>
        </main>
      </div>
    </div>
  );
}
