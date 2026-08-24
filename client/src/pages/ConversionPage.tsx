import { CheckCircle2, Download, FileAudio, FileVideo, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { applySeo, resetSeo } from "@/lib/seo";

export default function ConversionPage() {
  const params = new URLSearchParams(useSearch());
  const videoId = params.get("v") ?? "";
  const [format, setFormat] = useState<"mp3" | "mp4">("mp3");
  const [started, setStarted] = useState(false);
  useEffect(() => { applySeo({ title: "اختيار الصيغة والجودة — نغمة", description: "اختر صيغة صوت أو فيديو في تجربة تحويل توضيحية آمنة داخل نغمة.", path: `/videos_dl?v=${encodeURIComponent(videoId)}`, noindex: true }); return resetSeo; }, [videoId]);

  return <main className="reference-page mx-auto max-w-[1080px] px-4 pb-12 pt-8 sm:px-8"><Link href="/" className="text-sm font-bold text-[#756590]">العودة للرئيسية</Link><section className="reference-media mt-8"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#78938a]">تحويل تجريبي</p><h1 className="serif mt-3 text-5xl text-[#344d49]">اختيار الصيغة والجودة</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#78938a]">هذه صفحة اختيار تشبه خطوة التحويل في الرحلة المرجعية، لكنها لا تجلب ملفاً من YouTube ولا تنشئ نسخة غير مرخصة.</p><div className="mt-8 flex flex-wrap gap-3">{(["mp3", "mp4"] as const).map(item => <button key={item} onClick={() => setFormat(item)} className={`rounded-xl px-5 py-3 text-sm font-bold ${format === item ? "bg-[#3f5c56] text-white" : "border border-[#d9dfdc] bg-white text-[#527566]"}`}>{item === "mp3" ? <span className="inline-flex items-center gap-2"><FileAudio size={16} /> صوت MP3</span> : <span className="inline-flex items-center gap-2"><FileVideo size={16} /> فيديو MP4</span>}</button>)}</div><div className="mt-5 border border-[#d9dfdc] bg-white p-5"><p className="font-bold text-[#344d49]">{format === "mp3" ? "جودة صوت تجريبية — ١٢٨ كيلوبت/ث" : "جودة فيديو تجريبية — ٧٢٠ بكسل"}</p><p className="mt-2 text-xs text-[#78938a]">معرّف المصدر: {videoId || "غير محدد"}</p><button onClick={() => setStarted(true)} className="reference-action mt-5">{started ? <CheckCircle2 size={16} /> : <Download size={16} />}{started ? "تم تجهيز المعاينة" : "بدء التحويل التجريبي"}</button></div>{started && <div className="mt-5 border border-[#b9dfd2] bg-[#effaf5] p-4 text-sm text-[#477363]"><p className="flex items-center gap-2 font-bold"><CheckCircle2 size={16} /> حالة جاهزة</p><p className="mt-1">تم تجهيز نتيجة توضيحية فقط. لا يوجد ملف خارجي ولا رابط تنزيل فعلي.</p></div>}<p className="mt-7 flex items-start gap-2 text-xs leading-6 text-[#78938a]"><ShieldCheck className="mt-1 shrink-0" size={15} /> المحتوى التجريبي لا يتجاوز حماية المصدر ولا يخزن ملفات من YouTube.</p></section></main>;
}
