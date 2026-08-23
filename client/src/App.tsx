import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import SearchPage from "@/pages/SearchPage";
import SongPage from "@/pages/SongPage";
import MediaPage from "@/pages/MediaPage";
import TrendingPage from "@/pages/TrendingPage";
import LegalPage from "@/pages/LegalPage";
import AdminPage from "@/pages/AdminPage";
import ArtistPage from "@/pages/ArtistPage";
import ArtistsPage from "@/pages/ArtistsPage";
import { Route, Switch, Link } from "wouter";
import { Moon, Sun, Menu, Sparkles } from "lucide-react";
import { useState } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

function PublicLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="naghma-shell">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
      <Link href="/" className="flex items-center gap-3 text-decoration-none" onClick={() => setMenuOpen(false)}>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#756590] text-white shadow-lg shadow-[#756590]/20"><Sparkles size={20} /></span>
        <span><span className="serif block text-2xl text-[#514568]">نغمة</span><span className="-mt-1 block text-[10px] font-semibold uppercase tracking-[.3em] text-[#8c819f]">NaghmaHub</span></span>
      </Link>
      <nav className={`${menuOpen ? "flex" : "hidden"} absolute right-5 top-20 z-20 flex-col gap-4 rounded-2xl bg-white p-5 shadow-xl md:static md:flex md:flex-row md:items-center md:bg-transparent md:p-0 md:shadow-none`}>
        <Link href="/" className="text-sm font-semibold text-[#6f628f] hover:text-[#3d3556]">الرئيسية</Link>
        <Link href="/trending" className="text-sm font-semibold text-[#6f628f] hover:text-[#3d3556]">الرائج الآن</Link><Link href="/artists" className="text-sm font-semibold text-[#6f628f] hover:text-[#3d3556]">الفنانون</Link>
        <Link href="/terms" className="text-sm font-semibold text-[#6f628f] hover:text-[#3d3556]">المسؤولية</Link>
      </nav>
      <div className="flex items-center gap-2"><button className="rounded-full p-2 text-[#6f628f] hover:bg-white/70" aria-label="تبديل المظهر" onClick={toggleTheme}>{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="rounded-full p-2 text-[#6f628f] md:hidden" aria-label="فتح القائمة" onClick={() => setMenuOpen(v => !v)}><Menu size={20} /></button></div>
    </header>
    <main>{children}</main>
    <footer className="mx-auto mt-20 flex max-w-6xl flex-col gap-3 border-t border-[#6f628f]/10 px-5 py-8 text-sm text-[#8c819f] sm:flex-row sm:items-center sm:justify-between"><span>© 2026 نغمة — مساحة هادئة لاكتشاف الصوت.</span><div className="flex gap-4"><Link href="/privacy">الخصوصية</Link><Link href="/terms">الشروط</Link><Link href="/dmca">طلبات السحب</Link></div></footer>
  </div>;
}

function Router() { return <PublicLayout><Switch><Route path="/" component={Home} /><Route path="/search" component={SearchPage} /><Route path="/s/:slug" component={SongPage} /><Route path="/artists" component={ArtistsPage} /><Route path="/artists/:slug" component={ArtistPage} /><Route path="/media" component={MediaPage} /><Route path="/videos_dl" component={MediaPage} /><Route path="/trending" component={TrendingPage} /><Route path="/privacy" component={() => <LegalPage kind="privacy" />} /><Route path="/terms" component={() => <LegalPage kind="terms" />} /><Route path="/dmca" component={() => <LegalPage kind="dmca" />} /><Route path="/contact" component={() => <LegalPage kind="contact" />} /><Route path="/admin" component={AdminPage} /><Route component={NotFound} /></Switch></PublicLayout>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
