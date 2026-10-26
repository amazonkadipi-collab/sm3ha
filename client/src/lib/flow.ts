export const workflowLinks = {
  search: (query: string) => `/search?q=${encodeURIComponent(query.trim())}`,
  keyword: (query: string) => {
    // Match the server archive normalizer: strip download/format modifiers,
    // but preserve music-intent words like "اغاني" and "اغنية".
    const normalized = query.trim().split(/\s+/).filter(word => !/^(?:تحميل|تنزيل|download|mp3|mp4)$/i.test(word)).join(" ").trim() || query.trim();
    return `/s/${encodeURIComponent(normalized.replace(/\s+/g, "-"))}`;
  },
  song: (slug: string) => `/song/${encodeURIComponent(slug)}`,
  media: (token: string) => `/media?d=${encodeURIComponent(token)}`,
  conversion: (token: string) => `/videos_dl?d=${encodeURIComponent(token)}`,
};
