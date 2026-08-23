import { describe, expect, it } from "vitest";
import { createDemoDownloadToken, verifyDemoDownloadToken } from "./download";

describe("demo download tokens", () => {
  it("verifies a fresh signed token", () => {
    const token = createDemoDownloadToken("d_demo");
    expect(verifyDemoDownloadToken(token)?.opaqueToken).toBe("d_demo");
  });

  it("rejects expired and tampered tokens", () => {
    const expired = createDemoDownloadToken("d_old", -1);
    expect(verifyDemoDownloadToken(expired)).toBeNull();
    const fresh = createDemoDownloadToken("d_demo");
    expect(verifyDemoDownloadToken(`${fresh.slice(0, -2)}xx`)).toBeNull();
  });
});
