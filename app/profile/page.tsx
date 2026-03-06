import { redirect } from "next/navigation";

import { FileStatCard } from "@/components/files/file-stat-card";
import { SetupRequired } from "@/components/setup/setup-required";
import type { DatabaseUser, FileRecord } from "@/lib/types";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBytes, formatDate, sumFileSize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!hasSupabaseEnv()) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <SetupRequired />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: files }] = await Promise.all([
    supabase.from("users").select("id, email, full_name, created_at").eq("id", user.id).single(),
    supabase
      .from("files")
      .select("id, user_id, file_name, file_path, file_size, mime_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  const safeProfile = profile as DatabaseUser | null;
  const safeFiles = (files ?? []) as FileRecord[];
  const totalSize = sumFileSize(safeFiles);
  const displayName = safeProfile?.full_name || "未设置用户名";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="text-sm text-primary-foreground">个人信息</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">{displayName}</h1>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
              <p className="text-slate-500">用户名</p>
              <p className="mt-2 text-white">{displayName}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
              <p className="text-slate-500">注册时间</p>
              <p className="mt-2 text-white">{safeProfile?.created_at ? formatDate(safeProfile.created_at) : formatDate(user.created_at)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/60 px-4 py-4">
              <p className="text-slate-500">当前身份</p>
              <p className="mt-2 text-white">已登录用户，可访问自己的私有文件</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <FileStatCard label="文件数量" value={String(safeFiles.length)} accent="primary" />
            <FileStatCard label="总文件体积" value={formatBytes(totalSize)} accent="success" />
            <FileStatCard label="最新上传" value={safeFiles[0] ? formatDate(safeFiles[0].created_at) : "暂无"} accent="warning" />
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">最近文件</h2>
                <p className="mt-2 text-sm leading-7 text-slate-400">展示最近上传的 5 个文件，帮助你快速回顾个人资料。</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {safeFiles.slice(0, 5).length ? (
                safeFiles.slice(0, 5).map((file) => (
                  <div key={file.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-background/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{file.file_name}</p>
                      <p className="mt-1 text-sm text-slate-500">{file.mime_type}</p>
                    </div>
                    <div className="text-sm text-slate-300 sm:text-right">
                      <p>{formatBytes(file.file_size)}</p>
                      <p className="mt-1 text-slate-500">{formatDate(file.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-background/40 px-4 py-8 text-center text-sm text-slate-400">
                  还没有上传文件，去“我的文件”页面开始使用吧。
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}