import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(url(), publishableKey());
}

function url() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
  return value;
}

function publishableKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ausente");
  return value;
}
