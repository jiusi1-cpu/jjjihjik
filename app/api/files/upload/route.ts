import { NextResponse } from "next/server";

import { ALLOWED_FILE_TYPES, STORAGE_BUCKET } from "@/lib/constants";
import { SUPABASE_ENV_ERROR, hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildStoragePath, isFileSizeValid, validateFileType } from "@/lib/utils";

export const runtime = "nodejs";

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

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (!files.length) {
    return NextResponse.json({ success: false, message: "请选择至少一个文件。" }, { status: 400 });
  }

  const uploadedNames: string[] = [];

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

    const { error: insertError } = await supabase.from("files").insert({
      user_id: user.id,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || "application/octet-stream"
    });

    if (insertError) {
      console.error("[upload] database insert failed", {
        fileName: file.name,
        userId: user.id,
        error: insertError
      });

      await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

      const hint = insertError.message.includes("violates foreign key constraint")
        ? "；可能是 users 表初始化未完成，请重新执行 schema.sql 中的用户表与触发器 SQL。"
        : "";

      return NextResponse.json(
        {
          success: false,
          message: `文件记录保存失败：${insertError.message}${hint}`
        },
        { status: 500 }
      );
    }

    uploadedNames.push(file.name);
  }

  return NextResponse.json({
    success: true,
    message: `上传成功：${uploadedNames.join("、")}`
  });
}