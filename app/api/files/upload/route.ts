import { NextResponse } from "next/server";

import { ALLOWED_FILE_TYPES, STORAGE_BUCKET } from "@/lib/constants";
import { SUPABASE_ENV_ERROR, hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildStoragePath, isFileSizeValid, validateFileType } from "@/lib/utils";

export const runtime = "nodejs";

type UploadMetadata = {
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
};

function isUploadMetadata(value: unknown): value is UploadMetadata {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.file_name === "string" &&
    typeof candidate.file_path === "string" &&
    typeof candidate.file_size === "number" &&
    typeof candidate.mime_type === "string"
  );
}

async function saveUploadedFiles(userId: string, files: UploadMetadata[]) {
  const supabase = await createSupabaseServerClient();

  for (const file of files) {
    if (!file.file_path.startsWith(`${userId}/`)) {
      return NextResponse.json({ success: false, message: `文件路径非法：${file.file_name}` }, { status: 400 });
    }

    if (!validateFileType(file.mime_type, file.file_name, Object.keys(ALLOWED_FILE_TYPES))) {
      return NextResponse.json({ success: false, message: `文件类型不支持：${file.file_name}` }, { status: 400 });
    }

    if (!isFileSizeValid(file.file_size)) {
      return NextResponse.json({ success: false, message: `文件大小超出限制：${file.file_name}` }, { status: 400 });
    }
  }

  const { error: insertError } = await supabase.from("files").insert(
    files.map((file) => ({
      user_id: userId,
      file_name: file.file_name,
      file_path: file.file_path,
      file_size: file.file_size,
      mime_type: file.mime_type
    }))
  );

  if (insertError) {
    console.error("[upload] database insert failed", {
      userId,
      files,
      error: insertError
    });

    await supabase.storage.from(STORAGE_BUCKET).remove(files.map((file) => file.file_path));

    const hint = insertError.message.includes("violates foreign key constraint")
      ? "；可能是 users 表初始化未完成，请重新执行补充用户数据的 SQL。"
      : "";

    return NextResponse.json(
      {
        success: false,
        message: `文件记录保存失败：${insertError.message}${hint}`
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `上传成功：${files.map((file) => file.file_name).join("、")}`
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ success: false, message: SUPABASE_ENV_ERROR }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "请先登录后再上传文件。" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const payload = (await request.json().catch(() => null)) as { files?: unknown[] } | null;
    const files = Array.isArray(payload?.files) ? payload.files.filter(isUploadMetadata) : [];

    if (!files.length) {
      return NextResponse.json({ success: false, message: "缺少上传文件信息。" }, { status: 400 });
    }

    return saveUploadedFiles(user.id, files);
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (!files.length) {
    return NextResponse.json({ success: false, message: "请选择至少一个文件。" }, { status: 400 });
  }

  const uploadedFiles: UploadMetadata[] = [];

  for (const file of files) {
    if (!validateFileType(file.type, file.name, Object.keys(ALLOWED_FILE_TYPES))) {
      return NextResponse.json({ success: false, message: `文件类型不支持：${file.name}` }, { status: 400 });
    }

    if (!isFileSizeValid(file.size)) {
      return NextResponse.json({ success: false, message: `文件大小超出限制：${file.name}` }, { status: 400 });
    }

    const filePath = buildStoragePath(user.id, file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

    if (uploadError) {
      console.error("[upload] storage upload failed", {
        fileName: file.name,
        userId: user.id,
        error: uploadError
      });

      return NextResponse.json(
        {
          success: false,
          message: `文件上传失败：${uploadError.message || file.name}`
        },
        { status: 500 }
      );
    }

    uploadedFiles.push({
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream"
    });
  }

  return saveUploadedFiles(user.id, uploadedFiles);
}