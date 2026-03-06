import Link from "next/link";

import { APP_NAME } from "@/lib/constants";

export function Logo() {
  return (
    <Link className="flex items-center gap-3" href="/">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-glow">
        <span className="text-lg font-semibold text-white">文</span>
      </span>
      <span className="text-sm font-semibold tracking-wide text-white sm:text-base">{APP_NAME}</span>
    </Link>
  );
}
