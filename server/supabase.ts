import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { createOpaqueToken, makeSlug, normalizeArabic } from "./catalog";
import type { CatalogSong } from "./catalog";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function persistImportedRows(rows: Array<{ title: string; artist: string; providerVideoId: string; provider?: string; thumbnailUrl?: string; durationSeconds?: number }>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { accepted: 0, status: "database_unavailable" as const };
  const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ source: "admin", total_rows: rows.length, status: "completed" }).select("id").single();
  if (batchError || !batch) return { accepted: 0, status: "database_error" as const };
  let accepted = 0;
  const acceptedSlugs: string[] = [];
  for (const row of rows) {
    const artistSlug = makeSlug(row.artist);
    const songSlug = makeSlug(`${row.artist}-${row.title}`);
    const token = createOpaqueToken(`${row.providerVideoId}:${songSlug}`);
    const { data: artist, error: artistError } = await supabase.from("artists").upsert({ name: row.artist, slug: artistSlug }, { onConflict: "slug" }).select("id").single();
    if (artistError || !artist) {
      await supabase.from("import_rows").insert({ batch_id: batch.id, provider_video_id: row.providerVideoId, title: row.title, artist: row.artist, slug: songSlug, status: "failed", error_message: artistError?.message ?? "Artist insert failed" });
      continue;
    }
    const { error: songError } = await supabase.from("songs").upsert({ title: row.title, normalized_title: normalizeArabic(row.title), slug: songSlug, artist_id: artist.id, provider: row.provider ?? "demo", provider_video_id: row.providerVideoId, thumbnail_url: row.thumbnailUrl ?? null, duration_seconds: row.durationSeconds ?? 0, rights_status: row.provider === "youtube" ? "metadata_only" : "demo", opaque_token_hash: hashOpaqueToken(token), status: "active" }, { onConflict: "provider,provider_video_id" });
    await supabase.from("import_rows").insert({ batch_id: batch.id, provider_video_id: row.providerVideoId, title: row.title, artist: row.artist, slug: songSlug, status: songError ? "failed" : "accepted", error_message: songError?.message ?? null });
    if (!songError) { accepted += 1; acceptedSlugs.push(songSlug); }
  }
  await supabase.from("import_batches").update({ accepted_rows: accepted, duplicate_rows: rows.length - accepted }).eq("id", batch.id);
  return { accepted, acceptedSlugs, status: "persisted_demo" as const };
}

export async function upsertCatalogKeyword(query: string, resultSlugs: string[]) {
  const supabase = getSupabaseAdmin();
  const normalizedQuery = query.trim();
  if (!supabase || !normalizedQuery || resultSlugs.length === 0) return false;
  const slug = makeSlug(normalizedQuery);
  const { error } = await supabase.from("catalog_keywords").upsert({ query: normalizedQuery, slug, title: `تحميل ${normalizedQuery} Mp3 Mp4`, result_count: resultSlugs.length, result_slugs: Array.from(new Set(resultSlugs)).slice(0, 50), last_searched_at: new Date().toISOString(), updated_at: new Date().toISOString(), status: "active" }, { onConflict: "slug" });
  if (error) { console.warn("[Supabase] keyword upsert failed:", error.message); return false; }
  return true;
}

export async function listCatalogKeywords(limit = 20) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from("catalog_keywords").select("query,slug,title,result_count,result_slugs,status,last_searched_at,updated_at").eq("status", "active").order("updated_at", { ascending: false }).limit(Math.min(Math.max(limit, 1), 50));
  if (error) { console.warn("[Supabase] keyword list failed:", error.message); return []; }
  return data ?? [];
}

export async function findCatalogKeyword(slug: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data, error } = await supabase.from("catalog_keywords").select("query,slug,title,result_count,result_slugs,status").eq("slug", slug).eq("status", "active").maybeSingle();
  if (error) { console.warn("[Supabase] keyword lookup failed:", error.message); return null; }
  return data;
}

export async function updateSupabaseSongStatus(slug: string, status: "available" | "removed") {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { error } = await supabase.from("songs").update({ status: status === "available" ? "active" : "removed" }).eq("slug", slug);
  if (error) throw new Error(error.message);
  return { slug, status };
}

export function mapSupabaseSong(row: any): CatalogSong {
  return {
    id: Number(String(row.id).replace(/\D/g, "").slice(-9) || 0),
    title: row.title,
    artist: row.artist?.name ?? row.artist_name ?? "فنان تجريبي",
    artistSlug: row.artist?.slug ?? row.artist_slug ?? "artist",
    album: row.album?.title ?? row.album_title ?? "إصدار تجريبي",
    slug: row.slug,
    providerVideoId: row.provider_video_id,
    opaqueToken: row.opaque_token ?? row.opaqueToken ?? createOpaqueToken(`${row.provider_video_id}:${row.slug}`),
    thumbnailUrl: row.thumbnail_url ?? "",
    durationSeconds: row.duration_seconds ?? 0,
    isFeatured: Boolean(row.is_featured),
    rightsStatus: row.rights_status === "licensed" ? "licensed" : row.rights_status === "metadata_only" ? "metadata_only" : "demo",
    availabilityStatus: row.status === "removed" ? "removed" : "available",
  };
}
