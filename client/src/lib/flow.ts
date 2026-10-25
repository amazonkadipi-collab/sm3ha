export const workflowLinks = {
  search: (query: string) => `/search?q=${encodeURIComponent(query.trim())}`,
  keyword: (query: string) => {
    const normalized = query.trim().split(/\s+/).filter(word => !/^(?:تحميل|تنزيل|download|mp3|mp4|اغاني|أغاني|اغنية|أغنية)$/i.test(word)).join(" ").trim() || query.trim();
    return `/s/${encodeURIComponent(normalized.replace(/\s+/g, "-"))}`;
  },
  song: (slug: string) => `/song/${encodeURIComponent(slug)}`,
  media: (token: string) => `/media?d=${encodeURIComponent(token)}`,
  conversion: (token: string) => `/videos_dl?d=${encodeURIComponent(token)}`,
};
