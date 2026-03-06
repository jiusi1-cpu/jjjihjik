"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ACCEPT_FILE_TYPES, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, STORAGE_BUCKET } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildStoragePath, formatBytes, isFileSizeValid, validateFileType } from "@/lib/utils";

type UploadResponse = {
  success: boolean;
  message?: string;
};

type UploadTaskStatus = "waiting" | "uploading" | "saving" | "done" | "error";

type UploadTask = {
  id: string;
  name: string;
  size: number;
  status: UploadTaskStatus;
  detail?: string;
};

const statusLabel: Record<UploadTaskStatus, string> = {
  waiting: "等待上传",
  uploading: "上传中",
  saving: "登记中",
  done: "已完成",
  error: "失败"
};

const statusClassName: Record<UploadTaskStatus, string> = {
  waiting: "bg-white/[0.06] text-slate-300",
  uploading: "bg-primary/15 text-primary-foreground",
  saving: "bg-warning/15 text-warning",
  done: "bg-success/15 text-success",
  error: "bg-danger/15 text-rose-200"
};

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const updateTask = (taskId: string, status: UploadTaskStatus, detail?: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status, detail } : task))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const fileInput = event.currentTarget.elements.namedItem("files") as HTMLInputElement | null;
    const selectedFiles = Array.from(fileInput?.files ?? []);

    if (!selectedFiles.length) {
      setError("请选择至少一个文件。");
      setSubmitting(false);
      return;
    }

    const entries = selectedFiles.map((file, index) => ({
      id: `${file.name}-${file.size}-${index}`,
      file
    }));

    setTasks(
      entries.map(({ id, file }) => ({
        id,
        name: file.name,
        size: file.size,
        status: "waiting"
      }))
    );

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("登录状态已失效，请重新登录后再上传。");
      setSubmitting(false);
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const { id, file } of entries) {
      if (!validateFileType(file.type, file.name, Object.keys(ALLOWED_FILE_TYPES))) {
        updateTask(id, "error", "文件类型不支持");
        failureCount += 1;
        continue;
      }

      if (!isFileSizeValid(file.size)) {
        updateTask(id, "error", `文件大小超过 ${formatBytes(MAX_FILE_SIZE)}`);
        failureCount += 1;
        continue;
      }

      const filePath = buildStoragePath(user.id, file.name);

      updateTask(id, "uploading", "正在直传到文件存储，移动端会更快一些");

      const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
      });

      if (uploadError) {
        updateTask(id, "error", uploadError.message || "上传到文件存储失败");
        failureCount += 1;
        continue;
      }

      updateTask(id, "saving", "正在写入文件记录");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          files: [
            {
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type || "application/octet-stream"
            }
          ]
        })
      });

      const result = (await response.json().catch(() => ({ success: false }))) as UploadResponse;

      if (!response.ok || !result.success) {
        updateTask(id, "error", result.message || "文件记录保存失败");
        failureCount += 1;
        continue;
      }

      updateTask(id, "done", "上传完成");
      successCount += 1;
    }

    if (successCount > 0) {
      formRef.current?.reset();
      setMessage(`${successCount} 个文件上传成功。`);
      router.refresh();
    }

    if (failureCount > 0) {
      setError(`${failureCount} 个文件上传失败，请查看下方状态。`);
    }

    setSubmitting(false);
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">上传新文件</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            现在已优化为浏览器直传 Supabase Storage，移动端上传会比之前更快。单个文件大小不超过 {formatBytes(MAX_FILE_SIZE)}。
          </p>
        </div>
      </div>

      <form ref={formRef} className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="rounded-[28px] border border-dashed border-white/15 bg-background/50 p-6">
          <label className="block text-sm text-slate-300" htmlFor="files">
            选择文件
          </label>
          <input
            id="files"
            accept={ACCEPT_FILE_TYPES}
            className="mt-4 block w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-[#6a97ff]"
            multiple
            name="files"
            type="file"
            required
          />
          <p className="mt-3 text-xs text-slate-500">手机上传大图时可能仍需几秒，请等待状态变为“已完成”。</p>
        </div>

        {message ? <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        {tasks.length ? (
          <div className="space-y-3 rounded-[28px] border border-white/10 bg-background/40 p-4">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{task.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatBytes(task.size)}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs ${statusClassName[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                </div>
                {task.detail ? <p className="mt-3 text-sm text-slate-400">{task.detail}</p> : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={submitting} type="submit">
            {submitting ? "上传处理中..." : "开始上传"}
          </Button>
          <span className="text-sm text-slate-500">支持多文件连续上传</span>
        </div>
      </form>
    </section>
  );
}