import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, type FormEvent } from "react";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const fallbackQueries = [
  "اغاني حسين الامير", "ويلو ياسواد ليلو", "كشوق الليالي لضوء القمر", "غنيه ايباه",
  "اغنية الحروف العربية", "رضا البحراوي كوكتيل", "رمضان كريم الجزء الاول", "من كنه نسهر",
  "فيديو افلون اسود", "نواف جديد", "العب العب", "كل حياتى", "اغاني رامي صبري الجديدة",
  "اديني حب حبه", "اغنية انديلا", "راي", "سارية", "ضيعنا", "عالالا نواف عزيز", "قلبي كي ديرله", "نواف عزيز",
];

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: keywordData, isLoading: keywordsLoading } = trpc.catalog.keywords.useQuery({ limit: 20 });
  const { data: trendingData } = trpc.catalog.trending.useQuery({ limit: 20 });
  const storedKeywords = Array.isArray(keywordData) ? keywordData.map((item) => ({ label: String(item?.label ?? ""), slug: String(item?.slug ?? "") })).filter((item) => item.label && item.slug) : [];
  const trendingLinks = Array.isArray(trendingData) ? trendingData.map((song) => ({ label: String(song?.title ?? ""), slug: String(song?.slug ?? "") })).filter((item) => item.label && item.slug) : [];
  const fallbackLinks = fallbackQueries.map((label) => ({ label, slug: label }));
  const links = Array.from(new Map((storedKeywords.length ? storedKeywords : trendingLinks.length ? trendingLinks : fallbackLinks).map((item) => [item.slug, item])).values());

  useEffect(() => {
    applySeo({ title: "نغمة — تحميل واستماع أغاني عربية", description: "ابحث عن أغنية أو ألبوم أو فنان واكتشف نتائج موسيقية عربية.", path: "/" });
    return resetSeo;
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(workflowLinks.search(value));
  };

  return <main dir="rtl" className="reference-home mx-auto max-w-[1080px] px-4 pb-10 pt-3 sm:px-8">
    <section className="reference-hero"><div className="reference-mark"><span className="mark-orbit">♫</span><strong>نغمة</strong><small>اكتشاف الصوت</small></div><form onSubmit={submit} className="reference-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="البحث عن أغنية أو ألبوم أو فنان" /><button type="submit">بحث</button></form></section>
    <section className="reference-list" aria-label="الأكثر بحثاً"><div className="reference-list-heading">نغمة</div>{keywordsLoading && <div className="reference-loading">جارٍ تحميل الكلمات الأكثر بحثاً…</div>}{!keywordsLoading && links.map((item, index) => <Link key={`${item.slug}-${index}`} href={workflowLinks.song(item.slug)} className="reference-list-item"><span>♫</span>{item.label}</Link>)}</section>
    <footer className="reference-footer-card"><p>مساحة عربية لاكتشاف الأغاني والموسيقى.</p><div><Link href="/">نغمة</Link><Link href="/contact">اتصل بنا</Link><Link href="/dmca">DMCA</Link></div></footer>
  </main>;
}
