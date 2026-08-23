import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";

const demoQueries = ["والديا سمحولي", "وديلي سلامي يا رايح للحرم", "ميكس تامر عاشور حزين", "حسين لغزال", "الكابلي", "ثويني بيك", "اغنية ميدو بلحبيب", "نجينا", "مدلي رامي صبري", "نعت غازي مؤثر", "حلات زوز", "انشودة الحباب رسول الله", "قالولي شمة قتالة", "ترند الشيل", "موسيقى فيلم عريس", "واهي ذكريات", "أغاني سبيستون", "طبيب شاطر", "سورة الأنبياء", "أغاني مدح الرسول"];

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: trending = [], isLoading } = trpc.catalog.trending.useQuery({ limit: 20 });
  const links = trending.length ? trending.map(song => ({ label: song.title, slug: song.slug })) : demoQueries.map(label => ({ label, slug: label }));
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`); };
  return <main className="reference-home mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><section className="reference-hero"><div className="reference-mark"><span className="mark-orbit">◉</span><strong>نغمة</strong><small>اكتشاف الصوت</small></div><form onSubmit={submit} className="reference-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="البحث عن أغنية أو ألبوم أو فنان" /><button type="submit">بحث</button></form><div className="reference-trust"><ShieldCheck size={14} /> نتائج تجريبية آمنة · لا يتم تنزيل محتوى خارجي</div></section><section className="reference-list"><div className="reference-list-heading">نغمة</div>{links.map((item, index) => <Link key={`${item.slug}-${index}`} href={`/s/${item.slug}`} className="reference-list-item"><span>♫</span>{item.label}</Link>)}</section><section className="reference-footer-card"><p>مساحة عربية هادئة لاكتشاف الصوت.</p><div><Link href="/trending">جديد البحث</Link><Link href="/contact">اتصل بنا</Link><Link href="/dmca">طلبات السحب</Link></div></section></main>;
}
