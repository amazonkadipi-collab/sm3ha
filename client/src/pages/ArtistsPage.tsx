import { ArrowRight, Music2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function ArtistsPage() {
  const { data = [], isLoading } = trpc.catalog.artists.useQuery({ limit: 20 });
  return <div className="mx-auto max-w-6xl px-5 pb-12 pt-8"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#756590]"><ArrowRight size={16} /> العودة للرئيسية</Link><div className="soft-card rounded-[32px] p-7 sm:p-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">الوجوه الجديدة</p><h1 className="serif mt-2 text-5xl text-[#514568]">الفنانون</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-[#81768f]">تعرّف على أصوات متنوعة في كتالوج تجريبي هادئ، مصمم للفضول والاستكشاف.</p></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{isLoading ? [1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/60" />) : data.map(artist => <Link key={artist.slug} href={`/artists/${artist.slug}`} className="soft-card group flex items-center gap-4 rounded-[24px] p-4 transition hover:-translate-y-1"><img src={artist.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" /><span className="min-w-0 flex-1"><strong className="block truncate text-[#514568]">{artist.name}</strong><small className="mt-1 flex items-center gap-1 text-[#8c819f]"><Music2 size={13} /> {artist.songCount} مقاطع</small></span><span className="text-[#756590]">↗</span></Link>)}</div></div>;
}
