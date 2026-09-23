import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/Home";
import SearchPage from "@/pages/SearchPage";
import SongPage from "@/pages/SongPage";
import KeywordPage from "@/pages/KeywordPage";
import MediaPage from "@/pages/MediaPage";
import ConversionPage from "@/pages/ConversionPage";
import TrendingPage from "@/pages/TrendingPage";
import LegalPage from "@/pages/LegalPage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import ArtistPage from "@/pages/ArtistPage";
import ArtistsPage from "@/pages/ArtistsPage";
import AlbumsPage from "@/pages/AlbumsPage";
import AlbumPage from "@/pages/AlbumPage";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";

function AdBanner() {
  React.useEffect(() => {
    try {
      ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push({});
    } catch {
      // AdSense may be unavailable while the account/site is under review.
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-4" dir="ltr" aria-label="إعلان">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9105855254430799"
        data-ad-slot="7023973222"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

function AuthHeader() {
  const { user, loading, logout } = useAuth();
  if (loading) return null;
  return user ? <button type="button" onClick={() => void logout()} className="reference-top-link">خروج</button> : <Link href="/login" className="reference-top-link">دخول</Link>;
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="naghma-shell min-h-screen flex flex-col">
    <header className="reference-top-header shrink-0" dir="rtl">
      <div className="reference-top-header-inner">
        <Link href="/" className="reference-top-logo" aria-label="سمعها - الرئيسية">سمعها</Link>
        <nav className="reference-top-nav" aria-label="التنقل الرئيسي">
          <Link href="/" className="reference-top-link">الرئيسية</Link>
          <Link href="/trending" className="reference-top-link">جديد البحث</Link>
        </nav>
      </div>
    </header>
    <main className="flex-1">
      {children}
    </main>
    <AdBanner />
    <footer className="shrink-0 border-t border-[#756590]/10 bg-white/90" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm text-[#81768f]">
        <p>© {new Date().getFullYear()} سمعها — اكتشف الموسيقى وابحث عنها بسهولة.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="روابط الموقع">
          <Link href="/privacy" className="hover:text-[#514568]">الخصوصية</Link>
          <Link href="/terms" className="hover:text-[#514568]">الشروط</Link>
          <Link href="/dmca" className="hover:text-[#514568]">DMCA</Link>
          <Link href="/contact" className="hover:text-[#514568]">اتصل بنا</Link>
        </nav>
      </div>
    </footer>
  </div>;
}

function Router() { return <PublicLayout><Switch>
  <Route path="/" component={Home} />
  <Route path="/search" component={SearchPage} />
  <Route path="/s/:slug" component={KeywordPage} />
  <Route path="/song/:slug" component={SongPage} />
  <Route path="/artists" component={ArtistsPage} />
  <Route path="/artists/:slug" component={ArtistPage} />
  <Route path="/albums" component={AlbumsPage} />
  <Route path="/album/:slug" component={AlbumPage} />
  <Route path="/media" component={MediaPage} />
  <Route path="/videos_dl" component={ConversionPage} />
  <Route path="/trending" component={TrendingPage} />
  <Route path="/privacy" component={() => <LegalPage kind="privacy" />} />
  <Route path="/terms" component={() => <LegalPage kind="terms" />} />
  <Route path="/dmca" component={() => <LegalPage kind="dmca" />} />
  <Route path="/contact" component={() => <LegalPage kind="contact" />} />
  <Route path="/login" component={LoginPage} />
  <Route path="/admin" component={AdminPage} />
  <Route component={NotFound} />
</Switch></PublicLayout>; }

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
