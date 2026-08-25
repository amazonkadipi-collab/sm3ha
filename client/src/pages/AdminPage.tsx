import { FileUp, Loader2, Plus, Search, ShieldCheck, UploadCloud, Youtube } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout, { AdminLoginCard } from "@/components/DashboardLayout";
import AdminOperations from "@/components/AdminOperations";

type PreviewRow = { title: string; artist: string; slug: string; providerVideoId: string; duplicate: boolean };
type AutoConfig = { enabled: boolean; queries: string[]; maxQueries: number; videosPerQuery: number };

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const [text, setText] = useState("العنوان،الفنان،معرّف_المصدر\nليلة هادئة,نورا الورد,معرّف-تجريبي-ليلة\n");
  const [preview, setPreview] = useState<{ total: number; duplicates: number; rows: PreviewRow[] } | null>(null);
  const [youtubeText, setYoutubeText] = useState("");
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [autoConfig, setAutoConfig] = useState<AutoConfig>({ enabled: false, queries: ["اغاني مغربية", "اغاني عربية", "اغاني راي", "اغاني جديدة", "اغاني ترند"], maxQueries: 5, videosPerQuery: 10 });
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");
  const utils = trpc.useUtils();
  const catalogQuery = trpc.admin.listCatalog.useQuery({ limit: 25 }, { enabled: isAdmin });
  const previewMutation = trpc.admin.previewImport.useMutation({ onSuccess: setPreview });
  const commitMutation = trpc.admin.commitImport.useMutation({ onSuccess: () => utils.admin.listCatalog.invalidate() });
  const statusMutation = trpc.admin.setSongStatus.useMutation({ onSuccess: () => utils.admin.listCatalog.invalidate() });
  const youtubeQueryResult = trpc.youtube.search.useQuery(
    { query: youtubeQuery, limit: 8 },
    { enabled: isAdmin && youtubeQuery.trim().length >= 2 },
  );

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/youtube-auto")
      .then(response => response.ok ? response.json() : Promise.reject(new Error("settings unavailable")))
      .then(data => setAutoConfig({ enabled: Boolean(data.enabled), queries: Array.isArray(data.queries) && data.queries.length ? data.queries : autoConfig.queries, maxQueries: Number(data.maxQueries) || 5, videosPerQuery: Number(data.videosPerQuery) || 10 }))
      .catch(() => setAutoMessage("تعذر تحميل إعدادات الاستيراد التلقائي."));
  }, [isAdmin]);

  const saveAutoConfig = async (runNow = false) => {
    setAutoBusy(true);
    setAutoMessage("");
    try {
      const response = await fetch("/api/admin/youtube-auto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...autoConfig, runNow }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "request failed");
      if (data.result) setAutoMessage(`اكتمل التشغيل: فحص ${data.result.scanned}، جديد ${data.result.newRows}، أضيف ${data.result.accepted}، مكرر ${data.result.duplicates}.`);
      else setAutoMessage("تم حفظ إعدادات الاستيراد التلقائي.");
      await utils.admin.listCatalog.invalidate();
    } catch (error) {
      setAutoMessage(error instanceof Error ? error.message : "تعذر تنفيذ العملية.");
    } finally {
      setAutoBusy(false);
    }
  };

  const runPreview = () => {
    try {
      if (text.trim().startsWith("[")) {
        previewMutation.mutate({ rows: JSON.parse(text) });
        return;
      }
      const lines = text.trim().split("\n").slice(1).filter(Boolean);
      const rows = lines.map(line => {
        const [title, artist, providerVideoId] = line.split(/[,،]/);
        return { title: title?.trim() || "", artist: artist?.trim() || "", providerVideoId: providerVideoId?.trim() || "" };
      }).filter(row => row.title && row.artist && row.providerVideoId);
      previewMutation.mutate({ rows });
    } catch {
      setPreview(null);
    }
  };

  const runYouTubeSearch = (event: FormEvent) => {
    event.preventDefault();
    setYoutubeQuery(youtubeText.trim());
  };

  if (!loading && user && !isAdmin) {
    return <AdminLoginCard />;
  }

  const catalog = Array.isArray(catalogQuery.data) ? catalogQuery.data : [];
  const availableCount = catalog.filter(song => song.status !== "removed").length;
  const hiddenCount = catalog.filter(song => song.status === "removed").length;
  const youtubeCount = catalog.filter(song => song.provider === "youtube").length;

  return <DashboardLayout>
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-8">
      <Link href="/" className="text-sm font-bold text-[#756590]">العودة للموقع</Link>
      <div className="mt-7 flex items-center gap-3"><span className="rounded-2xl bg-[#eee8f7] p-3 text-[#756590]"><ShieldCheck size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">مساحة محمية</p><h1 className="serif text-5xl text-[#514568]">لوحة إدارة الكتالوج</h1></div></div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="soft-card rounded-2xl p-5"><p className="text-xs font-bold text-[#9d8aae]">إجمالي السجلات</p><p className="mt-2 text-3xl font-bold text-[#514568]">{catalogQuery.isLoading ? "—" : catalog.length}</p></div>
        <div className="soft-card rounded-2xl p-5"><p className="text-xs font-bold text-[#9d8aae]">متاح للعامة</p><p className="mt-2 text-3xl font-bold text-[#477363]">{catalogQuery.isLoading ? "—" : availableCount}</p></div>
        <div className="soft-card rounded-2xl p-5"><p className="text-xs font-bold text-[#9d8aae]">مخفي</p><p className="mt-2 text-3xl font-bold text-[#a86f87]">{catalogQuery.isLoading ? "—" : hiddenCount}</p></div>
        <div className="soft-card rounded-2xl p-5"><p className="text-xs font-bold text-[#9d8aae]">YouTube</p><p className="mt-2 text-3xl font-bold text-[#c75670]">{catalogQuery.isLoading ? "—" : youtubeCount}</p></div>
      </section>

      <section className="soft-card mt-10 rounded-[28px] p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-[#514568]">الكتالوج الحالي</h2><p className="mt-1 text-sm text-[#81768f]">عرض وإخفاء السجلات من الواجهة العامة. تغيير الدور يبقى محصوراً في إعدادات الحساب والصلاحيات.</p></div><span className="rounded-full bg-[#effaf5] px-3 py-1 text-xs font-bold text-[#477363]">{catalog.length} سجل</span></div>{catalogQuery.isLoading && <p className="mt-5 text-sm text-[#81768f]">جارٍ تحميل الكتالوج…</p>}{catalogQuery.isError && <div className="mt-5 rounded-2xl border border-[#a86f87]/15 bg-[#fff7f9] p-4 text-sm text-[#a86f87]">تعذر تحميل الكتالوج حالياً. تحقق من جلسة المدير أو اتصال API ثم أعد المحاولة.</div>}{!catalogQuery.isLoading && !catalogQuery.isError && catalog.length === 0 && <div className="mt-5 rounded-2xl bg-[#f6f1fa] p-6 text-center text-sm leading-7 text-[#8c819f]">لا توجد سجلات في الكتالوج بعد.</div>}{!catalogQuery.isLoading && !catalogQuery.isError && catalog.length > 0 && <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[640px] text-right text-sm"><thead className="border-b border-[#756590]/10 text-xs text-[#9d8aae]"><tr><th className="px-3 py-3">العنوان</th><th className="px-3 py-3">المصدر</th><th className="px-3 py-3">الحالة</th><th className="px-3 py-3">إجراء</th></tr></thead><tbody>{catalog.map(song => <tr key={song.slug} className="border-b border-[#756590]/5"><td className="px-3 py-3 font-bold text-[#514568]">{song.title}<span className="block text-xs font-normal text-[#8c819f]">{song.artist}</span></td><td className="px-3 py-3 text-xs text-[#81768f]">{song.provider}</td><td className={`px-3 py-3 text-xs ${song.status === "removed" ? "text-[#a86f87]" : "text-[#477363]"}`}>{song.status === "removed" ? "مخفي" : "متاح"}</td><td className="px-3 py-3"><button type="button" onClick={() => statusMutation.mutate({ slug: song.slug, status: song.status === "removed" ? "available" : "removed" })} disabled={statusMutation.isPending} className="rounded-lg border border-[#a86f87]/20 px-3 py-1.5 text-xs font-bold text-[#a86f87]">{song.status === "removed" ? "استعادة" : "إخفاء"}</button></td></tr>)}</tbody></table></div>}</section>

      <section className="soft-card mt-6 rounded-[28px] p-6">
        <div className="flex items-center gap-3"><Youtube className="text-[#c75670]" size={21} /><div><h2 className="font-bold text-[#514568]">YouTube Auto Catalog</h2><p className="mt-1 text-sm text-[#81768f]">يجلب metadata من YouTube API ويضيف الفيديوهات الجديدة فقط إلى Supabase. لا يتم تنزيل أو استضافة وسائط YouTube.</p></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-[#756590]/10 bg-white/60 p-4 text-sm font-bold text-[#514568]"><input type="checkbox" checked={autoConfig.enabled} onChange={event => setAutoConfig(current => ({ ...current, enabled: event.target.checked }))} />تفعيل الاستيراد التلقائي</label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-[#81768f]">Queries/run<input type="number" min={1} max={10} value={autoConfig.maxQueries} onChange={event => setAutoConfig(current => ({ ...current, maxQueries: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border border-[#756590]/10 px-3 py-2 text-sm" /></label><label className="text-xs font-bold text-[#81768f]">Videos/query<input type="number" min={1} max={25} value={autoConfig.videosPerQuery} onChange={event => setAutoConfig(current => ({ ...current, videosPerQuery: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border border-[#756590]/10 px-3 py-2 text-sm" /></label></div>
        </div>
        <label className="mt-4 block text-xs font-bold text-[#81768f]">Queries ثابتة — ويمكن كذلك استعمال أكثر عمليات البحث الأخيرة من المستخدمين<textarea value={autoConfig.queries.join("\n")} onChange={event => setAutoConfig(current => ({ ...current, queries: event.target.value.split(/\n+/).map(q => q.trim()).filter(Boolean) }))} className="mt-1 min-h-28 w-full rounded-xl border border-[#756590]/10 bg-white/70 p-3 text-sm text-[#514568]" /></label>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => saveAutoConfig(false)} disabled={autoBusy} className="rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">حفظ الإعدادات</button><button type="button" onClick={() => saveAutoConfig(true)} disabled={autoBusy || !autoConfig.enabled} className="rounded-xl border border-[#756590]/20 px-5 py-3 text-sm font-bold text-[#756590] disabled:opacity-50">{autoBusy ? "جارٍ التشغيل…" : "تشغيل الآن"}</button></div>
        {autoMessage && <p className="mt-3 rounded-xl bg-[#effaf5] p-3 text-sm text-[#477363]">{autoMessage}</p>}
      </section>

      <section className="soft-card mt-6 rounded-[28px] p-6">
        <div className="flex items-center gap-3"><Youtube className="text-[#c75670]" size={21} /><div><h2 className="font-bold text-[#514568]">بحث YouTube وإضافة metadata</h2><p className="mt-1 text-sm text-[#81768f]">البحث يتم من السيرفر بالمفتاح السري، والنتائج لا تعني تنزيل أو استضافة الوسائط.</p></div></div>
        <form onSubmit={runYouTubeSearch} className="mt-5 flex gap-2"><input value={youtubeText} onChange={event => setYoutubeText(event.target.value)} placeholder="ابحث عن أغنية أو فنان" className="min-w-0 flex-1 rounded-xl border border-[#756590]/15 bg-white/70 px-4 py-3 text-sm text-[#514568] outline-none focus:border-[#756590]/50" /><button type="submit" disabled={youtubeText.trim().length < 2 || youtubeQueryResult.isFetching} className="inline-flex items-center gap-2 rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Search size={16} />بحث</button></form>
        {youtubeQueryResult.isFetching && <p className="mt-5 flex items-center gap-2 text-sm text-[#81768f]"><Loader2 className="animate-spin" size={16} />جارٍ جلب النتائج…</p>}
        {youtubeQueryResult.isError && <p className="mt-5 rounded-xl bg-[#fff3f5] p-4 text-sm text-[#a86f87]">تعذر جلب النتائج. تحقق من مفتاح YouTube أو الحصة اليومية.</p>}
        {youtubeQueryResult.data && <div className="mt-5 grid gap-3 md:grid-cols-2">{youtubeQueryResult.data.map(item => <div key={item.providerVideoId} className="flex gap-3 rounded-2xl border border-[#756590]/10 bg-white/60 p-3"><img src={item.thumbnailUrl} alt="" className="h-20 w-28 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold text-[#514568]">{item.title}</p><p className="mt-1 truncate text-xs text-[#81768f]">{item.artist} · {formatDuration(item.durationSeconds)}</p><button type="button" onClick={() => commitMutation.mutate({ rows: [{ title: item.title, artist: item.artist || "YouTube", providerVideoId: item.providerVideoId }] })} disabled={commitMutation.isPending} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-[#756590]/20 px-3 py-1.5 text-xs font-bold text-[#756590] disabled:opacity-50"><Plus size={13} />إضافة تجريبية</button></div></div>)}</div>}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_.9fr]"><section className="soft-card rounded-[28px] p-6"><div className="flex items-center gap-3"><FileUp className="text-[#756590]" size={20} /><h2 className="font-bold text-[#514568]">معاينة استيراد CSV/JSON</h2></div><p className="mt-2 text-sm leading-7 text-[#81768f]">أضف العناوين والفنانين والمعرّفات في صيغة جدول. تتم المعاينة والتحقق قبل الإدخال.</p><textarea value={text} onChange={event => setText(event.target.value)} className="mt-5 min-h-48 w-full rounded-2xl border border-[#756590]/10 bg-white/70 p-4 font-mono text-sm text-[#514568] outline-none focus:border-[#756590]/40" /><button onClick={runPreview} disabled={previewMutation.isPending} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><UploadCloud size={16} />{previewMutation.isPending ? "جارٍ الفحص…" : "معاينة البيانات"}</button>{preview && <button onClick={() => commitMutation.mutate({ rows: preview.rows.map(row => ({ title: row.title, artist: row.artist, providerVideoId: row.providerVideoId })) })} disabled={commitMutation.isPending} className="mr-2 mt-4 rounded-xl border border-[#756590]/20 px-5 py-3 text-sm font-bold text-[#756590]">{commitMutation.isPending ? "جارٍ التأكيد…" : "تأكيد الاستيراد التجريبي"}</button>}{commitMutation.data && <p className="mt-3 text-xs text-[#477363]">{commitMutation.data.message}</p>}</section><section className="soft-card rounded-[28px] p-6"><h2 className="font-bold text-[#514568]">نتيجة المعاينة</h2>{!preview ? <div className="mt-8 rounded-2xl bg-[#f6f1fa] p-6 text-center text-sm leading-7 text-[#8c819f]">ستظهر هنا الإحصائيات والتكرارات.</div> : <><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#effaf5] p-4"><p className="text-2xl font-bold text-[#477363]">{preview.total}</p><p className="text-xs text-[#6b8f82]">سطر صالح</p></div><div className="rounded-2xl bg-[#fbf0f4] p-4"><p className="text-2xl font-bold text-[#a86f87]">{preview.duplicates}</p><p className="text-xs text-[#a86f87]">تكرار</p></div></div><div className="mt-5 space-y-2">{preview.rows.map(row => <div key={`${row.slug}-${row.title}`} className="rounded-xl border border-[#756590]/10 p-3 text-sm"><p className="font-bold text-[#514568]">{row.title}</p><p className="text-xs text-[#8c819f]">/{row.slug} {row.duplicate && "· مكرر"}</p></div>)}</div></>}</section></div>
      <AdminOperations />
    </div>
  </DashboardLayout>;
}
