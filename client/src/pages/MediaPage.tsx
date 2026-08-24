import { Download, FileAudio, FileVideo, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";

export default function MediaPage() {
  const params = new URLSearchParams(useSearch());
  const token = params.get("d") || "";
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const { data: media, isLoading, error } = trpc.catalog.mediaByToken.useQuery({ token }, { enabled: Boolean(token) });

  if (isLoading) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 sm:px-8"><div className="reference-media h-80 animate-pulse" /></main>;
  if (error || !media) return <main className="reference-page mx-auto max-w-[1080px] px-4 py-20 text-center sm:px-8"><p className="serif text-4xl text-[#344d49]">الرابط غير صالح أو منتهي</p><Link href="/" className="mt-4 inline-block font-bold text-[#527566]">العودة للرئيسية</Link></main>;

  return <main className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8"><div className="reference-media"><div className="flex items-start gap-4"><FileAudio className="mt-1 rounded-xl bg-[#eef4f0] p-3 text-[#3f5c56]" size={52} /><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#78938a]">مساحة الوسائط</p><h1>{media.title}</h1><p className="mt-1 text-sm text-[#78938a]">{media.artist || "فنان تجريبي"} · {media.duration}</p></div></div><div className="media-code"><span className="font-bold">كود الملف:</span> {media.opaqueToken}</div><div className="media-tabs">{(["mp3", "mp4"] as const).map(item => <button key={item} onClick={() => setFormat(item)} className={format === item ? "active" : ""}>{item === "mp3" ? <span className="inline-flex items-center gap-2"><FileAudio size={16} /> صوت</span> : <span className="inline-flex items-center gap-2"><FileVideo size={16} /> فيديو</span>}</button>)}</div><div className="mt-4 flex items-center justify-between border border-[#d9dfdc] bg-white p-4"><div><p className="font-bold text-[#344d49]">{format === "mp3" ? "جودة صوت تجريبية — ١٢٨ كيلوبت/ث" : "جودة فيديو تجريبية — ٧٢٠ بكسل"}</p><p className="text-xs text-[#78938a]">ملف توضيحي مصرح · الخطوة التالية اختيار الصيغة</p></div><Link href={`/videos_dl?v=${encodeURIComponent(media.providerVideoId)}`} className="reference-action"><Download size={16} /> متابعة التحويل التجريبي</Link></div><p className="mt-7 flex items-start gap-2 text-xs leading-6 text-[#78938a]"><ShieldCheck className="mt-1 shrink-0" size={15} /> لا يتم جلب أو تنزيل أي محتوى من مصادر خارجية. هذه الواجهة تعرض تجربة ملفات تجريبية مصرح بها فقط.</p></div></main>;
}
