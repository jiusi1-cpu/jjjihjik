"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { FileRecord } from "@/lib/types";
import { formatBytes, formatDate } from "@/lib/utils";

export function FilesTable({ files }: { files: FileRecord[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const hasFiles = useMemo(() => files.length > 0, [files.length]);

  const handleDelete = async (fileId: string) => {
    if (!window.confirm("确定删除这个文件吗？此操作不可恢复。")) {
      return;
    }

    setBusyId(fileId);

    const response = await fetch(`/api/files/${fileId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setBusyId(null);
      alert("删除失败，请稍后再试。");
      return;
    }

    router.refresh();
    setBusyId(null);
  };

  if (!hasFiles) {
    return (
      <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-8 text-center">
        <h2 className="text-2xl font-semibold text-white">还没有文件</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">上传你的第一份文件后，这里会展示文件名、大小、上传时间以及操作入口。</p>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
      <div className="hidden overflow-hidden rounded-[28px] border border-white/10 lg:block">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-white/[0.03] text-slate-400">
            <tr>
              <th className="px-6 py-4 font-medium">文件名</th>
              <th className="px-6 py-4 font-medium">文件大小</th>
              <th className="px-6 py-4 font-medium">上传时间</th>
              <th className="px-6 py-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {files.map((file) => (
              <tr key={file.id} className="text-slate-200">
                <td className="px-6 py-5">
                  <div className="font-medium text-white">{file.file_name}</div>
                  <div className="mt-1 text-xs text-slate-500">{file.mime_type}</div>
                </td>
                <td className="px-6 py-5">{formatBytes(file.file_size)}</td>
                <td className="px-6 py-5">{formatDate(file.created_at)}</td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-3">
                    <a className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm text-white transition hover:bg-white/[0.06]" href={`/api/files/${file.id}/download`}>
                      下载
                    </a>
                    <Button disabled={busyId === file.id} onClick={() => handleDelete(file.id)} type="button" variant="danger">
                      {busyId === file.id ? "删除中..." : "删除"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:hidden">
        {files.map((file) => (
          <div key={file.id} className="rounded-[28px] border border-white/10 bg-background/50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">{file.file_name}</h3>
                <p className="mt-2 text-sm text-slate-400">{file.mime_type}</p>
              </div>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-slate-300">{formatBytes(file.file_size)}</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">上传于 {formatDate(file.created_at)}</p>
            <div className="mt-5 flex gap-3">
              <a className="inline-flex h-10 flex-1 items-center justify-center rounded-2xl border border-white/10 px-4 text-sm text-white transition hover:bg-white/[0.06]" href={`/api/files/${file.id}/download`}>
                下载
              </a>
              <Button className="flex-1" disabled={busyId === file.id} onClick={() => handleDelete(file.id)} type="button" variant="danger">
                {busyId === file.id ? "删除中..." : "删除"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
