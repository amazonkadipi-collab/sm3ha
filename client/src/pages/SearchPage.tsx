import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { MusicCard, SectionHeading } from "@/components/MusicCard";

export default function SearchPage() {
  const params = new URLSearchParams(useSearch());
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [, navigate] = useLocation();
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery({ query: initial, limit: 12 });
  const submit = (e: FormEvent) => { e.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  return <div className="mx-auto max-w-6xl px-5 pb-12 pt-8"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[#756590]"><ArrowRight size={16} /> العودة للرئيسية</Link><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">البحث</p><h1 className="serif mt-2 text-5xl text-[#514568]">نتائجك، بهدوء.</h1></div><form onSubmit={submit} className="flex w-full max-w-md items-center gap-2 rounded-2xl border border-[#756590]/10 bg-white/80 p-2"><Search className="mr-3 text-[#9d8aae]" size={19} /><input value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" placeholder="ابحث من جديد" /><button className="rounded-xl bg-[#756590] px-4 py-2 text-sm font-bold text-white">بحث</button></form></div><div className="mt-12 flex items-center justify-between"><SectionHeading eyebrow="الكتالوج" title={initial ? `نتائج «${initial}»` : "كل الإصدارات"} /><button className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#756590]/15 bg-white/50 px-4 py-2 text-xs font-bold text-[#756590]"><SlidersHorizontal size={14} /> ترتيب هادئ</button></div>{isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 animate-pulse rounded-[24px] bg-white/60" />)}</div>}{isError && <div className="soft-card rounded-[24px] p-8 text-center text-[#8b536d]">تعذر تحميل النتائج حالياً. حاول مرة أخرى.</div>}{!isLoading && !isError && data.length === 0 && <div className="soft-card rounded-[24px] p-10 text-center"><p className="serif text-3xl text-[#514568]">لا شيء هنا بعد.</p><p className="mt-2 text-sm text-[#8c819f]">جرب اسماً آخر أو ابدأ من المقاطع الرائجة.</p></div>}{!isLoading && data.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map(song => <MusicCard key={song.id} song={song} />)}</div>}</div>;
}
