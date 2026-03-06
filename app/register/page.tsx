import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { SetupRequired } from "@/components/setup/setup-required";
import { hasSupabaseEnv } from "@/lib/supabase/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RegisterPage() {
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
      <AuthCard title="创建账号" subtitle="注册后即可拥有自己的私有文件空间，所有文件都和当前用户一一绑定。">
        <RegisterForm />
      </AuthCard>
    </div>
  );
}