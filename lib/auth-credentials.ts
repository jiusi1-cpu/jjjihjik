export function normalizeUsername(value: string) {
  return value.trim();
}

export function usernameToEmail(username: string) {
  const normalized = normalizeUsername(username);
  const encoded = encodeURIComponent(normalized).replace(/%/g, "").toLowerCase();
  return `u_${encoded}@personal-file-center.local`;
}

export function isEmailLike(value: string) {
  return value.includes("@");
}