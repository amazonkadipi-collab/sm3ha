import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import SearchPage from "@/pages/SearchPage";
import SongPage from "@/pages/SongPage";
import MediaPage from "@/pages/MediaPage";
import ConversionPage from "@/pages/ConversionPage";
import TrendingPage from "@/pages/TrendingPage";
import LegalPage from "@/pages/LegalPage";
import AdminPage from "@/pages/AdminPage";
import ArtistPage from "@/pages/ArtistPage";
import ArtistsPage from "@/pages/ArtistsPage";
import { Route, Switch, Link, useLocation } from "wouter";
import { Moon, Sun, Menu, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const track = trpc.observability.track.useMutation();
  useEffect(() => {
    void track.mutate({ eventName: "page_view", path: window.location.pathname, metadata: { title: document.title } });
  }, [location]);
  return <div className="naghma-shell">
    <header className="reference-header mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3 text-decoration-none" onClick={() => setMenuOpen(false)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#756590] text-white shadow-lg shadow-[#756590]/20"><Sparkles size={18} /></span>
        <span className="wordmark"><span className="serif block text-[1.5rem] font-semibold leading-none tracking-tight text-[#433857]">نغمة</span><span className="mt-1 block text-[9px] font-bold tracking-[.18em] text-[#756590]">اكتشاف الصوت</span></span>
      </Link>
      <nav aria-label="التنقل الرئيسي" className={`${menuOpen ? "flex" : "hidden"} absolute right-5 top-[4.5rem] z-30 flex-col gap-4 rounded-2xl border border-[#756590]/10 bg-white p-5 shadow-xl md:static md:flex md:flex-row md:items-center md:gap-7 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}>
        <Link href="/" className="text-sm font-semibold text-[#6f628f] transition-colors hover:text-[#3d3556]" onClick={() => setMenuOpen(false)}>الرئيسية</Link>
        <Link href="/trending" className="text-sm font-semibold text-[#6f628f] transition-colors hover:text-[#3d3556]" onClick={() => setMenuOpen(false)}>جديد البحث</Link>
      </nav>
      <div className="flex items-center gap-1"><button className="rounded-full p-2 text-[#6f628f] transition-colors hover:bg-white/70" aria-label="تبديل المظهر" onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="rounded-full p-2 text-[#6f628f] transition-colors hover:bg-white/70 md:hidden" aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><Menu size={20} /></button></div>
    </header>
    <main>{children}</main>
    <footer className="reference-footer mx-auto mt-20 flex max-w-6xl flex-col gap-5 border-t border-[#6f628f]/10 px-5 py-8 text-sm text-[#8c819f] sm:flex-row sm:items-center sm:justify-between sm:px-8"><span>© 2026 نغمة — مساحة عربية هادئة لاكتشاف الصوت.</span><div className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/trending">جديد البحث</Link><Link href="/contact">اتصل بنا</Link><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link><Link href="/dmca">طلبات السحب</Link></div></footer>
  </div>;
}

function Router() { return <PublicLayout><Switch><Route path="/" component={Home} /><Route path="/search" component={SearchPage} /><Route path="/s/:slug" component={SongPage} /><Route path="/artists" component={ArtistsPage} /><Route path="/artists/:slug" component={ArtistPage} /><Route path="/media" component={MediaPage} /><Route path="/videos_dl" component={ConversionPage} /><Route path="/trending" component={TrendingPage} /><Route path="/privacy" component={() => <LegalPage kind="privacy" />} /><Route path="/terms" component={() => <LegalPage kind="terms" />} /><Route path="/dmca" component={() => <LegalPage kind="dmca" />} /><Route path="/contact" component={() => <LegalPage kind="contact" />} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></PublicLayout>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
