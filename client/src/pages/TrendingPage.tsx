import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function TrendingPage() {
  const { data = [], isLoading } = trpc.catalog.recentSearches.useQuery({ limit: 50 });
  return <div className="reference-page mx-auto max-w-5xl px-5 pb-12 pt-8">
    <Link href="/" className="reference-back mb-7">العودة للرئيسية</Link>
    <section className="reference-results">
      <div className="reference-results-title">جديد البحث</div>
      {isLoading ? <div className="reference-loading">جاري تحميل عمليات البحث...</div> : data.length ? data.map((item, index) => (
        <Link key={item.query + index} href={"/s/" + encodeURIComponent(item.query.trim().replace(/\s+/g, "-"))} className="reference-list-item">
          <span>{index + 1}</span>{item.query}
        </Link>
      )) : <div className="reference-empty">لا توجد عمليات بحث حديثة بعد.</div>}
    </section>
  </div>;
}
