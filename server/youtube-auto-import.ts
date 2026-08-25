import { getSupabaseAdmin, persistImportedRows } from "./supabase";
import { searchYouTubeVideos, type YouTubeCatalogItem } from "./youtube";
import { recordAnalyticsEvent } from "./admin-observability";

const DEFAULT_QUERIES = ["اغاني مغربية", "اغاني عربية", "اغاني راي", "اغاني جديدة", "اغاني ترند"];

function asBoolean(value: string | undefined, fallback = false) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function asPositiveInt(value: string | undefined, fallback: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.floor(parsed), 1), max) : fallback;
}

function splitQueries(value: string | undefined) {
  return (value ?? "")
    .split(/[\n,،]+/)
    .map(item => item.trim())
    .filter(item => item.length >= 2 && item.length <= 120);
}

async function loadSettings() {
  const supabase = getSupabaseAdmin();
  const envQueries = splitQueries(process.env.YOUTUBE_AUTO_QUERIES);
  if (!supabase) {
    return {
      enabled: asBoolean(process.env.YOUTUBE_AUTO_ENABLED, false),
      queries: envQueries.length ? envQueries : DEFAULT_QUERIES,
      maxQueries: asPositiveInt(process.env.YOUTUBE_AUTO_MAX_QUERIES, 5, 10),
      videosPerQuery: asPositiveInt(process.env.YOUTUBE_AUTO_VIDEOS_PER_QUERY, 10, 25),
    };
  }

  const { data } = await supabase.from("site_settings").select("key,value").in("key", [
    "youtube_auto_enabled",
    "youtube_auto_queries",
    "youtube_auto_max_queries",
    "youtube_auto_videos_per_query",
  ]);
  const settings = new Map((data ?? []).map(row => [row.key, String(row.value ?? "")]));
  const configuredQueries = splitQueries(settings.get("youtube_auto_queries"));
  return {
    enabled: asBoolean(settings.get("youtube_auto_enabled"), asBoolean(process.env.YOUTUBE_AUTO_ENABLED, false)),
    queries: configuredQueries.length ? configuredQueries : envQueries.length ? envQueries : DEFAULT_QUERIES,
    maxQueries: asPositiveInt(settings.get("youtube_auto_max_queries") ?? process.env.YOUTUBE_AUTO_MAX_QUERIES, 5, 10),
    videosPerQuery: asPositiveInt(settings.get("youtube_auto_videos_per_query") ?? process.env.YOUTUBE_AUTO_VIDEOS_PER_QUERY, 10, 25),
  };
}

async function recentSearchQueries(limit: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];
  const { data } = await supabase.from("search_logs").select("query,result_count,created_at").order("created_at", { ascending: false }).limit(500);
  const scores = new Map<string, { count: number; resultCount: number }>();
  for (const row of data ?? []) {
    const query = String(row.query ?? "").trim();
    if (query.length < 2 || query.length > 120) continue;
    const current = scores.get(query) ?? { count: 0, resultCount: 0 };
    current.count += 1;
    current.resultCount += Number(row.result_count ?? 0);
    scores.set(query, current);
  }
  return [...scores.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].resultCount - a[1].resultCount)
    .slice(0, limit)
    .map(([query]) => query);
}

async function filterNewRows(rows: YouTubeCatalogItem[]) {
  const supabase = getSupabaseAdmin();
  if (!supabase || !rows.length) return rows;
  const ids = [...new Set(rows.map(row => row.providerVideoId))];
  const existing = new Set<string>();
  for (let offset = 0; offset < ids.length; offset += 100) {
    const chunk = ids.slice(offset, offset + 100);
    const { data } = await supabase.from("songs").select("provider_video_id").eq("provider", "youtube").in("provider_video_id", chunk);
    for (const row of data ?? []) existing.add(String(row.provider_video_id));
  }
  return rows.filter(row => !existing.has(row.providerVideoId));
}

export async function runYouTubeAutoImport() {
  const settings = await loadSettings();
  if (!settings.enabled) return { status: "disabled" as const, queries: 0, scanned: 0, newRows: 0, accepted: 0, duplicates: 0 };
  if (!process.env.YOUTUBE_API_KEY) return { status: "not_configured" as const, queries: 0, scanned: 0, newRows: 0, accepted: 0, duplicates: 0 };

  const recent = await recentSearchQueries(settings.maxQueries);
  const queries = [...new Set([...recent, ...settings.queries])].slice(0, settings.maxQueries);
  let scanned = 0;
  let newRows: YouTubeCatalogItem[] = [];
  const failures: string[] = [];

  for (const query of queries) {
    try {
      const rows = await searchYouTubeVideos(query, settings.videosPerQuery);
      scanned += rows.length;
      newRows.push(...rows);
    } catch (error) {
      failures.push(`${query}: ${error instanceof Error ? error.message : "YouTube request failed"}`);
    }
  }

  newRows = await filterNewRows(newRows);
  const uniqueRows = [...new Map(newRows.map(row => [row.providerVideoId, row])).values()];
  const persisted = uniqueRows.length && getSupabaseAdmin() ? await persistImportedRows(uniqueRows) : { accepted: 0, status: "database_unavailable" as const };
  const result = {
    status: failures.length && !scanned ? "failed" as const : "completed" as const,
    queries: queries.length,
    scanned,
    newRows: uniqueRows.length,
    accepted: persisted.accepted,
    duplicates: Math.max(0, scanned - uniqueRows.length),
    failures,
  };
  void recordAnalyticsEvent({ eventName: "admin_action", path: "/admin/youtube-auto", metadata: result });
  return result;
}
