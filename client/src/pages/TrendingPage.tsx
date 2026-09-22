import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function TrendingPage() {
  const { data = [], isLoading } = trpc.catalog.recentSearches.useQuery({ limit: 50 });
  return <main className="v1-trending" dir="rtl">
    <h1>جديد البحث</h1>
    <div className="v1-trending-list">
      {isLoading ? <div className="v1-trending-state">جاري تحميل عمليات البحث...</div> : data.length ? data.map((item, index) => (
        <Link key={item.query + index} href={"/s/" + encodeURIComponent(item.query.trim().replace(/\s+/g, "-"))} className="v1-trending-item">
          {item.query}
        </Link>
      )) : <div className="v1-trending-state">لا توجد عمليات بحث حديثة بعد.</div>}
    </div>
  </main>;
}
