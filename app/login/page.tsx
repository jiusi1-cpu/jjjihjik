import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SetupRequired } from "@/components/setup/setup-required";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  if (!hasSupabaseEnv()) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <SetupRequired />
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/files");
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <AuthCard title="欢迎回来" subtitle="登录后即可上传、查看、下载和删除属于你自己的文件。">
        <LoginForm />
      </AuthCard>
    </div>
  );
}