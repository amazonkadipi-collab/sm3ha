import { ArrowRight, Disc3 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { MusicCard } from "@/components/MusicCard";
import { applySeo, resetSeo } from "@/lib/seo";
import { useEffect } from "react";

export default function AlbumPage() {
  const [, params] = useRoute("/album/:slug");
  const { data: album, isLoading, error } = trpc.catalog.albumBySlug.useQuery({ slug: params?.slug ?? "" });
  useEffect(() => { if (!album) return; applySeo({ title: `${album.title} | سمعها`, description: `استكشف أغاني ألبوم ${album.title} واستمع إلى الإصدارات المتاحة عبر سمعها.`, path: `/album/${album.slug}` }); return resetSeo; }, [album]);
  if (isLoading) return <div className="mx-auto max-w-6xl px-5 py-20"><div className="h-72 animate-pulse rounded-[32px] bg-white/60" /></div>;
  if (error || !album) return <div className="mx-auto max-w-6xl px-5 py-20 text-center"><p className="serif text-4xl text-[#514568]">الألبوم غير موجود</p><Link href="/" className="mt-4 inline-block font-bold text-[#756590]">العودة للرئيسية</Link></div>;
  return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8"><Link href="/albums" className="reference-back"><ArrowRight size={15} /> الألبومات</Link><section className="soft-card flex items-center gap-5 rounded-[32px] p-7 sm:p-10"><div className="h-24 w-24 overflow-hidden rounded-[28px] bg-[#eee8f7] sm:h-32 sm:w-32">{album.imageUrl ? <img src={album.imageUrl} alt="" className="h-full w-full object-cover" /> : <Disc3 className="m-8 text-[#756590]" size={32} />}</div><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">الألبوم</p><h1 className="serif mt-2 text-5xl text-[#514568]">{album.title}</h1><p className="mt-2 text-sm text-[#81768f]">{album.songs.length} مقاطع</p></div></section><section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{album.songs.map(song => <MusicCard key={song.id} song={song} />)}</section></main>;
}