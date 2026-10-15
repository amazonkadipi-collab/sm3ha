import { ArrowRight, Music2 } from "lucide-react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 20;

export default function ArtistsPage() {
  const params = new URLSearchParams(useSearch());
  const parsedPage = Number.parseInt(params.get("page") ?? "0", 10);
  const page = Number.isFinite(parsedPage) ? Math.min(50_000, Math.max(0, parsedPage)) : 0;
  const { data: rows = [], isLoading, isError } = trpc.catalog.artists.useQuery({ limit: PAGE_SIZE + 1, offset: page * PAGE_SIZE });
  const { data: stats } = trpc.catalog.archiveStats.useQuery(undefined, { staleTime: 5 * 60_000 });
  const artists = rows.slice(0, PAGE_SIZE);
  const hasNext = rows.length > PAGE_SIZE;

  return (
    <main dir="rtl" className="mx-auto max-w-6xl px-5 pb-12 pt-8">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#756590]"><ArrowRight size={16} /> العودة للرئيسية</Link>
      <section className="soft-card rounded-[32px] p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">أرشيف سمعها</p>
        <h1 className="serif mt-2 text-5xl text-[#514568]">الفنانون</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#81768f]">
          تصفح الفنانين الموجودين في الكتالوج، وافتح صفحة الفنان لرؤية المقاطع المرتبطة به.
          {stats ? ` يضم الأرشيف ${stats.artists.toLocaleString("ar")} فناناً.` : ""}
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="قائمة الفنانين">
        {isLoading && [1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/60" />)}
        {isError && <p className="col-span-full rounded-2xl border border-[#a86f87]/20 bg-white p-6 text-sm text-[#a86f87]">تعذر تحميل الفنانين حالياً.</p>}
        {!isLoading && !isError && artists.length === 0 && <p className="col-span-full rounded-2xl bg-white p-6 text-sm text-[#81768f]">لا توجد أسماء في هذه الصفحة.</p>}
        {!isLoading && !isError && artists.map(artist => (
          <Link key={artist.slug} href={`/artists/${artist.slug}`} className="soft-card group flex items-center gap-4 rounded-[24px] p-4 transition hover:-translate-y-1">
            <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#eee8f7]">
              {artist.imageUrl
                ? <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                : <Music2 className="text-[#756590]" size={26} />}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[#514568]">{artist.name}</strong>
              <small className="mt-1 flex items-center gap-1 text-[#8c819f]"><Music2 size={13} /> {artist.songCount} مقاطع</small>
            </span>
            <span className="text-[#756590]" aria-hidden="true">↗</span>
          </Link>
        ))}
      </section>

      {!isLoading && !isError && (
        <nav className="mt-8 flex items-center justify-between gap-3" aria-label="التنقل بين الفنانين">
          {page > 0
            ? <Link href={page === 1 ? "/artists" : `/artists?page=${page - 1}`} className="rounded-xl border border-[#756590]/20 px-5 py-3 text-sm font-bold text-[#756590]">السابق</Link>
            : <span />}
          <span className="text-sm text-[#8c819f]">صفحة {page + 1}</span>
          {hasNext && <Link href={`/artists?page=${page + 1}`} className="rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white">التالي</Link>}
        </nav>
      )}
    </main>
  );
}
