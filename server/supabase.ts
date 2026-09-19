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

export function hashOpaqueToken(token: string) { return createHash("sha256").update(token).digest("hex"); }

export async function persistImportedRows(rows: Array<{ title: string; artist: string; providerVideoId: string; provider?: string; thumbnailUrl?: string; durationSeconds?: number }>) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { accepted: 0, status: "database_unavailable" as const };
  const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ source: "admin", total_rows: rows.length, status: "completed" }).select("id").single();
  if (batchError || !batch) return { accepted: 0, status: "database_error" as const };
  let accepted = 0; const acceptedSlugs: string[] = [];
  for (const row of rows) {
    const artistSlug = makeSlug(row.artist); const songSlug = makeSlug(`${row.artist}-${row.title}`); const token = createOpaqueToken(`${row.providerVideoId}:${songSlug}`);
    const { data: artist, error: artistError } = await supabase.from("artists").upsert({ name: row.artist, slug: artistSlug }, { onConflict: "slug" }).select("id").single();
    if (artistError || !artist) { await supabase.from("import_rows").insert({ batch_id: batch.id, provider_video_id: row.providerVideoId, title: row.title, artist: row.artist, slug: songSlug, status: "failed", error_message: artistError?.message ?? "Artist insert failed" }); continue; }
    const { error: songError } = await supabase.from("songs").upsert({ title: row.title, normalized_title: normalizeArabic(row.title), slug: songSlug, artist_id: artist.id, provider: row.provider ?? "demo", provider_video_id: row.providerVideoId, thumbnail_url: row.thumbnailUrl ?? null, duration_seconds: row.durationSeconds ?? 0, rights_status: row.provider === "youtube" ? "metadata_only" : "demo", opaque_token_hash: hashOpaqueToken(token), status: "active" }, { onConflict: "provider,provider_video_id" });
    await supabase.from("import_rows").insert({ batch_id: batch.id, provider_video_id: row.providerVideoId, title: row.title, artist: row.artist, slug: songSlug, status: songError ? "failed" : "accepted", error_message: songError?.message ?? null });
    if (!songError) { accepted += 1; acceptedSlugs.push(songSlug); }
  }
  await supabase.from("import_batches").update({ accepted_rows: accepted, duplicate_rows: rows.length - accepted }).eq("id", batch.id);
  if (acceptedSlugs.length) await indexCatalogText(rows.filter(row => acceptedSlugs.includes(makeSlug(`${row.artist}-${row.title}`))));
  return { accepted, acceptedSlugs, status: "persisted_demo" as const };
}

const KEYWORD_STOPWORDS = new Set([
  "في", "من", "الى", "إلى", "عن", "على", "مع", "هذا", "هذه", "ذلك", "تلك", "هو", "هي",
  "هم", "هن", "ما", "ماذا", "متى", "كيف", "لماذا", "اين", "أين", "هل", "لا", "لم", "لن",
  "ان", "أن", "إن", "او", "أو", "و", "يا", "ثم", "كان", "كانت", "يكون", "كل", "أي", "اي",
  "the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "de", "la", "le", "les", "des"
]);

function isMeaningfulKeyword(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length < 2 || normalized.length > 120) return false;
  const words = normalized.split(" ").filter(Boolean);
  if (/^\d+$/.test(normalized)) return false;
  if (words.length > 1) return true;
  return normalized.length >= 3 && !KEYWORD_STOPWORDS.has(normalized);
}

function keywordCandidates(query: string) {
  const normalized = normalizeArabic(query)
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/[^a-z0-9\u0600-\u06FF\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return [];
  const words = normalized.split(" ").filter(word => word.length >= 2 && word.length <= 80 && !KEYWORD_STOPWORDS.has(word));
  const candidates = new Set<string>();
  if (isMeaningfulKeyword(normalized)) candidates.add(normalized);

  // Do not create indexable pages from isolated words during catalog indexing.
  // Single-word keywords are still allowed for explicit user searches when meaningful.
  if (normalized.split(" ").length <= 1 && isMeaningfulKeyword(normalized)) candidates.add(normalized);

  for (let size = 2; size <= Math.min(words.length, 4); size += 1) {
    for (let i = 0; i + size <= words.length; i += 1) {
      const phrase = words.slice(i, i + size).join(" ");
      if (isMeaningfulKeyword(phrase)) candidates.add(phrase);
    }
  }

  return Array.from(candidates).filter(isMeaningfulKeyword);
}

async function saveKeyword(supabase: SupabaseClient, query: string, resultSlugs: string[], source: string, countSearch: boolean) {
  const normalizedQuery = normalizeArabic(query).replace(/\s+/g, " ").trim();
  const incomingSlugs = Array.from(new Set(resultSlugs)).filter(Boolean).slice(0, 50);
  // Explicit search queries are intentionally open-ended: one-word, typos,
  // unusual phrases, and other queries can become SEO pages when they have
  // real results. Catalog generation applies its own phrase-level filters.
  if (!normalizedQuery || incomingSlugs.length === 0) return false;
  const slug = makeSlug(normalizedQuery);
  if (!slug) return false;
  const { data: existing } = await supabase.from("catalog_keywords").select("search_count,result_slugs,result_count,source").eq("slug", slug).maybeSingle();
  const previousSlugs = Array.isArray(existing?.result_slugs) ? existing.result_slugs.map(String) : [];
  const mergedSlugs = Array.from(new Set([...previousSlugs, ...incomingSlugs])).filter(Boolean).slice(0, 500);
  const searchCount = Number(existing?.search_count ?? 0) + (countSearch ? 1 : 0);
  const now = new Date().toISOString();
  const { error } = await supabase.from("catalog_keywords").upsert({
    query: normalizedQuery, slug, title: `تحميل ${normalizedQuery} Mp3 Mp4`, language: "ar", source: existing?.source ?? source,
    result_count: mergedSlugs.length, result_slugs: mergedSlugs, indexable: mergedSlugs.length > 0,
    search_count: searchCount, last_searched_at: countSearch ? now : undefined, updated_at: now, status: "active"
  }, { onConflict: "slug" });
  if (error) { console.warn("[Supabase] keyword upsert failed:", error.message); return false; }
  return true;
}

export async function upsertCatalogKeyword(query: string, resultSlugs: string[], source = "search", countSearch = true) {
  const supabase = getSupabaseAdmin();
  const normalizedQuery = normalizeArabic(query).replace(/\s+/g, " ").trim();
  const uniqueSlugs = Array.from(new Set(resultSlugs)).filter(Boolean).slice(0, 50);
  // Explicit searches are intentionally open-ended: one-word queries,
  // typos and unusual phrases are valid SEO candidates when they return results.
  // Catalog-derived keyword generation remains filtered separately.
  if (!supabase || !normalizedQuery || uniqueSlugs.length === 0) return false;
  if (!(await saveKeyword(supabase, normalizedQuery, uniqueSlugs, source, countSearch))) return false;
  if (countSearch) {
    const family = keywordCandidates(normalizedQuery)
      .filter(candidate => candidate !== normalizedQuery)
      .filter(candidate => candidate.includes(" "));
    for (const candidate of family) await saveKeyword(supabase, candidate, uniqueSlugs, "search-derived", false);
  }
  return true;
}

export async function indexCatalogText(rows: Array<{ title: string; artist: string; providerVideoId: string; provider?: string; thumbnailUrl?: string; durationSeconds?: number; album?: string }>) {
  const supabase = getSupabaseAdmin(); if (!supabase) return 0; const candidates = new Map<string, string[]>();
  for (const row of rows) {
    const songSlug = makeSlug(`${row.artist}-${row.title}`);
    const texts = [row.title, row.artist, row.album ?? "", `${row.artist} ${row.title}`, `${row.title} ${row.artist}`];
    for (const text of texts) {
      for (const candidate of keywordCandidates(text)) {
        // Catalog-derived pages must be phrase-level to avoid huge numbers of
        // generic one-word / stopword pages. Exact user searches are handled
        // separately by upsertCatalogKeyword().
        if (!candidate.includes(" ")) continue;
        const list = candidates.get(candidate) ?? [];
        if (!list.includes(songSlug)) list.push(songSlug);
        candidates.set(candidate, list);
      }
    }
  }
  let indexed = 0;
  for (const [candidate, slugs] of candidates) {
    if (slugs.length > 0 && await saveKeyword(supabase, candidate, slugs, "catalog", false)) indexed += 1;
  }
  return indexed;
}

export async function listCatalogKeywords(limit = 20) {
  const supabase = getSupabaseAdmin(); if (!supabase) return null; const safeLimit = Math.min(Math.max(limit, 1), 50);
  const { data, error } = await supabase.from("catalog_keywords").select("query,slug,title,result_count,result_slugs,status,last_searched_at,updated_at,search_count").eq("status", "active").eq("indexable", true).gt("result_count", 0).order("last_searched_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }).limit(safeLimit);
  if (error) { console.warn("[Supabase] keyword list failed:", error.message); return []; } return data ?? [];
}

export async function findCatalogKeyword(slug: string) {
  const supabase = getSupabaseAdmin(); if (!supabase) return null;
  const { data, error } = await supabase.from("catalog_keywords").select("query,slug,title,result_count,result_slugs,status,indexable").eq("slug", slug).eq("status", "active").eq("indexable", true).gt("result_count", 0).maybeSingle();
  if (error) { console.warn("[Supabase] keyword lookup failed:", error.message); return null; } return data;
}

export async function listSitemapKeywords(offset = 0, limit = 45000) {
  const supabase = getSupabaseAdmin(); if (!supabase) return [];
  const { data, error } = await supabase.from("catalog_keywords").select("slug,updated_at").eq("status", "active").eq("indexable", true).gt("result_count", 0).order("updated_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) { console.warn("[Supabase] sitemap keyword query failed:", error.message); return []; } return data ?? [];
}

export async function countIndexableKeywords() {
  const supabase = getSupabaseAdmin(); if (!supabase) return 0;
  const { count, error } = await supabase.from("catalog_keywords").select("id", { count: "exact", head: true }).eq("status", "active").eq("indexable", true).gt("result_count", 0);
  if (error) { console.warn("[Supabase] keyword count failed:", error.message); return 0; } return count ?? 0;
}

export async function updateSupabaseSongStatus(slug: string, status: "available" | "removed") {
  const supabase = getSupabaseAdmin(); if (!supabase) return null; const { error } = await supabase.from("songs").update({ status: status === "available" ? "active" : "removed" }).eq("slug", slug); if (error) throw new Error(error.message); return { slug, status };
}

export function mapSupabaseSong(row: any): CatalogSong {
  return { id: Number(String(row.id).replace(/\D/g, "").slice(-9) || 0), title: row.title, artist: row.artist?.name ?? row.artist_name ?? "فنان تجريبي", artistSlug: row.artist?.slug ?? row.artist_slug ?? "artist", album: row.album?.title ?? row.album_title ?? "إصدار تجريبي", slug: row.slug, providerVideoId: row.provider_video_id, opaqueToken: row.opaque_token ?? row.opaqueToken ?? createOpaqueToken(`${row.provider_video_id}:${row.slug}`), thumbnailUrl: row.thumbnail_url ?? "", durationSeconds: row.duration_seconds ?? 0, isFeatured: Boolean(row.is_featured), rightsStatus: row.rights_status === "licensed" ? "licensed" : row.rights_status === "metadata_only" ? "metadata_only" : "demo", availabilityStatus: row.status === "removed" ? "removed" : "available" };
}
