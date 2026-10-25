import { getSupabaseAdmin } from "./supabase";

export async function getSupabaseAuthUser(accessToken: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !accessToken) return null;
  const { data, error } = await (supabase.auth as any).getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
}
