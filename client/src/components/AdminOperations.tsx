import { useMemo, useState } from "react";
import { BarChart3, FileWarning, ListFilter, Save, Search, Settings2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const tabs = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "search", label: "سجل البحث", icon: Search },
  { key: "dmca", label: "طلبات السحب", icon: FileWarning },
  { key: "settings", label: "الإعدادات", icon: Settings2 },
] as const;

type TabKey = typeof tabs[number]["key"];
const statusLabel: Record<string, string> = { open: "مفتوح", reviewing: "قيد المراجعة", resolved: "تم الحل", rejected: "مرفوض" };

function Empty({ text }: { text: string }) { return <p className="rounded-2xl bg-[#f6f1fa] p-5 text-center text-sm text-[#81768f]">{text}</p>; }

export default function AdminOperations() {
  const [tab, setTab] = useState<TabKey>("analytics");
  const [days, setDays] = useState(30);
  const analytics = trpc.observability.summary.useQuery({ days }, { enabled: tab === "analytics" });
  const [searchFilter, setSearchFilter] = useState("");
  const searchLogs = trpc.observability.searchLogs.useQuery({ query: searchFilter || undefined, limit: 25, offset: 0 }, { enabled: tab === "search" });
  const [takedownStatus, setTakedownStatus] = useState<"open" | "reviewing" | "resolved" | "rejected" | undefined>();
  const takedowns = trpc.observability.takedowns.useQuery({ status: takedownStatus, limit: 25, offset: 0 }, { enabled: tab === "dmca" });
  const settings = trpc.observability.settings.useQuery(undefined, { enabled: tab === "settings" });
  const updateTakedown = trpc.observability.updateTakedown.useMutation({ onSuccess: () => takedowns.refetch() });
  const updateSettings = trpc.observability.updateSettings.useMutation({ onSuccess: () => settings.refetch() });
  const settingsRows = useMemo(() => settings.data?.rows ?? [], [settings.data]);
  const [draftSettings, setDraftSettings] = useState<Record<string, string>>({});

  return <section className="soft-card mt-6 rounded-[28px] p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#9d8aae]">تشغيل حقيقي</p><h2 className="mt-1 text-xl font-bold text-[#514568]">المراقبة والإدارة</h2><p className="mt-1 text-sm text-[#81768f]">بيانات محفوظة في Supabase، بدون أرقام تجريبية أو سجلات وهمية.</p></div><div className="flex items-center gap-2 rounded-xl bg-[#f6f1fa] p-1">{tabs.map(item => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${tab === item.key ? "bg-white text-[#756590] shadow-sm" : "text-[#81768f]"}`}><item.icon size={14} />{item.label}</button>)}</div></div>

    {tab === "analytics" && <div className="mt-6 space-y-5">{analytics.isLoading ? <Empty text="جارٍ تحميل Analytics…" /> : !analytics.data?.available ? <Empty text="قاعدة البيانات غير متاحة حالياً." /> : <><div className="flex items-center justify-between"><span className="text-sm text-[#81768f]">الفترة الزمنية</span><select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded-xl border border-[#756590]/15 bg-white px-3 py-2 text-sm text-[#514568]"><option value={7}>آخر 7 أيام</option><option value={30}>آخر 30 يوماً</option><option value={90}>آخر 90 يوماً</option></select></div><div className="grid gap-3 sm:grid-cols-3"><Metric label="الأحداث" value={analytics.data.totalEvents} /><Metric label="الجلسات المميزة" value={analytics.data.uniqueSessions} /><Metric label="عمليات البحث" value={analytics.data.topSearches.reduce((sum, item) => sum + item.count, 0)} /></div><div className="grid gap-4 md:grid-cols-3"><Rank title="أنواع الأحداث" rows={analytics.data.eventBreakdown} /><Rank title="أكثر الصفحات" rows={analytics.data.topPaths} /><Rank title="أكثر عمليات البحث" rows={analytics.data.topSearches} /></div></>}</div>}

    {tab === "search" && <div className="mt-6 space-y-4"><div className="flex gap-2"><input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="فلترة كلمة البحث" className="min-w-0 flex-1 rounded-xl border border-[#756590]/15 bg-white px-4 py-3 text-sm text-[#514568]" /><button type="button" onClick={() => searchLogs.refetch()} className="inline-flex items-center gap-2 rounded-xl bg-[#756590] px-4 py-3 text-sm font-bold text-white"><ListFilter size={15} />تصفية</button></div>{searchLogs.data?.rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-right text-sm"><thead className="border-b border-[#756590]/10 text-xs text-[#9d8aae]"><tr><th className="px-3 py-3">البحث</th><th className="px-3 py-3">النتائج</th><th className="px-3 py-3">المسار</th><th className="px-3 py-3">التاريخ</th></tr></thead><tbody>{searchLogs.data.rows.map(row => <tr key={row.id} className="border-b border-[#756590]/5"><td className="px-3 py-3 font-bold text-[#514568]">{row.query}</td><td className="px-3 py-3 text-[#477363]">{row.result_count}</td><td className="px-3 py-3 text-xs text-[#81768f]">{row.path}</td><td className="px-3 py-3 text-xs text-[#81768f]">{new Date(row.created_at).toLocaleString("ar-MA")}</td></tr>)}</tbody></table></div> : <Empty text="لا توجد عمليات بحث محفوظة بعد." />}</div>}

    {tab === "dmca" && <div className="mt-6 space-y-4"><div className="flex items-center justify-between"><p className="text-sm text-[#81768f]">طلبات السحب القانونية المحفوظة</p><select value={takedownStatus ?? "all"} onChange={e => setTakedownStatus(e.target.value === "all" ? undefined : e.target.value as typeof takedownStatus)} className="rounded-xl border border-[#756590]/15 bg-white px-3 py-2 text-sm text-[#514568]"><option value="all">كل الحالات</option>{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>{takedowns.data?.rows.length ? <div className="space-y-3">{takedowns.data.rows.map(row => <div key={row.id} className="rounded-2xl border border-[#756590]/10 bg-white/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-[#514568]">{row.claimant_name}</p><p className="text-xs text-[#81768f]">{row.claimant_email} · {new Date(row.created_at).toLocaleString("ar-MA")}</p><p className="mt-3 max-w-2xl text-sm leading-7 text-[#514568]">{row.reason}</p>{row.evidence_url && <a className="mt-2 block text-xs text-[#756590] underline" href={row.evidence_url} target="_blank" rel="noreferrer">عرض الإثبات</a>}</div><select value={row.status} onChange={e => updateTakedown.mutate({ id: row.id, status: e.target.value as "open" | "reviewing" | "resolved" | "rejected" })} disabled={updateTakedown.isPending} className="rounded-xl border border-[#756590]/15 bg-white px-3 py-2 text-sm text-[#514568]">{Object.entries(statusLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div>)}</div> : <Empty text="لا توجد طلبات سحب حالياً." />}</div>}

    {tab === "settings" && <div className="mt-6 space-y-4">{settingsRows.length ? <>{settingsRows.map(row => { const value = draftSettings[row.key] ?? row.value; return <label key={row.key} className="block rounded-2xl border border-[#756590]/10 bg-white/60 p-4"><span className="text-sm font-bold text-[#514568]">{row.key}</span><span className="mt-1 block text-xs text-[#81768f]">{row.description ?? "إعداد تشغيلي"}</span><input value={value} onChange={e => setDraftSettings(current => ({ ...current, [row.key]: e.target.value }))} className="mt-3 w-full rounded-xl border border-[#756590]/15 bg-white px-3 py-2 text-sm text-[#514568]" /></label>})}<button type="button" onClick={() => updateSettings.mutate({ rows: settingsRows.map(row => ({ key: row.key, value: draftSettings[row.key] ?? row.value })) })} disabled={updateSettings.isPending} className="inline-flex items-center gap-2 rounded-xl bg-[#756590] px-5 py-3 text-sm font-bold text-white"><Save size={15} />{updateSettings.isPending ? "جارٍ الحفظ…" : "حفظ الإعدادات"}</button></> : <Empty text="لا توجد إعدادات محفوظة أو قاعدة البيانات غير متاحة." />}</div>}
  </section>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl bg-[#effaf5] p-4"><p className="text-2xl font-bold text-[#477363]">{value}</p><p className="mt-1 text-xs text-[#6b8f82]">{label}</p></div>; }
function Rank({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) { return <div className="rounded-2xl border border-[#756590]/10 p-4"><h3 className="font-bold text-[#514568]">{title}</h3>{rows.length ? <div className="mt-3 space-y-2">{rows.slice(0, 6).map(row => <div key={row.label} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-[#81768f]">{row.label}</span><strong className="text-[#756590]">{row.count}</strong></div>)}</div> : <p className="mt-3 text-xs text-[#9d8aae]">لا توجد بيانات بعد.</p>}</div>; }
