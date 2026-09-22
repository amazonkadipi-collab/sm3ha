import { createHmac, timingSafeEqual } from "node:crypto";

function getDownloadSecret() {
  const value = process.env.NAGHMAHUB_DOWNLOAD_SECRET || process.env.NAGHMAHUB_JWT_SECRET || process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("NAGHMAHUB_DOWNLOAD_SECRET must be configured with at least 32 characters");
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", getDownloadSecret()).update(payload).digest("hex");
}

export function createDemoDownloadToken(opaqueToken: string, ttlSeconds = 900) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${opaqueToken}.${expiresAt}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyDemoDownloadToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [opaqueToken, expiryText, signature] = parts;
    const expiresAt = Number(expiryText);
    if (!opaqueToken || !signature || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
    const expected = sign(`${opaqueToken}.${expiresAt}`);
    const actualBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    return { opaqueToken, expiresAt };
  } catch {
    return null;
  }
}

export type AuthorizedFormat = "mp3" | "mp4";

export function createAuthorizedDownloadToken(opaqueToken: string, format: AuthorizedFormat, ttlSeconds = 900) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${opaqueToken}.${format}.${expiresAt}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function verifyAuthorizedDownloadToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 4) return null;
    const [opaqueToken, format, expiryText, signature] = parts;
    const expiresAt = Number(expiryText);
    if (!opaqueToken || (format !== "mp3" && format !== "mp4") || !signature || !Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) return null;
    const expected = sign(`${opaqueToken}.${format}.${expiresAt}`);
    const actualBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
    return { opaqueToken, format: format as AuthorizedFormat, expiresAt };
  } catch {
    return null;
  }
}
