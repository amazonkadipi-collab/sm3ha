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
  const { data: keywordData, isLoading: keywordsLoading } = trpc.catalog.keywords.useQuery({ limit: 50 });
  const links = (Array.isArray(keywordData) && keywordData.length ? keywordData : fallbackQueries.map(label => ({ label, slug: label })))
    .map((item, index) => ({ label: String(item?.label ?? ""), slug: String(item?.slug ?? item?.label ?? ""), index }))
    .filter(item => item.label && item.slug);

  useEffect(() => {
    applySeo({ title: "سمعها - تحميل اغاني mp3", description: "إبحث عن اغنية او البوم او فنان واكتشف نتائج الوسائط المتاحة عبر سمعها.", path: "/" });
    return resetSeo;
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(workflowLinks.search(value));
  };

  return <div dir="rtl" className="legacy-home">
    <section className="legacy-search-card">
      <h1>سمعها</h1>
      <form onSubmit={submit} className="legacy-search-form" role="search">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="إبحث عن اغنية او البوم او فنان" required />
        <button type="submit">بحث</button>
      </form>
    </section>
    <section className="legacy-keyword-list" aria-label="عمليات البحث">
      <div className="legacy-section-title">جديد البحث</div>
      {keywordsLoading && <div className="legacy-loading">جارٍ تحميل عمليات البحث…</div>}
      {!keywordsLoading && links.map(item => <Link key={`${item.slug}-${item.index}`} href={workflowLinks.keyword(item.label)} className="legacy-keyword-item"><span aria-hidden="true">♪</span>{item.label}</Link>)}
    </section>
  </div>;
}
