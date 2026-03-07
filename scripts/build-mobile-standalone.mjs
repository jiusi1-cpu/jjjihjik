import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

function readEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const content = readFileSync(filePath, "utf8");
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  return Object.fromEntries(
    lines
      .map((line) => {
        const index = line.indexOf("=");
        if (index === -1) return null;
        return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
      })
      .filter(Boolean)
  );
}

const root = process.cwd();
const env = {
  ...readEnvFile(resolve(root, ".env")),
  ...readEnvFile(resolve(root, ".env.local"))
};

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("缺少 Supabase 配置，请先在 .env.local 中填写 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY。");
}

const sourceDir = resolve(root, "mobile", "standalone");
const outputDir = resolve(root, "capacitor-build");
const vendorDir = resolve(outputDir, "vendor");

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });

copyFileSync(resolve(sourceDir, "index.html"), resolve(outputDir, "index.html"));
copyFileSync(resolve(sourceDir, "styles.css"), resolve(outputDir, "styles.css"));
copyFileSync(resolve(sourceDir, "app.js"), resolve(outputDir, "app.js"));
copyFileSync(resolve(root, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"), join(vendorDir, "supabase.js"));

const runtimeConfig = {
  appName: env.CAPACITOR_APP_NAME || "个人文件中心",
  supabaseUrl,
  supabaseAnonKey: supabaseKey,
  storageBucket: "user-files",
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: {
    "application/pdf": "PDF",
    "text/plain": "TXT",
    "image/png": "PNG",
    "image/jpeg": "JPG / JPEG",
    "image/webp": "WEBP",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/zip": "ZIP"
  }
};

writeFileSync(resolve(outputDir, "app-config.js"), `window.APP_CONFIG = ${JSON.stringify(runtimeConfig, null, 2)};\n`, "utf8");
console.log("Standalone mobile build generated at", outputDir);
