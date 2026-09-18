import { ArrowRight, Disc3 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";
import { useEffect } from "react";

export default function AlbumsPage() {
  const { data = [], isLoading } = trpc.catalog.albums.useQuery({ limit: 50 });
  useEffect(() => { applySeo({ title: "الألبومات | سمعها", description: "استكشف الألبومات والإصدارات المتاحة عبر سمعها.", path: "/albums" }); return resetSeo; }, []);
  return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8"><Link href="/" className="reference-back"><ArrowRight size={15} /> الرئيسية</Link><section className="reference-page-head"><div><span>سمعها</span><h1>الألبومات</h1></div></section><section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{isLoading ? [1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/60" />) : data.map(album => <Link key={album.slug} href={`/album/${album.slug}`} className="soft-card flex items-center gap-4 rounded-[24px] p-4 transition hover:-translate-y-1"><div className="h-16 w-16 overflow-hidden rounded-2xl bg-[#eee8f7]">{album.imageUrl ? <img src={album.imageUrl} alt="" className="h-full w-full object-cover" /> : <Disc3 className="m-5 text-[#756590]" size={24} />}</div><div className="min-w-0"><strong className="block truncate text-[#514568]">{album.title}</strong><small className="text-[#8c819f]">عرض الألبوم ↗</small></div></Link>)}</section></main>;
}