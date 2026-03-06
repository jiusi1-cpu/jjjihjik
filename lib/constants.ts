export const APP_NAME = "个人文件中心";
export const STORAGE_BUCKET = "user-files";
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_FILE_TYPES: Record<string, string> = {
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
};

export const ACCEPT_FILE_TYPES = [
  ".pdf",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".zip"
].join(",");

export const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/files", label: "我的文件" },
  { href: "/profile", label: "个人中心" }
];
