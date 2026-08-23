import { Link } from "wouter";
import { ArrowUpLeft, Clock3, Disc3 } from "lucide-react";

type Song = { title: string; artist: string; album: string; slug: string; thumbnailUrl?: string | null; duration?: string; mediaUrl?: string; };

export function MusicCard({ song, compact = false }: { song: Song; compact?: boolean }) {
  return <article className={`soft-card group flex items-center gap-4 rounded-[24px] p-3 transition duration-200 hover:-translate-y-1 hover:shadow-xl ${compact ? "" : "p-4"}`}>
    <img src={song.thumbnailUrl || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80"} alt="" className={`${compact ? "h-14 w-14" : "h-20 w-20"} rounded-2xl object-cover`} loading="lazy" />
    <div className="min-w-0 flex-1"><Link href={`/s/${song.slug}`} className="block truncate font-bold text-[#514568] hover:text-[#756590]">{song.title}</Link><p className="mt-1 truncate text-sm text-[#8c819f]">{song.artist || "فنان تجريبي"}</p><div className="mt-2 flex items-center gap-3 text-xs text-[#a49aaf]"><span className="inline-flex items-center gap-1"><Disc3 size={12} /> {song.album || "إصدار تجريبي"}</span><span className="inline-flex items-center gap-1"><Clock3 size={12} /> {song.duration || "--:--"}</span></div></div>
    <Link href={`/s/${song.slug}`} className="rounded-full bg-[#eee8f7] p-2 text-[#756590] opacity-70 transition group-hover:opacity-100" aria-label={`فتح ${song.title}`}><ArrowUpLeft size={18} /></Link>
  </article>;
}

export function SectionHeading({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) { return <div className="mb-5 flex items-end justify-between"><div><p className="mb-1 text-xs font-bold uppercase tracking-[.22em] text-[#9d8aae]">{eyebrow}</p><h2 className="serif text-3xl text-[#514568]">{title}</h2></div>{href && <Link href={href} className="text-sm font-bold text-[#756590] hover:underline">عرض الكل</Link>}</div>; }
