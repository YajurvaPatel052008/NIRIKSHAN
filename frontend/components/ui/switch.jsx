import { cn } from "@/lib/utils";

function Switch({ checked, onCheckedChange, disabled = false, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-60",
        checked ? "bg-emerald-600" : "bg-slate-300",
        className,
      )}
    >
      <span className={cn("pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}

export { Switch };
