import { ENV } from "./_core/env";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string }; high?: { url?: string } } };
  }>;
  nextPageToken?: string;
  error?: { message?: string };
};

type YouTubeVideosResponse = {
  items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
  error?: { message?: string };
};

export type YouTubeCatalogItem = {
  providerVideoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSeconds: number;
  provider: "youtube";
};

export function parseYouTubeDuration(value: string): number {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

function requireApiKey() {
  if (!ENV.youtubeApiKey) throw new Error("YouTube API is not configured");
  return ENV.youtubeApiKey;
}

async function youtubeGet<T>(resource: string, params: Record<string, string>) {
  const query = new URLSearchParams({ ...params, key: requireApiKey() });
  const response = await fetch(`${YOUTUBE_API}/${resource}?${query}`);
  const body = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || `YouTube API request failed (${response.status})`);
  return body;
}

export async function searchYouTubeVideos(query: string, limit = 10): Promise<YouTubeCatalogItem[]> {
  const search = await youtubeGet<YouTubeSearchResponse>("search", {
    part: "snippet",
    q: query.trim(),
    type: "video",
    maxResults: String(Math.min(Math.max(limit, 1), 25)),
    safeSearch: "moderate",
  });
  const candidates = (search.items ?? [])
    .map(item => ({ id: item.id?.videoId ?? "", title: item.snippet?.title ?? "", artist: item.snippet?.channelTitle ?? "", thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "" }))
    .filter(item => item.id && item.title);
  if (!candidates.length) return [];

  const details = await youtubeGet<YouTubeVideosResponse>("videos", {
    part: "contentDetails",
    id: candidates.map(item => item.id).join(","),
  });
  const durations = new Map((details.items ?? []).map(item => [item.id ?? "", parseYouTubeDuration(item.contentDetails?.duration ?? "")]));
  return candidates.map(item => ({ providerVideoId: item.id, title: item.title, artist: item.artist, thumbnailUrl: item.thumbnailUrl, durationSeconds: durations.get(item.id) ?? 0, provider: "youtube" as const }));
}
