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
  items?: Array<{
    id?: string;
    contentDetails?: { duration?: string };
    status?: { embeddable?: boolean; privacyStatus?: string };
  }>;
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  let response: Response;
  try {
    response = await fetch(`${YOUTUBE_API}/${resource}?${query}`, { signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("YouTube API request timed out");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

  // Return search candidates immediately. Duration enrichment used to require a second
  // YouTube API request, which made every new keyword wait for two upstream calls.
  // Duration is optional metadata; 0 is rendered as a lightweight placeholder.
  return candidates.map(item => ({
    providerVideoId: item.id,
    title: item.title,
    artist: item.artist,
    thumbnailUrl: item.thumbnailUrl,
    durationSeconds: 0,
    provider: "youtube" as const,
  }));
}

export async function searchYouTubeVideos(query: string, limit = 10): Promise<YouTubeCatalogItem[]> {
  let lastError: unknown;
  for (const apiKey of requireApiKeys()) {
    try {
      return await searchWithKey(query, limit, apiKey);
    } catch (error) {
      lastError = error;
      // Do not multiply a timeout/transient failure across every key.\n      if (!isYouTubeQuotaError(error)) throw error;
      console.warn("[YouTube] API quota reached; trying the next authorized project key.");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All configured YouTube API projects are unavailable");
}


export type YouTubeEmbedStatus = {
  videoId: string;
  embeddable: boolean | null;
  privacyStatus: string | null;
};

export async function getYouTubeEmbedStatus(videoId: string): Promise<YouTubeEmbedStatus> {
  const id = videoId.trim();
  if (!id) throw new Error("YouTube video ID is required");
  let lastError: unknown;
  for (const apiKey of requireApiKeys()) {
    try {
      const response = await youtubeGet<YouTubeVideosResponse>("videos", {
        part: "status",
        id,
      }, apiKey);
      const item = response.items?.[0];
      if (!item) return { videoId: id, embeddable: false, privacyStatus: "missing" };
      return {
        videoId: id,
        embeddable: item.status?.embeddable === true,
        privacyStatus: item.status?.privacyStatus ?? null,
      };
    } catch (error) {
      lastError = error;
      if (!isYouTubeQuotaError(error)) throw error;
      console.warn("[YouTube] API quota reached while checking embed status; trying the next authorized project key.");
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All configured YouTube API projects are unavailable");
}
