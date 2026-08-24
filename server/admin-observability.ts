import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "./supabase";

const clampLimit = (value: number, max = 100) => Math.min(Math.max(value, 1), max);

export function hashRequestValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function recordAnalyticsEvent(input: {
  eventName: "page_view" | "search" | "song_view" | "media_view" | "conversion_start" | "admin_action";
  path: string;
  query?: string;
  metadata?: Record<string, unknown>;
  sessionHash?: string;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase.from("analytics_events").insert({
    event_name: input.eventName,
    path: input.path.slice(0, 500),
    query: input.query?.slice(0, 255) ?? null,
    metadata: input.metadata ?? {},
    session_hash: input.sessionHash ?? null,
  });
  if (error) console.warn("[Analytics] event insert failed:", error.message);
  return !error;
}

export async function recordSearchLog(input: { query: string; path?: string; resultCount: number; songId?: string; hashedIp?: string; userAgent?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;
  const { error } = await supabase.from("search_logs").insert({
    query: input.query.slice(0, 255),
    path: (input.path ?? "/search").slice(0, 500),
    result_count: Math.max(0, Math.floor(input.resultCount)),
    song_id: input.songId ?? null,
    hashed_ip: input.hashedIp ?? null,
    user_agent: input.userAgent?.slice(0, 500) ?? null,
  });
  if (error) console.warn("[SearchLogs] insert failed:", error.message);
  return !error;
}

export async function getAnalyticsSummary(days: number) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, days, totalEvents: 0, uniqueSessions: 0, eventBreakdown: [], topPaths: [], topSearches: [] };
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const [{ data: events, error: eventsError }, { data: searches, error: searchesError }] = await Promise.all([
    supabase.from("analytics_events").select("event_name,path,query,session_hash,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
    supabase.from("search_logs").select("query,result_count,created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(5000),
  ]);
  if (eventsError || searchesError) console.warn("[Analytics] summary query failed:", eventsError?.message ?? searchesError?.message);
  const eventRows = events ?? [];
  const searchRows = searches ?? [];
  const countBy = (rows: Array<Record<string, any>>, key: string) => Object.entries(rows.reduce<Record<string, number>>((acc, row) => { const value = String(row[key] ?? "غير محدد"); acc[value] = (acc[value] ?? 0) + 1; return acc; }, {})).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  return { available: true, days, totalEvents: eventRows.length, uniqueSessions: new Set(eventRows.map(row => row.session_hash).filter(Boolean)).size, eventBreakdown: countBy(eventRows, "event_name"), topPaths: countBy(eventRows, "path"), topSearches: countBy(searchRows, "query"), recentSearches: searchRows.slice(0, 20) };
}

export async function listSearchLogs(input: { query?: string; limit: number; offset: number }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, rows: [], total: 0 };
  let request = supabase.from("search_logs").select("id,query,path,result_count,hashed_ip,user_agent,created_at", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + clampLimit(input.limit) - 1);
  if (input.query?.trim()) request = request.ilike("query", `%${input.query.trim().replace(/[%(),]/g, " ")}%`);
  const { data, count, error } = await request;
  if (error) console.warn("[SearchLogs] list failed:", error.message);
  return { available: !error, rows: data ?? [], total: count ?? 0 };
}

export async function listTakedowns(input: { status?: string; limit: number; offset: number }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, rows: [], total: 0 };
  let request = supabase.from("takedown_requests").select("id,song_id,claimant_name,claimant_email,reason,status,evidence_url,admin_notes,created_at,resolved_at,updated_at,updated_by", { count: "exact" }).order("created_at", { ascending: false }).range(input.offset, input.offset + clampLimit(input.limit) - 1);
  if (input.status) request = request.eq("status", input.status);
  const { data, count, error } = await request;
  if (error) console.warn("[Takedown] list failed:", error.message);
  return { available: !error, rows: data ?? [], total: count ?? 0 };
}

export async function submitTakedown(input: { songId?: string; claimantName: string; claimantEmail: string; reason: string; evidenceUrl?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, id: null };
  const { data, error } = await supabase.from("takedown_requests").insert({ song_id: input.songId ?? null, claimant_name: input.claimantName, claimant_email: input.claimantEmail, reason: input.reason, evidence_url: input.evidenceUrl ?? null }).select("id").single();
  if (error) throw new Error(error.message);
  return { available: true, id: data?.id ?? null };
}

export async function updateTakedown(input: { id: string; status: "open" | "reviewing" | "resolved" | "rejected"; adminNotes?: string; updatedBy?: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false };
  const resolvedAt = input.status === "resolved" ? new Date().toISOString() : null;
  const { error } = await supabase.from("takedown_requests").update({ status: input.status, admin_notes: input.adminNotes ?? null, updated_by: input.updatedBy ?? null, resolved_at: resolvedAt, updated_at: new Date().toISOString() }).eq("id", input.id);
  if (error) throw new Error(error.message);
  return { available: true, id: input.id, status: input.status };
}

export async function getSiteSettings() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, rows: [] };
  const { data, error } = await supabase.from("site_settings").select("key,value,value_type,description,updated_by,updated_at").order("key").limit(100);
  if (error) console.warn("[Settings] list failed:", error.message);
  return { available: !error, rows: data ?? [] };
}

export async function updateSiteSettings(rows: Array<{ key: string; value: string }>, updatedBy?: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, updated: 0 };
  const safeRows = rows.slice(0, 50).map(row => ({ key: row.key.slice(0, 100), value: row.value.slice(0, 2000), updated_by: updatedBy ?? null, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from("site_settings").upsert(safeRows, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { available: true, updated: safeRows.length };
}
