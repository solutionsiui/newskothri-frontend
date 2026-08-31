import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNavigate } from "react-router-dom";
import { usePathname } from "next/navigation";
import { normalizePathname } from "../lib/routerShim";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Moon, Sun, Menu, X, Globe2,
  Home, Tv2, Clock, ChevronRight, User,
} from "lucide-react";
import { SITE_SOCIAL_LINKS, SiteSocialIconButton } from "./social/siteSocialLinks";
import type { NewsItem } from "../data/mockData";
import { categories } from "../data/publicCategories";
import { useLang } from "../context/LangContext";
import { useReaderAuth } from "../context/ReaderAuthContext";
import { fetchPublicSearch } from "../services/newsApi";
import { adaptArticles } from "../services/articleAdapter";
import BrandLogo from "./BrandLogo";

interface NavbarProps {
  darkMode: boolean;
  toggleDark: () => void;
}

export default function Navbar({ darkMode, toggleDark }: NavbarProps) {
  const { lang, toggleLang, t } = useLang();
  const { reader } = useReaderAuth();
  const [scrolled, setScrolled]       = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [remoteResults, setRemoteResults] = useState<NewsItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFetched, setSearchFetched] = useState(false);
  const searchRef   = useRef<HTMLInputElement>(null);
  const searchWrap  = useRef<HTMLDivElement>(null);
  const mobileMenuBtnRef = useRef<HTMLButtonElement>(null);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const prevMobileOpen = useRef(false);
  const navigate = useNavigate();
  const pathname = normalizePathname(usePathname() || "/");

  /* active tab: home vs shows */
  const isShows = pathname === "/shows";
  const isAccountRoute =
    pathname === "/profile" ||
    pathname === "/login" ||
    pathname === "/register";

  /* active category from URL */
  const activeSlug = (() => {
    if (pathname === "/") return "home";
    const m = pathname.match(/^\/category\/(.+)/);
    return m ? m[1] : "";
  })();

  /* scroll shadow */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Close drawer on navigation — avoids invisible overlay / locked scroll on mobile */
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setMobileOpen(false);
      setSearchActive(false);
      setSearchQuery("");
    });
    document.body.style.overflow = "";
    document.body.style.removeProperty("overflow");
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  /* Mobile drawer: lock page scroll only while open */
  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const focusHandle = window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !mobileDrawerRef.current) return;
      const focusable = Array.from(
        mobileDrawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trapFocus);
    return () => {
      window.cancelAnimationFrame(focusHandle);
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* Return focus to menu button when drawer closes */
  useEffect(() => {
    if (prevMobileOpen.current && !mobileOpen) {
      mobileMenuBtnRef.current?.focus();
    }
    prevMobileOpen.current = mobileOpen;
  }, [mobileOpen]);

  /* close search on outside tap/click (pointerdown works for touch; mousedown alone misses many phones) */
  useEffect(() => {
    const fn = (e: Event) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) {
        setSearchActive(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("pointerdown", fn, true);
    return () => document.removeEventListener("pointerdown", fn, true);
  }, []);

  /* Ctrl/Cmd+K */
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchActive(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setSearchActive(false);
        setSearchQuery("");
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const handleCatClick = (slug: string) => {
    if (slug === "home")   navigate("/");
    else navigate(`/category/${slug}`);
    setMobileOpen(false);
  };

  /* Live search — published articles via public API */
  useEffect(() => {
    const q = searchQuery.trim();
    if (!searchActive || q.length < 2) {
      return;
    }
    const handle = window.setTimeout(() => {
      setSearchLoading(true);
      setSearchFetched(false);
      fetchPublicSearch(q, 12, lang)
        .then((raw) => setRemoteResults(adaptArticles(raw, lang)))
        .catch(() => setRemoteResults([]))
        .finally(() => {
          setSearchLoading(false);
          setSearchFetched(true);
        });
    }, 280);
    return () => window.clearTimeout(handle);
  }, [searchQuery, searchActive, lang]);

  const results = remoteResults;

  return (
    <>
      <nav
        className={`navbar-v2${scrolled ? " nav-scrolled" : ""}`}
        aria-label={t("मुख्य नेविगेशन", "Main navigation")}
      >
        {/* ── BRAND STRIP ── */}
        <div className="nav-brand-strip" />

        {/* ══════ ROW 1: Logo | Tabs | Socials ══════ */}
        <div className="nav-row1">
          <span className="nav-brand-name nav-brand-name--mobile" aria-hidden="true">
            {t("न्यूज़ कोठरी", "News Kothri")}
          </span>

          <Link
            href="/"
            className="nav-logo"
            aria-label={t("न्यूज़ कोठरी — होम", "News Kothri — Home")}
          >
            <BrandLogo className="nav-brand-logo-img" height={44} decorative />
            <span className="nav-brand-name nav-brand-name--desktop">
              {t("न्यूज़ कोठरी", "News Kothri")}
            </span>
          </Link>

          {/* Center tabs: Home | Shows */}
          <div className="nav-main-tabs">
            <button
              type="button"
              className={`nav-main-tab nav-tab-home${!isShows ? " tab-active" : ""}`}
              onClick={() => navigate("/")}
              aria-current={!isShows ? "page" : undefined}
            >
              <Home size={15} strokeWidth={2} aria-hidden />
              {t("होम", "Home")}
            </button>
            <button
              type="button"
              className={`nav-main-tab nav-tab-shows${isShows ? " tab-active" : ""}`}
              onClick={() => navigate("/shows")}
              aria-current={isShows ? "page" : undefined}
            >
              <Tv2 size={15} strokeWidth={2} aria-hidden />
              {t("शोज़", "Shows")}
            </button>
          </div>

          {/* Right: Social icons + util */}
          <div className="nav-row1-right">
            <div className="nav-socials">
              {SITE_SOCIAL_LINKS.map((link) => (
                <SiteSocialIconButton key={link.key} link={link} lang={lang} />
              ))}
            </div>
            <div className="nav-util-btns">
              <button
                type="button"
                className="nav-util-btn nav-lang-btn-mobile"
                onClick={toggleLang}
                title={t("भाषा बदलें", "Change language")}
                aria-label={t("भाषा बदलें", "Change language")}
              >
                <Globe2 size={15} strokeWidth={2} aria-hidden />
                <span className="nav-util-label">{lang === "hi" ? "EN" : "हि"}</span>
              </button>
              <button
                type="button"
                className={`nav-util-btn nav-profile-btn${isAccountRoute ? " nav-profile-btn--active" : ""}`}
                onClick={() => navigate(reader ? "/profile" : "/login?next=%2Fprofile")}
                title={reader ? t("प्रोफ़ाइल", "Profile") : t("लॉग इन", "Log in")}
                aria-label={reader ? t("प्रोफ़ाइल", "Profile") : t("लॉग इन", "Log in")}
              >
                <User size={15} strokeWidth={2} aria-hidden />
              </button>
              <button
                ref={mobileMenuBtnRef}
                type="button"
                className="nav-util-btn nav-mobile-menu"
                onClick={() => setMobileOpen(true)}
                aria-label={t("मेनू खोलें", "Open menu")}
                aria-expanded={mobileOpen}
                aria-controls="kn-mobile-drawer"
              >
                <Menu size={20} strokeWidth={2} aria-hidden />
              </button>
              <div className="nav-util-cluster" role="group" aria-label={t("भाषा और थीम", "Language and theme")}>
                <button type="button" className="nav-util-btn" onClick={toggleLang} title={t("भाषा बदलें", "Change language")}>
                  <Globe2 size={15} strokeWidth={2} aria-hidden />
                  <span className="nav-util-label">{lang === "hi" ? "EN" : "हि"}</span>
                </button>
                <button type="button" className="nav-util-btn" onClick={toggleDark} title={t("थीम बदलें", "Toggle theme")}>
                  {darkMode ? <Sun size={15} strokeWidth={2} aria-hidden /> : <Moon size={15} strokeWidth={2} aria-hidden />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ ROW 2: Categories + Search ══════ */}
        <div className="nav-row2">
          <div className="nav-cats-scroll">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.slug}
                className={`nav-cat-pill${activeSlug === cat.slug ? " cat-pill-active" : ""}`}
                onClick={() => handleCatClick(cat.slug)}
                aria-current={activeSlug === cat.slug ? "page" : undefined}
              >
                {lang === "hi" ? cat.name : cat.nameEn}
              </button>
            ))}
          </div>

          {/* Inline search */}
          <div className="nav-search-zone" ref={searchWrap}>
            {searchActive ? (
              <div className="nav-search-expand">
                <Search size={15} className="nav-search-icon-inner" strokeWidth={2} aria-hidden />
                <input
                  ref={searchRef}
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("खोजें…", "Search news…")}
                  className="nav-search-input"
                />
                <button type="button" className="nav-search-clear" aria-label={t("खोज बंद करें", "Close search")} onClick={() => { setSearchActive(false); setSearchQuery(""); }}>
                  <X size={14} aria-hidden />
                </button>

                {/* Results dropdown */}
                <AnimatePresence>
                  {searchQuery.trim().length >= 2 && (
                    <motion.div
                      className="nav-search-results"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      {searchLoading && (
                        <p className="nav-no-results">{t("खोज हो रही है…", "Searching…")}</p>
                      )}
                      {!searchLoading &&
                        results.map((item) => (
                        <button
                          type="button"
                          key={String(item.id)}
                          className="nav-result-item"
                          onClick={() => {
                            navigate(`/article/${item.id}`);
                            setSearchActive(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="nav-result-cat">
                            {lang === "hi" ? item.category : item.categoryEn}
                          </span>
                          <span className="nav-result-title">
                            {lang === "hi" ? item.title : item.titleEn}
                          </span>
                          <Clock size={10} className="nav-result-clock" />
                          <span className="nav-result-time">
                            {lang === "hi" ? item.time : item.timeEn}
                          </span>
                        </button>
                      ))}
                      {!searchLoading && searchFetched && results.length === 0 && (
                        <p className="nav-no-results">{t("कोई परिणाम नहीं", "No results found")}</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                type="button"
                className="nav-search-trigger"
                aria-label={t("खोजें", "Search")}
                onClick={() => { setSearchActive(true); setTimeout(() => searchRef.current?.focus(), 50); }}
              >
                <Search size={17} strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ══════ MOBILE DRAWER ══════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              ref={mobileDrawerRef}
              id="kn-mobile-drawer"
              className="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t("मेनू", "Menu")}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
            >
              <div className="drawer-header">
                <Link
                  href="/"
                  className="drawer-brand-hit"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t("न्यूज़ कोठ्री — होम", "News Kothri — Home")}
                >
                  <BrandLogo className="drawer-brand-logo-img" height={40} decorative />
                </Link>
                <button ref={drawerCloseRef} type="button" onClick={() => setMobileOpen(false)} className="drawer-close" aria-label={t("बंद करें", "Close")}><X size={22} aria-hidden /></button>
              </div>

              {/* Drawer: Home / Shows tabs */}
              <div className="drawer-tabs-row">
                <button
                  type="button"
                  className={`nav-main-tab nav-tab-home${!isShows ? " tab-active" : ""}`}
                  onClick={() => { navigate("/"); setMobileOpen(false); }}
                  aria-current={!isShows ? "page" : undefined}
                >
                  <Home size={14} strokeWidth={2} aria-hidden /> {t("होम", "Home")}
                </button>
                <button
                  type="button"
                  className={`nav-main-tab nav-tab-shows${isShows ? " tab-active" : ""}`}
                  onClick={() => { navigate("/shows"); setMobileOpen(false); }}
                  aria-current={isShows ? "page" : undefined}
                >
                  <Tv2 size={14} strokeWidth={2} aria-hidden /> {t("शोज़", "Shows")}
                </button>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="drawer-action-btn"
                  onClick={() => {
                    navigate(reader ? "/profile" : "/login?next=%2Fprofile");
                    setMobileOpen(false);
                  }}
                >
                  <User size={16} strokeWidth={2} aria-hidden />
                  {reader ? t("प्रोफ़ाइल", "Profile") : t("लॉग इन", "Log in")}
                </button>
                <button type="button" className="drawer-action-btn" onClick={toggleDark}>
                  {darkMode ? <Sun size={16} strokeWidth={2} aria-hidden /> : <Moon size={16} strokeWidth={2} aria-hidden />}
                  {darkMode ? t("लाइट मोड", "Light Mode") : t("डार्क मोड", "Dark Mode")}
                </button>
              </div>

              <nav className="drawer-nav">
                {categories.map((cat) => (
                  <motion.button
                    key={cat.slug}
                    className={`drawer-cat-btn${activeSlug === cat.slug ? " active" : ""}`}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCatClick(cat.slug)}
                    aria-current={activeSlug === cat.slug ? "page" : undefined}
                  >
                    <span>{lang === "hi" ? cat.name : cat.nameEn}</span>
                    <ChevronRight size={15} className="drawer-chevron" />
                  </motion.button>
                ))}
              </nav>

              {/* Social icons in drawer */}
              <div className="drawer-social-row">
                {SITE_SOCIAL_LINKS.map((link) => (
                  <SiteSocialIconButton key={link.key} link={link} lang={lang} />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
