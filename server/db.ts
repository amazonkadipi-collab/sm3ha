import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { albums, artists, InsertUser, songs, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined || user.openId === ENV.ownerOpenId) {
    values.role = user.role ?? "admin";
    updateSet.role = values.role;
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function findSongs(query?: string, limit = 12) {
  const db = await getDb();
  if (!db) return [];
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  if (!query?.trim()) return db.select().from(songs).orderBy(desc(songs.isFeatured), desc(songs.createdAt)).limit(safeLimit);
  const pattern = `%${query.trim()}%`;
  return db.select().from(songs).where(or(like(songs.title, pattern), like(songs.normalizedTitle, pattern), like(songs.slug, pattern))).orderBy(desc(songs.isFeatured), desc(songs.createdAt)).limit(safeLimit);
}

export async function findSongBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(and(eq(songs.slug, slug), eq(songs.availabilityStatus, "available"))).limit(1);
  return result[0];
}

export async function findSongByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(songs).where(and(eq(songs.opaqueToken, token), eq(songs.availabilityStatus, "available"))).limit(1);
  return result[0];
}

export async function listArtists(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artists).orderBy(desc(artists.createdAt)).limit(Math.min(limit, 50));
}

export async function listAlbums(limit = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(albums).orderBy(desc(albums.createdAt)).limit(Math.min(limit, 50));
}
