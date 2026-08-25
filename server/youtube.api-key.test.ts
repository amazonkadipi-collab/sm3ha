import { describe, expect, it } from "vitest";
import { parseYouTubeDuration } from "./youtube";

describe("YouTube Data API", () => {
  it("parses ISO-8601 durations used by videos.list", () => {
    expect(parseYouTubeDuration("PT1H2M3S")).toBe(3723);
    expect(parseYouTubeDuration("PT4M12S")).toBe(252);
    expect(parseYouTubeDuration("invalid")).toBe(0);
  });

  it("accepts the configured server-side key for a minimal search request", async () => {
    const key = process.env.YOUTUBE_API_KEY;
    expect(key, "YOUTUBE_API_KEY must be configured for this validation").toBeTruthy();

    const params = new URLSearchParams({
      part: "snippet",
      q: "نغمة",
      type: "video",
      maxResults: "1",
      key: key!,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const body = await response.json() as { items?: unknown[]; error?: { code?: number; message?: string } };

    if (response.status === 200) {
      expect(Array.isArray(body.items)).toBe(true);
      return;
    }
    expect(response.status).toBe(429);
    expect(body.error?.message ?? "").toMatch(/quota/i);
  }, 15_000);
});
