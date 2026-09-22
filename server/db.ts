import { and, desc, eq, inArray, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { albums, artists, InsertUser, songs, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getSupabaseAdmin, hashOpaqueToken, mapSupabaseSong } from "./supabase";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } }
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) { values.role = user.role ?? "admin"; updateSet.role = values.role; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const songSelect = "id,title,normalized_title,slug,provider,provider_video_id,provider_url,opaque_token_hash,thumbnail_url,duration_seconds,status,created_at,artists(name,slug),albums(title)";

async function supabaseSongs(query?: string, limit = 12, includeRemoved = false) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  let request = supabase.from("songs").select(songSelect).order("created_at", { ascending: false }).limit(safeLimit);
  if (!includeRemoved) request = request.eq("status", "active");
  if (query?.trim()) {
    const term = query.trim().replace(/[%,()]/g, " ");
    request = request.or(`title.ilike.%${term}%,normalized_title.ilike.%${term}%,slug.ilike.%${term}%`);
  }
  const { data, error } = await request;
  if (error) { console.warn("[Supabase] songs query failed:", error.message); return []; }
  return (data ?? []).map(mapSupabaseSong);
}

export async function findSongsBySlugs(slugs: string[], limit = 20, includeRemoved = false) {
  const ordered = Array.from(new Set(slugs)).slice(0, Math.min(Math.max(limit, 1), 50));
  if (!ordered.length) return [];
  const supabase = getSupabaseAdmin();
  if (supabase) {
    let request = supabase.from("songs").select(songSelect).in("slug", ordered).limit(ordered.length);
    if (!includeRemoved) request = request.eq("status", "active");
    const { data, error } = await request;
    if (!error && data) {
      const rows = data.map(mapSupabaseSong);
      return ordered.flatMap(slug => rows.filter((row: { slug: string }) => row.slug === slug));
    }
    if (error) console.warn("[Supabase] keyword songs query failed:", error.message);
  }
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(songs).where(includeRemoved ? inArray(songs.slug, ordered) : and(inArray(songs.slug, ordered), eq(songs.availabilityStatus, "available")));
  return ordered.flatMap(slug => rows.filter(row => row.slug === slug));
}

export async function findSongs(query?: string, limit = 12, includeRemoved = false) {
  const supabaseResult = await supabaseSongs(query, limit, includeRemoved);
  if (supabaseResult) return supabaseResult;
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 50);
      if (!query?.trim()) return db.select().from(songs).orderBy(desc(songs.isFeatured), desc(songs.createdAt)).limit(safeLimit);
  const pattern = `%${query.trim()}%`;
  return db.select().from(songs).where(or(like(songs.title, pattern), like(songs.normalizedTitle, pattern), like(songs.slug, pattern))).orderBy(desc(songs.isFeatured), desc(songs.createdAt)).limit(safeLimit);
}

export async function findArtistBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: artist, error } = await supabase.from("artists").select("id,name,slug,image_url,created_at").eq("slug", slug).maybeSingle();
    if (!error && artist) {
      const { data: rows, error: songsError } = await supabase.from("songs").select(songSelect).eq("artist_id", artist.id).eq("status", "active").order("created_at", { ascending: false }).limit(100);
      if (!songsError) return {
        slug: artist.slug,
        name: artist.name,
        imageUrl: artist.image_url ?? null,
        songs: (rows ?? []).map(mapSupabaseSong),
      };
    }
    if (error) console.warn("[Supabase] artist lookup failed:", error.message);
  }
  const db = await getDb();
  if (!db) return undefined;
  const artistRows = await db.select().from(artists).where(eq(artists.slug, slug)).limit(1);
  const artist = artistRows[0];
  if (!artist) return undefined;
  const songRows = await db.select().from(songs).where(and(eq(songs.artistId, artist.id), eq(songs.availabilityStatus, "available"))).orderBy(desc(songs.createdAt)).limit(100);
  return { ...artist, songs: songRows };
}

export async function findAlbumBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data: album, error } = await supabase.from("albums").select("id,title,slug,image_url,created_at").eq("slug", slug).maybeSingle();
    if (!error && album) {
      const { data: rows, error: songsError } = await supabase.from("songs").select(songSelect).eq("album_id", album.id).eq("status", "active").order("created_at", { ascending: false }).limit(100);
      if (!songsError) return {
        id: album.id,
        title: album.title,
        slug: album.slug,
        imageUrl: album.image_url ?? null,
        songs: (rows ?? []).map(mapSupabaseSong),
      };
    }
    if (error) console.warn("[Supabase] album lookup failed:", error.message);
  }
  const db = await getDb();
  if (!db) return undefined;
  const albumRows = await db.select().from(albums).where(eq(albums.slug, slug)).limit(1);
  const album = albumRows[0];
  if (!album) return undefined;
  const songRows = await db.select().from(songs).where(and(eq(songs.albumId, album.id), eq(songs.availabilityStatus, "available"))).orderBy(desc(songs.createdAt)).limit(100);
  return { ...album, songs: songRows };
}

export async function updateDrizzleSongStatus(slug: string, status: "available" | "removed") {
  const db = await getDb();
  if (!db) return null;
  await db.update(songs).set({ availabilityStatus: status }).where(eq(songs.slug, slug));
  return { slug, status };
}

export async function findSongBySlug(slug: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("songs").select(songSelect).eq("slug", slug).eq("status", "active").maybeSingle();
    if (!error && data) return mapSupabaseSong(data);
    if (error) console.warn("[Supabase] slug lookup failed:", error.message);
  }
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(and(eq(songs.slug, slug), eq(songs.availabilityStatus, "available"))).limit(1);
  return result[0];
}

export async function findSongByToken(token: string) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("songs").select(songSelect).eq("opaque_token_hash", hashOpaqueToken(token)).eq("status", "active").maybeSingle();
    if (!error && data) return { ...mapSupabaseSong(data), opaqueToken: token };
    if (error) console.warn("[Supabase] token lookup failed:", error.message);
  }
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(and(eq(songs.opaqueToken, token), eq(songs.availabilityStatus, "available"))).limit(1);
  return result[0];
}

export async function listArtists(limit = 12) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("artists").select("id,name,slug,image_url,created_at").order("created_at", { ascending: false }).limit(Math.min(limit, 50));
    if (!error && data) return data.map((artist: any, index: number) => ({ id: index + 1, name: artist.name, normalizedName: artist.name, slug: artist.slug, imageUrl: artist.image_url ?? null, createdAt: new Date(artist.created_at), updatedAt: new Date(artist.created_at) }));
    if (error) console.warn("[Supabase] artists query failed:", error.message);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artists).orderBy(desc(artists.createdAt)).limit(Math.min(limit, 50));
}

export async function listAlbums(limit = 12) {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data, error } = await supabase.from("albums").select("id,title,slug,image_url,created_at").order("created_at", { ascending: false }).limit(Math.min(limit, 50));
    if (!error && data) return data;
    if (error) console.warn("[Supabase] albums query failed:", error.message);
  }
  const db = await getDb();
  if (!db) return [];
  return db.select().from(albums).orderBy(desc(albums.createdAt)).limit(Math.min(limit, 50));
}
