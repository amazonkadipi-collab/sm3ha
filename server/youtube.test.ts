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
});
