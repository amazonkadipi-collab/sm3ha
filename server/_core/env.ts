export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.NAGHMAHUB_JWT_SECRET || process.env.JWT_SECRET || "",
  downloadSecret: process.env.NAGHMAHUB_DOWNLOAD_SECRET || process.env.NAGHMAHUB_JWT_SECRET || process.env.JWT_SECRET || "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  youtubeApiKey: process.env.YOUTUBE_API_KEY ?? "",
  youtubeApiKeys: [process.env.YOUTUBE_API_KEY, process.env.YOUTUBE_API_KEY_2, process.env.YOUTUBE_API_KEY_3].filter((key): key is string => Boolean(key)),
  adminUsername: process.env.ADMIN_USERNAME ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
};

// Never crash the entire server during module initialization because an
// optional/admin environment variable is missing. Public pages and health
// endpoints must remain available; protected operations validate their own
// required configuration when they are actually invoked.
if (ENV.isProduction) {
  const checks = [
    ["NAGHMAHUB_JWT_SECRET or JWT_SECRET", ENV.cookieSecret, 32],
    ["ADMIN_USERNAME", ENV.adminUsername, 1],
    ["ADMIN_PASSWORD", ENV.adminPassword, 16],
  ] as const;
  const missing = checks.filter(([, value, minLength]) => !value || value.length < minLength).map(([name]) => name);
  if (missing.length) console.error(`[Config] Production configuration incomplete: ${missing.join(", ")}`);
}
