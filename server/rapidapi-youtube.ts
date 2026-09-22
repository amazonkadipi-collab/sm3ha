const RAPIDAPI_HOST = "youtube-to-mp4-mp3.p.rapidapi.com";
const RAPIDAPI_BASES = [
  `https://${RAPIDAPI_HOST}/api`,
  `https://${RAPIDAPI_HOST}`,
];

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

function requireKey() {
  const key = process.env.RAPIDAPI_KEY?.trim();
  if (!key) throw new Error("RAPIDAPI_KEY is not configured");
  return key;
}

function youtubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

function flatten(value: unknown, out: unknown[] = []) {
  if (Array.isArray(value)) {
    for (const item of value) flatten(item, out);
  } else if (value && typeof value === "object") {
    out.push(value);
    for (const item of Object.values(value as Record<string, unknown>)) flatten(item, out);
  }
  return out;
}

function allUrls(payload: unknown) {
  const urls: string[] = [];
  for (const node of flatten(payload)) {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if ((key.toLowerCase().includes("url") || key.toLowerCase() === "file" || key.toLowerCase() === "link") && isHttpUrl(value)) urls.push(value);
    }
  }
  return Array.from(new Set(urls));
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

function qualityOf(node: Record<string, unknown>, format: "mp3" | "mp4") {
  const raw = [node.quality, node.qualityLabel, node.resolution, node.height, node.bitrate, node.audioQuality]
    .find(value => value !== undefined && value !== null);
  if (raw === undefined) return format === "mp3" ? "Audio" : "Video";
  if (typeof raw === "number") return format === "mp3" ? `${Math.round(raw)} kbps` : `${Math.round(raw)}p`;
  const text = String(raw).replace(/_/g, " ").trim();
  const kbps = text.match(/(\d{2,4})\s*kbps/i);
  if (kbps) return `${kbps[1]} kbps`;
  const pixels = text.match(/(144|240|360|480|720|1080|1440|2160)p?/i);
  if (pixels && format === "mp4") return `${pixels[1]}p`;
  return text;
}

function linksFromPayload(payload: unknown, format: "mp3" | "mp4"): RapidMediaLink[] {
  const result: RapidMediaLink[] = [];
  for (const node of flatten(payload)) {
    const object = node as Record<string, unknown>;
    const url = ["url", "downloadUrl", "download_url", "file", "link", "src"]
      .map(key => object[key]).find(isHttpUrl);
    if (!url) continue;
    if (/youtube\.com|youtu\.be/i.test(url)) continue;
    const text = `${object.extension ?? ""} ${object.mime ?? ""} ${object.type ?? ""} ${object.format ?? ""} ${object.quality ?? ""} ${object.qualityLabel ?? ""}`.toLowerCase();
    const looksLikeAudio = /mp3|m4a|audio/.test(text);
    const looksLikeVideo = /mp4|video/.test(text);
    if (format === "mp3" && looksLikeVideo && !looksLikeAudio) continue;
    if (format === "mp4" && looksLikeAudio && !looksLikeVideo) continue;
    const bitrate = Number(object.bitrate);
    const size = Number(object.contentLength ?? object.size ?? object.filesize);
    result.push({
      url,
      format,
      quality: qualityOf(object, format),
      ...(Number.isFinite(bitrate) && bitrate > 0 ? { bitrate } : {}),
      ...(Number.isFinite(size) && size > 0 ? { size } : {}),
    });
  }
  return Array.from(new Map(result.map(item => [item.url, item])).values());
}

async function call(path: string, url: string) {
  const key = requireKey();
  let lastError = "";

  for (const base of RAPIDAPI_BASES) {
    const response = await fetch(`${base}${path}?url=${encodeURIComponent(url)}`, {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": RAPIDAPI_HOST,
        accept: "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });
    const text = await response.text();
    let payload: unknown;
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (response.ok) return payload;

    const message = firstString(payload, ["message", "error", "detail"]) || `RapidAPI returned ${response.status}`;
    lastError = message;

    // The provider currently reports '/api/video-info' as a missing endpoint on
    // some deployments even though the marketplace documentation shows /api.
    // Retry the same endpoint against the host root before failing.
    if (response.status === 404 || /endpoint.*does not exist/i.test(message)) continue;
    throw new Error(message);
  }

  throw new Error(lastError || "RapidAPI endpoint unavailable");
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

export async function getRapidYouTubeInfo(videoId: string): Promise<RapidYouTubeInfo> {
  const id = normalizeVideoId(videoId);
  if (!id) throw new Error("Invalid YouTube video ID");
  const url = youtubeUrl(id);

  // Metadata endpoints are independent. A thumbnail failure must not prevent
  // the video/audio result from loading.
  const [videoResult, audioResult, thumbnailResult] = await Promise.allSettled([
    call("/video-info", url),
    call("/audio-info", url),
    call("/thumbnails", url),
  ]);

  if (videoResult.status === "rejected" && audioResult.status === "rejected") {
    throw new Error(videoResult.reason instanceof Error ? videoResult.reason.message : "RapidAPI could not retrieve the video");
  }

  const videoPayload = videoResult.status === "fulfilled" ? videoResult.value : {};
  const audioPayload = audioResult.status === "fulfilled" ? audioResult.value : {};
  const thumbnailPayload = thumbnailResult.status === "fulfilled" ? thumbnailResult.value : {};
  const thumbnails = allUrls(thumbnailPayload).filter(item => /ytimg|youtube/i.test(item));
  const title = firstString(videoPayload, ["title", "name"]) || firstString(audioPayload, ["title", "name"]);
  const durationSeconds = firstNumber(videoPayload, ["duration", "durationSeconds", "duration_seconds"])
    || firstNumber(audioPayload, ["duration", "durationSeconds", "duration_seconds"]);

  return {
    videoId: id,
    url,
    title: title || `YouTube ${id}`,
    thumbnail: thumbnails[0] || `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`,
    durationSeconds,
    audio: linksFromPayload(audioPayload, "mp3"),
    video: linksFromPayload(videoPayload, "mp4"),
  };
}

export async function getRapidYouTubeDownload(videoId: string, format: "mp3" | "mp4", requestedQuality: string) {
  const id = normalizeVideoId(videoId);
  if (!id) throw new Error("Invalid YouTube video ID");
  const url = youtubeUrl(id);
  const payload = await call(format === "mp3" ? "/audio-info" : "/video-info", url);
  const links = linksFromPayload(payload, format);
  if (!links.length) throw new Error(`RapidAPI returned no ${format.toUpperCase()} download link`);
  const requested = requestedQuality.toLowerCase().replace(/\s+/g, "");
  const exact = links.find(link => link.quality.toLowerCase().replace(/\s+/g, "") === requested);
  const sameFamily = links.find(link => link.quality.toLowerCase().includes(requested.replace("kbps", "")));
  return exact ?? sameFamily ?? links[0];
}
