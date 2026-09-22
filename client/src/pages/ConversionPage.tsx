import { CheckCircle2, Download, ExternalLink, FileAudio, FileVideo, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { applySeo, resetSeo } from "@/lib/seo";

const qualityOptions = { mp3: ["128 كيلوبت/ث", "192 كيلوبت/ث", "256 كيلوبت/ث", "320 كيلوبت/ث"], mp4: ["360 بكسل", "480 بكسل", "720 بكسل"] } as const;

export default function ConversionPage() {
  const token = new URLSearchParams(useSearch()).get("v") ?? "";
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [selectedQuality, setSelectedQuality] = useState<string>(qualityOptions.mp3[0]);
  const media = trpc.catalog.mediaByToken.useQuery({ token }, { enabled: Boolean(token) });
  const conversion = trpc.catalog.startConversion.useMutation();

  useEffect(() => {
    applySeo({ title: "تحميل الملف — سمعها", description: "تحميل ملفات مصرح بها فقط.", path: `/videos_dl?v=${encodeURIComponent(token)}`, noindex: true });
    return resetSeo;
  }, [token]);

  const changeFormat = (next: "mp3" | "mp4") => { setFormat(next); setSelectedQuality(qualityOptions[next][0]); conversion.reset(); };
  const selectedVariant = media.data?.variants?.find(variant => variant.format === format);
  const start = () => conversion.mutate({ token, format, quality: selectedQuality });

  if (!token) return <main className="reference-page mx-auto px-4 py-20 text-center"><p className="serif text-4xl text-[#344d49]">مصدر التحويل غير محدد</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;
  if (media.isLoading) return <main className="reference-page mx-auto px-4 py-20"><div className="reference-media h-80 animate-pulse" /></main>;
  if (media.error || !media.data) return <main className="reference-page mx-auto px-4 py-20 text-center"><p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;

  return <main className="reference-page mx-auto px-4 pb-12 pt-8 sm:px-8">
    <Link href="/" className="text-sm font-bold text-[#756590]">العودة للرئيسية</Link>
    <section className="reference-media mt-8">
      <p className="text-xs font-bold uppercase tracking-[.22em] text-[#78938a]">الخطوة الأخيرة</p>
      <h1 className="serif mt-3 text-5xl text-[#344d49]">تحميل الملف</h1>
      <div className="mt-6 space-y-2 border-y border-[#d9dfdc] py-5 text-sm text-[#527566]">
        <p><strong>العنوان:</strong> {media.data.title}</p>
        <p><strong>كود المصدر:</strong> <span dir="ltr">{media.data.providerVideoId}</span></p>
        <p><strong>الحالة:</strong> {media.data.canDownload ? "ملف مصرح به جاهز" : "metadata فقط؛ لا يوجد ملف مصرح به"}</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={() => changeFormat("mp3")} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp3" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"}`}><span className="inline-flex items-center gap-2"><FileAudio size={16} /> MP3</span></button>
        <button onClick={() => changeFormat("mp4")} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp4" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"}`}><span className="inline-flex items-center gap-2"><FileVideo size={16} /> MP4</span></button>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#d9dfdc] bg-white">
        <div className="grid grid-cols-[1fr_auto] border-b border-[#d9dfdc] bg-[#f2f7f4] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-[#78938a]"><span>الجودة</span><span>الحالة</span></div>
        {qualityOptions[format].map(quality => <button key={quality} onClick={() => setSelectedQuality(quality)} className={`grid w-full grid-cols-[1fr_auto] px-5 py-4 text-right text-sm ${selectedQuality === quality ? "bg-[#effaf5] text-[#344d49]" : "text-[#527566]"}`}><span>{quality}</span><span>{selectedQuality === quality ? <CheckCircle2 size={17} className="text-[#4d9478]" /> : "جاهز"}</span></button>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {conversion.data?.downloadUrl ? <a href={conversion.data.downloadUrl} download className="reference-action"><Download size={16} /> DOWNLOAD NOW</a> : <button onClick={start} disabled={selectedVariant?.status !== "ready" || conversion.isPending} className="reference-action disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} />{conversion.isPending ? "جاري التحضير..." : `بدء التحويل ${format.toUpperCase()} — ${selectedQuality}`}</button>}
        <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(media.data.providerVideoId)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d9dfdc] bg-white px-5 py-3 text-sm font-bold text-[#527566]"><ExternalLink size={16} /> مشاهدة المصدر</a>
      </div>
      {conversion.error && <p className="mt-5 border border-[#edcaca] bg-[#fff5f5] p-4 text-sm text-[#9b4b4b]">{conversion.error.message}</p>}
      <p className="mt-7 flex items-start gap-2 text-xs leading-6 text-[#78938a]"><ShieldCheck className="mt-1 shrink-0" size={15} /> التحميل الحقيقي متاح فقط للملفات التي أضافها المشرف كرابط مصرح به MP3/MP4؛ نتائج YouTube تبقى للمشاهدة الرسمية فقط.</p>
    </section>
  </main>;
}
