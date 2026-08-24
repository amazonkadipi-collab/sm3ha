import { TRPCError } from "@trpc/server";
import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { LOCAL_ADMIN_OPEN_ID, sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createOpaqueToken, demoSongs, formatDuration, makeSlug, normalizeArabic, searchDemoSongs } from "./catalog";
import { createDemoDownloadToken } from "./download";
import { findSongBySlug, findSongByToken, findSongs, getDb, updateDrizzleSongStatus } from "./db";
import { getSupabaseAdmin, persistImportedRows, updateSupabaseSongStatus } from "./supabase";
import { getAnalyticsSummary, getSiteSettings, hashRequestValue, listSearchLogs, listTakedowns, recordAnalyticsEvent, recordSearchLog, submitTakedown, updateSiteSettings, updateTakedown } from "./admin-observability";
import { searchYouTubeVideos } from "./youtube";
import { artists, songs } from "../drizzle/schema";

const paginationInput = z.object({ query: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(50).default(12) });
const importRowInput = z.object({ title: z.string().min(1), artist: z.string().min(1), providerVideoId: z.string().min(1), provider: z.string().max(64).optional(), thumbnailUrl: z.string().url().optional(), durationSeconds: z.number().int().min(0).max(86400).optional() });

const demoResult = (song: typeof demoSongs[number]) => ({ ...song, duration: formatDuration(song.durationSeconds), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` });

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    adminLogin: publicProcedure.input(z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      if (!ENV.adminUsername || !ENV.adminPassword) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Admin login is not configured" });
      const safeEqual = (left: string, right: string) => { const a = Buffer.from(left); const b = Buffer.from(right); return a.length === b.length && timingSafeEqual(a, b); };
      if (!safeEqual(input.username, ENV.adminUsername) || !safeEqual(input.password, ENV.adminPassword)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin credentials" });
      const token = await sdk.signSession({ openId: LOCAL_ADMIN_OPEN_ID, appId: ENV.appId, name: "admin" }, { expiresInMs: 8 * 60 * 60 * 1000 });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, sameSite: cookieOptions.secure ? "none" : "lax", maxAge: 8 * 60 * 60 * 1000 });
      return { success: true, username: ENV.adminUsername } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    search: publicProcedure.input(paginationInput).query(async ({ ctx, input }) => {
      const query = input.query?.trim();
      let databaseSongs = await findSongs(query, input.limit);
      let results = databaseSongs.map(song => ({ ...song, artist: "", album: "", duration: formatDuration(song.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` }));
      if (query && results.length === 0 && ENV.youtubeApiKey) {
        try {
          const youtubeRows = await searchYouTubeVideos(query, input.limit);
          if (youtubeRows.length) {
            await persistImportedRows(youtubeRows);
            databaseSongs = await findSongs(query, input.limit);
            results = databaseSongs.map(song => ({ ...song, artist: "", album: "", duration: formatDuration(song.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` }));
          }
        } catch (error) {
          console.warn("[YouTube] public search failed:", error instanceof Error ? error.message : error);
        }
      }
      if (results.length === 0) results = searchDemoSongs(query ?? "").slice(0, input.limit).map(demoResult);
      if (query) {
        const forwarded = String(ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket.remoteAddress ?? "").split(",")[0].trim();
        void recordSearchLog({ query, path: "/search", resultCount: results.length, hashedIp: forwarded ? hashRequestValue(forwarded) : undefined, userAgent: String(ctx.req.headers["user-agent"] ?? "") });
        void recordAnalyticsEvent({ eventName: "search", path: "/search", query, metadata: { resultCount: results.length, source: databaseSongs.length ? "catalog" : "fallback" } });
      }
      return results;
    }),
    trending: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(20).default(6) })).query(async ({ input }) => {
      const stored = await findSongs(undefined, input.limit);
      return stored.length ? stored.map(song => ({ ...song, artist: "", album: "", duration: formatDuration(song.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` })) : demoSongs.slice(0, input.limit).map(demoResult);
    }),
    artists: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(20).default(12) })).query(({ input }) => Array.from(new Map(demoSongs.map(song => [song.artistSlug, { slug: song.artistSlug, name: song.artist, imageUrl: song.thumbnailUrl, songCount: demoSongs.filter(item => item.artistSlug === song.artistSlug).length }])).values()).slice(0, input.limit)),
    artistBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(255) })).query(({ input }) => { const songs = demoSongs.filter(song => song.artistSlug === input.slug); if (!songs.length) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" }); return { slug: input.slug, name: songs[0].artist, imageUrl: songs[0].thumbnailUrl, songs: songs.map(demoResult) }; }),
    songBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(255) })).query(async ({ input }) => {
      const dbSong = await findSongBySlug(input.slug);
      if (dbSong) return { ...dbSong, artist: "", album: "", duration: formatDuration(dbSong.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(dbSong.opaqueToken)}` };
      const song = demoSongs.find(item => item.slug === input.slug);
      if (song) return demoResult(song);
      if (ENV.youtubeApiKey) {
        try {
          const youtubeRows = await searchYouTubeVideos(input.slug.replace(/-/g, " "), 10);
          const match = youtubeRows.find(row => makeSlug(`${row.artist}-${row.title}`) === input.slug) ?? youtubeRows[0];
          if (match) {
            await persistImportedRows([match]);
            const persisted = await findSongBySlug(makeSlug(`${match.artist}-${match.title}`));
            if (persisted) return { ...persisted, artist: "", album: "", duration: formatDuration(persisted.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(persisted.opaqueToken)}` };
          }
        } catch (error) {
          console.warn("[YouTube] slug materialization failed:", error instanceof Error ? error.message : error);
        }
      }
      throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
    }),
    mediaByToken: publicProcedure.input(z.object({ token: z.string().min(8).max(128) })).query(async ({ input }) => {
      const dbSong = await findSongByToken(input.token);
      const song = dbSong ? { ...dbSong, artist: "", album: "", duration: formatDuration(dbSong.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(dbSong.opaqueToken)}` } : demoSongs.map(demoResult).find(item => item.opaqueToken === input.token);
      if (!song) throw new TRPCError({ code: "NOT_FOUND", message: "Media token not found" });
      return { ...song, allowedDemo: song.rightsStatus === "demo" || song.rightsStatus === "licensed", variants: [{ format: "mp3", quality: "Demo 128 kbps", status: "ready" }, { format: "mp4", quality: "Demo 720p", status: "ready" }] };
    }),
    startDemoConversion: publicProcedure.input(z.object({ token: z.string(), format: z.enum(["mp3", "mp4"]), quality: z.string().max(32) })).mutation(async ({ input }) => {
      const song = demoSongs.find(item => item.opaqueToken === input.token);
      if (!song) throw new TRPCError({ code: "NOT_FOUND", message: "Demo media token not found" });
      const signedToken = createDemoDownloadToken(song.opaqueToken);
      return { id: `demo-job-${song.id}-${Date.now()}`, status: "ready" as const, progress: 100, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), downloadUrl: `/api/demo-download/${signedToken}`, notice: "Demo only: no external media was downloaded." };
    }),
  }),
  youtube: router({
    search: adminProcedure.input(z.object({ query: z.string().trim().min(2).max(120), limit: z.number().int().min(1).max(25).default(10) })).query(async ({ input }) => {
      try {
        return await searchYouTubeVideos(input.query, input.limit);
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "YouTube search failed" });
      }
    }),
  }),
  observability: router({
    track: publicProcedure.input(z.object({ eventName: z.enum(["page_view", "song_view", "media_view", "conversion_start"]), path: z.string().min(1).max(500), query: z.string().max(255).optional(), metadata: z.record(z.string(), z.unknown()).optional() })).mutation(({ input, ctx }) => { const session = String(ctx.req.headers["x-forwarded-for"] ?? ctx.req.socket.remoteAddress ?? ""); void recordAnalyticsEvent({ ...input, sessionHash: session ? hashRequestValue(session) : undefined }); return { accepted: true } as const; }),
    summary: adminProcedure.input(z.object({ days: z.number().int().min(1).max(90).default(30) })).query(({ input }) => getAnalyticsSummary(input.days)),
    searchLogs: adminProcedure.input(z.object({ query: z.string().max(120).optional(), limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).max(10000).default(0) })).query(({ input }) => listSearchLogs(input)),
    takedowns: adminProcedure.input(z.object({ status: z.enum(["open", "reviewing", "resolved", "rejected"]).optional(), limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().min(0).max(10000).default(0) })).query(({ input }) => listTakedowns(input)),
    updateTakedown: adminProcedure.input(z.object({ id: z.string().uuid(), status: z.enum(["open", "reviewing", "resolved", "rejected"]), adminNotes: z.string().max(5000).optional() })).mutation(async ({ input, ctx }) => { const result = await updateTakedown({ ...input, updatedBy: ctx.user.openId }); void recordAnalyticsEvent({ eventName: "admin_action", path: "/admin/dmca", metadata: { action: "update_takedown", status: input.status } }); return result; }),
    settings: adminProcedure.query(() => getSiteSettings()),
    updateSettings: adminProcedure.input(z.object({ rows: z.array(z.object({ key: z.string().min(1).max(100), value: z.string().max(2000) })).max(50) })).mutation(async ({ input, ctx }) => { const result = await updateSiteSettings(input.rows, ctx.user.openId); void recordAnalyticsEvent({ eventName: "admin_action", path: "/admin/settings", metadata: { action: "update_settings", keys: input.rows.map(row => row.key).slice(0, 20) } }); return result; }),
  }),
  takedown: router({
    submit: publicProcedure.input(z.object({ songId: z.string().uuid().optional(), claimantName: z.string().trim().min(2).max(255), claimantEmail: z.string().email().max(320), reason: z.string().trim().min(20).max(10000), evidenceUrl: z.string().url().max(1000).optional() })).mutation(({ input }) => submitTakedown(input)),
  }),
  admin: router({
    listCatalog: adminProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(25) })).query(async ({ input }) => {
      const songs = await findSongs(undefined, input.limit, true);
      return songs.map(song => ({ ...song, artist: "artist" in song ? song.artist : "فنان تجريبي", provider: "provider" in song ? song.provider : "demo", status: "availabilityStatus" in song && song.availabilityStatus === "removed" ? "removed" as const : "available" as const }));
    }),
    setSongStatus: adminProcedure.input(z.object({ slug: z.string().min(1).max(255), status: z.enum(["available", "removed"]) })).mutation(async ({ input }) => {
      const supabaseResult = await updateSupabaseSongStatus(input.slug, input.status);
      if (supabaseResult) return supabaseResult;
      const drizzleResult = await updateDrizzleSongStatus(input.slug, input.status);
      if (!drizzleResult) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database unavailable" });
      return drizzleResult;
    }),
    previewImport: adminProcedure.input(z.object({ rows: z.array(z.object({ title: z.string().min(1), artist: z.string().min(1), providerVideoId: z.string().min(1) })).max(1000) })).mutation(({ input }) => {
      const seen = new Set<string>();
      const rows = input.rows.map(row => { const duplicate = seen.has(row.providerVideoId); seen.add(row.providerVideoId); return { ...row, slug: makeSlug(`${row.artist}-${row.title}`), normalizedTitle: normalizeArabic(row.title), duplicate }; });
      return { rows, total: rows.length, duplicates: rows.filter(row => row.duplicate).length };
    }),
    commitImport: adminProcedure.input(z.object({ rows: z.array(importRowInput).max(1000) })).mutation(async ({ input }) => { if (getSupabaseAdmin()) { const result = await persistImportedRows(input.rows); return { ...result, message: `${result.accepted} ligne(s) enregistrée(s) dans Supabase en mode demo.` }; } const db = await getDb(); if (!db) return { accepted: 0, status: "database_unavailable" as const, message: "Database unavailable; no rows were written." }; let accepted = 0; for (const row of input.rows) { const artistSlug = makeSlug(row.artist); const songSlug = makeSlug(`${row.artist}-${row.title}`); await db.insert(artists).values({ name: row.artist, normalizedName: normalizeArabic(row.artist), slug: artistSlug }).onDuplicateKeyUpdate({ set: { name: row.artist, normalizedName: normalizeArabic(row.artist) } }); const artistRows = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, artistSlug)).limit(1); const artistId = artistRows[0]?.id; if (!artistId) continue; await db.insert(songs).values({ title: row.title, normalizedTitle: normalizeArabic(row.title), slug: songSlug, artistId, provider: row.provider ?? "demo", providerVideoId: row.providerVideoId, thumbnailUrl: row.thumbnailUrl, durationSeconds: row.durationSeconds, opaqueToken: createOpaqueToken(`${row.providerVideoId}:${songSlug}`), availabilityStatus: "available", rightsStatus: row.provider === "youtube" ? "metadata_only" : "demo" }).onDuplicateKeyUpdate({ set: { title: row.title, artistId } }); accepted += 1; } return { accepted, status: "persisted_demo" as const, message: `${accepted} ligne(s) enregistrée(s) en mode demo.` }; }),
  }),
});

export type AppRouter = typeof appRouter;
