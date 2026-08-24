export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.NAGHMAHUB_JWT_SECRET || process.env.JWT_SECRET || "",
  downloadSecret: process.env.NAGHMAHUB_DOWNLOAD_SECRET || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
};

if (ENV.isProduction) {
  const required = [
    ["NAGHMAHUB_JWT_SECRET", ENV.cookieSecret, 32],
    ["NAGHMAHUB_DOWNLOAD_SECRET", ENV.downloadSecret, 32],
    ["ADMIN_USERNAME", ENV.adminUsername, 1],
    ["ADMIN_PASSWORD", ENV.adminPassword, 16],
  ] as const;
  for (const [name, value, minLength] of required) {
    if (!value || value.length < minLength) throw new Error(`${name} must be configured in production with at least ${minLength} characters`);
  }
}
