import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Clock3, Download, Play, Square, Youtube } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;
const ARABIC_RUN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff0-9٠-٩][\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff0-9٠-٩\s،,:؛!?()\-–—'’]*/g;

function arabicTitle(value: string) {
  const title = value.trim();
  if (!ARABIC.test(title)) return title;
  const runs = title.match(ARABIC_RUN)?.map(run => run.trim()).filter(Boolean) ?? [];
  return runs.join(" ") || title;
}

function normalizeKeywordWords(value: string) {
  return new Set(value.toLocaleLowerCase("ar").normalize("NFKD").replace(/[\u064B-\u065F\u0670]/g, "").replace(/[إأآا]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/[^a-z0-9\u0600-\u06FF\s]+/gi, " ").replace(/\s+/g, " ").trim().split(" ").filter(word => word.length >= 2));
}

function keywordFamily(value: string) {
  const words = Array.from(normalizeKeywordWords(value));
  const candidates = new Set<string>();
  if (words.length > 1) {
    for (let size = 2; size <= Math.min(words.length, 4); size += 1) {
      for (let i = 0; i + size <= words.length; i += 1) candidates.add(words.slice(i, i + size).join(" "));
    }
  }
  words.forEach(word => candidates.add(word));
  return candidates;
}

export default function KeywordPage() {
  const [, params] = useRoute("/s/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const keyword = useMemo(() => decodeURIComponent(slug).replace(/-/g, " ").trim(), [slug]);
  const [query, setQuery] = useState(keyword);
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery({ query: keyword, limit: 10 }, { enabled: Boolean(keyword), retry: false, staleTime: 30_000 });
  const { data: keywordLinks = [] } = trpc.catalog.keywords.useQuery({ limit: 50 }, { retry: 1, staleTime: 60_000 });
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const { data: embedStatus, isFetching: isCheckingEmbed } = trpc.youtube.embedStatus.useQuery(
    { videoId: activeVideoId ?? "" },
    { enabled: Boolean(activeVideoId), retry: false, staleTime: 5 * 60_000, gcTime: 30 * 60_000 }
  );
  const playerRef = useRef<HTMLDivElement | null>(null);
  const hasResults = !isLoading && !isError && data.length > 0;
  const relatedKeywords = useMemo(() => {
    const family = keywordFamily(keyword);
    return keywordLinks
      .filter(item => item.slug !== slug && item.resultCount > 0)
      .map(item => ({ item, overlap: Array.from(normalizeKeywordWords(item.label)).filter(word => family.has(word)).length }))
      .filter(entry => entry.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || a.item.label.localeCompare(b.item.label, "ar"))
      .slice(0, 12)
      .map(entry => entry.item);
  }, [keywordLinks, keyword, slug]);

  useEffect(() => setQuery(keyword), [keyword]);
  useEffect(() => setActiveVideoId(null), [slug]);
  useEffect(() => {
    if (activeVideoId) requestAnimationFrame(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }, [activeVideoId]);
  useEffect(() => {
    applySeo({
      title: `تحميل ${keyword} Mp3 Mp4 سمعها`,
      description: hasResults ? `نتائج ${keyword} في سمعها. إبحث واستكشف الأغاني والفيديوهات المتاحة.` : `نتائج ${keyword} في سمعها.`,
      path: `/s/${encodeURIComponent(slug)}`,
      noindex: !isLoading && !isError && !hasResults,
    });
    return resetSeo;
  }, [keyword, slug, hasResults, isLoading, isError]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(workflowLinks.keyword(value));
  };

  return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8">
    <section className="keyword-search-hero" aria-label="البحث">
      <form onSubmit={submit} className="reference-search" role="search">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="إبحث عن اغنية او البوم او فنان" />
        <button type="submit">بحث</button>
      </form>
      <h1>تحميل {keyword} Mp3 Mp4 سمعها</h1>
    </section>
    <section className="reference-results" aria-label={`نتائج ${keyword}`}>
      {isLoading && <div className="reference-empty">جارٍ تجهيز النتائج…</div>}
      {isError && <div className="reference-empty">تعذر تحميل النتائج حالياً.</div>}
      {!isLoading && !isError && data.length === 0 && <div className="reference-empty">عذراً، لم يتم العثور على بيانات.</div>}
      {!isLoading && !isError && data.map(song => {
        const visibleTitle = arabicTitle(song.title);
        const isPlaying = activeVideoId === song.providerVideoId;
        return <article key={`${song.providerVideoId}-${song.slug}`} className="reference-media-row">
          <div className="reference-media-thumb reference-media-thumb-area">{song.thumbnailUrl ? <img src={song.thumbnailUrl} alt={visibleTitle} title={visibleTitle} loading="lazy" /> : <span><Youtube size={20} /></span>}</div>
          <div className="min-w-0 reference-media-copy"><h2>{visibleTitle}</h2><p><Youtube size={14} /> <Clock3 size={14} /> مدة الفيديو: {song.duration}</p></div>
          <div className="reference-media-actions reference-media-actions-area">
            <a href={workflowLinks.media(song.opaqueToken)} className="reference-action"><Download size={15} /> تحميل</a>
            <button type="button" className="reference-watch" aria-pressed={isPlaying} onClick={() => setActiveVideoId(isPlaying ? null : song.providerVideoId)}>{isPlaying ? <><Square size={14} /> إيقاف</> : <><Play size={14} /> مشاهدة</>}</button>
          </div>
          {isPlaying && song.providerVideoId && <div ref={playerRef} className="reference-inline-player" aria-label={`مشاهدة ${visibleTitle} داخل سمعها`}>
            {isCheckingEmbed && <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-black/[0.04] text-sm text-black/55">جاري التحقق من إمكانية المشاهدة…</div>}
            {!isCheckingEmbed && embedStatus?.embeddable === false && <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl bg-black/[0.04] px-5 text-center text-sm text-black/60"><span>هذا الفيديو لا يسمح بالمشاهدة داخل المواقع الخارجية.</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}`} target="_blank" rel="noreferrer" className="font-semibold text-black/70 underline underline-offset-2">فتح الفيديو في YouTube</a></div>}
            {!isCheckingEmbed && embedStatus?.embeddable !== false && <iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.providerVideoId)}?autoplay=1&controls=1&rel=0&playsinline=1&fs=1&origin=${encodeURIComponent(window.location.origin)}`} title={visibleTitle || "مشاهدة الفيديو"} loading="eager" referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />}
            {!isCheckingEmbed && <div className="mt-2 flex items-center justify-between gap-3 text-xs text-black/55"><span>{embedStatus?.embeddable === false ? "تم تحويلك إلى المصدر الرسمي لأن التضمين غير مسموح." : "المشاهدة تتم عبر مشغل YouTube الرسمي."}</span><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}`} target="_blank" rel="noreferrer" className="font-semibold text-black/70 underline underline-offset-2">فتح في YouTube</a></div>}
          </div>}
        </article>;
      })}
    </section>
    {relatedKeywords.length > 0 && <section className="mt-8 border-t border-black/10 pt-5" aria-label="كلمات مرتبطة"><div className="mb-3 text-sm font-semibold text-black/70">مواضيع مرتبطة</div><div className="flex flex-wrap gap-2">{relatedKeywords.map(item => <a key={item.slug} href={`/s/${encodeURIComponent(item.slug)}`} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm text-black/70 transition hover:bg-black/[0.03]">تحميل {item.label}</a>)}</div></section>}
  </main>;
}
