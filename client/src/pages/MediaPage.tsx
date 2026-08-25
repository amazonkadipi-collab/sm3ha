import React from "react";
import { ArrowRight, Download, ShieldCheck } from "lucide-react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { workflowLinks } from "@/lib/flow";

export default function MediaPage() {
  const params = new URLSearchParams(useSearch());
  const token = params.get("d") || "";
  const { data: media, isLoading, error } = trpc.catalog.mediaByToken.useQuery({ token }, { enabled: Boolean(token) });

  if (isLoading) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 sm:px-8"><div className="reference-media h-80 animate-pulse" /></main>;
  if (error || !media) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;

  return <main className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
    <Link href="/" className="reference-back"><ArrowRight size={15} /> العودة للرئيسية</Link>
    <div className="reference-media reference-download-panel">
      <h1>تحميل الملف</h1>
      <div className="reference-file-meta" aria-label="معلومات الملف">
        <p><strong>كود الملف:</strong> <code>{media.providerVideoId}</code></p>
        <p><strong>المدة:</strong> {media.duration}</p>
        <p><strong>الكوالتي:</strong> Mp3@128kbps - Mp4@720p/360p</p>
      </div>
      <div className="reference-download-actions">
        <Link href={workflowLinks.conversion(media.providerVideoId)} className="reference-action"><Download size={16} /> DOWNLOAD NOW</Link>
        <Link href={workflowLinks.conversion(media.providerVideoId)} className="reference-direct-action"><Download size={16} /> تحميل مباشر</Link>
      </div>
      <section className="reference-notice" aria-label="تنبيه قانوني">
        <p><ShieldCheck size={16} /> هذه الواجهة تعرض metadata وروابط مشاهدة رسمية فقط، ولا تستضيف أو تنزّل أي محتوى من YouTube.</p>
        <p>أي استعمال للملف أو المصدر الخارجي يبقى خاضعاً لشروط مالك المحتوى والمنصة الأصلية.</p>
      </section>
    </div>
  </main>;
}
