"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";

import { supabase } from "@/lib/supabaseClient";
import BrandLogo from "@/components/brand-logo";
import MinistryLogo from "@/components/ministry-logo";

const roleLabels = {
  inspector: "Inspector Dashboard",
  supervisor: "Supervisor Dashboard",
  administrator: "Admin Dashboard",
};

function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="NIRIKSHAN home">
      <MinistryLogo className="h-10 w-10" />
      <span className="flex size-11 items-center justify-center rounded-lg bg-[#0f3d63] text-white shadow-sm">
        <BrandLogo className="h-10 w-11" />
      </span>
      <span className="text-left leading-none">
        <span className="block text-lg font-bold tracking-[0.14em] text-[#0f3d63]">NIRIKSHAN</span>
        <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
          Compliance intelligence
        </span>
      </span>
    </Link>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#168cae] focus:ring-2 focus:ring-[#168cae]/15"
      />
    </label>
  );
}

function PasswordField({ label, value, onChange, placeholder = "Enter password" }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#168cae] focus:ring-2 focus:ring-[#168cae]/15"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-[#0f3d63]"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Inspector");
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (window.location.search.includes("message=deactivated")) {
      showError("Your account has been deactivated. Please contact your administrator.");
    }
  }, []);

  function showError(message) {
    setStatus({ type: "error", message });
  }

  async function handleLogin(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    if (!supabase) {
      showError("Supabase is not configured. Add the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
      return;
    }
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      showError(error.message);
      setIsSubmitting(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      showError(profileError.message);
      setIsSubmitting(false);
      return;
    }

    if ((profile?.status || "Active").toLowerCase() === "inactive") {
      await supabase.auth.signOut();
      showError("Your account has been deactivated. Please contact your administrator.");
      setIsSubmitting(false);
      return;
    }

    if (!profile) {
      const metadataRole = data.user.user_metadata?.role;
      const normalizedMetadataRole = metadataRole?.toLowerCase();
      const recoveryRole =
        ["admin", "administrator"].includes(normalizedMetadataRole)
          ? "administrator"
          : normalizedMetadataRole === "supervisor"
            ? "supervisor"
            : "inspector";
      const { error: recoveryError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: data.user.user_metadata?.full_name || "NIRIKSHAN Officer",
        role: recoveryRole === "administrator" ? "Admin" : recoveryRole === "supervisor" ? "Supervisor" : "Inspector",
        region: region || null,
      });

      if (recoveryError) {
        showError(
          `Your account is valid, but its profile is missing. Ask an administrator to run the profiles setup SQL. (${recoveryError.message})`,
        );
        setIsSubmitting(false);
        return;
      }

      router.push(`/dashboard/${recoveryRole}`);
      return;
    }

    const dashboardRole = {
      inspector: "inspector",
      supervisor: "supervisor",
      admin: "administrator",
      administrator: "administrator",
    }[profile.role?.toLowerCase()] || "inspector";
    router.push(`/dashboard/${dashboardRole}`);
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    if (!supabase) {
      showError("Supabase is not configured. Add the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          region,
          // Administrator accounts are provisioned separately by an administrator.
          role,
        },
      },
    });

    if (error) {
      showError(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.user) {
      showError("Unable to create the account. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setStatus({
      type: "success",
      message: data.session
        ? "Account created successfully. You can now access your dashboard."
        : "Account created. Please confirm your email before logging in.",
    });
    setIsSubmitting(false);
  }

  async function handleForgotPassword() {
    if (!supabase) {
      showError("Supabase is not configured. Add the NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
      return;
    }
    if (!email) {
      showError("Enter your email address first, then select Forgot password.");
      return;
    }
    setStatus({ type: "", message: "" });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      showError(error.message);
      return;
    }
    setStatus({ type: "success", message: "Password reset instructions have been sent to your email." });
  }

  const isLogin = mode === "login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f8fa] px-4 py-10 text-slate-800 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-[#0f3d63] to-[#168cae] opacity-95" />
      <div className="relative w-full max-w-[470px]">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-22px_rgba(15,61,99,0.35)] sm:p-8">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-[#edf7fb] text-[#0f6584]">
              <LockKeyhole size={20} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0f3d63]">
              {isLogin ? "Welcome back" : "Create officer account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {isLogin ? "Sign in to your NIRIKSHAN dashboard." : "Set up a prototype account for testing."}
            </p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-lg bg-slate-100 p-1" role="tablist">
            {["login", "signup"].map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={mode === tab}
                onClick={() => {
                  setMode(tab);
                  setStatus({ type: "", message: "" });
                }}
                className={`rounded-md py-2.5 text-sm font-bold transition ${
                  mode === tab ? "bg-white text-[#0f3d63] shadow-sm" : "text-slate-500 hover:text-[#0f3d63]"
                }`}
              >
                {tab === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>

          {!isLogin && (
            <div className="mb-5 flex gap-2 rounded-md border border-[#f0d8ae] bg-[#fff9ed] p-3 text-xs leading-5 text-[#805b1e]">
              <AlertCircle className="mt-0.5 shrink-0" size={15} />
              <p>In production, officer accounts are provisioned by an Administrator; self-signup is disabled outside this prototype.</p>
            </div>
          )}

          {status.message && (
            <div className={`mb-5 flex gap-2 rounded-md border p-3 text-sm leading-5 ${
              status.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}>
              {status.type === "error" ? <AlertCircle className="mt-0.5 shrink-0" size={16} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={16} />}
              <p>{status.message}</p>
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-5">
            {!isLogin && <Field label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter full name" required />}
            {!isLogin && <Field label="Region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Enter department region" />}
            <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="officer@department.gov.in" required />
            <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
            {!isLogin && <PasswordField label="Confirm Password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter password" />}
            {!isLogin && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Role</span>
                <select value={role} onChange={(event) => setRole(event.target.value)} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-[#168cae] focus:ring-2 focus:ring-[#168cae]/15">
                  <option value="Inspector">Inspector</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Administrator</option>
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Administrator access is provisioned by an existing administrator.
                </p>
              </label>
            )}
            {isLogin && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="size-4 accent-[#0f6584]" />
                  Remember me
                </label>
                <button type="button" onClick={handleForgotPassword} className="font-semibold text-[#0f6584] hover:text-[#0f3d63]">Forgot password?</button>
              </div>
            )}
            <button type="submit" disabled={isSubmitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0f3d63] text-sm font-bold text-white transition hover:bg-[#0b2e4b] disabled:cursor-not-allowed disabled:opacity-60">
              {isSubmitting ? "Please wait..." : isLogin ? "Login" : "Create Account"}
              {!isSubmitting && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="mt-7 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
            <BrandLogo className="h-5 w-5" />
            Access restricted to authorized enforcement personnel.
          </p>
        </section>
        <Link href="/" className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-white">
          <ArrowLeft size={16} /> Back to NIRIKSHAN
        </Link>
      </div>
    </main>
  );
}
