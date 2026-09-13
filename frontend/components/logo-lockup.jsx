import BrandLogo from "@/components/brand-logo";
import MinistryLogo from "@/components/ministry-logo";

export default function LogoLockup({ compact = false, dark = false }) {
  return (
    <span className="flex items-center gap-3">
      <MinistryLogo className="h-10 w-auto shrink-0" />
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${dark ? "bg-white/10" : "bg-[#0f3d63]"} shadow-sm`}>
        <BrandLogo className="h-9 w-auto" />
      </span>
      <span className="leading-none">
        <span className={`block text-[17px] font-bold tracking-[0.14em] ${dark ? "text-white" : "text-[#0f3d63]"}`}>
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
