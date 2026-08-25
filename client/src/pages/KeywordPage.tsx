import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Download, ExternalLink, Play, Square, Youtube } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;
const ARABIC_RUN = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff0-9٠-٩][\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff0-9٠-٩\s،,:؛!?()\-–—'’]*/g;

function arabicTitle(value: string) {
  const title = value.trim();
  if (!ARABIC.test(title)) return "";
  const runs = title.match(ARABIC_RUN)?.map(run => run.trim()).filter(Boolean) ?? [];
  return runs.join(" ") || title;
}

export default function KeywordPage() {
  const [, params] = useRoute("/s/:slug");
  const slug = params?.slug ?? "";
  const keyword = useMemo(() => decodeURIComponent(slug).replace(/-/g, " ").trim(), [slug]);
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery({ query: keyword, limit: 10 }, { enabled: Boolean(keyword) });
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    setActiveVideoId(null);
  }, [slug]);

  useEffect(() => {
    applySeo({ title: `تحميل ${keyword} Mp3 Mp4 — نغمة`, description: `نتائج ${keyword} من الأغاني والفيديوهات المتاحة للمشاهدة الرسمية عبر نغمة.`, path: `/s/${encodeURIComponent(slug)}` });
    return resetSeo;
  }, [keyword, slug]);

  return <main className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
    <Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link>
    <section className="reference-page-head"><div><span>نتائج البحث</span><h1>تحميل {keyword} Mp3 Mp4</h1></div><Link href={`/search?q=${encodeURIComponent(keyword)}`} className="reference-action"><ExternalLink size={16} /> بحث جديد</Link></section>
    <section className="reference-results" aria-label={`نتائج ${keyword}`}>
      <div className="reference-results-title">نتائج «{keyword}»</div>
      {isLoading && <div className="reference-empty">جارٍ تجهيز النتائج…</div>}
      {isError && <div className="reference-empty">تعذر تحميل النتائج حالياً.</div>}
      {!isLoading && !isError && data.length === 0 && <div className="reference-empty">لا توجد نتائج مطابقة.</div>}
      {!isLoading && !isError && data.map(song => {
        const visibleTitle = arabicTitle(song.title);
        const isPlaying = activeVideoId === song.providerVideoId;
        return <article key={`${song.providerVideoId}-${song.slug}`} className="reference-media-row">
          <div className="reference-media-thumb reference-media-thumb-area">{song.thumbnailUrl ? <img src={song.thumbnailUrl} alt={visibleTitle} title={visibleTitle} loading="lazy" /> : <span><Youtube size={20} /></span>}</div>
          <div className="min-w-0 reference-media-copy">
            {visibleTitle && <h2>{visibleTitle}</h2>}
            <p><Youtube size={14} /> <Clock3 size={14} /> مدة الفيديو: {song.duration}</p>
          </div>
          <div className="reference-media-actions reference-media-actions-area">
            <Link href={workflowLinks.media(song.opaqueToken)} className="reference-action"><Download size={15} /> تحميل</Link>
            <button type="button" className="reference-watch" aria-pressed={isPlaying} onClick={() => setActiveVideoId(isPlaying ? null : song.providerVideoId)}>{isPlaying ? <><Square size={14} /> إيقاف</> : <><Play size={14} /> مشاهدة</>}</button>
          </div>
          {isPlaying && <div className="reference-inline-player"><iframe src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.providerVideoId)}`} title={visibleTitle || "YouTube video player"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
        </article>;
      })}
    </section>
  </main>;
}
