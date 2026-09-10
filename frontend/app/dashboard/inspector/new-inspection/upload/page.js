"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  FileImage,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

const checks = [
  "Image Resolution Sufficient",
  "Lighting Adequate",
  "Text Visibility Clear",
  "Label Fully Visible",
  "No Excessive Blur",
];

function DemoLabel() {
  return (
    <div className="relative flex h-full min-h-[280px] items-center justify-center overflow-hidden rounded-lg bg-[#edf4f6] p-8">
      <div className="w-[205px] rotate-[-4deg] rounded-md border border-slate-300 bg-white p-3 shadow-xl">
        <div className="flex h-8 items-center gap-2 rounded bg-[#0f3d63] px-2">
          <ShieldCheck size={13} className="text-white" />
          <span className="text-[8px] font-bold tracking-[0.13em] text-white">NIRIKSHA SAMPLE</span>
        </div>
        <div className="mt-4 rounded bg-[#e1f1f4] p-3">
          <p className="text-[10px] font-bold text-[#0f3d63]">PREMIUM WHOLE WHEAT</p>
          <div className="mt-2 h-1.5 w-3/4 rounded bg-[#168cae]/40" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-slate-300" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-1.5 w-full rounded bg-slate-200" />
          <div className="h-1.5 w-5/6 rounded bg-slate-200" />
          <div className="h-1.5 w-2/3 rounded bg-slate-200" />
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div className="space-y-1"><div className="h-1.5 w-14 rounded bg-slate-300" /><div className="h-1.5 w-20 rounded bg-slate-200" /></div>
          <div className="grid grid-cols-4 gap-0.5">{Array.from({ length: 20 }).map((_, index) => <span key={index} className="size-1.5 bg-[#0f3d63]" />)}</div>
        </div>
      </div>
      <span className="absolute bottom-4 left-4 rounded bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Preview image</span>
    </div>
  );
}

export default function ImageUploadPage() {
  const inputRef = useRef(null);
  const cameraRef = useRef(null);
  const [image, setImage] = useState(null);
  const [checksComplete, setChecksComplete] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!image) return undefined;
    const timers = checks.map((_, index) => setTimeout(() => {
      setChecksComplete((current) => [...current, index]);
      if (index === checks.length - 1) setIsChecking(false);
    }, 500 + index * 480));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [image]);

  function acceptFile(file) {
    setError("");
    if (!file || !file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or other image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("The image must be smaller than 10 MB.");
      return;
    }
    setChecksComplete([]);
    setIsChecking(true);
    setImage({ url: URL.createObjectURL(file), name: file.name });
  }

  function handleDrop(event) {
    event.preventDefault();
    acceptFile(event.dataTransfer.files[0]);
  }

  function retake() {
    setImage(null);
    setChecksComplete([]);
    setIsChecking(false);
    setError("");
    inputRef.current?.click();
  }

  const qualityGood = checksComplete.length === checks.length && !isChecking;

  return (
    <div className="min-h-screen bg-[#f4f8fa] text-slate-800">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0b304d] text-white lg:flex">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white/10"><ShieldCheck size={21} /></span><span className="text-lg font-bold tracking-[0.14em]">NIRIKSHA</span></div>
        <nav className="space-y-1 px-4 pt-8"><Link href="/dashboard/inspector" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-blue-100/65 hover:bg-white/5 hover:text-white"><ChevronLeft size={17} /> Dashboard</Link><Link href="/dashboard/inspector/new-inspection" className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-2.5 text-sm font-medium text-white"><FileImage size={17} /> New Inspection</Link></nav>
      </aside>
      <div className="lg:pl-64">
        <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#168cae]">Inspection workflow</p><h1 className="text-lg font-bold text-[#0f3d63]">Upload Product Image</h1></div><Link href="/dashboard/inspector/new-inspection" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0f6584] hover:text-[#0f3d63]"><ChevronLeft size={16} /> Back</Link></header>
        <main className="mx-auto max-w-6xl p-5 sm:p-8">
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d18a26]">Step 2 of 3</p><h2 className="mt-1 text-xl font-bold text-[#0f3d63]">Upload Product Image</h2></div><div className="hidden items-center gap-2 sm:flex"><span className="size-2.5 rounded-full bg-emerald-500" /><span className="h-px w-12 bg-[#d18a26]" /><span className="size-2.5 rounded-full bg-[#d18a26]" /><span className="h-px w-12 bg-slate-200" /><span className="size-2.5 rounded-full bg-slate-200" /></div></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 rounded-full bg-[#d18a26]" /></div></div>
          {!image ? (
            <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()} className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#9ccddd] bg-white p-8 text-center shadow-sm transition hover:border-[#168cae] hover:bg-[#f8fcfd]">
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => acceptFile(event.target.files[0])} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => acceptFile(event.target.files[0])} />
              <span className="flex size-16 items-center justify-center rounded-full bg-[#edf7fb] text-[#168cae]"><UploadCloud size={29} /></span>
              <h3 className="mt-5 text-lg font-bold text-[#0f3d63]">Drag &amp; drop product label image</h3>
              <p className="mt-2 text-sm text-slate-500">or click to upload / Take Photo</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0f3d63] px-5 py-3 text-sm font-bold text-white hover:bg-[#0b2e4b]"><ImagePlus size={17} /> Upload File</button><button type="button" onClick={() => cameraRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#9ccddd] px-5 py-3 text-sm font-bold text-[#0f6584] hover:bg-[#edf7fb]"><Camera size={17} /> Open Camera</button></div>
              <p className="mt-6 text-xs text-slate-400">JPG or PNG · Maximum file size 10 MB</p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-[#0f3d63]">Uploaded image</h2><p className="mt-1 max-w-[260px] truncate text-xs text-slate-400">{image.name}</p></div><button type="button" onClick={() => { setImage(null); setChecksComplete([]); setIsChecking(false); }} aria-label="Remove image" className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><X size={18} /></button></div>{image.url ? <img src={image.url} alt="Uploaded product label" className="max-h-[390px] w-full rounded-lg object-contain" /> : <DemoLabel />}</section>
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#168cae]">OpenCV preprocessing</p><h2 className="mt-1 text-lg font-bold text-[#0f3d63]">Image Quality Check</h2></div>{isChecking && <LoaderCircle size={20} className="animate-spin text-[#168cae]" />}</div><div className="mt-6 space-y-4">{checks.map((check, index) => <div key={check} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${checksComplete.includes(index) ? "text-slate-700" : "text-slate-400"}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${checksComplete.includes(index) ? "bg-emerald-100 text-emerald-600" : "bg-slate-100"}`}>{checksComplete.includes(index) ? <Check size={15} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-slate-300" />}</span>{check}</div>)}</div>{qualityGood && <div className="mt-7 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">Image Quality: Good ✅</div>}</section>
            </div>
          )}
          {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <div className="mt-8 flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row"><Link href="/dashboard/inspector/new-inspection" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-300 px-5 text-sm font-bold text-slate-600 hover:bg-white"><ArrowLeft size={16} /> Back</Link><div className="flex flex-col gap-3 sm:flex-row"><button type="button" onClick={retake} disabled={!image} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#9ccddd] px-5 text-sm font-bold text-[#0f6584] hover:bg-[#edf7fb] disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw size={16} /> Retake</button><Link href={qualityGood ? "/dashboard/inspector/new-inspection/analysis" : "#"} aria-disabled={!qualityGood} onClick={(event) => { if (!qualityGood) event.preventDefault(); }} className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-bold text-white ${qualityGood ? "bg-[#0f3d63] hover:bg-[#0b2e4b]" : "cursor-not-allowed bg-slate-300"}`}>Proceed to AI Analysis <ArrowRight size={17} /></Link></div></div>
        </main>
      </div>
    </div>
  );
}
