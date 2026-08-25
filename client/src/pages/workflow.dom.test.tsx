// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
  song: vi.fn(),
  media: vi.fn(),
  trending: vi.fn(),
  navigate: vi.fn(),
}));
let searchValue = "q=ليلة%20هادئة";

vi.mock("@/lib/trpc", () => ({
  trpc: { catalog: {
    search: { useQuery: (...args: unknown[]) => mocks.search(...args) },
    songBySlug: { useQuery: (...args: unknown[]) => mocks.song(...args) },
    mediaByToken: { useQuery: (...args: unknown[]) => mocks.media(...args) },
    trending: { useQuery: (...args: unknown[]) => mocks.trending(...args) },
  } },
}));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
  useLocation: () => [searchValue, mocks.navigate],
  useSearch: () => searchValue,
  useRoute: () => [true, { slug: "layla-hadia" }],
}));
vi.mock("@/components/MusicCard", () => ({
  MusicCard: () => <div />,
  SectionHeading: ({ title }: { title: string }) => <h2>{title}</h2>,
}));

let SearchPage: typeof import("./SearchPage").default;
let SongPage: typeof import("./SongPage").default;
let MediaPage: typeof import("./MediaPage").default;
let KeywordPage: typeof import("./KeywordPage").default;

beforeAll(async () => {
  SearchPage = (await import("./SearchPage")).default;
  SongPage = (await import("./SongPage")).default;
  MediaPage = (await import("./MediaPage")).default;
  KeywordPage = (await import("./KeywordPage")).default;
});

beforeEach(() => {
  document.body.innerHTML = "";
  mocks.navigate.mockReset();
  mocks.search.mockReset();
  mocks.song.mockReset();
  mocks.media.mockReset();
  mocks.trending.mockReturnValue({ data: [], isLoading: false, isError: false });
});

describe("reference workflow runtime", () => {
  it("redirects a single search result to the song route", async () => {
    searchValue = "q=ليلة%20هادئة";
    mocks.search.mockReturnValue({ data: [{ id: 1, slug: "layla-hadia", title: "ليلة هادئة", artist: "نغمة", duration: "03:00" }], isLoading: false, isError: false });
    render(<SearchPage />);
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/s/%D9%84%D9%8A%D9%84%D8%A9-%D9%87%D8%A7%D8%AF%D8%A6%D8%A9"));
  });

  it("renders the song-to-media link with the opaque token", () => {
    mocks.song.mockReturnValue({ data: { slug: "layla-hadia", title: "ليلة هادئة", artist: "نغمة", album: "إصدار تجريبي", duration: "03:00", durationSeconds: 180, opaqueToken: "opaque-demo", providerVideoId: "video-demo", thumbnailUrl: "" }, isLoading: false, error: null });
    render(<SongPage />);
    expect(screen.getByRole("link", { name: /تجربة التحميل/ }).getAttribute("href")).toBe("/media?d=opaque-demo");
  });

  it("renders the media-to-conversion link with the provider id", () => {
    searchValue = "d=opaque-demo";
    mocks.media.mockReturnValue({ data: { title: "ليلة هادئة", artist: "نغمة", duration: "03:00", opaqueToken: "opaque-demo", providerVideoId: "video-demo" }, isLoading: false, error: null });
    render(<MediaPage />);
    expect(screen.getByRole("link", { name: /DOWNLOAD NOW/ }).getAttribute("href")).toBe("/videos_dl?v=video-demo");
  });

  it("shows Arabic title text only and toggles one inline YouTube player", () => {
    mocks.search.mockReturnValue({ data: [
      { providerVideoId: "video-ar", slug: "song-ar", title: "Official أغنية عربية Mix", duration: "03:00", thumbnailUrl: "https://i.ytimg.com/vi/video-ar/mqdefault.jpg" },
      { providerVideoId: "video-en", slug: "song-en", title: "English only title", duration: "02:00", thumbnailUrl: "https://i.ytimg.com/vi/video-en/mqdefault.jpg" },
    ], isLoading: false, isError: false });
    render(<KeywordPage />);

    expect(screen.getByRole("heading", { name: "أغنية عربية" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "English only title" })).toBeNull();

    const watchButtons = screen.getAllByRole("button", { name: /مشاهدة/ });
    fireEvent.click(watchButtons[0]);
    expect(document.querySelector('iframe[title="أغنية عربية"]')?.getAttribute("src")).toContain("youtube-nocookie.com/embed/video-ar");
    expect(screen.getByRole("button", { name: /إيقاف/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /إيقاف/ }));
    expect(document.querySelector('iframe[title="أغنية عربية"]')).toBeNull();
  });
});
