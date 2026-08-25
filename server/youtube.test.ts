import { describe, expect, it, vi } from "vitest";
import { parseYouTubeDuration, searchYouTubeVideos } from "./youtube";

describe("YouTube catalog integration", () => {
  it("parses ISO 8601 durations", () => {
    expect(parseYouTubeDuration("PT1H2M3S")).toBe(3723);
    expect(parseYouTubeDuration("PT4M8S")).toBe(248);
    expect(parseYouTubeDuration("invalid")).toBe(0);
  });

  it("maps search results and enriches them with durations", async () => {
    const originalKey = process.env.YOUTUBE_API_KEY;
    process.env.YOUTUBE_API_KEY = "test-youtube-key";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: { videoId: "abc123" }, snippet: { title: "أغنية عربية", channelTitle: "فنان عربي", thumbnails: { high: { url: "https://img.test/high.jpg" } } } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "abc123", contentDetails: { duration: "PT3M20S" } }] }), { status: 200 }));

    const result = await searchYouTubeVideos("أغنية عربية", 30);

    expect(result).toEqual([{ providerVideoId: "abc123", title: "أغنية عربية", artist: "فنان عربي", thumbnailUrl: "https://img.test/high.jpg", durationSeconds: 200, provider: "youtube" }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("maxResults=25");
    fetchMock.mockRestore();
    if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
    else process.env.YOUTUBE_API_KEY = originalKey;
  });

  it("moves to the next authorized project only after quota exhaustion", async () => {
    const originals = { one: process.env.YOUTUBE_API_KEY, two: process.env.YOUTUBE_API_KEY_2, three: process.env.YOUTUBE_API_KEY_3 };
    process.env.YOUTUBE_API_KEY = "project-one";
    process.env.YOUTUBE_API_KEY_2 = "project-two";
    delete process.env.YOUTUBE_API_KEY_3;
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { errors: [{ reason: "quotaExceeded" }], message: "Daily quota exceeded" } }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: { videoId: "fallback123" }, snippet: { title: "نتيجة بديلة", channelTitle: "قناة", thumbnails: { medium: { url: "https://img.test/fallback.jpg" } } } }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ id: "fallback123", contentDetails: { duration: "PT1M" } }] }), { status: 200 }));

    const result = await searchYouTubeVideos("بحث بديل", 1);

    expect(result[0]?.providerVideoId).toBe("fallback123");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("key=project-one");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("key=project-two");
    fetchMock.mockRestore();
    if (originals.one === undefined) delete process.env.YOUTUBE_API_KEY; else process.env.YOUTUBE_API_KEY = originals.one;
    if (originals.two === undefined) delete process.env.YOUTUBE_API_KEY_2; else process.env.YOUTUBE_API_KEY_2 = originals.two;
    if (originals.three === undefined) delete process.env.YOUTUBE_API_KEY_3; else process.env.YOUTUBE_API_KEY_3 = originals.three;
  });
});
