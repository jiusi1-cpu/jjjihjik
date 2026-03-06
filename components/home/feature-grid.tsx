const items = [
  {
    title: "安全的用户级文件隔离",
    description: "每个文件都绑定当前登录用户，下载和删除都在服务端再次校验文件归属。"
  },
  {
    title: "现代深色界面",
    description: "使用 Tailwind CSS 构建深色、简洁、响应式布局，桌面和移动端都具备良好体验。"
  },
  {
    title: "Supabase 一体化后端",
    description: "用户认证、Postgres 数据表和 Storage 存储由 Supabase 统一承载，部署简单。"
  },
  {
    title: "上传规则可配置",
    description: "已内置文件类型与大小限制，命名策略使用 UUID 避免同名覆盖。"
  }
];

export function FeatureGrid() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <h2 className="text-xl font-semibold text-white">{item.title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
