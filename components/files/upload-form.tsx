"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ACCEPT_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";

type UploadResponse = {
  success: boolean;
  message?: string;
};

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData
    });

    const result = (await response.json()) as UploadResponse;

    if (!response.ok || !result.success) {
      setError(result.message || "上传失败，请稍后再试。");
      setSubmitting(false);
      return;
    }

    formRef.current?.reset();
    setMessage(result.message || "文件上传成功。");
    router.refresh();
    setSubmitting(false);
  };

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">上传新文件</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            仅允许上传常见文档与图片格式，单个文件大小不超过 {formatBytes(MAX_FILE_SIZE)}。
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
        </div>

        {message ? <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={submitting} type="submit">
            {submitting ? "上传中..." : "开始上传"}
          </Button>
          <span className="text-sm text-slate-500">支持多文件连续上传</span>
        </div>
      </form>
    </section>
  );
}