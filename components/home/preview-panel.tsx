export function PreviewPanel() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
            页面与功能一览
          </span>
          <h2 className="text-3xl font-semibold text-white">覆盖首页、登录、注册、我的文件、个人中心。</h2>
          <p className="text-sm leading-7 text-slate-400">
            页面结构已经拆分为布局组件、认证组件、文件管理组件和 Supabase 工具层，方便后续新增分享链接、文件标签、回收站等功能。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["首页", "项目亮点、功能概览、行动入口"],
            ["登录页", "邮箱密码登录，自动刷新会话"],
            ["注册页", "创建账号并同步生成用户资料"],
            ["我的文件页", "上传、展示、下载、删除自己的文件"],
            ["个人中心页", "显示用户信息、统计数据和最近上传"],
            ["后端接口", "上传、下载、删除都含身份与归属校验"]
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-background/60 p-5">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
