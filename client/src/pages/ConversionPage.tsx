import { CheckCircle2, Download, ExternalLink, FileAudio, FileVideo, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { applySeo, resetSeo } from "@/lib/seo";
import { trpc } from "@/lib/trpc";

export default function ConversionPage() {
  const params = new URLSearchParams(useSearch());
  const videoId = params.get("v") ?? "";
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [selectedQuality, setSelectedQuality] = useState("128 kbps");
  const [jobId, setJobId] = useState("");
  const [error, setError] = useState("");
  const start = trpc.catalog.startConversion.useMutation();
  const status = trpc.catalog.conversionStatus.useQuery({ jobId }, { enabled: Boolean(jobId), refetchInterval: query => query.state.data?.downloadUrl ? false : 2000 });

  const media = trpc.catalog.mediaByToken.useQuery({ token: videoId }, { enabled: Boolean(videoId) });

  useEffect(() => {
    applySeo({ title: "تحميل الملف — سمعها", description: "اختر الصيغة والجودة للملف المصرح بتنزيله.", path: `/videos_dl?v=${encodeURIComponent(videoId)}`, noindex: true });
    return resetSeo;
  }, [videoId]);

  useEffect(() => {
    if (start.error) setError(start.error.message);
    if (status.error) setError(status.error.message);
  }, [start.error, status.error]);

  const qualities = format === "mp3" ? ["128 kbps", "192 kbps", "256 kbps", "320 kbps"] : ["360p", "480p", "720p"];
  const begin = async () => {
    setError("");
    setJobId("");
    const result = await start.mutateAsync({ token: videoId, format, quality: selectedQuality });
    setJobId(result.id);
  };

  if (!videoId) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">مصدر التحويل غير محدد</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;

  if (media.isLoading) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><Loader2 className="mx-auto animate-spin" /></main>;
  if (media.error || !media.data) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">الملف غير موجود</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;

  const item = media.data;
  const title = item.title;
  const canDownload = Boolean((item as any).sourceAvailable);
  return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
    <Link href="/" className="text-sm font-bold text-[#756590]">العودة للرئيسية</Link>
    <section className="reference-media mt-8">
      <div className="overflow-hidden rounded-2xl border border-[#d9dfdc] bg-white">
        {item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={title} className="aspect-video w-full object-cover" /> : null}
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#78938a]">التحميل</p>
          <h1 className="serif mt-2 text-4xl text-[#344d49]">{title}</h1>
          <p className="mt-2 text-sm text-[#527566]">المدة: {item.duration}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button disabled={!canDownload} onClick={() => { setFormat("mp3"); setSelectedQuality("128 kbps"); }} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp3" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"} disabled:opacity-50`}><FileAudio size={16} className="inline mr-2" /> MP3</button>
        <button disabled={!canDownload} onClick={() => { setFormat("mp4"); setSelectedQuality("360p"); }} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp4" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"} disabled:opacity-50`}><FileVideo size={16} className="inline mr-2" /> MP4</button>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#d9dfdc] bg-white">
        {qualities.map(q => <button key={q} disabled={!canDownload} onClick={() => setSelectedQuality(q)} className={`grid w-full grid-cols-[1fr_auto] px-5 py-4 text-right text-sm ${selectedQuality === q ? "bg-[#effaf5] text-[#344d49]" : "text-[#527566]"} disabled:opacity-50`}><span>{q}</span><span>{selectedQuality === q ? <CheckCircle2 size={17} /> : ""}</span></button>)}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={!canDownload || start.isPending || Boolean(jobId && !status.data?.downloadUrl)} onClick={begin} className="reference-action"><Download size={16} />{start.isPending ? "جاري التحضير..." : status.data?.downloadUrl ? "تحميل الملف" : "بدء التحويل والتحميل"}</button>
        {status.data?.downloadUrl ? <a href={status.data.downloadUrl} download className="reference-action"><Download size={16} /> DOWNLOAD NOW</a> : null}
        <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(item.providerVideoId)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d9dfdc] bg-white px-5 py-3 text-sm font-bold text-[#527566]"><ExternalLink size={16} /> المصدر</a>
      </div>
      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {!canDownload ? <p className="mt-6 rounded-xl border border-[#d9dfdc] bg-white p-4 text-sm leading-6 text-[#78938a]"><ShieldCheck className="inline mr-2" size={15} /> هذا المصدر مسجل كـmetadata فقط. أضف رابط ملف مصرح به في provider_url قبل تفعيل التحميل الحقيقي.</p> : null}
      {jobId && !status.data?.downloadUrl && !error ? <p className="mt-5 text-sm text-[#527566]"><Loader2 className="inline animate-spin mr-2" /> يتم تجهيز الملف ({status.data?.progress ?? 0}%).</p> : null}
    </section>
  </main>;
}
