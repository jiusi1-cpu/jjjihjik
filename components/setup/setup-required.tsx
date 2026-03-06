import Link from "next/link";

export function SetupRequired() {
  return (
    <section className="rounded-[32px] border border-amber-400/20 bg-amber-400/10 p-6 sm:p-8">
      <div className="max-w-3xl space-y-4">
        <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-200">
          还差最后一步配置
        </div>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">项目已经启动，但还没有连接 Supabase。</h2>
        <p className="text-sm leading-7 text-slate-300 sm:text-base">
          现在网页已经能打开了，不过登录、注册、上传、下载、删除这些功能需要先填入 Supabase 的项目地址和前端公钥。
        </p>
        <div className="rounded-3xl border border-white/10 bg-background/60 p-5 text-sm text-slate-300">
          <p className="font-medium text-white">请在项目根目录创建 `.env.local`，内容如下：</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-slate-200">
{`NEXT_PUBLIC_SUPABASE_URL=https://你的项目id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的publishable key`}
          </pre>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-[#6a97ff]" href="https://supabase.com/dashboard" target="_blank">
            打开 Supabase 控制台
          </Link>
          <a className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white transition hover:bg-white/[0.06]" href="http://localhost:3000">
            刷新当前页面
          </a>
        </div>
      </div>
    </section>
  );
}