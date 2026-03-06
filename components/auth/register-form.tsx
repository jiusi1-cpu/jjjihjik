"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usernameToEmail } from "@/lib/auth-credentials";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError("请输入用户名。");
      setSubmitting(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(trimmedUsername),
      password,
      options: {
        data: {
          full_name: trimmedUsername,
          username: trimmedUsername
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/files`
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    if (data.session) {
      router.push("/files");
      router.refresh();
      return;
    }

    router.push("/login?registered=1");
    router.refresh();
    setSubmitting(false);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="username">
          用户名
        </label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="请输入用户名"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="password">
          密码
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="至少 6 位密码"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "注册中..." : "创建账号"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        已有账号？
        <Link className="ml-2 text-primary-foreground underline underline-offset-4" href="/login">
          去登录
        </Link>
      </p>
    </form>
  );
}