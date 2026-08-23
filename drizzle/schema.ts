import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const artists = mysqlTable("artists", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({ nameIdx: index("artists_normalized_name_idx").on(table.normalizedName) }));

export const albums = mysqlTable("albums", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  normalizedTitle: varchar("normalizedTitle", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  artistId: int("artistId"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const songs = mysqlTable("songs", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  normalizedTitle: varchar("normalizedTitle", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  artistId: int("artistId"),
  albumId: int("albumId"),
  provider: varchar("provider", { length: 64 }).notNull().default("demo"),
  providerVideoId: varchar("providerVideoId", { length: 64 }).notNull(),
  providerUrl: text("providerUrl"),
  opaqueToken: varchar("opaqueToken", { length: 128 }).notNull().unique(),
  thumbnailUrl: text("thumbnailUrl"),
  durationSeconds: int("durationSeconds"),
  availabilityStatus: mysqlEnum("availabilityStatus", ["available", "pending", "unavailable", "removed"]).default("available").notNull(),
  rightsStatus: mysqlEnum("rightsStatus", ["demo", "licensed", "metadata_only", "removed"]).default("demo").notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  titleIdx: index("songs_normalized_title_idx").on(table.normalizedTitle),
  providerIdx: uniqueIndex("songs_provider_video_idx").on(table.provider, table.providerVideoId),
}));

export const mediaVariants = mysqlTable("mediaVariants", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId").notNull(),
  format: mysqlEnum("format", ["mp3", "mp4"]).notNull(),
  quality: varchar("quality", { length: 32 }).notNull(),
  sizeBytes: int("sizeBytes"),
  storageKey: text("storageKey"),
  status: mysqlEnum("status", ["ready", "processing", "unavailable"]).default("unavailable").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const conversionJobs = mysqlTable("conversionJobs", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId").notNull(),
  format: mysqlEnum("format", ["mp3", "mp4"]).notNull(),
  quality: varchar("quality", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "ready", "failed", "expired", "cancelled"]).default("queued").notNull(),
  progress: int("progress").default(0).notNull(),
  errorMessage: text("errorMessage"),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"),
});

export const searchLogs = mysqlTable("searchLogs", {
  id: int("id").autoincrement().primaryKey(),
  query: varchar("query", { length: 255 }).notNull(),
  songId: int("songId"),
  hashedIp: varchar("hashedIp", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const takedownRequests = mysqlTable("takedownRequests", {
  id: int("id").autoincrement().primaryKey(),
  songId: int("songId"),
  claimantName: varchar("claimantName", { length: 255 }).notNull(),
  claimantEmail: varchar("claimantEmail", { length: 320 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["open", "reviewing", "resolved", "rejected"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Song = typeof songs.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type ConversionJob = typeof conversionJobs.$inferSelect;
