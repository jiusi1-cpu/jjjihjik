import { cn } from "@/lib/utils";

export function FileStatCard({ label, value, accent }: { label: string; value: string; accent?: "primary" | "success" | "warning" }) {
  const accentClass = accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-primary-foreground";

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold text-white", accentClass)}>{value}</p>
    </div>
  );
}
