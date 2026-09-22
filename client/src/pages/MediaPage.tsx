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
          <div className="mt-8 h-10 w-44 rounded bg-[#e8eeeb]" />
        </section>
      </main>
    );
  }

  if (error || !media) {
    return (
      <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8">
        <p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p>
        <Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link>
      </main>
    );
  }

  const downloadUrl = workflowLinks.conversion(media.providerVideoId);

  return (
    <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-10 pt-7 sm:px-8">
      <section className="reference-download-card">
        <h1>تحميل الملف</h1>

        <ul className="reference-v1-meta">
          <li><strong>كود الملف:</strong> <code dir="ltr">{media.providerVideoId}</code></li>
          <li><strong>المدة:</strong> {media.duration}</li>
          <li><strong>الكوالتي:</strong> Mp3@128kbps - Mp4@720p/360p</li>
        </ul>

        <div className="reference-v1-downloads">
          <Link href={downloadUrl} title="Fast Download" className="reference-v1-button">
            <Download size={15} />
            DOWNLOAD NOW
          </Link>
          <Link href={downloadUrl} title="Fast Download" className="reference-v1-button">
            <Download size={15} />
            تحميل مباشر
          </Link>
        </div>

        <article className="reference-v1-article">
          <h2>تنزيل خدمات جوجل بلاي</h2>
          <p>
            جوجل بلاي Google Play سابقاً سوق أندرويد هي خدمة توزيع رقمية يتم تشغيلها
            وتطويرها بواسطة جوجل. وهو بمثابة متجر التطبيقات الرسميّ للأجهزة المُعتمدة
            التي تعمل على نظام التشغيل أندرويد، ممَّا يسمح للمستخدمين بتصفح وتنزيل
            التطبيقات التي تمَّ تطويرها بِاستخدام مجموعة تطوير برامج أندرويد ونشرها عبر جوجل.
          </p>
          <p>
            ومع ذلك، يتم تثبيته افتراضيًا في جميع أجهزة أندرويد، كما يحصل على تحديثات منتظمة،
            وعدد الأذونات التي يتطلب الوصول إليها كبير جدًا، حيث يصل إلى كل شيء تقريبًا.
            باختصار هو تطبيق يرتبط ارتباطًا وثيقًا بنظام أندرويد نفسه ويمكن ايضاً من خلالة
            تحميل الافلام وتحميل الالعاب.
          </p>
          <p>
            أي معلومات، لا تتردد في الاتصال بنا على: 4shareinfotv@gmail.com
          </p>
        </article>

        <section className="reference-v1-disclaimer" aria-label="إخلاء مسؤولية">
          <p>
            <ShieldCheck size={15} />
            <strong>إخلاء مسئولية:</strong> هذا المحتوى لم يتم انشائه او استضافته بواسطة
            موقع سمعها وأي مسئولية قانونية تقع على عاتق الطرف الثالث
          </p>
        </section>

        <footer className="reference-v1-footer">
          <Link href="/" title="سمعها">سمعها</Link>
          <span> - </span>
          <Link href="/contact" title="اتصل بنا">اتصل بنا</Link>
          <span> - </span>
          <Link href="/dmca" title="DMCA">DMCA</Link>
          <div>Powered By <Link href="/" title="Sm3ha">Sm3ha</Link> © 2026</div>
        </footer>
      </section>
    </main>
  );
}
