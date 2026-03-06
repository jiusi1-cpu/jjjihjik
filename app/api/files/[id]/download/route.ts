import { NextResponse } from "next/server";

import { STORAGE_BUCKET } from "@/lib/constants";
import { SUPABASE_ENV_ERROR, hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ success: false, message: SUPABASE_ENV_ERROR }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, message: "未登录用户不能下载文件。" }, { status: 401 });
  }

  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("id, user_id, file_name, file_path")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fileError || !file) {
    return NextResponse.json({ success: false, message: "文件不存在或你无权下载。" }, { status: 404 });
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(file.file_path, 60, {
    download: file.file_name
  });

  if (error || !data?.signedUrl) {
    return NextResponse.json({ success: false, message: "下载链接生成失败，请稍后重试。" }, { status: 500 });
  }

  return NextResponse.redirect(new URL(data.signedUrl));
}