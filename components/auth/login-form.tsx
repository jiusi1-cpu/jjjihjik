"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isEmailLike, usernameToEmail } from "@/lib/auth-credentials";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/files";
  const registered = searchParams.get("registered");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const trimmedAccount = account.trim();
    const email = isEmailLike(trimmedAccount) ? trimmedAccount : usernameToEmail(trimmedAccount);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setSubmitting(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
    setSubmitting(false);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {registered ? (
        <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
          注册成功，请使用用户名和密码登录。
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="account">
          用户名
        </label>
        <Input
          id="account"
          type="text"
          autoComplete="username"
          placeholder="请输入用户名"
          required
          value={account}
          onChange={(event) => setAccount(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm text-slate-300" htmlFor="password">
          密码
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="请输入密码"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "登录中..." : "登录"}
      </Button>

      <p className="text-center text-sm text-slate-400">
        还没有账号？
        <Link className="ml-2 text-primary-foreground underline underline-offset-4" href="/register">
          立即注册
        </Link>
      </p>
    </form>
  );
}