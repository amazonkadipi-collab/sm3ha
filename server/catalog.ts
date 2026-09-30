import { createHash, randomBytes } from "node:crypto";

export type CatalogSong = {
  id: number;
  title: string;
  artist: string;
  artistSlug: string;
  album: string;
  slug: string;
  providerVideoId: string;
  providerUrl?: string;
  opaqueToken: string;
  thumbnailUrl: string;
  durationSeconds: number;
  isFeatured?: boolean;
  rightsStatus: "licensed" | "metadata_only" | "removed";
  availabilityStatus?: "available" | "removed";
};

export function normalizeArabic(value: string) {
  return value.toLocaleLowerCase("ar").normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
}

export function makeSlug(value: string) {
  return normalizeArabic(value).replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "") || "song";
}

export function isLikelyMusicTitle(title: string, artist = "") {
  const value = `${title} ${artist}`.toLocaleLowerCase("en");
  const blocked = [
    /\bfull\s*(movie|film)\b/, /\b(movie|film)\s*full\b/, /\btrailer\b/, /\bteaser\b/,
    /\bepisode\b/, /\bep\s*\d+\b/, /\bpart\s*[1-9]\b/, /\bseason\s*\d+\b/,
    /\bseries\b/, /\bdocumentary\b/, /\bshort\s*film\b/, /\bweb\s*series\b/,
    /\bmovie\s*202\d\b/, /\bfilm\s*202\d\b/, /\bmafia\s*movie\b/,
    /\bmy\s+(white|babysitter)\b/, /\bhorror\s+movies?\b/, /\bthe\s+last\s+don\b/
  ];
  return !blocked.some(pattern => pattern.test(value));
}

export function createOpaqueToken(seed?: string) {
  if (seed) return `d_${createHash("sha256").update(seed).digest("hex").slice(0, 16)}`;
  return `d_${randomBytes(16).toString("hex")}`;
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}
