const LEGACY_HOST = "youtube-to-mp4-mp3.p.rapidapi.com";
const DEFAULT_HOST = "youtube-mp3-audio-video-downloader.p.rapidapi.com";
const CONFIGURED_HOST = process.env.RAPIDAPI_HOST?.trim();
const RAPIDAPI_HOST = CONFIGURED_HOST && CONFIGURED_HOST !== LEGACY_HOST ? CONFIGURED_HOST : DEFAULT_HOST;
const RAPIDAPI_BASE = `https://${RAPIDAPI_HOST}`;

export type RapidMediaLink = {
  url: string;
  format: "mp3" | "mp4";
  quality: string;
  bitrate?: number;
  size?: number;
};

export type RapidYouTubeInfo = {
  videoId: string;
  url: string;
  title: string;
  thumbnail: string;
  durationSeconds: number;
  audio: RapidMediaLink[];
  video: RapidMediaLink[];
};

export class MediaProviderError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: "NOT_CONFIGURED" | "NOT_SUBSCRIBED" | "UPSTREAM" | "TIMEOUT",
  ) {
    super(message);
    this.name = "MediaProviderError";
  }
}

function requireKey() {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) throw new MediaProviderError("Download provider is not configured.", 503, "NOT_CONFIGURED");
  return key;
}

function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function flatten(value: unknown, out: unknown[] = []) {
  if (Array.isArray(value)) for (const item of value) flatten(item, out);
  else if (value && typeof value === "object") {
    out.push(value);
    for (const item of Object.values(value as Record<string, unknown>)) flatten(item, out);
  }
  return out;
}

function firstString(payload: unknown, keys: string[]) {
  for (const node of flatten(payload)) {
    for (const key of keys) {
      const value = (node as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
}

function firstNumber(payload: unknown, keys: string[]) {
  for (const node of flatten(payload)) {
    for (const key of keys) {
      const value = (node as Record<string, unknown>)[key];
      const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
      if (Number.isFinite(number) && number >= 0) return number;
    }
  }
  return 0;
}

async function request(path: string, init: RequestInit = {}) {
  const key = requireKey();
  try {
    return await fetch(`${RAPIDAPI_BASE}${path}`, {
      ...init,
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": RAPIDAPI_HOST,
        accept: "*/*",
        ...(init.headers ?? {}),
      },
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new MediaProviderError("The media provider timed out. Please try again.", 504, "TIMEOUT");
    }
    throw error;
  }
}

async function jsonRequest(path: string) {
  const response = await request(path, { headers: { accept: "application/json" } });
  const text = await response.text();
  let payload: unknown;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
  if (!response.ok) {
    const rawMessage = firstString(payload, ["message", "error", "detail"]);
    if (response.status === 401 || response.status === 403 || /not subscribed|subscription required|not authorized/i.test(rawMessage)) {
      throw new MediaProviderError(
        "The configured media provider is not subscribed or authorized for this operation.",
        503,
        "NOT_SUBSCRIBED",
      );
    }
    throw new MediaProviderError(rawMessage || `Media provider returned ${response.status}`, 502, "UPSTREAM");
  }
  return payload;
}

export function normalizeVideoId(value: string) {
  const input = value.trim();
  if (/^[A-Za-z0-9_-]{6,32}$/.test(input)) return input;
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      return parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).pop() || "";
    }
  } catch {
    return "";
  }
  return "";
}

function thumbnailFromInfo(payload: unknown) {
  for (const node of flatten(payload)) {
    const thumbnail = (node as Record<string, unknown>).thumbnail;
    if (typeof thumbnail === "string" && isHttpUrl(thumbnail)) return thumbnail;
    if (Array.isArray(thumbnail)) {
      for (const item of thumbnail) {
        const url = firstString(item, ["url"]);
        if (isHttpUrl(url)) return url;
      }
    }
  }
  return "";
}

export async function getRapidYouTubeInfo(videoId: string): Promise<RapidYouTubeInfo> {
  const id = normalizeVideoId(videoId);
  if (!id) throw new MediaProviderError("Invalid YouTube video ID.", 400, "UPSTREAM");

  const payload = await jsonRequest(`/get-video-info/${encodeURIComponent(id)}`);
  const title = firstString(payload, ["title", "name"]) || `YouTube ${id}`;
  const durationSeconds = firstNumber(payload, ["lengthSeconds", "duration", "durationSeconds", "duration_seconds"]);
  const thumbnail = thumbnailFromInfo(payload) || `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;

  return {
    videoId: id,
    url: youtubeUrl(id),
    title,
    thumbnail,
    durationSeconds,
    audio: [
      { url: `/api/youtube/download?provider=rapidapi&v=${encodeURIComponent(id)}&format=mp3&quality=low`, format: "mp3", quality: "low" },
      { url: `/api/youtube/download?provider=rapidapi&v=${encodeURIComponent(id)}&format=mp3&quality=mid`, format: "mp3", quality: "mid" },
      { url: `/api/youtube/download?provider=rapidapi&v=${encodeURIComponent(id)}&format=mp3&quality=high`, format: "mp3", quality: "high" },
    ],
    video: [
      { url: `/api/youtube/download?provider=rapidapi&v=${encodeURIComponent(id)}&format=mp4&quality=best`, format: "mp4", quality: "best" },
    ],
  };
}

function mp3Quality(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "low" || normalized === "mid" || normalized === "high") return normalized;
  if (/^\d+$/.test(normalized)) {
    const n = Number(normalized);
    if (n <= 96) return "low";
    if (n <= 192) return "mid";
    return "high";
  }
  return "high";
}

export async function streamRapidYouTubeDownload(videoId: string, format: "mp3" | "mp4", requestedQuality: string) {
  const id = normalizeVideoId(videoId);
  if (!id) throw new MediaProviderError("Invalid YouTube video ID.", 400, "UPSTREAM");
  const path = format === "mp3"
    ? `/download-mp3/${encodeURIComponent(id)}?quality=${encodeURIComponent(mp3Quality(requestedQuality))}`
    : `/download-mp4/${encodeURIComponent(id)}`;
  const response = await request(path, { headers: { accept: "*/*" } });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 401 || response.status === 403 || /not subscribed|subscription required|not authorized/i.test(text)) {
      throw new MediaProviderError(
        "The configured media provider is not subscribed or authorized for downloads.",
        503,
        "NOT_SUBSCRIBED",
      );
    }
    throw new MediaProviderError(text || `Media provider returned ${response.status}`, 502, "UPSTREAM");
  }
  if (!response.body) throw new MediaProviderError("Media provider returned an empty stream.", 502, "UPSTREAM");
  return response;
}
