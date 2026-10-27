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

const SEARCH_ACTION_WORDS = new Set(["تحميل", "تنزيل", "download", "mp3", "mp4"]);
const SEARCH_CATEGORY_WORDS = new Set(["اغاني", "اغنيه", "موسيقى", "music", "songs", "song"]);

/** Normalize v1-style search phrases without discarding a generic music-only query. */
export function normalizeSearchQuery(value: string) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const withoutActions = words.filter(word => !SEARCH_ACTION_WORDS.has(normalizeArabic(word)));
  const meaningful = withoutActions.filter(word => !SEARCH_CATEGORY_WORDS.has(normalizeArabic(word)));
  return (meaningful.length ? meaningful : withoutActions).join(" ").trim() || value.trim();
}

const SEARCH_RELEVANCE_GENERIC_TERMS = new Set(["تحميل", "تنزيل", "download", "mp3", "mp4", "اغاني", "اغنيه", "موسيقي", "موسيقى", "music", "songs", "song"]);

export function isRelevantSearchResult(query: string, title: string, artist = "", slug = "") {
  const meaningfulTokens = Array.from(new Set(
    normalizeArabic(normalizeSearchQuery(query))
      .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, " ")
      .split(/\s+/)
      .filter(token => token.length >= 2 && !SEARCH_RELEVANCE_GENERIC_TERMS.has(token))
  ));
  // Generic/category searches should stay broad. For multi-word named queries,
  // require each meaningful word to occur in the actual result metadata.
  if (meaningfulTokens.length <= 1) return true;
  const searchableWords = new Set(
    normalizeArabic([title, artist, slug].filter(Boolean).join(" "))
      .replace(/[^a-z0-9\u0600-\u06FF\s]/gi, " ")
      .split(/\s+/)
      .filter(Boolean)
  );
  return meaningfulTokens.every(token => searchableWords.has(token));
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
    /\bmy\s+(white|babysitter)\b/, /\bhorror\s+movies?\b/, /\bthe\s+last\s+don\b/,
    /(?:^|\s)(?:فيلم|افلام|أفلام|مسلسل|مسلسلات|حلقة|الحلقه|بودكاست|دروس|كورس|ديناصورات|حيوانات|مباراة|مباريات|تمثيلية|تمثيليه|سهرات|اذاعة|إذاعة)(?:\s|$)/,
    /(?:شرح|طريقة|طريقه|كيفية|كيفيه|برنامج)\s+(?:تحميل|تنزيل|تحويل)\s+(?:أ?غاني|أ?غنيه|الأغاني|الاغاني|فيديو|فيديوهات|الموسيقى|موسيقي|mp3)/i,
    /(?:تحميل|تنزيل)\s+(?:أ?غاني|أ?غنيه|الأغاني|الاغاني)\s+(?:من\s+)?(?:برنامج|جوجل|كروم|متصفح|اليوتيوب)/i,
    /\bhow\s+to\s+(?:download|convert|listen\s+to)\b/i,
    /\b(?:mp3|music|song|video)\s+(?:downloader|converter|download\s+app)\b/i
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
