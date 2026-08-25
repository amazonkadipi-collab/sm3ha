import { ArrowRight, Clock3, Download, ExternalLink } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

export default function KeywordPage() {
  const [, params] = useRoute("/s/:slug");
  const slug = params?.slug ?? "";
  const keyword = useMemo(() => decodeURIComponent(slug).replace(/-/g, " ").trim(), [slug]);
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery({ query: keyword, limit: 20 }, { enabled: Boolean(keyword) });

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
      {!isLoading && !isError && data.map(song => <article key={`${song.providerVideoId}-${song.slug}`} className="reference-media-row">
        <div className="reference-media-thumb">{song.thumbnailUrl ? <img src={song.thumbnailUrl} alt="" loading="lazy" /> : <span>♫</span>}</div>
        <div className="min-w-0"><h2>{song.title}</h2><p><Clock3 size={14} /> {song.duration} · {song.artist || "فنان"}</p></div>
        <div className="reference-media-actions"><Link href={workflowLinks.media(song.opaqueToken)} className="reference-action"><Download size={15} /> تحميل</Link><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(song.providerVideoId)}`} target="_blank" rel="noreferrer" className="reference-watch">مشاهدة</a></div>
      </article>)}
    </section>
  </main>;
}
