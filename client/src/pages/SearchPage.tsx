import { ArrowRight, Search, Music2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const params = new URLSearchParams(useSearch());
  const initial = (params.get("q") ?? "").trim();
  const parsedPage = Number.parseInt(params.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) ? Math.min(50_000, Math.max(0, parsedPage)) : 0;
  const [query, setQuery] = useState(initial);
  const [, navigate] = useLocation();
  const isArchive = !initial;
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery(
    { query: initial || undefined, limit: isArchive ? PAGE_SIZE + 1 : 10, offset: isArchive ? page * PAGE_SIZE : 0 },
    { enabled: true, staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 }
  );
  const { data: stats } = trpc.catalog.archiveStats.useQuery(undefined, { staleTime: 5 * 60_000 });

  useEffect(() => {
    if (!initial) {
      navigate("/");
      return;
    }
    applySeo({
      title: initial ? `نتائج البحث عن ${initial} — سمعها` : "الأرشيف الموسيقي | سمعها",
      description: initial ? `نتائج البحث عن ${initial} من الأغاني والموسيقى العربية في سمعها.` : "تصفح الأغاني المسجلة في أرشيف سمعها وابحث عن العناوين والفنانين.",
      path: initial ? `/search?q=${encodeURIComponent(initial)}` : (page ? `/search?page=${page}` : "/search"),
    });
    return resetSeo;
  }, [initial, page, navigate]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) navigate(workflowLinks.search(query));
  };

  const visibleRows = isArchive ? data.slice(0, PAGE_SIZE) : data;
  const hasNext = isArchive && data.length > PAGE_SIZE;

  return (
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
      <Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link>
      <div className="reference-page-head">
        <div>
          <span>{isArchive ? "أرشيف سمعها" : "البحث"}</span>
          <h1>{isArchive ? "الأرشيف الموسيقي" : "نتائج البحث"}</h1>
        </div>
        <form onSubmit={submit} className="reference-search reference-search-small" role="search">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن أغنية أو فنان" aria-label="ابحث عن أغنية أو فنان" />
          <button type="submit">بحث</button><Search size={17} />
        </form>
      </div>

      {isArchive && stats && (
        <section className="mb-8 grid gap-3 sm:grid-cols-3" aria-label="إحصائيات الأرشيف">
          <div className="soft-card rounded-2xl p-4"><p className="text-xs text-[#8c819f]">مقاطع نشطة</p><strong className="mt-1 block text-2xl text-[#514568]">{stats.activeSongs.toLocaleString("ar")}</strong></div>
          <div className="soft-card rounded-2xl p-4"><p className="text-xs text-[#8c819f]">الفنانون</p><strong className="mt-1 block text-2xl text-[#514568]">{stats.artists.toLocaleString("ar")}</strong></div>
          <div className="soft-card rounded-2xl p-4"><p className="text-xs text-[#8c819f]">مصادر تحميل مرخصة</p><strong className="mt-1 block text-2xl text-[#514568]">{stats.licensedDownloads.toLocaleString("ar")}</strong></div>
        </section>
      )}

      <section className="reference-results">
        <div className="reference-results-title">{initial ? `نتائج «${initial}»` : `مقاطع الأرشيف — الصفحة ${page + 1}`}</div>
        {isLoading && <div className="reference-loading">جارٍ تجهيز النتائج…</div>}
        {isError && <div className="reference-empty">تعذر تحميل النتائج حالياً.</div>}
        {!isLoading && !isError && visibleRows.length === 0 && <div className="reference-empty">لا توجد نتائج في هذه الصفحة.</div>}
        {!isLoading && !isError && visibleRows.map(song => (
          <Link key={song.id} href={workflowLinks.song(song.slug)} className="reference-result-row">
            <span><Music2 size={16} /></span>
            <strong>{song.title}</strong>
            <small>{song.artist || "الفنان غير محدد"} · {song.duration}</small>
          </Link>
        ))}
      </section>

      {isArchive && !isLoading && !isError && (
        <nav className="mt-7 flex items-center justify-between gap-3" aria-label="التنقل بين صفحات الأرشيف">
          {page > 0
            ? <Link href={page === 1 ? "/search" : `/search?page=${page - 1}`} className="rounded-xl border border-[#756590]/20 px-5 py-3 text-sm font-bold text-[#756590]">السابق</Link>
            : <span />}
          <span className="text-sm text-[#8c819f]">صفحة {page + 1}</span>
          {hasNext && <Link href={`/search?page=${page + 1}`} className="rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white">التالي</Link>}
        </nav>
      )}
    </main>
  );
}
