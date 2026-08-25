export const workflowLinks = {
  search: (query: string) => `/search?q=${encodeURIComponent(query.trim())}`,
  keyword: (query: string) => `/s/${encodeURIComponent(query.trim().replace(/\s+/g, "-"))}`,
  song: (slug: string) => `/s/${encodeURIComponent(slug)}`,
  media: (token: string) => `/media?d=${encodeURIComponent(token)}`,
  conversion: (providerVideoId: string) => `/videos_dl?v=${encodeURIComponent(providerVideoId)}`,
};
