import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-10 shadow-glow sm:px-10 sm:py-14 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(91,140,255,0.3),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(52,211,153,0.16),transparent_24%)]" />
      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary-foreground">
            安全私有 · 多终端访问 · 用户级权限隔离
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {APP_NAME}，帮你集中管理每一份重要资料。
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              提供注册登录、私有文件上传、下载与删除、个人资料与文件统计，基于 Supabase 实现认证、数据库和文件存储，适合直接继续扩展为真实生产项目。
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-[#6a97ff]"
              href={isAuthenticated ? "/files" : "/register"}
            >
              {isAuthenticated ? "进入我的文件" : "立即注册"}
            </Link>
            <Link
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-sm font-medium text-white transition hover:bg-white/[0.06]"
              href={isAuthenticated ? "/profile" : "/login"}
            >
              {isAuthenticated ? "查看个人中心" : "前往登录"}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "私有文件访问", value: "100%" },
              { label: "上传冲突避免", value: "UUID" },
              { label: "支持文件限制", value: "类型 / 大小" }
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/10 bg-background/70 p-5">
                <div className="text-2xl font-semibold text-white">{item.value}</div>
                <p className="mt-2 text-sm text-slate-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-background/80 p-4 sm:p-6">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div>
                <p className="text-sm text-slate-400">当前项目</p>
                <p className="mt-1 text-lg font-semibold text-white">{APP_NAME}</p>
              </div>
              <div className="rounded-full bg-success/15 px-3 py-1 text-xs text-success">在线保护</div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { title: "我的文件", detail: "上传、下载、删除仅限本人" },
                { title: "个人中心", detail: "展示用户信息与文件统计" },
                { title: "认证系统", detail: "支持注册、登录、退出登录" }
              ].map((item, index) => (
                <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-primary-foreground">
                    0{index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
