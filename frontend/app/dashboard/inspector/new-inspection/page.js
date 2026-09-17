"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Crosshair,
  FileText,
  MapPin,
  Eye,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

const categories = [
  "Food & Beverages",
  "Cosmetics",
  "Household",
  "Electronics",
  "Pharmaceuticals",
  "Other",
];

function currentDateTime() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function NewInspectionPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    productName: "",
    category: "Food & Beverages",
    manufacturer: "",
    retailer: "",
    location: "",
    dateTime: currentDateTime(),
    notes: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Location services are not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => updateField("location", `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`),
      () => setError("Unable to access your location. Please enter it manually."),
    );
  }

  async function submitDraft(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const payload = {
      product_name: form.productName,
      category: form.category,
      manufacturer: form.manufacturer || "Unknown",
      retailer_name: form.retailer,
      location: form.location,
      notes: form.notes || null,
    };

    try {
      if (!apiUrl || !supabase) {
        throw new Error("The inspection service or Supabase client is not configured.");
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Your Supabase session is not available. Please sign in again.");
      const response = await fetch(`${apiUrl}/inspections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let detail = `The inspection service returned ${response.status}.`;
        try {
          const body = await response.json();
          if (body.detail) detail = body.detail;
        } catch {
          // Keep the HTTP status when the server does not return JSON.
        }
        throw new Error(detail);
      }
      const savedInspection = await response.json();
      const inspectionId = savedInspection.id;
      if (!inspectionId) throw new Error("The inspection service did not return an inspection ID.");
      window.sessionStorage.setItem("niriksha-inspection-draft", JSON.stringify({ id: inspectionId, ...payload }));
      router.push(`/dashboard/inspector/new-inspection/upload?inspectionId=${encodeURIComponent(inspectionId)}`);
    } catch (submitError) {
      setError(submitError.message || "Unable to create the inspection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white/10">          <BrandLogo className="h-8 w-9" /></span>
          <span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span>
        </div>
        <nav className="space-y-1 px-4 pt-8">
          <Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileText size={17} /> New Inspection</Link>
          <Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Start New Inspection</h1></div>
          <Link href="/dashboard/inspector" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to dashboard</Link>
        </header>

        <main className="mx-auto max-w-4xl p-5 sm:p-8">
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d18a26]">Step 1 of 3</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Inspection Details</h2></div>
              <div className="hidden items-center gap-2 sm:flex"><span className="size-2.5 rounded-full bg-[#d18a26]" /><span className="h-px w-12 bg-slate-200" /><span className="size-2.5 rounded-full bg-slate-200" /><span className="h-px w-12 bg-slate-200" /><span className="size-2.5 rounded-full bg-slate-200" /></div>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-1/3 rounded-full bg-[#d18a26]" /></div>
          </div>

          <form onSubmit={submitDraft} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-7 flex items-start gap-3 border-b border-slate-100 pb-6">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#edf7fb] text-[#0f6584]"><FileText size={19} /></span>
              <div><h2 className="font-bold text-[#0f3d63]">Commodity information</h2><p className="mt-1 text-sm text-slate-500">Enter the details available at the inspection site.</p></div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Product Name <small className="font-normal text-slate-400">(optional)</small></span><input value={form.productName} onChange={(event) => updateField("productName", event.target.value)} placeholder="e.g. Aashirvaad Atta 5 kg" className="form-input" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Product Category <span className="text-red-500">*</span></span><select required value={form.category} onChange={(event) => updateField("category", event.target.value)} className="form-input"><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Manufacturer / Packer / Importer <small className="font-normal text-slate-400">(optional)</small></span><input value={form.manufacturer} onChange={(event) => updateField("manufacturer", event.target.value)} placeholder="Enter registered name" className="form-input" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Retailer / Shop Name <span className="text-red-500">*</span></span><input required value={form.retailer} onChange={(event) => updateField("retailer", event.target.value)} placeholder="Enter shop or retailer name" className="form-input" /></label>
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Inspection Location <span className="text-red-500">*</span></span><span className="flex gap-2"><span className="relative flex-1"><MapPin size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input required value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Enter address, market, or locality" className="form-input pl-12" /></span><button type="button" onClick={useCurrentLocation} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[#9ccddd] px-3 text-xs font-bold text-[#0f6584] hover:bg-[#edf7fb] sm:px-4"><Crosshair size={16} /> <span className="hidden sm:inline">Use Current Location</span><span className="sm:hidden">Use GPS</span></button></span></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Inspection Date &amp; Time <span className="text-red-500">*</span></span><span className="relative block"><CalendarDays size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input required type="datetime-local" value={form.dateTime} onChange={(event) => updateField("dateTime", event.target.value)} className="form-input pl-12" /></span></label>
              <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-slate-700">Notes / Remarks <small className="font-normal text-slate-400">(optional)</small></span><textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} rows={4} placeholder="Add any observations from the inspection site..." className="form-input min-h-24 resize-y py-3" /></label>
            </div>
            {error && <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
            <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row"><Link href="/dashboard/inspector" className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</Link><button disabled={isSubmitting} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b] disabled:opacity-60">{isSubmitting ? "Saving draft..." : "Continue to Image Upload"} <ArrowRight size={17} /></button></div>
          </form>
        </main>
      </div>
    </div>
  );
}
