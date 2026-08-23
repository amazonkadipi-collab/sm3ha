import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createOpaqueToken, demoSongs, formatDuration, makeSlug, normalizeArabic, searchDemoSongs } from "./catalog";
import { createDemoDownloadToken } from "./download";
import { findSongBySlug, findSongByToken, findSongs, getDb } from "./db";
import { artists, songs } from "../drizzle/schema";

const paginationInput = z.object({ query: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(50).default(12) });

const demoResult = (song: typeof demoSongs[number]) => ({ ...song, duration: formatDuration(song.durationSeconds), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` });

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next();
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    search: publicProcedure.input(paginationInput).query(async ({ input }) => {
      const databaseSongs = await findSongs(input.query, input.limit);
      if (databaseSongs.length) return databaseSongs.map(song => ({ ...song, artist: "", album: "", duration: formatDuration(song.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(song.opaqueToken)}` }));
      return searchDemoSongs(input.query ?? "").slice(0, input.limit).map(demoResult);
    }),
    trending: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(20).default(6) })).query(async ({ input }) => demoSongs.slice(0, input.limit).map(demoResult)),
    artists: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(20).default(12) })).query(({ input }) => Array.from(new Map(demoSongs.map(song => [song.artistSlug, { slug: song.artistSlug, name: song.artist, imageUrl: song.thumbnailUrl, songCount: demoSongs.filter(item => item.artistSlug === song.artistSlug).length }])).values()).slice(0, input.limit)),
    artistBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(255) })).query(({ input }) => { const songs = demoSongs.filter(song => song.artistSlug === input.slug); if (!songs.length) throw new TRPCError({ code: "NOT_FOUND", message: "Artist not found" }); return { slug: input.slug, name: songs[0].artist, imageUrl: songs[0].thumbnailUrl, songs: songs.map(demoResult) }; }),
    songBySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(255) })).query(async ({ input }) => {
      const dbSong = await findSongBySlug(input.slug);
      if (dbSong) return { ...dbSong, artist: "", album: "", duration: formatDuration(dbSong.durationSeconds ?? 0), mediaUrl: `/media?d=${encodeURIComponent(dbSong.opaqueToken)}` };
      const song = demoSongs.find(item => item.slug === input.slug);
      if (!song) throw new TRPCError({ code: "NOT_FOUND", message: "Song not found" });
      return demoResult(song);
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
  admin: router({
    previewImport: adminProcedure.input(z.object({ rows: z.array(z.object({ title: z.string().min(1), artist: z.string().min(1), providerVideoId: z.string().min(1) })).max(1000) })).mutation(({ input }) => {
      const seen = new Set<string>();
      const rows = input.rows.map(row => { const duplicate = seen.has(row.providerVideoId); seen.add(row.providerVideoId); return { ...row, slug: makeSlug(`${row.artist}-${row.title}`), normalizedTitle: normalizeArabic(row.title), duplicate }; });
      return { rows, total: rows.length, duplicates: rows.filter(row => row.duplicate).length };
    }),
    commitImport: adminProcedure.input(z.object({ rows: z.array(z.object({ title: z.string().min(1), artist: z.string().min(1), providerVideoId: z.string().min(1) })).max(1000) })).mutation(async ({ input }) => { const db = await getDb(); if (!db) return { accepted: 0, status: "database_unavailable" as const, message: "Database unavailable; no rows were written." }; let accepted = 0; for (const row of input.rows) { const artistSlug = makeSlug(row.artist); const songSlug = makeSlug(`${row.artist}-${row.title}`); await db.insert(artists).values({ name: row.artist, normalizedName: normalizeArabic(row.artist), slug: artistSlug }).onDuplicateKeyUpdate({ set: { name: row.artist, normalizedName: normalizeArabic(row.artist) } }); const artistRows = await db.select({ id: artists.id }).from(artists).where(eq(artists.slug, artistSlug)).limit(1); const artistId = artistRows[0]?.id; if (!artistId) continue; await db.insert(songs).values({ title: row.title, normalizedTitle: normalizeArabic(row.title), slug: songSlug, artistId, provider: "demo", providerVideoId: row.providerVideoId, opaqueToken: createOpaqueToken(`${row.providerVideoId}:${songSlug}`), availabilityStatus: "available", rightsStatus: "demo" }).onDuplicateKeyUpdate({ set: { title: row.title, artistId } }); accepted += 1; } return { accepted, status: "persisted_demo" as const, message: `${accepted} ligne(s) enregistrée(s) en mode demo.` }; }),
  }),
});

export type AppRouter = typeof appRouter;
