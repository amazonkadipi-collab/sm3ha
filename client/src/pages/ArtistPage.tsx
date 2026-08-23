import { ArrowRight, Music2 } from "lucide-react";
import { Link, useRoute } from "wouter";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { MusicCard, SectionHeading } from "@/components/MusicCard";

export default function ArtistPage() {
  const [, params] = useRoute("/artists/:slug");
  const { data: artist, isLoading, error } = trpc.catalog.artistBySlug.useQuery({ slug: params?.slug ?? "" });
  useEffect(() => { if (artist) document.title = `${artist.name} | نغمة`; return () => { document.title = "نغمة | NaghmaHub"; }; }, [artist]);
  if (isLoading) return <div className="mx-auto max-w-6xl px-5 py-20"><div className="h-72 animate-pulse rounded-[32px] bg-white/60" /></div>;
  if (error || !artist) return <div className="mx-auto max-w-6xl px-5 py-20 text-center"><p className="serif text-4xl text-[#514568]">الفنان غير موجود</p><Link href="/" className="mt-4 inline-block font-bold text-[#756590]">العودة للرئيسية</Link></div>;
  return <div className="mx-auto max-w-6xl px-5 pb-12 pt-8"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#756590]"><ArrowRight size={16} /> العودة للرئيسية</Link><section className="soft-card flex items-center gap-5 rounded-[32px] p-7 sm:p-10"><img src={artist.imageUrl} alt="" className="h-24 w-24 rounded-[28px] object-cover sm:h-32 sm:w-32" /><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">ملف الفنان</p><h1 className="serif mt-2 text-5xl text-[#514568]">{artist.name}</h1><p className="mt-2 inline-flex items-center gap-2 text-sm text-[#81768f]"><Music2 size={15} /> {artist.songs.length} مقاطع تجريبية</p></div></section><section className="mt-14"><SectionHeading eyebrow="الإصدارات" title="من هذا الفنان" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{artist.songs.map(song => <MusicCard key={song.id} song={song} />)}</div></section></div>;
}
