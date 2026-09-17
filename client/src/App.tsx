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
import ArtistPage from "@/pages/ArtistPage";
import ArtistsPage from "@/pages/ArtistsPage";
import { Route, Switch, Link } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="naghma-shell">
    <header className="reference-header reference-simple-header mx-auto flex max-w-[1080px] items-center justify-center px-4 py-3 sm:px-8">
      <Link href="/" className="reference-header-brand" aria-label="سمعها الرئيسية">سمعها</Link>
    </header>
    <main>{children}</main>
    <footer className="reference-footer mx-auto mt-12 flex max-w-[1080px] flex-col gap-3 border-t border-[#d9dfdc] px-4 py-6 text-xs text-[#82918c] sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <span>Powered By Sm3ha © 2026</span>
      <div className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/">سمعها</Link><Link href="/contact">اتصل بنا</Link><Link href="/dmca">DMCA</Link></div>
    </footer>
  </div>;
}

function Router() { return <PublicLayout><Switch>
  <Route path="/" component={Home} />
  <Route path="/search" component={SearchPage} />
  <Route path="/s/:slug" component={KeywordPage} />
  <Route path="/artists" component={ArtistsPage} />
  <Route path="/artists/:slug" component={ArtistPage} />
  <Route path="/media" component={MediaPage} />
  <Route path="/videos_dl" component={ConversionPage} />
  <Route path="/trending" component={TrendingPage} />
  <Route path="/privacy" component={() => <LegalPage kind="privacy" />} />
  <Route path="/terms" component={() => <LegalPage kind="terms" />} />
  <Route path="/dmca" component={() => <LegalPage kind="dmca" />} />
  <Route path="/contact" component={() => <LegalPage kind="contact" />} />
  <Route path="/admin" component={AdminPage} />
  <Route component={NotFound} />
</Switch></PublicLayout>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light" switchable><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
