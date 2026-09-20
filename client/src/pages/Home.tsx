import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const ARABIC = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/;

const fallbackQueries = [
  "اغاني حسين الامير", "ويلو ياسواد ليلو", "كشوق الليالي لضوء القمر", "غنيه ايباه",
  "اغنية الحروف العربية", "رضا البحراوي كوكتيل", "رمضان كريم الجزء الاول", "من كنه نسهر",
  "فيديو افلون اسود", "نواف جديد", "العب العب", "كل حياتى", "اغاني رامي صبري الجديدة",
  "اديني حب حبه", "اغنية انديلا", "راي", "سارية", "ضيعنا", "عالالا نواف عزيز", "قلبي كي ديرله", "نواف عزيز",
];

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: keywordData } = trpc.catalog.keywords.useQuery({ limit: 50 }, {
    // The Home feed is an enhancement, not a blocking dependency. Keep the
    // local Arabic feed visible while Supabase is loading or unavailable.
    retry: 1,
    staleTime: 60_000,
  });

  const links = useMemo(() => {
    const stored = Array.isArray(keywordData)
      ? keywordData
          .map(item => ({ label: String(item?.label ?? "").trim(), slug: String(item?.slug ?? item?.label ?? "").trim() }))
          .filter(item => item.label && item.slug && ARABIC.test(item.label))
      : [];

    // Never render an empty Home feed just because the catalog request is
    // still pending. This also prevents the old "جارٍ تحميل عمليات البحث…"
    // state from becoming a permanent screen on a slow Supabase connection.
    const fallback = fallbackQueries.map(label => ({ label, slug: label }));
    const merged = [...stored, ...fallback];
    const unique = Array.from(new Map(merged.map(item => [item.slug, item])).values());
    return unique.slice(0, 50).map((item, index) => ({ ...item, index }));
  }, [keywordData]);

  useEffect(() => {
    applySeo({ title: "سمعها - تحميل وإستماع أغاني", description: "إبحث عن اغنية او البوم او فنان", path: "/" });
    return resetSeo;
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(workflowLinks.keyword(value));
  };

  return <main dir="rtl" className="reference-home mx-auto max-w-[1080px] px-4 pb-10 pt-3 sm:px-8">
    <section className="reference-hero">
      <div className="reference-mark"><span className="mark-orbit">♫</span><strong>سمعها</strong><small>إكتشف وإبحث</small></div>
      <form onSubmit={submit} className="reference-search" role="search">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="إبحث عن اغنية او البوم او فنان" />
        <button type="submit">بحث</button>
      </form>
    </section>
    <section className="reference-list" aria-label="عمليات البحث">
      <div className="reference-list-heading">سمعها</div>
      {links.map(item => <Link key={`${item.slug}-${item.index}`} href={workflowLinks.keyword(item.label)} className="reference-list-item"><span>♫</span>{item.label}</Link>)}
    </section>
    <footer className="reference-footer-card">
      <p>سمعها © 2026</p>
      <div><Link href="/">سمعها</Link><Link href="/contact">اتصل بنا</Link><Link href="/dmca">DMCA</Link></div>
    </footer>
  </main>;
}
