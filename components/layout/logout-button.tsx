"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = async () => {
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
    setSubmitting(false);
  };

  return (
    <Button onClick={handleLogout} type="button" variant="secondary" disabled={submitting}>
      {submitting ? "退出中..." : "退出登录"}
    </Button>
  );
}
