"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Plus } from "lucide-react";
import LogoLockup from "@/components/logo-lockup";
import { supabase } from "@/lib/supabaseClient";
import { Switch } from "@/components/ui/switch";

const emptyRule = { rule_name: "", declaration_type: "MRP", applicable_category: "All", validation_type: "Presence Check", threshold_value: {}, severity: "Medium", legal_reference: "" };

export default function RulesPage() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(emptyRule);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);

  async function request(path, options = {}) {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Unable to complete the request.");
    return payload;
  }

  async function loadRules() {
    try { setLoading(true); const payload = await request("/rules"); setRules(payload.items || []); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); }
  }
  useEffect(() => { loadRules(); }, []);

  async function saveRule(event) {
    event.preventDefault();
    try { await request("/rules", { method: "POST", body: JSON.stringify(form) }); setForm(emptyRule); setShowForm(false); await loadRules(); } catch (saveError) { setError(saveError.message); }
  }
  async function toggleRule(rule) {
    const nextActive = !rule.is_active;
    setTogglingId(rule.id);
    setRules((current) => current.map((item) => item.id === rule.id ? { ...item, is_active: nextActive } : item));
    try {
      const updated = await request(`/rules/${rule.id}/toggle-active`, { method: "PATCH" });
      setRules((current) => current.map((item) => item.id === rule.id ? { ...item, ...updated } : item));
    } catch (toggleError) {
      setRules((current) => current.map((item) => item.id === rule.id ? { ...item, is_active: rule.is_active } : item));
      setError(`Unable to update "${rule.rule_name}": ${toggleError.message}`);
    } finally {
      setTogglingId(null);
    }
  }

  return <div className="min-h-screen bg-[#f4f8fa] text-slate-800"><header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><Link href="/dashboard/administrator" className="flex items-center" aria-label="NIRIKSHAN admin dashboard"><LogoLockup compact /></Link><Link href="/dashboard/administrator" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584]"><ArrowLeft size={16} /> Admin Dashboard</Link></header><main className="mx-auto max-w-6xl p-5 sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Administration</p><h1 className="text-2xl font-bold text-[#0f3d63]">Rule Engine Config</h1></div><button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-md bg-[#d18a26] px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Add New Rule</button></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{showForm && <form onSubmit={saveRule} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"><input required placeholder="Rule name" value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} className="form-input" /><input required placeholder="Legal reference" value={form.legal_reference} onChange={(e) => setForm({ ...form, legal_reference: e.target.value })} className="form-input" /><select value={form.declaration_type} onChange={(e) => setForm({ ...form, declaration_type: e.target.value })} className="form-input"><option>MRP</option><option>Net Quantity</option><option>Manufacturer</option><option>Mfg Date</option><option>Consumer Care</option></select><select value={form.validation_type} onChange={(e) => setForm({ ...form, validation_type: e.target.value })} className="form-input"><option>Presence Check</option><option>Format Check</option><option>Value Range</option><option>Font Size Threshold</option></select><select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="form-input"><option>High</option><option>Medium</option><option>Low</option></select><button className="rounded-md bg-[#0f3d63] px-4 py-2 text-sm font-bold text-white">Save Rule</button></form>}<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-12 text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin" /></div> : rules.length === 0 ? <p className="p-12 text-center text-slate-500">No rules configured yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400"><th className="px-5 py-4">Rule</th><th className="px-5 py-4">Declaration</th><th className="px-5 py-4">Validation</th><th className="px-5 py-4">Severity</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.id} className="border-b border-slate-50"><td className="px-5 py-4 font-semibold text-[#0f3d63]">{rule.rule_name}</td><td className="px-5 py-4 text-sm text-slate-600">{rule.declaration_type}</td><td className="px-5 py-4 text-sm text-slate-600">{rule.validation_type}</td><td className="px-5 py-4 text-sm">{rule.severity}</td>  <td className="px-5 py-4 text-sm">{rule.is_active ? "Active" : "Inactive"}</td><td className="px-5 py-4 text-right"><Switch checked={Boolean(rule.is_active)} disabled={togglingId === rule.id} onCheckedChange={() => toggleRule(rule)} /></td></tr>)}</tbody></table></div>}</section></main></div>;
}
