import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { APP_NAME } from "@/lib/constants";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "一个支持用户认证、私有文件上传、下载和删除的个人文件中心项目。"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-background text-slate-100 antialiased">
        <div className="relative min-h-screen bg-grid bg-[size:220px_220px,32px_32px,32px_32px] bg-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(91,140,255,0.14),transparent_30%),linear-gradient(180deg,rgba(5,8,22,0.1),rgba(5,8,22,1))]" />
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </div>
      </body>
    </html>
  );
}