# 个人文件中心

一个基于 **Next.js + Tailwind CSS + Supabase** 的完整网页项目，提供注册、登录、退出登录、私有文件上传、文件列表展示、下载自己的文件、删除自己的文件，以及个人中心统计能力。

## 技术栈

- Next.js App Router
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage

## 功能清单

- 用户注册
- 用户登录 / 退出登录
- 文件上传
- 文件列表展示
- 下载自己的文件
- 删除自己的文件
- 文件名、文件大小、上传时间展示
- 用户信息与文件统计展示
- 文件类型与大小限制
- 防止同名文件覆盖

## 项目目录结构

```text
.
├─ app
│  ├─ api
│  │  └─ files
│  │     ├─ [id]
│  │     │  ├─ download
│  │     │  │  └─ route.ts
│  │     │  └─ route.ts
│  │     └─ upload
│  │        └─ route.ts
│  ├─ auth
│  │  └─ callback
│  │     └─ route.ts
│  ├─ files
│  │  └─ page.tsx
│  ├─ login
│  │  └─ page.tsx
│  ├─ profile
│  │  └─ page.tsx
│  ├─ register
│  │  └─ page.tsx
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components
│  ├─ auth
│  │  ├─ auth-card.tsx
│  │  ├─ login-form.tsx
│  │  └─ register-form.tsx
│  ├─ files
│  │  ├─ file-stat-card.tsx
│  │  ├─ files-table.tsx
│  │  └─ upload-form.tsx
│  ├─ home
│  │  ├─ feature-grid.tsx
│  │  ├─ hero-section.tsx
│  │  └─ preview-panel.tsx
│  ├─ layout
│  │  ├─ logout-button.tsx
│  │  ├─ site-footer.tsx
│  │  └─ site-header.tsx
│  └─ ui
│     ├─ button.tsx
│     ├─ input.tsx
│     └─ logo.tsx
├─ lib
│  ├─ supabase
│  │  ├─ client.ts
│  │  ├─ middleware.ts
│  │  ├─ server.ts
│  │  └─ shared.ts
│  ├─ constants.ts
│  ├─ types.ts
│  └─ utils.ts
├─ supabase
│  └─ schema.sql
├─ .env.example
├─ .eslintrc.json
├─ .gitignore
├─ middleware.ts
├─ next.config.ts
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
└─ tsconfig.json
```

## 数据结构

### `users`

```sql
id uuid primary key
email text not null unique
full_name text
created_at timestamptz not null
```

### `files`

```sql
id uuid primary key
user_id uuid not null
file_name text not null
file_path text not null
file_size bigint not null
mime_type text not null
created_at timestamptz not null
```

## 本地运行方法

### 1. 安装依赖

```bash
npm install
```

### 2. 创建 Supabase 项目

1. 在 Supabase 控制台创建新项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 获取项目的 URL 和 anon key。
4. 复制 `.env.example` 为 `.env.local`，填入你的 Supabase 环境变量。

### 3. 可选：关闭邮箱验证

如果你希望注册后立即登录，可以在 Supabase Auth 设置中关闭 Email Confirm。

### 4. 启动开发环境

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 部署步骤

### 推荐：部署到 Vercel

1. 将代码推送到 Git 仓库。
2. 在 Vercel 中导入该项目。
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 点击 Deploy。

### Supabase 配置检查

- 确认 `supabase/schema.sql` 已执行成功。
- 确认私有 Bucket `user-files` 已创建。
- 确认 RLS 与 Storage Policy 生效。

## 核心实现说明

### 认证

- 注册页使用 Supabase Auth 创建用户。
- 登录页使用邮箱密码登录。
- 顶部导航支持退出登录。
- 中间件与服务端页面共同保护私有页面。

### 文件上传

- 上传接口位于 `app/api/files/upload/route.ts`
- 上传前校验登录状态、文件类型、文件大小。
- 存储路径使用 `用户ID/UUID-文件名`，避免重名覆盖。
- 上传成功后写入 `files` 表。

### 文件下载

- 下载接口位于 `app/api/files/[id]/download/route.ts`
- 先验证文件是否属于当前用户。
- 再生成短时效签名链接进行下载。

### 文件删除

- 删除接口位于 `app/api/files/[id]/route.ts`
- 先验证文件归属。
- 再删除 Storage 文件和数据库记录。

## 后续可扩展方向

- 文件搜索 / 筛选
- 文件夹层级
- 回收站
- 分享链接
- 文件预览
- 用户头像与资料编辑