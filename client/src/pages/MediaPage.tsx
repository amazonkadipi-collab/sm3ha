import { Download, ShieldCheck } from "lucide-react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { workflowLinks } from "@/lib/flow";

export default function MediaPage() {
  const params = new URLSearchParams(useSearch());
  const token = params.get("d") || "";
  const { data: media, isLoading, error } = trpc.catalog.mediaByToken.useQuery(
    { token },
    { enabled: Boolean(token) }
  );

  if (isLoading) {
    return (
      <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-16 sm:px-8">
        <section className="reference-download-card animate-pulse">
          <div className="h-8 w-40 rounded bg-[#e8eeeb]" />
          <div className="mt-8 h-4 w-72 rounded bg-[#eef2f0]" />
          <div className="mt-3 h-4 w-52 rounded bg-[#eef2f0]" />
          <div className="mt-3 h-4 w-64 rounded bg-[#eef2f0]" />
          <div className="mt-8 h-11 w-full rounded bg-[#e8eeeb]" />
        </section>
      </main>
    );
  }

  if (error || !media) {
    return (
      <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8">
        <p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p>
        <Link href="/" className="mt-5 inline-block font-bold text-[#527566]">
          العودة للرئيسية
        </Link>
      </main>
    );
  }

  const conversionUrl = workflowLinks.conversion(media.providerVideoId);

  return (
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-7 sm:px-8">
      <section className="reference-download-card">
        <h1>تحميل الملف</h1>

        <div className="reference-download-meta" aria-label="معلومات الملف">
          <p><strong>كود الملف:</strong> <code dir="ltr">{media.providerVideoId}</code></p>
          <p><strong>المدة:</strong> {media.duration}</p>
          <p><strong>الكوالتي:</strong> Mp3@128kbps - Mp4@720p/360p</p>
        </div>

        <div className="reference-download-actions">
          <Link href={conversionUrl} className="reference-action">
            <Download size={16} /> DOWNLOAD NOW
          </Link>
          <Link href={conversionUrl} className="reference-direct-action">
            <Download size={16} /> تحميل مباشر
          </Link>
        </div>

        <article className="reference-download-copy">
          <h2>تنزيل خدمات جوجل بلاي</h2>
          <p>
            صفحة التحميل تعرض بيانات الملف والجودة المتاحة قبل الانتقال إلى خطوة التحويل.
            اختر DOWNLOAD NOW أو تحميل مباشر للمتابعة.
          </p>
        </article>

        <section className="reference-download-disclaimer" aria-label="إخلاء مسؤولية">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-1 shrink-0" size={16} />
            إخلاء مسئولية: هذا المحتوى لم يتم إنشاؤه أو استضافته بواسطة موقع سمعها.
            أي استخدام للمصدر الخارجي يخضع لشروط المنصة ومالك المحتوى.
          </p>
          <p className="mt-2">
            للمعلومات أو الاستفسارات، تواصل مع فريق الموقع عبر صفحة الاتصال.
          </p>
        </section>
      </section>
    </main>
  );
}
