import { Link, useLocation } from "wouter";
import { Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect, useState, type FormEvent } from "react";
import { applySeo, resetSeo } from "@/lib/seo";
import { workflowLinks } from "@/lib/flow";

const demoQueries = ["والديا سمحولي", "وديلي سلامي يا رايح للحرم", "ميكس تامر عاشور حزين", "حسين لغزال", "الكابلي", "ثويني بيك", "اغنية ميدو بلحبيب", "نجينا", "مدلي رامي صبري", "نعت غازي مؤثر", "حلات زوز", "انشودة الحباب رسول الله", "قالولي شمة قتالة", "ترند الشيل", "موسيقى فيلم عريس", "واهي ذكريات", "أغاني سبيستون", "طبيب شاطر", "سورة الأنبياء", "أغاني مدح الرسول"];

export default function Home() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const { data: trending = [], isLoading } = trpc.catalog.trending.useQuery({ limit: 20 });
  useEffect(() => { applySeo({ title: "تحميل واستماع أغاني عربية — نغمة", description: "اكتشف أغاني وموسيقى عربية، ابحث عن فنان أو ألبوم، وتصفح إصدارات صوتية في مساحة نغمة.", path: "/" }); return resetSeo; }, []);
  const links = trending.length ? trending.map(song => ({ label: song.title, slug: song.slug })) : demoQueries.map(label => ({ label, slug: label }));
  const submit = (event: FormEvent) => { event.preventDefault(); if (query.trim()) navigate(workflowLinks.search(query)); };
  return <main className="reference-home mx-auto max-w-[1080px] px-4 pb-12 pt-4 sm:px-8"><section className="reference-hero"><div className="reference-mark"><span className="mark-orbit">◉</span><strong>نغمة</strong><small>اكتشاف الصوت</small></div><form onSubmit={submit} className="reference-search"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="البحث عن أغنية أو ألبوم أو فنان" /><button type="submit">بحث</button></form><div className="reference-trust"><ShieldCheck size={14} /> نتائج تجريبية آمنة · لا يتم تنزيل محتوى خارجي</div></section><section className="reference-list"><div className="reference-list-heading">نغمة</div>{links.map((item, index) => <Link key={`${item.slug}-${index}`} href={workflowLinks.song(item.slug)} className="reference-list-item"><span>♫</span>{item.label}</Link>)}</section><section className="reference-footer-card"><p>مساحة عربية هادئة لاكتشاف الصوت.</p><div><Link href="/trending">جديد البحث</Link><Link href="/contact">اتصل بنا</Link><Link href="/dmca">طلبات السحب</Link></div></section></main>;
}
