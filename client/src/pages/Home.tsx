import { Link, useLocation } from "wouter";
import { Search, ShieldCheck, Sparkles, Music2, ArrowLeft } from "lucide-react";
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
  return <main dir="rtl" className="min-h-screen bg-[#f8f6fb] text-[#30263d]">
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-8">
      <header className="flex items-center justify-between border-b border-[#6f5a8a]/10 pb-5">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#5d4678] text-xl text-white shadow-lg shadow-[#5d4678]/15">♫</span>
          <span><strong className="block text-xl tracking-tight text-[#453452]">نغمة</strong><small className="text-[11px] text-[#897d94]">اكتشاف الصوت</small></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#756b7d] sm:flex"><Link href="/trending" className="transition hover:text-[#5d4678]">الأكثر بحثاً</Link><Link href="/contact" className="transition hover:text-[#5d4678]">اتصل بنا</Link></nav>
      </header>

      <section className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#4d3865] via-[#654d7d] to-[#82658f] px-6 py-14 text-white shadow-2xl shadow-[#5d4678]/15 sm:px-12 sm:py-20">
        <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" /><div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#d8c5e8]/15 blur-3xl" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/85"><Sparkles size={14} /> مساحة عربية لاكتشاف الصوت</div>
          <h1 className="serif text-4xl font-bold leading-tight sm:text-6xl">لقا الأغنية اللي<br /><span className="text-[#eadcf3]">كتقلب عليها</span></h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">ابحث عن أغنية، فنان أو ألبوم واكتشف نتائج موسيقية مرتبة في تجربة بسيطة وسريعة.</p>
          <form onSubmit={submit} className="mx-auto mt-8 flex max-w-2xl rounded-2xl bg-white p-2 shadow-xl">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="إبحث عن أغنية أو ألبوم أو فنان" aria-label="البحث عن أغنية أو ألبوم أو فنان" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-right text-sm text-[#3b3045] outline-none placeholder:text-[#a69dab]" />
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-[#5d4678] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#49365f]"><Search size={17} />بحث</button>
          </form>
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/60"><ShieldCheck size={14} /> نتائج آمنة · لا يتم تنزيل محتوى خارجي</div>
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#a08fac]">اكتشف الآن</p><h2 className="mt-1 text-2xl font-bold text-[#453452]">الأكثر بحثاً</h2></div><Link href="/trending" className="flex items-center gap-1 text-sm font-bold text-[#6b5181]">عرض الكل <ArrowLeft size={15} /></Link></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{links.map((item, index) => <Link key={`${item.slug}-${index}`} href={workflowLinks.song(item.slug)} className="group flex items-center gap-3 rounded-2xl border border-[#6f5a8a]/8 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6f5a8a]/20 hover:shadow-md"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f0ebf5] text-[#76578b]"><Music2 size={17} /></span><span className="min-w-0 truncate text-sm font-semibold text-[#51465a]">{item.label}</span></Link>)}</div>
        {isLoading && <p className="mt-5 text-center text-sm text-[#928798]">جارٍ تحميل الاقتراحات…</p>}
      </section>

      <section className="mt-12 rounded-[28px] border border-[#6f5a8a]/10 bg-white px-6 py-8 text-center shadow-sm"><p className="font-bold text-[#51405f]">نغمة — اكتشف الصوت بطريقة أبسط.</p><p className="mt-2 text-sm text-[#8d8193]">مساحة عربية للبحث واكتشاف الأغاني والموسيقى.</p><div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-[#756a7d]"><Link href="/trending" className="hover:text-[#5d4678]">جديد البحث</Link><Link href="/contact" className="hover:text-[#5d4678]">اتصل بنا</Link><Link href="/dmca" className="hover:text-[#5d4678]">طلبات السحب</Link></div></section>
    </div>
  </main>;
}
