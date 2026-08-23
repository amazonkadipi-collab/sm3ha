import { ArrowRight, Flame } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MusicCard, SectionHeading } from "@/components/MusicCard";

export default function TrendingPage() {
  const { data = [], isLoading } = trpc.catalog.trending.useQuery({ limit: 12 });
  return <div className="mx-auto max-w-6xl px-5 pb-12 pt-8"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#756590]"><ArrowRight size={16} /> العودة للرئيسية</Link><div className="soft-card rounded-[32px] p-7 sm:p-10"><div className="flex items-center gap-3"><span className="rounded-2xl bg-[#f8e9ef] p-3 text-[#b2768d]"><Flame size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">تحديث هادئ</p><h1 className="serif mt-1 text-5xl text-[#514568]">الرائج الآن</h1></div></div><p className="mt-5 max-w-2xl text-sm leading-7 text-[#81768f]">اختيارات تجريبية مرتبة لتساعدك على اكتشاف أصوات جديدة دون ضجيج.</p></div><section className="mt-14"><SectionHeading eyebrow="الأكثر استماعاً" title="اختيارات المجتمع" />{isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div className="h-28 animate-pulse rounded-[24px] bg-white/60" key={i} />)}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(song => <MusicCard key={song.id} song={song} />)}</div>}</section></div>;
}
