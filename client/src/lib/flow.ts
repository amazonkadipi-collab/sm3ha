export const workflowLinks = {
  search: (query: string) => `/search?q=${encodeURIComponent(query.trim())}`,
  song: (slug: string) => `/s/${encodeURIComponent(slug)}`,
  media: (token: string) => `/media?d=${encodeURIComponent(token)}`,
  conversion: (providerVideoId: string) => `/videos_dl?v=${encodeURIComponent(providerVideoId)}`,
};
