"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenCheck,
  Box,
  ChevronDown,
  ClipboardCheck,
  FileClock,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  PackageSearch,
  Plus,
  Settings,
  Eye,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import BrandLogo from "@/components/brand-logo";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";

const roleMeta = {
  inspector: { label: "Inspector", name: "Officer" },
  supervisor: { label: "Supervisor", name: "Supervisor" },
  administrator: { label: "Administrator", name: "Administrator" },
};

const roleRoutes = ["inspector", "supervisor", "administrator"];

const inspectorStats = [
  ["Today's Inspections", "24", "+12% vs yesterday", ClipboardCheck, "teal"],
  ["This Month", "186", "+8.4% vs last month", BarChart3, "blue"],
  ["Pending Verification", "07", "Requires your review", FileClock, "amber"],
  ["Compliance Rate", "92.4%", "Scans completed by you", Gauge, "green"],
];

const recentInspections = [
  ["Aashirvaad Atta 5 kg", "10 Sep 2026", "Compliant"],
  ["FreshDrop Sunflower Oil", "10 Sep 2026", "Violation"],
  ["Bharat Tea Premium", "09 Sep 2026", "Pending"],
  ["Natura Basmati Rice", "09 Sep 2026", "Compliant"],
  ["Shakti Detergent Bar", "08 Sep 2026", "Violation"],
];

const complianceTrend = [
  { day: "12 Aug", value: 86 }, { day: "15 Aug", value: 89 }, { day: "18 Aug", value: 87 },
  { day: "21 Aug", value: 91 }, { day: "24 Aug", value: 90 }, { day: "27 Aug", value: 93 },
  { day: "30 Aug", value: 91 }, { day: "02 Sep", value: 95 }, { day: "05 Sep", value: 94 },
  { day: "08 Sep", value: 96 }, { day: "10 Sep", value: 97 },
];

const violationTypes = [
  { name: "MRP mismatch", count: 48 },
  { name: "Net quantity", count: 35 },
  { name: "Date missing", count: 24 },
  { name: "Manufacturer", count: 18 },
  { name: "Consumer care", count: 13 },
];

const categories = [
  { name: "Food grains", count: 64 },
  { name: "Edible oils", count: 47 },
  { name: "Personal care", count: 38 },
  { name: "Household", count: 29 },
  { name: "Beverages", count: 21 },
];

const officerActivity = [
  ["Meera Iyer", "142", "18", "Today, 11:42 AM"],
  ["Arjun Patel", "128", "12", "Today, 10:18 AM"],
  ["Sanjay Kumar", "116", "23", "Yesterday, 4:36 PM"],
  ["Fatima Sheikh", "104", "09", "Yesterday, 2:05 PM"],
];

const auditLog = [
  ["Rule updated", "Priya Sharma", "10 Sep 2026, 11:48 AM"],
  ["Officer account approved", "Rajiv Menon", "10 Sep 2026, 10:21 AM"],
  ["Repository import completed", "System", "09 Sep 2026, 06:14 PM"],
  ["Role permission changed", "Priya Sharma", "09 Sep 2026, 04:02 PM"],
  ["Report export generated", "Ananya Rao", "09 Sep 2026, 01:27 PM"],
];

const iconMap = {
  Dashboard: LayoutDashboard,
  "New Inspection": Plus,
  "Product Repository": Box,
  "Inspection History": History,
  "Risk Intelligence": AlertTriangle,
  "Rule Engine Config": SlidersHorizontal,
  "User Management": Users,
  Settings,
};

function StatusBadge({ status }) {
  const styles = {
    Compliant: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    Violation: "bg-red-50 text-red-700 ring-red-200",
    Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${styles[status]}`}>{status}</span>;
}

function StatCard({ item }) {
  const [label, value, note, Icon, color] = item;
  const colors = { teal: "bg-cyan-50 text-cyan-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700" };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-lg ${colors[color]}`}><Icon size={18} /></span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-[#0f3d63]">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  );
}

function ChartCard({ title, children, action }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-[#0f3d63]">{title}</h2>
        {action && <span className="text-xs text-slate-400">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function EmptyMap() {
  return (
    <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#a8c9d5] bg-[#eff7f9]">
      <Map size={80} strokeWidth={1} className="text-[#8bb8c7]" />
      <div className="absolute left-[28%] top-[32%] size-3 rounded-full bg-[#d18a26] ring-4 ring-[#d18a26]/20" />
      <div className="absolute left-[59%] top-[50%] size-3 rounded-full bg-[#168cae] ring-4 ring-[#168cae]/20" />
      <div className="absolute left-[44%] top-[70%] size-3 rounded-full bg-[#0f3d63] ring-4 ring-[#0f3d63]/20" />
      <p className="absolute bottom-4 text-xs font-semibold text-[#0f6584]">Geographic Compliance Trends</p>
    </div>
  );
}

function Table({ columns, rows, renderRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">{columns.map((column) => <th key={column} className="px-4 py-3 font-bold">{column}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">{renderRow(row, index)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function InspectorView({ name, onStartInspection }) {
  return (
    <>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm text-slate-500">Good morning, {name}.</p><h1 className="text-2xl font-bold text-[#0f3d63]">Inspector Dashboard</h1></div>
        <button onClick={onStartInspection} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d18a26] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#b9761e]"><Plus size={18} /> Start New Inspection</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{inspectorStats.map((item) => <StatCard key={item[0]} item={item} />)}</div>
      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 className="text-base font-bold text-[#0f3d63]">Recent Inspections</h2><p className="mt-1 text-xs text-slate-400">Your latest field activity</p></div><button className="text-xs font-bold text-[#0f6584] hover:underline">View all</button></div>
        <Table columns={["Product Name", "Date", "Compliance Status", ""]} rows={recentInspections} renderRow={(row) => <><td className="px-4 py-4 font-semibold text-slate-700">{row[0]}</td><td className="px-4 py-4 text-slate-500">{row[1]}</td><td className="px-4 py-4"><StatusBadge status={row[2]} /></td><td className="px-4 py-4 text-right"><button className="font-semibold text-[#0f6584] hover:underline">View</button></td></>} />
      </section>
    </>
  );
}

function SupervisorView() {
  const stats = [["Total Inspections", "1,248", "Across your team", ClipboardCheck, "teal"], ["Violations Detected", "142", "11.4% of inspections", AlertTriangle, "amber"], ["High-Risk Manufacturers", "18", "Needs attention", PackageSearch, "blue"], ["Active Officers", "24", "26 officers assigned", Users, "green"]];
  return (
    <>
      <div className="mb-6"><p className="text-sm text-slate-500">Team overview</p><h1 className="text-2xl font-bold text-[#0f3d63]">Supervisor Dashboard</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <StatCard key={item[0]} item={item} />)}</div>
      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <ChartCard title="Compliance Trend" action="Last 30 days"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={complianceTrend}><CartesianGrid stroke="#edf2f4" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#168cae" strokeWidth={3} dot={{ r: 3, fill: "#168cae" }} /></LineChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Top Violation Types"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={violationTypes} layout="vertical" margin={{ left: 15, right: 10 }}><CartesianGrid stroke="#edf2f4" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#d18a26" radius={[0, 4, 4, 0]} barSize={18} /></BarChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Product Categories with Most Violations"><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={categories}><CartesianGrid stroke="#edf2f4" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} angle={-25} textAnchor="end" height={55} axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="count" fill="#0f6584" radius={[4, 4, 0, 0]} barSize={28} /></BarChart></ResponsiveContainer></div></ChartCard>
        <ChartCard title="Geographic Compliance Trends"><EmptyMap /></ChartCard>
      </div>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-base font-bold text-[#0f3d63]">Officer Activity</h2></div><Table columns={["Officer Name", "Inspections Done", "Violations Found", "Last Active"]} rows={officerActivity} renderRow={(row) => <><td className="px-4 py-4 font-semibold text-slate-700">{row[0]}</td><td className="px-4 py-4 text-slate-600">{row[1]}</td><td className="px-4 py-4 text-slate-600">{row[2]}</td><td className="px-4 py-4 text-slate-500">{row[3]}</td></>} /></section>
    </>
  );
}

function AdministratorView() {
  const stats = [["Total Users", "86", "24 active officers", Users, "teal"], ["Rules Configured", "64", "3 updated this week", BookOpenCheck, "blue"], ["Products in Repository", "12,480", "98 added this month", Box, "amber"], ["System Health", "99.98%", "All services operational", Activity, "green"]];
  return (
    <>
      <div className="mb-6"><p className="text-sm text-slate-500">System overview</p><h1 className="text-2xl font-bold text-[#0f3d63]">Admin Dashboard</h1></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <StatCard key={item[0]} item={item} />)}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-[#0f3d63]">Quick actions</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><button className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left hover:border-[#9ccddd] hover:bg-[#f6fbfc]"><SlidersHorizontal className="text-[#168cae]" size={21} /><span><b className="block text-sm text-[#0f3d63]">Rule Engine Config</b><small className="text-xs text-slate-400">Manage compliance rules</small></span></button><button className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left hover:border-[#9ccddd] hover:bg-[#f6fbfc]"><Users className="text-[#168cae]" size={21} /><span><b className="block text-sm text-[#0f3d63]">User Management</b><small className="text-xs text-slate-400">Manage officer access</small></span></button></div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-base font-bold text-[#0f3d63]">System status</h2><div className="mt-5 space-y-4"><div className="flex items-center justify-between text-sm"><span className="text-slate-500">API / Railway</span><span className="flex items-center gap-2 font-semibold text-emerald-600"><i className="size-2 rounded-full bg-emerald-500" />Operational</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-500">Supabase Database</span><span className="flex items-center gap-2 font-semibold text-emerald-600"><i className="size-2 rounded-full bg-emerald-500" />Operational</span></div><div className="flex items-center justify-between text-sm"><span className="text-slate-500">AI Services</span><span className="flex items-center gap-2 font-semibold text-emerald-600"><i className="size-2 rounded-full bg-emerald-500" />Operational</span></div></div></section>
      </div>
      <section className="mt-5 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="text-base font-bold text-[#0f3d63]">Recent system audit log</h2></div><Table columns={["Action", "User", "Timestamp"]} rows={auditLog} renderRow={(row) => <><td className="px-4 py-4 font-semibold text-slate-700">{row[0]}</td><td className="px-4 py-4 text-slate-600">{row[1]}</td><td className="px-4 py-4 text-slate-500">{row[2]}</td></>} /></section>
    </>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const requestedRole = roleRoutes.includes(params.role) ? params.role : "inspector";
  const [role, setRole] = useState(requestedRole);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [officer, setOfficer] = useState({ name: "", role: "" });
  const meta = roleMeta[role];

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;
    fetch(`${apiUrl}/api/dashboard/${requestedRole}`)
      .then((response) => setApiConnected(response.ok))
      .catch(() => setApiConnected(false));
  }, [requestedRole]);

  useEffect(() => {
    let mounted = true;

    async function loadOfficerProfile() {
      if (!supabase) return;
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || !mounted) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (mounted) {
        setOfficer({
          name: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email?.split("@")[0] || "",
          role: profile?.role || "",
        });
      }
    }

    loadOfficerProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = officer.name || meta.name;
  const displayRole = officer.role ? roleMeta[officer.role]?.label || officer.role : meta.label;

  const navItems = useMemo(() => [
    ["Dashboard", true],
    ["New Inspection", true],
    ["Product Repository", role === "inspector" || role === "supervisor" || role === "administrator"],
    ["Inspection History", true],
    ["Risk Intelligence", role !== "inspector"],
    ["Rule Engine Config", role === "administrator"],
    ["User Management", role === "administrator"],
    ["Settings", true],
  ].filter((item) => item[1]), [role]);

  function changeRole(nextRole) {
    setRole(nextRole);
    router.replace(`/dashboard/${nextRole}`);
  }

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0b304d] text-white transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10">                <BrandLogo className="h-8 w-9" /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span><button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}><X size={20} /></button></div>
        <div className="px-4 pt-7"><p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-100/45">Workspace</p><nav className="mt-3 space-y-1">{navItems.map(([label, active]) => { const Icon = iconMap[label]; const href = label === "Product Repository" ? "/dashboard/products" : label === "New Inspection" ? "/dashboard/inspector/new-inspection" : label === "Risk Intelligence" ? "/dashboard/risk-intelligence" : label === "Inspection History" ? "/dashboard/inspector/history" : null; return href ? <a href={href} key={label} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-blue-100/65 transition hover:bg-white/5 hover:text-white"><Icon size={17} />{label}</a> : <button key={label} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${active && label === "Dashboard" ? "bg-white/10 text-white" : "text-blue-100/65 hover:bg-white/5 hover:text-white"}`}><Icon size={17} />{label}</button>; })}</nav></div>
        <div className="mt-auto border-t border-white/10 p-4"><button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><LogOut size={17} /> Logout</button><p className="mt-5 px-3 text-[10px] leading-4 text-blue-100/35">Smart India Hackathon<br />Internal prototype</p></div>
      </aside>
      {sidebarOpen && <button aria-label="Close sidebar" className="fixed inset-0 z-20 bg-[#061b2c]/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3"><button className="rounded-md p-2 text-[#0f3d63] lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex">                    <BrandLogo className="h-5 w-5" /> Enforcement workspace</div></div>
          <div className="flex items-center gap-3"><button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"><Bell size={19} /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#d18a26]" /></button><div className="hidden h-7 w-px bg-slate-200 sm:block" /><div className="relative"><select value={role} onChange={(event) => changeRole(event.target.value)} aria-label="Dashboard role" className="h-9 appearance-none rounded-md border border-slate-200 bg-white py-1 pl-3 pr-8 text-xs font-bold text-[#0f3d63] outline-none"><option value="inspector">Inspector</option><option value="supervisor">Supervisor</option><option value="administrator">Administrator</option></select><ChevronDown size={14} className="pointer-events-none absolute right-2 top-3 text-slate-400" /></div><div className="hidden items-center gap-2 sm:flex"><span className="flex size-9 items-center justify-center rounded-full bg-[#dbeef2] text-xs font-bold text-[#0f6584]">{displayName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><p className="text-xs font-bold text-[#0f3d63]">{displayName}</p><p className="text-[10px] text-slate-400">{displayRole}</p></div></div></div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8">{role === "inspector" && <InspectorView name={displayName} onStartInspection={() => router.push("/dashboard/inspector/new-inspection")} />}{role === "supervisor" && <SupervisorView />}{role === "administrator" && <AdministratorView />}</main>
      </div>
    </div>
  );
}
