import { Search, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { MusicCard, SectionHeading } from "@/components/MusicCard";

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: trending = [], isLoading } = trpc.catalog.trending.useQuery({ limit: 6 });
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  return <div className="mx-auto max-w-6xl px-5 pb-10">
    <section className="corner-frame soft-card relative overflow-hidden rounded-[34px] px-6 py-16 text-center sm:px-14 sm:py-24">
      <div className="absolute -left-16 top-12 h-40 w-40 rounded-full bg-[#e9b8c9]/35 blur-3xl" /><div className="absolute -right-16 bottom-8 h-52 w-52 rounded-full bg-[#b9dfd2]/45 blur-3xl" />
      <div className="relative mx-auto max-w-3xl"><p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold tracking-wide text-[#756590]"><Sparkles size={14} /> اكتشف صوتك بهدوء</p><h1 className="serif text-5xl leading-tight text-[#514568] sm:text-7xl">مساحة ناعمة،<br /><span className="text-[#8f719d]">لأصوات لا تُنسى.</span></h1><p className="mx-auto mt-6 max-w-xl text-base leading-8 text-[#81768f]">ابحث بين الإصدارات، تعرّف على فنانين جدد، واترك للموسيقى أن تقودك إلى لحظة أهدأ.</p>
      <form onSubmit={submit} className="mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl border border-[#756590]/10 bg-white/85 p-2 shadow-xl shadow-[#756590]/10"><Search className="mr-3 text-[#9d8aae]" size={21} /><input value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-[#514568] outline-none placeholder:text-[#b2a8bb]" placeholder="إبحث عن أغنية أو ألبوم أو فنان" aria-label="البحث" /><button className="rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#62537f] active:scale-[.98]">بحث</button></form>
      <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-[#9589a3]"><span className="inline-flex items-center gap-1"><ShieldCheck size={14} /> نتائج تجريبية آمنة</span><span>•</span><span>بدون تحميل غير مصرح</span></div></div>
    </section>
    <section className="mt-16"><SectionHeading eyebrow="اختيارات اليوم" title="الأكثر حضوراً" href="/trending" />{isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/60" />)}</div> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{trending.slice(0, 6).map(song => <MusicCard key={song.id} song={song} />)}</div>}</section>
    <section className="mt-16 grid gap-6 md:grid-cols-[1.1fr_.9fr]"><div className="soft-card rounded-[28px] p-7"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9d8aae]">دليل صغير</p><h2 className="serif mt-3 text-3xl text-[#514568]">استمع بفضول،<br />وتصفح على مهل.</h2><p className="mt-4 text-sm leading-7 text-[#81768f]">كل صفحة هنا مصممة لتبقى خفيفة: معلومات واضحة، مساحات مريحة، وتجربة تحويل توضيحية لا تتجاوز الملفات المصرح بها.</p><Link href="/terms" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#756590]">اعرف المزيد <ArrowLeft size={16} /></Link></div><div className="rounded-[28px] bg-[#514568] p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-[#d9ccea]">للزوار الجدد</p><h2 className="serif mt-3 text-3xl">ابدأ من اسم<br />تحبه.</h2><p className="mt-4 text-sm leading-7 text-[#e4dff0]">استخدم البحث للوصول إلى صفحات الفنانين والمقاطع التجريبية في ثوانٍ.</p><Link href="/search?q=ليلة" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#514568]">جرب البحث <ArrowLeft size={16} /></Link></div></section>
  </div>;
}
