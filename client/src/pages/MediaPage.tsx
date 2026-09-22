import { ArrowRight, Download, ShieldCheck } from "lucide-react";
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
    return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 sm:px-8"><div className="reference-media h-80 animate-pulse" /></main>;
  }

  if (error || !media) {
    return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;
  }

  const sourceUrl = workflowLinks.conversion(media.providerVideoId);

  return (
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
      <Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link>

      <section className="reference-media reference-download-panel mt-6">
        <h1>تحميل الملف</h1>

        <div className="reference-file-meta" aria-label="معلومات الملف">
          <p><strong>كود الملف:</strong> <code dir="ltr">{media.providerVideoId}</code></p>
          <p><strong>المدة:</strong> {media.duration}</p>
          <p><strong>الكوالتي:</strong> Mp3@128kbps - Mp4@720p/360p</p>
        </div>

        <div className="reference-download-actions">
          <Link href={sourceUrl} className="reference-action">
            <Download size={16} /> DOWNLOAD NOW
          </Link>
          <Link href={sourceUrl} className="reference-direct-action">
            <Download size={16} /> تحميل مباشر
          </Link>
        </div>

        <article className="reference-notice mt-6" aria-label="معلومات الملف">
          <h2 className="font-bold">معلومات عن الملف</h2>
          <p className="mt-2 leading-7">
            يمكنك متابعة الخطوة التالية من خلال صفحة التحويل المرتبطة بالمصدر.
            تعرض هذه الصفحة معلومات الملف والجودة المتاحة قبل المتابعة.
          </p>
          <p className="mt-2 leading-7">
            المصدر: YouTube. لا يتم استضافة محتوى الفيديو الخارجي داخل موقع سمعها.
          </p>
        </article>

        <section className="reference-notice mt-4" aria-label="إخلاء مسؤولية">
          <p className="flex items-start gap-2 leading-7">
            <ShieldCheck className="mt-1 shrink-0" size={16} />
            إخلاء مسئولية: هذا المحتوى لم يتم إنشاؤه أو استضافته بواسطة موقع سمعها.
            أي استعمال للمصدر الخارجي يبقى خاضعاً لشروط مالك المحتوى والمنصة الأصلية.
          </p>
          <p className="mt-2 text-sm leading-6">
            لأي معلومات، تواصل مع فريق الموقع عبر صفحة الاتصال.
          </p>
        </section>
      </section>
    </main>
  );
}
