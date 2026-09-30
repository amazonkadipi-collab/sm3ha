import { Download, ExternalLink, ShieldCheck } from "lucide-react";
import { Download, ShieldCheck, ExternalLink } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useState, type FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { workflowLinks } from "@/lib/flow";

function MediaSearchBar() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = query.trim();
    if (value) navigate(workflowLinks.keyword(value));
  };

  return (
    <section className="reference-media-search-wrap" dir="rtl">
      <form onSubmit={submit} className="reference-search" role="search">
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="إبحث عن اغنية او البوم او فنان" aria-label="إبحث عن اغنية او البوم او فنان" />
        <button type="submit">بحث</button>
      </form>
    </section>
  );
}

function MediaFooter() {
  return (
    <footer className="reference-media-footer" dir="rtl">
      <div>
        <Link href="/" title="سمعها">الرئيسية</Link>
        <span> - </span>
        <Link href="/contact" title="اتصل بنا">اتصل بنا</Link>
        <span> - </span>
        <Link href="/dmca" title="DMCA">DMCA</Link>
      </div>
      <div>Powered By <Link href="/" title="Sm3ha">Sm3ha</Link> © 2026</div>
    </footer>
  );
}

export default function MediaPage() {
  const params = new URLSearchParams(useSearch());
  const token = params.get("d") || "";
  const { data: media, isLoading, error } = trpc.catalog.mediaByToken.useQuery(
    { token },
    { enabled: Boolean(token) }
  );

  if (isLoading) {
    return <>
      <MediaSearchBar />
      <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-16 sm:px-8">
        <section className="reference-download-card animate-pulse">
          <div className="h-8 w-40 rounded bg-[#e8eeeb]" />
          <div className="mt-8 h-4 w-72 rounded bg-[#eef2f0]" />
          <div className="mt-3 h-4 w-52 rounded bg-[#eef2f0]" />
          <div className="mt-3 h-4 w-64 rounded bg-[#eef2f0]" />
          <div className="mt-8 h-10 w-44 rounded bg-[#e8eeeb]" />
        </section>
      </main>
      <MediaFooter />
    </>;
  }

  if (error || !media) {
    return <>
      <MediaSearchBar />
      <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8">
        <p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p>
        <Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link>
      </main>
      <MediaFooter />
    </>;
  }

  const downloadUrl = media.sourceAvailable ? workflowLinks.conversion(media.opaqueToken) : "";

  return <>
    <MediaSearchBar />
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-10 pt-3 sm:px-8">
      <section className="reference-download-card">
        <h1>تحميل الملف</h1>
        <ul className="reference-v1-meta">
          <li><strong>كود الملف:</strong> <code dir="ltr">{media.providerVideoId}</code></li>
          <li><strong>المدة:</strong> {media.duration}</li>
          <li><strong>الكوالتي:</strong> {media.sourceAvailable ? media.variants.map((variant: any) => `${String(variant.format).toUpperCase()}@${variant.quality}`).join(" - ") : "غير متاحة حالياً"}</li>
        </ul>
        <div className="reference-v1-downloads">
          {media.sourceAvailable ? (
            <>
              <Link href={downloadUrl} title="Fast Download" className="reference-v1-button"><Download size={15} />DOWNLOAD NOW</Link>
              <Link href={downloadUrl} title="Fast Download" className="reference-v1-button"><Download size={15} />تحميل مباشر</Link>
            </>
          ) : (
            <a
              href={`https://www.youtube.com/watch?v=${encodeURIComponent(media.providerVideoId)}`}
              target="_blank"
              rel="noreferrer"
              className="reference-v1-button"
              title="مشاهدة المصدر"
            >
              <ExternalLink size={15} />مشاهدة المصدر
            </a>
          )}
        </div>
        <section className="reference-v1-article">
          <h2>{media.sourceAvailable ? "خيارات التحميل المتاحة" : "حالة التحميل"}</h2>
          {media.sourceAvailable ? (
            <ul className="space-y-2 text-sm leading-7">
              {media.variants.map((variant: any) => (
                <li key={`${variant.format}-${variant.quality}`}>
                  {String(variant.format).toUpperCase()} · {variant.quality}
                </li>
              ))}
            </ul>
          ) : (
            <p>لا يوجد حالياً مصدر تحميل مصرح به لهذا المحتوى. يمكن فتح المصدر الخارجي للمشاهدة.</p>
          )}
        </section>
        <section className="reference-v1-disclaimer" aria-label="إخلاء مسؤولية">
          <p><ShieldCheck size={15} /><strong>حقوق المحتوى:</strong> التحميل متاح فقط للمصادر المصرح بها في فهرس سمعها؛ أما المصادر الخارجية فتُفتح للمشاهدة فقط.</p>
        </section>
      </section>
    </main>
    <MediaFooter />
  </>;
}
