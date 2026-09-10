"use client";

import { useState } from "react";

import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  BrainCircuit,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  Landmark,
  Laptop,
  Menu,
  ScanLine,
  SearchCheck,
  ShieldCheck,
  Upload,
  UserCheck,
  X,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload / Capture Image",
    description: "Capture a clear photograph of the packaged commodity label.",
    icon: Upload,
  },
  {
    number: "02",
    title: "OpenCV Enhancement",
    description: "Improve image quality for reliable, high-precision analysis.",
    icon: ScanLine,
  },
  {
    number: "03",
    title: "PaddleOCR Extraction",
    description: "Extract declarations from labels in multiple Indian languages.",
    icon: FileText,
  },
  {
    number: "04",
    title: "AI + Rule Engine Check",
    description: "Groq AI and configurable rules evaluate every declaration.",
    icon: BrainCircuit,
  },
  {
    number: "05",
    title: "Compliance Report",
    description: "Receive an evidence-backed report ready for action.",
    icon: ClipboardCheck,
  },
];

const benefits = [
  {
    title: "Faster Inspections",
    description:
      "Reduce manual review time and cover more products during every field visit.",
    icon: Gauge,
  },
  {
    title: "AI + Human-in-the-Loop",
    description:
      "AI surfaces findings while officers retain the final authority to verify and act.",
    icon: UserCheck,
  },
  {
    title: "Configurable Legal Rules",
    description:
      "Keep checks aligned with the Legal Metrology Rules as requirements evolve.",
    icon: BookOpenCheck,
  },
  {
    title: "Evidence-Based Reports",
    description:
      "Create clear, traceable reports with the source image and detected declarations.",
    icon: FileCheck2,
  },
];

function Logo({ compact = false }) {
  return (
    <a className="flex items-center gap-3" href="#home" aria-label="NIRIKSHA home">
      <span className="flex size-10 items-center justify-center rounded-lg bg-[#0f3d63] text-white shadow-sm">
        <ShieldCheck size={22} strokeWidth={1.8} />
      </span>
      <span className="leading-none">
        <span className="block text-[17px] font-bold tracking-[0.14em] text-[#0f3d63]">
          NIRIKSHA
        </span>
        {!compact && (
          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Compliance intelligence
          </span>
        )}
      </span>
    </a>
  );
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main id="home" className="min-h-screen overflow-hidden bg-white text-slate-800">
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
            <a className="nav-link active" href="#home">Home</a>
            <a className="nav-link" href="#about">About</a>
            <a className="nav-link" href="#contact">Contact</a>
          </nav>
          <a
            href="/login"
            className="hidden items-center gap-2 rounded-md bg-[#0f3d63] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b2e4b] md:flex"
          >
            Login <ArrowRight size={16} />
          </a>
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="rounded-md p-2 text-[#0f3d63] md:hidden"
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-slate-100 bg-white px-6 py-4 md:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-4 text-sm font-semibold text-[#0f3d63]">
              <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
              <a href="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-fit items-center gap-2 rounded-md bg-[#0f3d63] px-4 py-2.5 text-white">
                Login <ArrowRight size={16} />
              </a>
            </div>
          </nav>
        )}
      </header>

      <section className="hero-grid relative border-b border-slate-200" aria-labelledby="hero-title">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#b8d7e8] bg-[#edf7fb] px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6584]">
              <span className="size-1.5 rounded-full bg-[#168cae]" />
              Built for enforcement officers
            </div>
            <h1 id="hero-title" className="max-w-3xl text-5xl font-bold leading-[1.08] tracking-[-0.035em] text-[#0f3d63] sm:text-6xl lg:text-[4.35rem]">
              Scan. Detect.
              <br />
              Validate. <span className="text-[#168cae]">Ensure</span>
              <br />
              Compliance.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              NIRIKSHA is an AI-powered platform that helps enforcement officers
              check packaged commodity labels against the Legal Metrology
              (Packaged Commodities) Rules, 2011.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#d18a26] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(209,138,38,0.7)] transition hover:bg-[#b9761e]"
              >
                Login to Dashboard <ArrowRight size={17} />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-6 py-3.5 text-sm font-bold text-[#0f3d63] transition hover:border-[#0f3d63] hover:bg-slate-50"
              >
                Learn How It Works <ChevronRight size={17} />
              </a>
            </div>
            <div className="mt-10 flex items-center gap-3 text-xs text-slate-500">
              <BadgeCheck size={18} className="text-[#168cae]" />
              <span>Aligned with Government of India compliance workflows</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px] lg:justify-self-end">
            <div className="absolute -right-5 top-8 size-32 rounded-full bg-[#e1f1f4] blur-2xl" />
            <div className="absolute -bottom-8 left-0 size-40 rounded-full bg-[#f9eddc] blur-2xl" />
            <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_25px_70px_-25px_rgba(15,61,99,0.3)] sm:p-7">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-md bg-[#edf7fb] text-[#0f6584]">
                    <ScanLine size={17} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0f3d63]">Label inspection</p>
                    <p className="text-[10px] text-slate-400">Live analysis preview</p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Ready
                </span>
              </div>
              <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-[#f2f6f8]">
                <div className="scan-beam absolute left-0 top-0 z-10 h-0.5 w-full bg-[#168cae] shadow-[0_0_14px_3px_rgba(22,140,174,0.45)]" />
                <div className="relative w-[190px] rotate-[-5deg] rounded-md border border-slate-300 bg-white p-3 shadow-xl sm:w-[220px]">
                  <div className="flex h-6 items-center gap-2 rounded bg-[#0f3d63] px-2">
                    <ShieldCheck size={12} className="text-white" />
                    <span className="text-[8px] font-bold tracking-[0.14em] text-white">NIRIKSHA SAMPLE</span>
                  </div>
                  <div className="mt-4 h-16 rounded bg-[#e8f3f5] p-2">
                    <div className="h-2 w-3/4 rounded bg-[#168cae]/40" />
                    <div className="mt-2 h-1.5 w-1/2 rounded bg-slate-300" />
                    <div className="mt-2 h-1.5 w-2/3 rounded bg-slate-300" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-1.5 w-full rounded bg-slate-200" />
                    <div className="h-1.5 w-5/6 rounded bg-slate-200" />
                    <div className="h-1.5 w-3/5 rounded bg-slate-200" />
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="h-1.5 w-14 rounded bg-slate-300" />
                      <div className="h-1.5 w-20 rounded bg-slate-200" />
                    </div>
                    <div className="grid grid-cols-4 gap-0.5">
                      {Array.from({ length: 24 }).map((_, index) => (
                        <span key={index} className="size-1.5 bg-[#0f3d63]" />
                      ))}
                    </div>
                  </div>
                  <span className="absolute -right-5 top-14 flex size-10 items-center justify-center rounded-full border-4 border-white bg-[#d18a26] text-white shadow-lg">
                    <SearchCheck size={19} />
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[10px] font-medium text-slate-400">
                  <span>IMAGE CAPTURED</span>
                  <span>AI PROCESSING</span>
                  <span>RULE CHECK</span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-[#f7fafb] p-3">
                  <p className="text-[10px] text-slate-400">Fields found</p>
                  <p className="mt-1 text-lg font-bold text-[#0f3d63]">12</p>
                </div>
                <div className="rounded-lg bg-[#f7fafb] p-3">
                  <p className="text-[10px] text-slate-400">Rule checks</p>
                  <p className="mt-1 text-lg font-bold text-[#0f3d63]">18</p>
                </div>
                <div className="rounded-lg bg-[#edf7f1] p-3">
                  <p className="text-[10px] text-emerald-600">Status</p>
                  <p className="mt-1 text-sm font-bold text-emerald-700">Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-kicker">A clear path to compliance</p>
          <h2 className="section-title">How It Works</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            From a field image to a defensible compliance decision, NIRIKSHA
            brings the entire inspection workflow into one place.
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-5 md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative text-center md:px-3">
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+34px)] right-[calc(-50%+34px)] top-7 hidden h-px bg-slate-200 md:block" />
                )}
                <div className="relative z-10 mx-auto flex size-14 items-center justify-center rounded-xl border border-[#b8d7e8] bg-white text-[#0f6584] shadow-sm">
                  <Icon size={23} strokeWidth={1.7} />
                </div>
                <p className="mt-5 text-[10px] font-bold tracking-[0.16em] text-[#d18a26]">{step.number}</p>
                <h3 className="mt-2 text-sm font-bold leading-5 text-[#0f3d63]">{step.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-500">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="about" className="border-y border-slate-200 bg-[#f6f9fb]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <p className="section-kicker">Designed around your mandate</p>
              <h2 className="section-title">Why NIRIKSHA?</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Better tools help officers make consistent, transparent
                decisions while keeping expertise and accountability at the
                centre of every inspection.
              </p>
            </div>
            <div className="hidden size-16 items-center justify-center rounded-full border border-[#b8d7e8] bg-white text-[#0f6584] lg:flex">
              <Landmark size={27} strokeWidth={1.5} />
            </div>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article key={benefit.title} className="rounded-xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#9ccddd] hover:shadow-lg hover:shadow-slate-200/60">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-[#edf7fb] text-[#0f6584]">
                    <Icon size={21} strokeWidth={1.7} />
                  </div>
                  <h3 className="mt-6 text-base font-bold text-[#0f3d63]">{benefit.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{benefit.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#0f3d63] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 sm:grid-cols-3 lg:px-8">
          {[
            ["10,000+", "Products Scanned"],
            ["98%", "Detection Accuracy"],
            ["500+", "Officers Onboarded"],
          ].map(([value, label], index) => (
            <div key={label} className={`text-center sm:text-left ${index > 0 ? "sm:border-l sm:border-white/15 sm:pl-10" : ""}`}>
              <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
              <p className="mt-1 text-sm text-blue-100/70">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer id="contact" className="bg-[#092c49] text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <Logo compact />
              <p className="mt-5 max-w-sm text-sm leading-6 text-blue-100/65">
                An intelligent, accountable platform for strengthening Legal
                Metrology enforcement across India.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">Platform</h3>
              <div className="mt-4 space-y-3 text-sm text-blue-100/65">
                <a className="block transition hover:text-white" href="#home">Home</a>
                <a className="block transition hover:text-white" href="#about">About NIRIKSHA</a>
                <a className="block transition hover:text-white" href="#how-it-works">How It Works</a>
              </div>
            </div>
            <div id="login">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100/70">Access</h3>
              <p className="mt-4 text-sm leading-6 text-blue-100/65">
                For authorised enforcement officers and department
                administrators.
              </p>
              <a href="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#72d2d1] hover:text-white">
                Officer Login <ArrowRight size={15} />
              </a>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[11px] leading-5 text-blue-100/45 sm:flex-row sm:items-center sm:justify-between">
            <p>Smart India Hackathon (SIH) internal prototype. Not for production use.</p>
            <p className="inline-flex items-center gap-1.5"><Laptop size={13} /> Powered by Supabase, FastAPI &amp; Groq</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
