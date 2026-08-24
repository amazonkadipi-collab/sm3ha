import { createHash, randomBytes } from "node:crypto";

export type CatalogSong = {
  id: number;
  title: string;
  artist: string;
  artistSlug: string;
  album: string;
  slug: string;
  providerVideoId: string;
  opaqueToken: string;
  thumbnailUrl: string;
  durationSeconds: number;
  isFeatured?: boolean;
  rightsStatus: "demo" | "licensed" | "metadata_only";
  availabilityStatus?: "available" | "removed";
};

export const demoSongs: CatalogSong[] = [
  { id: 1, title: "ليلة هادئة", artist: "نورا الورد", artistSlug: "nورا-الورد", album: "أحلام صغيرة", slug: "layla-hadia", providerVideoId: "demo-layla", opaqueToken: "d_8f2c1a0e4b7d9c32", thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80", durationSeconds: 214, isFeatured: true, rightsStatus: "demo" },
  { id: 2, title: "بين الغيم", artist: "سليم ناصر", artistSlug: "salim-nasser", album: "مدى", slug: "bayn-al-ghaym", providerVideoId: "demo-cloud", opaqueToken: "d_74a91cbe0f5e2138", thumbnailUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=800&q=80", durationSeconds: 188, rightsStatus: "demo" },
  { id: 3, title: "أثر الورد", artist: "ليان صبري", artistSlug: "layan-sabri", album: "مسافة ضوء", slug: "athar-al-ward", providerVideoId: "demo-rose", opaqueToken: "d_1ca48b0e75f3d962", thumbnailUrl: "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=800&q=80", durationSeconds: 242, isFeatured: true, rightsStatus: "demo" },
  { id: 4, title: "على مهل", artist: "يوسف مراد", artistSlug: "youssef-mourad", album: "تأمل", slug: "ala-mahal", providerVideoId: "demo-slowly", opaqueToken: "d_3b7e94f1c20a6d88", thumbnailUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80", durationSeconds: 201, rightsStatus: "demo" },
  { id: 5, title: "صوت المدينة", artist: "رنا حبيب", artistSlug: "rana-habib", album: "شوارع بعيدة", slug: "sawt-al-madina", providerVideoId: "demo-city", opaqueToken: "d_9d4e28a6b3c1057f", thumbnailUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80", durationSeconds: 176, isFeatured: true, rightsStatus: "demo" },
  { id: 6, title: "موجة خفيفة", artist: "آدم ربيع", artistSlug: "adam-rabie", album: "تنفس", slug: "mawja-khafifa", providerVideoId: "demo-wave", opaqueToken: "d_52fc9a1e8b406d73", thumbnailUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80", durationSeconds: 229, rightsStatus: "demo" },
];

export function normalizeArabic(value: string) {
  return value.toLocaleLowerCase("ar").normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").trim();
}

export function makeSlug(value: string) {
  return normalizeArabic(value).replace(/[^a-zA-Z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "") || "song";
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

export function searchDemoSongs(query: string) {
  const normalized = normalizeArabic(query);
  if (!normalized) return demoSongs;
  return demoSongs.filter(song => [song.title, song.artist, song.album].some(value => normalizeArabic(value).includes(normalized)));
}
