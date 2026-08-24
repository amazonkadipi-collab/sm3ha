import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";

export default function SearchPage() {
  const params = new URLSearchParams(useSearch());
  const initial = params.get("q") ?? "";
  const [query, setQuery] = useState(initial);
  const [, navigate] = useLocation();
  const { data = [], isLoading, isError } = trpc.catalog.search.useQuery({ query: initial, limit: 20 });
  useEffect(() => { if (initial && !isLoading && !isError && data.length === 1) navigate(`/s/${data[0].slug}`); }, [initial, isLoading, isError, data, navigate]);
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  return <main className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8"><Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link><div className="reference-page-head"><div><span>البحث</span><h1>نتائجك، بهدوء.</h1></div><form onSubmit={submit} className="reference-search reference-search-small"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" /><button type="submit">بحث</button><Search size={17} /></form></div><section className="reference-results"><div className="reference-results-title">{initial ? `نتائج «${initial}»` : "كل الإصدارات"}</div>{isLoading && <div className="reference-loading">جارٍ تجهيز النتائج…</div>}{isError && <div className="reference-empty">تعذر تحميل النتائج حالياً.</div>}{!isLoading && !isError && data.length === 0 && <div className="reference-empty">لا توجد نتائج مطابقة.</div>}{!isLoading && !isError && data.map(song => <Link key={song.id} href={`/s/${song.slug}`} className="reference-result-row"><span>♫</span><strong>{song.title}</strong><small>{song.artist || "فنان تجريبي"} · {song.duration}</small></Link>)}</section></main>;
}
