import { describe, expect, it } from "vitest";

const keys = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY_2,
  process.env.YOUTUBE_API_KEY_3,
].filter((key): key is string => Boolean(key));

describe("YouTube failover credentials", () => {
  it("accepts each configured key on a lightweight videos.list request", async () => {
    expect(keys.length).toBeGreaterThanOrEqual(1);

    for (const key of keys) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=id&id=dQw4w9WgXcQ&key=${encodeURIComponent(key)}`,
      );
      const body = (await response.json()) as { error?: { errors?: Array<{ reason?: string }> } };
      expect(response.ok, body.error?.errors?.[0]?.reason ?? "YouTube credentials rejected").toBe(true);
    }
  }, 30_000);
});
