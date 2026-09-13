"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import { supabase } from "@/lib/supabaseClient";

const categories = ["All categories", "Food & Beverages", "Cosmetics", "Household", "Electronics", "Pharmaceuticals"];
const statuses = ["All statuses", "Compliant", "Violation", "Pending"];
function ProductThumbnail({ kind }) {
  const colors = { biscuits: "bg-amber-100", soap: "bg-pink-100", snacks: "bg-orange-100", water: "bg-sky-100", household: "bg-purple-100", personal: "bg-red-100", salt: "bg-slate-100", milk: "bg-blue-100" };
  return <div className={`flex size-11 items-center justify-center rounded-lg ${colors[kind] || "bg-slate-100"}`}><Box size={19} className="text-[#0f6584]" /></div>;
}

function StatusBadge({ status }) {
  const styles = { Compliant: "bg-emerald-50 text-emerald-700 ring-emerald-200", Violation: "bg-red-50 text-red-700 ring-red-200", Pending: "bg-amber-50 text-amber-700 ring-amber-200" };
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}

export default function ProductRepositoryPage() {
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [manufacturer, setManufacturer] = useState("All manufacturers");
  const [dateRange, setDateRange] = useState("All dates");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const token = data?.session?.access_token;
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const params = new URLSearchParams();
        if (query.trim()) params.set("search", query.trim());
        if (category !== categories[0]) params.set("category", category);
        if (status !== statuses[0]) params.set("compliance_status", status === "Violation" ? "Non-Compliant" : status);
        if (manufacturer !== "All manufacturers") params.set("manufacturer", manufacturer);
        const days = dateRange === "Last 7 days" ? 7 : dateRange === "Last 30 days" ? 30 : dateRange === "Last 90 days" ? 90 : null;
        if (days) {
          const from = new Date(Date.now() - days * 86400000);
          params.set("date_from", from.toISOString().slice(0, 10));
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.detail || "Unable to load products.");
        setProducts((payload.items || []).map((product) => [
          product.id,
          product.name,
          product.manufacturer,
          product.category,
          product.last_inspected ? new Date(product.last_inspected).toLocaleDateString("en-IN") : "Not inspected",
          product.compliance_status === "Compliant"
            ? "Compliant"
            : product.compliance_status
              ? "Violation"
              : "Pending",
          product.inspection_count,
          "product",
          product.last_inspected,
        ]));
      } catch (error) {
        if (error.name !== "AbortError") setLoadError(error.message);
      }
    }
    loadProducts();
    return () => controller.abort();
  }, [query, category, status, manufacturer, dateRange]);
  const manufacturers = useMemo(
    () => ["All manufacturers", ...new Set(products.map((product) => product[2]))],
    [products],
  );
  const filtered = products;

  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10">            <BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/products" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><Box size={17} /> Product Repository</Link></nav></aside>
      <div className="lg:pl-64"><header className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 py-3 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Product intelligence</p><h1 className="text-lg font-bold text-[#0f3d63]">Product Repository</h1></div><Link href="/dashboard/inspector/new-inspection" className="rounded-md bg-[#d18a26] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#b9761e]">+ New Inspection</Link></header>
        <main className="mx-auto max-w-[1450px] p-5 sm:p-8"><div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold text-[#0f3d63]">Scanned Products</h2><p className="mt-1 text-sm text-slate-500">A searchable record of products inspected by your department.</p></div><p className="text-xs text-slate-400">{filtered.length} products in repository</p></div>
          {loadError && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{loadError}</p>}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search size={17} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Search by product name, brand, manufacturer, or inspection ID" className="form-input pl-10" /></label><div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Filter size={16} /> Filters</div></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="relative"><select value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} className="form-input appearance-none pr-8 text-sm"><option>{categories[0]}</option>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-slate-400" /></label><label className="relative"><select value={status} onChange={(event) => updateFilter(setStatus, event.target.value)} className="form-input appearance-none pr-8 text-sm"><option>{statuses[0]}</option>{statuses.slice(1).map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-slate-400" /></label><label className="relative"><select value={manufacturer} onChange={(event) => updateFilter(setManufacturer, event.target.value)} className="form-input appearance-none pr-8 text-sm">{manufacturers.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-slate-400" /></label></div><div className="mt-3 flex items-center gap-2"><CalendarDays size={15} className="text-slate-400" /><select value={dateRange} onChange={(event) => setDateRange(event.target.value)} className="border-0 bg-transparent text-xs font-semibold text-slate-500 outline-none"><option>All dates</option><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option></select></div></section>
          <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left"><thead><tr className="border-b border-slate-100 bg-[#fbfdfe] text-[10px] uppercase tracking-wider text-slate-400"><th className="px-5 py-4 font-bold">Product</th><th className="px-5 py-4 font-bold">Manufacturer</th><th className="px-5 py-4 font-bold">Category</th><th className="px-5 py-4 font-bold">Last Inspected</th><th className="px-5 py-4 font-bold">Compliance Status</th><th className="px-5 py-4 font-bold">Inspections</th><th className="px-5 py-4 text-right font-bold">Actions</th></tr></thead><tbody>{visible.map((product) => <tr key={product[0]} className="border-b border-slate-50 last:border-0 hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><ProductThumbnail kind={product[7]} /><div><p className="text-sm font-bold text-[#0f3d63]">{product[1]}</p><p className="mt-1 text-[10px] text-slate-400">ID: {product[0]}</p></div></div></td><td className="px-5 py-4 text-sm text-slate-600">{product[2]}</td><td className="px-5 py-4 text-xs text-slate-500">{product[3]}</td><td className="px-5 py-4 text-xs text-slate-500">{product[4]}</td><td className="px-5 py-4"><StatusBadge status={product[5]} /></td><td className="px-5 py-4 text-sm font-semibold text-slate-600">{product[6]}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/inspector/history?productId=${product[0]}`} className="inline-flex items-center gap-1.5 rounded-md border border-[#9ccddd] px-3 py-2 text-xs font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Eye size={14} /> View</Link></td></tr>)}</tbody></table>{visible.length === 0 && <div className="p-12 text-center"><p className="font-semibold text-[#0f3d63]">No products yet</p><p className="mt-1 text-sm text-slate-500">Inspections will appear here once submitted.</p></div>}</div><div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-xs text-slate-500"><span>Showing {filtered.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft size={15} /></button><span className="font-semibold text-[#0f3d63]">Page {page} of {pageCount}</span><button onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount} className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight size={15} /></button></div></div></section>
        </main>
      </div>
    </div>
  );
}
