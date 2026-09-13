"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Plus } from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import MinistryLogo from "@/components/ministry-logo";
import { supabase } from "@/lib/supabaseClient";

const emptyUser = { email: "", full_name: "", role: "Inspector", region: "", temporary_password: "" };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  async function request(path, options = {}) {
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const token = data?.session?.access_token;
    if (!token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 403 && payload.detail?.toLowerCase().includes("deactivated")) {
      await supabase.auth.signOut();
      window.location.assign("/login?message=deactivated");
      throw new Error("Your account has been deactivated. Please contact your administrator.");
    }
    if (!response.ok) throw new Error(payload.detail || "Unable to complete the request.");
    return payload;
  }
  async function loadUsers() { try { setLoading(true); const payload = await request("/users"); setUsers(payload.items || []); } catch (loadError) { setError(loadError.message); } finally { setLoading(false); } }
  useEffect(() => { loadUsers(); }, []);
  async function saveUser(event) { event.preventDefault(); try { await request("/users", { method: "POST", body: JSON.stringify({ ...form, region: form.region || null, temporary_password: form.temporary_password || null }) }); setForm(emptyUser); setShowForm(false); await loadUsers(); } catch (saveError) { setError(saveError.message); } }
  async function updateStatus(id, nextStatus) {
    const user = users.find((item) => item.id === id);
    const userName = user?.full_name || "this user";
    const action = nextStatus === "Inactive" ? "deactivate" : "reactivate";
    const message = nextStatus === "Inactive"
      ? `Are you sure you want to deactivate ${userName}? They will no longer be able to log in.`
      : `Reactivate ${userName}? They will be able to log in again.`;
    if (!window.confirm(message)) {
      return;
    }
    setUpdatingId(id);
    setRowErrors((current) => ({ ...current, [id]: "" }));
    try {
      const path = nextStatus === "Inactive" ? `/users/${id}/deactivate` : `/users/${id}`;
      const payload = await request(path, {
        method: "PATCH",
        ...(nextStatus === "Active" ? { body: JSON.stringify({ status: "Active" }) } : {}),
      });
      if (payload.user) setUsers((current) => current.map((user) => user.id === id ? { ...user, ...payload.user } : user));
      else setUsers((current) => current.map((user) => user.id === id ? { ...user, status: nextStatus } : user));
    } catch (actionError) {
      setRowErrors((current) => ({ ...current, [id]: `Unable to ${action}: ${actionError.message}` }));
    } finally {
      setUpdatingId(null);
    }
  }

  return <div className="min-h-screen bg-[#f4f8fa] text-slate-800"><header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><Link href="/dashboard/administrator" className="flex items-center gap-3 text-[#0f3d63]"><MinistryLogo className="h-8 w-8" /><BrandLogo className="h-8 w-8" /><span className="font-bold tracking-[0.14em]">NIRIKSHA</span></Link><Link href="/dashboard/administrator" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584]"><ArrowLeft size={16} /> Admin Dashboard</Link></header><main className="mx-auto max-w-6xl p-5 sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Administration</p><h1 className="text-2xl font-bold text-[#0f3d63]">User Management</h1></div><button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 rounded-md bg-[#d18a26] px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Add New User</button></div>{error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}{showForm && <form onSubmit={saveUser} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2"><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" /><input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="form-input" /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="form-input"><option>Inspector</option><option>Supervisor</option><option>Admin</option></select><input placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="form-input" /><input minLength={8} placeholder="Temporary password (optional)" value={form.temporary_password} onChange={(e) => setForm({ ...form, temporary_password: e.target.value })} className="form-input" /><button className="rounded-md bg-[#0f3d63] px-4 py-2 text-sm font-bold text-white">Create User</button></form>}<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">{loading ? <div className="p-12 text-center text-slate-500"><LoaderCircle className="mx-auto animate-spin" /></div> : users.length === 0 ? <p className="p-12 text-center text-slate-500">No users found.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-100 text-xs uppercase text-slate-400"><th className="px-5 py-4">Name</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Region</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-slate-50"><td className="px-5 py-4 font-semibold text-[#0f3d63]">{user.full_name}</td><td className="px-5 py-4 text-sm text-slate-600">{user.role}</td><td className="px-5 py-4 text-sm text-slate-600">{user.region || "Not set"}</td><td className="px-5 py-4 text-sm"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.status === "Inactive" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{user.status || "Not set"}</span></td><td className="px-5 py-4 text-right"><button disabled={updatingId === user.id} onClick={() => updateStatus(user.id, user.status === "Inactive" ? "Active" : "Inactive")} className={`text-xs font-bold disabled:text-slate-300 ${user.status === "Inactive" ? "text-emerald-700" : "text-red-600"}`}>{updatingId === user.id ? "Updating..." : user.status === "Inactive" ? "Reactivate" : "Deactivate"}</button>{rowErrors[user.id] && <p className="mt-1 max-w-[220px] text-left text-xs text-red-600">{rowErrors[user.id]}</p>}</td></tr>)}</tbody></table></div>}</section></main></div>;
}
