import { ArrowRight, Search, Music2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

export default function SearchPage() {
  const params = new URLSearchParams(useSearch());
  const initial = (params.get("q") ?? "").trim().slice(0, 120);
  const [query, setQuery] = useState(initial);
  const [, navigate] = useLocation();
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery(
    { query: initial, limit: 10, offset: 0 },
    { enabled: Boolean(initial), staleTime: 30_000, gcTime: 5 * 60_000, retry: 1 }
  );

  useEffect(() => {
    if (!initial) {
      navigate("/");
      return;
    }
    applySeo({
      title: `نتائج البحث عن ${initial} — سمعها`,
      description: `نتائج البحث عن ${initial} من الأغاني والموسيقى العربية في سمعها.`,
      path: `/search?q=${encodeURIComponent(initial)}`,
      robots: "noindex,follow",
    });
    return resetSeo;
  }, [initial, navigate]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim()) navigate(workflowLinks.search(query));
  };

  return (
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
      <Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link>
      <div className="reference-page-head">
        <div>
          <span>البحث</span>
          <h1>نتائج البحث</h1>
        </div>
        <form onSubmit={submit} className="reference-search reference-search-small" role="search">
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن أغنية أو فنان" aria-label="ابحث عن أغنية أو فنان" />
          <button type="submit">بحث</button><Search size={17} />
        </form>
      </div>
      <section className="reference-results">
        <div className="reference-results-title">نتائج «{initial}»</div>
        {isLoading && <div className="reference-loading">جارٍ تجهيز النتائج…</div>}
        {isError && <div className="reference-empty">تعذر تحميل النتائج حالياً.</div>}
        {!isLoading && !isError && data.length === 0 && <div className="reference-empty">لم يتم العثور على نتائج مناسبة.</div>}
        {!isLoading && !isError && data.map(song => (
          <Link key={song.id} href={workflowLinks.song(song.slug)} className="reference-result-row">
            <span><Music2 size={16} /></span>
            <strong>{song.title}</strong>
            <small>{song.artist || "الفنان غير محدد"} · {song.duration}</small>
          </Link>
        ))}
      </section>
    </main>
  );
}
