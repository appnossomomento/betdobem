export const ADMIN_EMAILS = ["wellerson.lima96@gmail.com", "gui.luid33@gmail.com"];

export function isAdminEmail(email: string | undefined | null) {
  return ADMIN_EMAILS.includes((email ?? "").trim().toLowerCase());
}
