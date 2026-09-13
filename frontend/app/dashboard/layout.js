"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const roleRoutes = {
  inspector: "/dashboard/inspector",
  supervisor: "/dashboard/supervisor",
  administrator: "/dashboard/administrator",
};

function normalizeRole(role) {
  const normalized = role?.toLowerCase();
  if (normalized === "admin" || normalized === "administrator") return "administrator";
  if (normalized === "supervisor") return "supervisor";
  return "inspector";
}

function routeRole(pathname) {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/inspector") || pathname.startsWith("/dashboard/products")) {
    return "inspector";
  }
  if (pathname.startsWith("/dashboard/supervisor") || pathname.startsWith("/dashboard/risk-intelligence")) {
    return "supervisor";
  }
  if (pathname.startsWith("/dashboard/administrator")) return "administrator";
  return null;
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function guardRoute() {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError?.message?.toLowerCase().includes("status does not exist")) {
        const fallback = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle();
        profile = fallback.data;
        profileError = fallback.error;
      }

      if (profileError || !profile) {
        router.replace("/login");
        return;
      }

      if ((profile.status || "Active").toLowerCase() === "inactive") {
        await supabase.auth.signOut();
        router.replace("/login?message=deactivated");
        return;
      }

      const actualRole = normalizeRole(profile.role);
      const requestedRole = routeRole(pathname);
      if (requestedRole && requestedRole !== actualRole) {
        router.replace(roleRoutes[actualRole]);
        return;
      }

      if (mounted) setCheckingAccess(false);
    }

    guardRoute();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (checkingAccess) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f8fa] text-sm text-slate-500">Checking workspace access...</div>;
  }

  return children;
}
