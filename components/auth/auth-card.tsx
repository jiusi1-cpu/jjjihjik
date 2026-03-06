import type { PropsWithChildren } from "react";

export function AuthCard({ children, title, subtitle }: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-glow sm:p-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="text-sm leading-7 text-slate-400">{subtitle}</p>
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
