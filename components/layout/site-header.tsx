import Link from "next/link";

import { LogoutButton } from "@/components/layout/logout-button";
import { Logo } from "@/components/ui/logo";
import { NAV_LINKS } from "@/lib/constants";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabaseReady = hasSupabaseEnv();
  let user: { email?: string | null; user_metadata?: { full_name?: string | null } } | null = null;

  if (supabaseReady) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    user = currentUser;
  }

  const displayName = user?.user_metadata?.full_name || user?.email || "";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/[0.85] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          {!supabaseReady ? (
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">未配置后端</span>
          ) : user ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">已登录</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:flex-1 lg:justify-end">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300 lg:justify-end">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                className="rounded-full px-4 py-2 transition hover:bg-white/[0.06] hover:text-white"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-3 lg:ml-6">
            {!supabaseReady ? (
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
                请先配置 Supabase
              </div>
            ) : user ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                  {displayName}
                </div>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link className="rounded-2xl border border-white/10 px-5 py-2.5 text-sm text-slate-200 transition hover:bg-white/[0.06]" href="/login">
                  登录
                </Link>
                <Link className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-[#6a97ff]" href="/register">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}