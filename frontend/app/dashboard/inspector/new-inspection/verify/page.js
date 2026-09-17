"use client";

import Link from "next/link";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "../../../../../lib/supabaseClient";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  FileText,
  Flag,
  Info,
  Pencil,
  Send,
  Eye,
  X,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";

function Evidence({ label }) {
  return <div className="relative flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-[#e5f0f2]"><div className="w-16 rotate-[-5deg] rounded bg-white p-2 shadow-sm"><div className="h-2 rounded-sm bg-[#0f3d63]" /><div className="mt-2 h-1 w-full rounded bg-slate-200" /><div className="mt-2 h-3 rounded-sm border border-amber-400 bg-amber-50" /><div className="mt-2 h-1 w-3/4 rounded bg-slate-200" /></div><span className="absolute bottom-1 left-1 right-1 truncate rounded bg-[#0f3d63]/80 px-1 py-0.5 text-center text-[8px] text-white">{label}</span></div>;
}

export default function VerificationPage() {
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDeclarations() {
      const inspectionId = new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id");
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: {} };
      const token = sessionData?.session?.access_token;
      if (!inspectionId || !process.env.NEXT_PUBLIC_API_URL || !token) {
        setMessage("A completed inspection and active session are required.");
        return;
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inspections/${inspectionId}`, { headers: { Authorization: "Bearer " + token } });
      if (!response.ok) {
        setMessage("Unable to load declarations for verification.");
        return;
      }
      const result = await response.json();
      setItems((result.declarations || []).map((item) => ({
        id: item.id,
        label: item.declaration_type,
        value: item.normalized_value || item.extracted_value || "Not detected",
        confidence: Math.round(item.confidence_score > 1 ? item.confidence_score : (item.confidence_score || 0) * 100),
        reason: "",
        correction: "",
      })));
    }
    loadDeclarations().catch(() => setMessage("Unable to load declarations for verification."));
  }, []);

  const verified = items.filter((item) => item.action).length;
  const allVerified = verified === items.length;

  function updateItem(id, updates) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  async function submitVerification() {
    if (!allVerified) return;
    setSubmitting(true);
    setMessage("");
    const payload = {
      corrections: items.filter((item) => item.action === "corrected").map((item) => ({
        declaration_id: item.id,
        corrected_value: item.correction,
        reason: item.reason || "Officer correction",
      })),
    };
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        const inspectionId = new URLSearchParams(window.location.search).get("inspectionId") || window.sessionStorage.getItem("niriksha-inspection-id");
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(`${apiUrl}/inspections/${inspectionId}/verify`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionData.session.access_token }, body: JSON.stringify(payload.corrections) });
        if (!response.ok) throw new Error("The verified report could not be submitted.");
      }
      setMessage("Verified report submitted successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex"><div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10">            <BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div><nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection/compliance" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><Flag size={17} /> Human Verification</Link></nav></aside>
      <div className="lg:pl-64"><header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d18a26]">Human-in-the-loop review</p><h1 className="text-lg font-bold text-[#0f3d63]">Human Verification</h1></div><Link href="/dashboard/inspector/new-inspection/compliance" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back to compliance result</Link></header>
        <main className="mx-auto max-w-4xl p-5 sm:p-8"><div className="rounded-xl border border-[#f0d8ae] bg-[#fff9ed] p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex gap-3"><Info className="mt-0.5 shrink-0 text-[#d18a26]" size={20} /><div><h2 className="font-bold text-[#805b1e]">AI confidence for some declarations was below threshold</h2><p className="mt-1 text-sm text-[#805b1e]/80">Please verify each finding before finalizing this inspection report.</p></div></div><div className="shrink-0 text-sm font-bold text-[#0f3d63]"><span className="text-xl">{verified}</span> of {items.length} items verified</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0d8ae]"><div className="h-full rounded-full bg-[#d18a26] transition-all" style={{ width: `${(verified / items.length) * 100}%` }} /></div></div>
          <div className="mt-6 space-y-4">{items.map((item) => { const corrected = item.action === "corrected"; const addressed = Boolean(item.action); return <article key={item.id} className={`rounded-xl border bg-white p-5 shadow-sm transition ${addressed ? "border-emerald-200" : "border-slate-200"}`}><div className="flex flex-col gap-4 sm:flex-row"><Evidence label={item.label} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-base font-bold text-[#0f3d63]">{item.label}</h3><p className="mt-2 text-sm text-slate-500">AI detected value: <span className="font-bold text-slate-700">{item.value}</span></p></div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${item.confidence >= 90 ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}`}>{item.confidence}% confidence</span></div>{corrected && <div className="mt-4 rounded-lg bg-[#f7fafb] p-3"><label className="block text-xs font-bold text-[#0f3d63]">Correct value<input value={item.correction} onChange={(event) => updateItem(item.id, { correction: event.target.value })} placeholder="Enter the value visible on the label" className="form-input mt-2" /></label><label className="mt-3 block text-xs font-bold text-[#0f3d63]">Reason for correction <span className="font-normal text-slate-400">(optional)</span><select value={item.reason} onChange={(event) => updateItem(item.id, { reason: event.target.value })} className="form-input mt-2"><option value="">Select a reason</option><option>Text unclear</option><option>AI misread</option><option>Value actually missing</option><option>Other</option></select></label></div>}<div className="mt-4 flex flex-wrap gap-2">{!addressed && <><button type="button" onClick={() => updateItem(item.id, { action: "confirmed" })} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Check size={15} /> Confirm AI Result</button><button type="button" onClick={() => updateItem(item.id, { action: "corrected" })} className="inline-flex items-center gap-2 rounded-md border border-[#9ccddd] px-3.5 py-2 text-xs font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Pencil size={15} /> Correct</button></>}{addressed && <span className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-bold ${corrected ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><Check size={15} /> {corrected ? "Correction recorded" : "AI result confirmed"}<button type="button" onClick={() => updateItem(item.id, { action: "", correction: "", reason: "" })} className="ml-1 rounded p-0.5 hover:bg-black/5" aria-label="Undo verification"><X size={13} /></button></span>}</div></div></div></article>; })}</div>
          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row"><p className="text-xs text-slate-500">Your corrections help improve the AI model.</p><button type="button" disabled={!allVerified || submitting} onClick={submitVerification} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 text-sm font-bold text-white hover:bg-[#0b2e4b] disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? "Submitting..." : "Submit Verified Report"} <Send size={16} /></button></div>{message && <div className={`mt-4 flex flex-col gap-3 rounded-md px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${message.includes("successfully") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}><span>{message}</span>{message.includes("successfully") && <Link href="/dashboard/inspector/new-inspection/report" className="font-bold underline">Preview report</Link>}</div>}</main>
      </div>
    </div>
  );
}
