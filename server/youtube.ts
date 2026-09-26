import { isLikelyMusicTitle } from "./catalog";\n\nconst YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

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
  const resultLimit = Math.min(Math.max(limit, 1), 25);
  const search = await youtubeGet<YouTubeSearchResponse>("search", {
    part: "snippet",
    q: query.trim(),
    type: "video",
    videoCategoryId: "10",
    maxResults: String(resultLimit),
    safeSearch: "moderate",
  }, apiKey);

  const candidates = (search.items ?? [])
    .map(item => ({
      id: item.id?.videoId ?? "",
      title: item.snippet?.title ?? "",
      artist: item.snippet?.channelTitle ?? "",
      thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
    }))
    .filter(item => item.id && item.title && isLikelyMusicTitle(item.title, item.artist));

  if (!candidates.length) return [];

  // YouTube search.list does not include video duration. Fetch the durations for
  // all returned IDs in one videos.list request so the UI gets the real duration
  // without making one request per result.
  const details = await youtubeGet<YouTubeVideosResponse>("videos", {
    part: "contentDetails",
    id: candidates.map(item => item.id).join(","),
  }, apiKey);

  const durations = new Map(
    (details.items ?? [])
      .filter(item => item.id)
      .map(item => [item.id as string, parseYouTubeDuration(item.contentDetails?.duration ?? "")]),
  );

  return candidates.map(item => ({
    providerVideoId: item.id,
    title: item.title,
    artist: item.artist,
    thumbnailUrl: item.thumbnailUrl,
    durationSeconds: durations.get(item.id) ?? 0,
    provider: "youtube" as const,
  }));
}

export async function getYouTubeDurations(videoIds: string[]): Promise<Map<string, number>> {
  const ids = Array.from(new Set(videoIds.map(id => id.trim()).filter(Boolean))).slice(0, 50);
  const durations = new Map<string, number>();
  if (!ids.length) return durations;
  let lastError: unknown;
  for (const apiKey of requireApiKeys()) {
    try {
      const details = await youtubeGet<YouTubeVideosResponse>("videos", {
        part: "contentDetails",
        id: ids.join(","),
      }, apiKey);
      for (const item of details.items ?? []) {
        if (item.id) durations.set(item.id, parseYouTubeDuration(item.contentDetails?.duration ?? ""));
      }
      return durations;
    } catch (error) {
      lastError = error;
      if (!isYouTubeQuotaError(error)) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("All configured YouTube API projects are unavailable");
}

export async function searchYouTubeVideos(query: string, limit = 10): Promise<YouTubeCatalogItem[]> {
  let lastError: unknown;
  for (const apiKey of requireApiKeys()) {
    try {
      return await searchWithKey(query, limit, apiKey);
    } catch (error) {
      lastError = error;
      // Do not multiply a timeout/transient failure across every key.
      if (!isYouTubeQuotaError(error)) throw error;
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
