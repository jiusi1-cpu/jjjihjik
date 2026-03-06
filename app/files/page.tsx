import { redirect } from "next/navigation";

import { FilesTable } from "@/components/files/files-table";
import { FileStatCard } from "@/components/files/file-stat-card";
import { UploadForm } from "@/components/files/upload-form";
import { SetupRequired } from "@/components/setup/setup-required";
import type { DatabaseUser, FileRecord } from "@/lib/types";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatBytes, sumFileSize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
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
  const latestUpload = safeFiles[0]?.created_at;
  const displayName = safeProfile?.full_name || "用户";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-primary-foreground">文件工作台</p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">欢迎回来，{displayName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              这里展示当前账号的所有私有文件。上传、下载和删除操作都会校验登录状态与文件归属。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <FileStatCard label="文件总数" value={String(safeFiles.length)} accent="primary" />
        <FileStatCard label="已用空间" value={formatBytes(totalSize)} accent="success" />
        <FileStatCard
          label="最近上传"
          value={
            latestUpload
              ? new Intl.DateTimeFormat("zh-CN", {
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit"
                }).format(new Date(latestUpload))
              : "暂无"
          }
          accent="warning"
        />
      </section>

      <UploadForm />
      <FilesTable files={safeFiles} />
    </div>
  );
}