export function publicAvatar(value: unknown) {
  if (typeof value !== "string") return "";
  const url = value.trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    if (!parsed.pathname.startsWith("/storage/v1/object/public/avatars/")) return "";
    return url;
  } catch {
    return "";
  }
}
