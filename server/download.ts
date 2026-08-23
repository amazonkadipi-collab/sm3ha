import { createHmac, timingSafeEqual } from "node:crypto";

const secret = () => process.env.JWT_SECRET || "naghmahub-demo-secret";

export function createDemoDownloadToken(opaqueToken: string, ttlSeconds = 900) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${opaqueToken}.${expiresAt}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function verifyDemoDownloadToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [opaqueToken, expiryText, signature] = parts;
    const expiresAt = Number(expiryText);
    if (!opaqueToken || !signature || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
    const expected = createHmac("sha256", secret()).update(`${opaqueToken}.${expiresAt}`).digest("hex");
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return { opaqueToken, expiresAt };
  } catch {
    return null;
  }
}
