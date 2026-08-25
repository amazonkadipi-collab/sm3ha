const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

 type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string }; high?: { url?: string } } };
  }>;
  nextPageToken?: string;
  error?: { message?: string; errors?: Array<{ reason?: string }> };
};

type YouTubeVideosResponse = {
  items?: Array<{ id?: string; contentDetails?: { duration?: string } }>;
  error?: { message?: string; errors?: Array<{ reason?: string }> };
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

export function isYouTubeQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /quotaExceeded|dailyLimitExceeded|rateLimitExceeded|userRateLimitExceeded|quota/i.test(message);
}

function requireApiKeys() {
  const keys = [process.env.YOUTUBE_API_KEY, process.env.YOUTUBE_API_KEY_2, process.env.YOUTUBE_API_KEY_3].filter((key): key is string => Boolean(key));
  if (!keys.length) throw new Error("YouTube API is not configured");
  return keys;
}

async function youtubeGet<T>(resource: string, params: Record<string, string>, apiKey: string) {
  const query = new URLSearchParams({ ...params, key: apiKey });
  const response = await fetch(`${YOUTUBE_API}/${resource}?${query}`);
  const body = await response.json() as T & { error?: { message?: string; errors?: Array<{ reason?: string }> } };
  if (!response.ok) {
    const reason = body.error?.errors?.[0]?.reason;
    throw new Error(`${reason ? `${reason}: ` : ""}${body.error?.message || `YouTube API request failed (${response.status})`}`);
  }
  return body;
}

async function searchWithKey(query: string, limit: number, apiKey: string): Promise<YouTubeCatalogItem[]> {
  const search = await youtubeGet<YouTubeSearchResponse>("search", {
    part: "snippet",
    q: query.trim(),
    type: "video",
    maxResults: String(Math.min(Math.max(limit, 1), 25)),
    safeSearch: "moderate",
  }, apiKey);
  const candidates = (search.items ?? [])
    .map(item => ({ id: item.id?.videoId ?? "", title: item.snippet?.title ?? "", artist: item.snippet?.channelTitle ?? "", thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "" }))
    .filter(item => item.id && item.title);
  if (!candidates.length) return [];

  const details = await youtubeGet<YouTubeVideosResponse>("videos", {
    part: "contentDetails",
    id: candidates.map(item => item.id).join(","),
  }, apiKey);
  const durations = new Map((details.items ?? []).map(item => [item.id ?? "", parseYouTubeDuration(item.contentDetails?.duration ?? "")]));
  return candidates.map(item => ({ providerVideoId: item.id, title: item.title, artist: item.artist, thumbnailUrl: item.thumbnailUrl, durationSeconds: durations.get(item.id) ?? 0, provider: "youtube" as const }));
}

export async function searchYouTubeVideos(query: string, limit = 10): Promise<YouTubeCatalogItem[]> {
  let lastError: unknown;
  for (const apiKey of requireApiKeys()) {
    try {
      return await searchWithKey(query, limit, apiKey);
    } catch (error) {
      lastError = error;
      if (!isYouTubeQuotaError(error)) throw error;
      console.warn("[YouTube] API quota reached; trying the next authorized project key.");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All configured YouTube API projects are unavailable");
}
