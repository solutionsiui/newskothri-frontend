"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  Bookmark,
  Link2,
  Loader2,
  Share2,
  ThumbsUp,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IconWhatsApp, IconXLogo } from "../../../components/icons/ShareBrandIcons";
import { useLang } from "../../../context/LangContext";
import { useReaderAuth } from "../../../context/ReaderAuthContext";
import ArticleContent from "../components/ArticleContent";
import ArticleSidebar from "../components/ArticleSidebar";
import { useArticle, useArticleClipboard } from "../hooks/useArticle";
import { useBookmarks } from "../hooks/useBookmarks";
import { categoryColors, publicArticleRouteSegment } from "../utils/formatArticle";
import { shareToTwitter, shareToWhatsApp } from "../utils/share";
import { displayDek, displayHeadline } from "../../../services/articleDisplay";
import { isBusinessArticle } from "../../../lib/markets/isBusinessArticle";
import type { NewsItem } from "../types/article";

export default function ArticlePageClient({
  articleId,
  initialArticle,
  jsonLd,
}: {
  articleId: string;
  initialArticle?: NewsItem | null;
  jsonLd?: Record<string, unknown> | null;
}) {
  const navigate = useNavigate();
  const { t } = useLang();
  const { token } = useReaderAuth();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  const {
    article,
    loading,
    imgErr,
    setImgErr,
    recommendedArticles,
    mostReadSidebar,
    showBackTop,
  } = useArticle(articleId, initialArticle);

  const { copied, handleCopyLink, handleUnifiedMobileShare } = useArticleClipboard();

  const {
    bookmarked,
    upvoted,
    upvoteCount,
    handleBookmarkToggle,
    handleUpvoteToggle,
  } = useBookmarks(articleId, token, article, navigate);

  useEffect(() => {
    if (!article) return;
    const canonicalSeg = publicArticleRouteSegment(article);
    if (String(canonicalSeg) === String(articleId).trim()) return;
    navigate(`/article/${canonicalSeg}`, { replace: true });
  }, [article, articleId, navigate]);

  if (loading) {
    return (
      <div className="article-page article-page--centered article-page--loading" role="status" aria-live="polite">
        <Loader2 size={36} className="article-page-loading-spinner" aria-hidden />
        <p className="article-page-loading-text">
          {t("खबर लोड हो रही है…", "Loading article…")}
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page article-page--centered article-page--not-found">
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-900)" }}>
          {t("खबर नहीं मिली", "Article not found")}
        </h2>
        <button type="button" className="article-back-btn" onClick={() => navigate("/")}>
          <ArrowLeft size={16} /> {t("होम पर जाएं", "Go to Home")}
        </button>
      </div>
    );
  }

  const articleLang = article.primaryLocale;
  const title = displayHeadline(article, articleLang);
  const summary = displayDek(article, articleLang);
  const category = articleLang === "hi" ? article.category : article.categoryEn;
  const tags = articleLang === "hi" ? (article.tags ?? []) : (article.tagsEn ?? []);
  const rawContent = articleLang === "hi" ? article.content : article.contentEn;
  const paragraphs = rawContent && rawContent.length > 0 ? rawContent : [];
  const bodyHtml = paragraphs[0] && typeof paragraphs[0] === "string" ? paragraphs[0] : "";

  const color = categoryColors[article.categorySlug] || "#BB1919";
  const showMarket = isBusinessArticle(article);
  const sideRelated = recommendedArticles.slice(0, 8);
  const stripItems = recommendedArticles.slice(0, 8);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <motion.div
      className="article-page"
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {jsonLd != null && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <motion.div
        className="article-progress-bar"
        style={{ scaleX, transformOrigin: "0%" }}
        aria-hidden="true"
      />
      <div className="article-page-layout">
        <ArticleContent
          article={article}
          lang={articleLang}
          t={t}
          color={color}
          title={title}
          summary={summary}
          category={category}
          tags={tags}
          bodyHtml={bodyHtml}
          paragraphs={paragraphs}
          imageSrc={article.image}
          imgErr={imgErr}
          onImgError={() => setImgErr(true)}
          stripItems={stripItems}
          mobileRelated={sideRelated}
          mobileMostRead={mostReadSidebar}
          bookmarked={bookmarked}
          upvoted={upvoted}
          upvoteCount={upvoteCount}
          onBookmark={handleBookmarkToggle}
          onUpvote={handleUpvoteToggle}
          copied={copied}
          onCopyLink={handleCopyLink}
          pageUrl={pageUrl}
          showMarket={showMarket}
        />
        <ArticleSidebar
          sideRelated={sideRelated}
          mostReadSidebar={mostReadSidebar}
          color={color}
          lang={articleLang}
          t={t}
          title={title}
          pageUrl={pageUrl}
          copied={copied}
          onCopyLink={handleCopyLink}
          showMarket={showMarket}
        />
      </div>
      {showBackTop && (
        <motion.button
          type="button"
          className="article-back-top"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={16} />
        </motion.button>
      )}
      <div className="article-mobile-share-strip" role="toolbar" aria-label={t("शेयर", "Share")}>
        <button
          type="button"
          className="mobile-strip-btn mobile-strip-wa"
          onClick={() => shareToWhatsApp(title, pageUrl)}
          aria-label={t("व्हाट्सऐप", "WhatsApp")}
        >
          <IconWhatsApp size={22} aria-hidden className="article-share-brand-icon" />
        </button>
        <button
          type="button"
          className="mobile-strip-btn mobile-strip-tw"
          onClick={() => shareToTwitter(title, pageUrl)}
          aria-label={t("एक्स (ट्विटर)", "X (Twitter)")}
        >
          <IconXLogo size={20} aria-hidden className="article-share-brand-icon" />
        </button>
        <button
          type="button"
          className="mobile-strip-share-unified"
          onClick={() => void handleUnifiedMobileShare(title, summary)}
          aria-label={t("शेयर करें", "Share")}
        >
          <Share2 size={18} strokeWidth={2} aria-hidden />
          <span className="mobile-strip-share-unified-text">{t("शेयर", "Share")}</span>
        </button>
        <button
          type="button"
          className="mobile-strip-btn"
          onClick={handleCopyLink}
          aria-label={copied ? t("लिंक कॉपी हो गया", "Link copied") : t("लिंक कॉपी करें", "Copy link")}
        >
          <Link2 size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className="mobile-strip-bookmark"
          onClick={() => void handleBookmarkToggle()}
          aria-label={t("बुकमार्क", "Bookmark")}
          aria-pressed={bookmarked}
          style={bookmarked ? { color: "#BB1919" } : {}}
        >
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          className="mobile-strip-btn mobile-strip-upvote"
          onClick={() => void handleUpvoteToggle()}
          aria-label={t("अपवोट", "Upvote")}
          aria-pressed={upvoted}
          style={upvoted ? { color: "#BB1919", borderColor: "#BB1919" } : {}}
        >
          <ThumbsUp size={18} fill={upvoted ? "currentColor" : "none"} />
        </button>
      </div>
    </motion.div>
  );
}
