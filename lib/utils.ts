import { MAX_FILE_SIZE } from "@/lib/constants";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatBytes(value: number) {
  if (value === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;

  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function sanitizeFileName(fileName: string) {
  const normalized = fileName.normalize("NFKC").trim();
  return normalized
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function validateFileType(mimeType: string, fileName: string, acceptedMimeTypes: string[]) {
  if (acceptedMimeTypes.includes(mimeType)) {
    return true;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();
  const acceptedExtensions = ["pdf", "txt", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "zip"];
  return Boolean(extension && acceptedExtensions.includes(extension));
}

export function isFileSizeValid(fileSize: number) {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
}

function getSafeExtension(fileName: string) {
  const rawExtension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = rawExtension.replace(/[^a-z0-9]/g, "");
  return safeExtension || "bin";
}

export function buildStoragePath(userId: string, fileName: string) {
  const extension = getSafeExtension(fileName);
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export function sumFileSize(files: Array<{ file_size: number }>) {
  return files.reduce((total, current) => total + current.file_size, 0);
}