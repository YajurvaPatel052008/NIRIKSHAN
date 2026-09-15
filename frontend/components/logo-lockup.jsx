import BrandLogo from "@/components/brand-logo";
import MinistryLogo from "@/components/ministry-logo";

export default function LogoLockup({ compact = false, dark = false }) {
  return (
    <span className={`flex min-w-0 items-center ${compact ? "gap-2" : "gap-3"}`}>
      <MinistryLogo className={`${compact ? "h-7" : "h-10"} w-auto shrink-0`} />
      <span className={`flex ${compact ? "h-7 w-7 rounded-md" : "h-10 w-10 rounded-lg"} shrink-0 items-center justify-center ${dark ? "bg-white/10" : "bg-[#0f3d63]"} shadow-sm`}>
        <BrandLogo className={`${compact ? "h-6" : "h-9"} w-auto`} />
      </span>
      <span className="min-w-0 leading-none">
        <span className={`block whitespace-nowrap ${compact ? "text-[13px] tracking-[0.08em]" : "text-[17px] tracking-[0.14em]"} font-bold ${dark ? "text-white" : "text-[#0f3d63]"}`}>
          NIRIKSHAN
        </span>
        {!compact && (
          <span className={`mt-1 block text-[9px] font-medium uppercase tracking-[0.18em] ${dark ? "text-blue-100/60" : "text-slate-500"}`}>
            Compliance intelligence
          </span>
        )}
      </span>
    </span>
  );
}
