import { Download, ExternalLink, FileAudio, FileVideo, Loader2, PlayCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { applySeo, resetSeo } from "@/lib/seo";

type MediaLink = { url: string; format: "mp3" | "mp4"; quality: string; bitrate?: number; size?: number };
type MediaInfo = { videoId: string; url: string; title: string; thumbnail: string; durationSeconds: number; audio: MediaLink[]; video: MediaLink[] };

function duration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const value = Math.round(seconds);
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;
  return h > 0 ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ConversionPage() {
  const params = new URLSearchParams(useSearch());
  const videoId = params.get("v") ?? "";
  const [info, setInfo] = useState<MediaInfo | null>(null);
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [loading, setLoading] = useState(Boolean(videoId));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    applySeo({
      title: info ? `تحميل ${info.title} Mp3 Mp4 — سمعها` : "تحميل الفيديو — سمعها",
      description: info ? `تحميل ${info.title} بصيغ MP3 و MP4.` : "صفحة تحميل الفيديو.",
      path: `/videos_dl?v=${encodeURIComponent(videoId)}`,
      noindex: true,
    });
    return resetSeo;
  }, [videoId, info]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!videoId) { setLoading(false); return; }
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/youtube/info?v=${encodeURIComponent(videoId)}`);
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "تعذر جلب معلومات الفيديو");
        if (!cancelled) {
          setInfo(payload);
          setFormat(payload.audio?.length ? "mp3" : "mp4");
          setSelectedQuality(payload.audio?.[0]?.quality || payload.video?.[0]?.quality || "");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "تعذر جلب معلومات الفيديو");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [videoId]);

  const links = useMemo(() => format === "mp3" ? info?.audio ?? [] : info?.video ?? [], [format, info]);

  useEffect(() => {
    if (links.length && !links.some(link => link.quality === selectedQuality)) setSelectedQuality(links[0].quality);
  }, [links, selectedQuality]);

  const beginDownload = async () => {
    if (!videoId || !selectedQuality) return;
    setDownloading(true);
    setError("");
    try {
      const query = new URLSearchParams({ v: videoId, format, quality: selectedQuality });
      const response = await fetch(`/api/youtube/download?${query.toString()}`);
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || "لم يتم العثور على رابط التحميل");
      const anchor = document.createElement("a");
      anchor.href = payload.url;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.download = "";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر بدء التحميل");
    } finally {
      setDownloading(false);
    }
  };

  if (!videoId) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">مصدر التحميل غير محدد</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;
  if (loading) return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><Loader2 className="mx-auto animate-spin" /><p className="mt-4 text-sm text-[#527566]">جاري جلب معلومات الفيديو…</p></main>;
  if (error && !info) return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-3xl text-[#344d49]">تعذر تحميل الفيديو</p><p className="mx-auto mt-4 max-w-xl rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p><a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 font-bold text-[#527566]"><ExternalLink size={16} /> فتح في YouTube</a></main>;

  const title = info?.title || `YouTube ${videoId}`;
  return <main dir="rtl" className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8">
    <Link href="/" className="text-sm font-bold text-[#756590]">العودة للرئيسية</Link>
    <section className="reference-media mt-8">
      <div className="overflow-hidden rounded-2xl border border-[#d9dfdc] bg-white">
        {info?.thumbnail ? <img src={info.thumbnail} alt={title} className="aspect-video w-full object-cover" /> : null}
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#78938a]">تحميل الفيديو</p>
          <h1 className="serif mt-2 text-3xl leading-tight text-[#344d49]">{title}</h1>
          <p className="mt-2 text-sm text-[#527566]">المدة: {duration(info?.durationSeconds ?? 0)} · كود الفيديو: {videoId}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => setFormat("mp3")} disabled={!info?.audio.length} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp3" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"} disabled:opacity-40`}><FileAudio size={16} className="inline mr-2" /> MP3</button>
        <button onClick={() => setFormat("mp4")} disabled={!info?.video.length} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === "mp4" ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"} disabled:opacity-40`}><FileVideo size={16} className="inline mr-2" /> MP4</button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#d9dfdc] bg-white">
        {links.length ? links.map(link => <button key={`${link.url}-${link.quality}`} onClick={() => setSelectedQuality(link.quality)} className={`grid w-full grid-cols-[1fr_auto] px-5 py-4 text-right text-sm ${selectedQuality === link.quality ? "bg-[#effaf5] text-[#344d49]" : "text-[#527566]"}`}><span>{link.quality}</span><span>{selectedQuality === link.quality ? "✓" : ""}</span></button>) : <p className="p-5 text-sm text-[#78938a]">لا توجد صيغة {format.toUpperCase()} متاحة حالياً لهذا الفيديو.</p>}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button disabled={!selectedQuality || downloading || !links.length} onClick={beginDownload} className="reference-action"><Download size={16} />{downloading ? "جاري تجهيز التحميل..." : "DOWNLOAD NOW"}</button>
        <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#d9dfdc] bg-white px-5 py-3 text-sm font-bold text-[#527566]"><PlayCircle size={16} /> مشاهدة في YouTube</a>
      </div>

      {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      <p className="mt-6 rounded-xl border border-[#d9dfdc] bg-white p-4 text-sm leading-6 text-[#78938a]">التحميل يتم عبر مزود RapidAPI الموجود في إعدادات الخادم. تأكد من أن لديك الحق في تنزيل وإعادة استخدام المحتوى المطلوب.</p>
    </section>
  </main>;
}
