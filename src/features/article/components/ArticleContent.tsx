"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import DOMPurify from "dompurify";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bookmark, Share2, Link2, ThumbsUp, ChevronRight,
} from "lucide-react";
import { IconFacebook, IconWhatsApp, IconXLogo } from "../../../components/icons/ShareBrandIcons";
import { categories } from "../../../data/publicCategories";
import { categoryColors } from "../utils/formatArticle";
import type { NewsItem } from "../types/article";
import ArticleAuthor from "./ArticleAuthor";
import { ArticleYoutubeClip } from "./ArticleYoutubeEmbeds";
import { splitBodyWithYoutubeSlots } from "../utils/youtubeEmbedMarkers";
import { youtubeVideoIdFromUrl } from "../../../utils/youtube";
import ArticleHero from "./ArticleHero";
import { formatDisplayTag } from "../../../lib/formatDisplayTag";
import RelatedCard from "./RelatedCard";
import { isHtmlParagraph } from "../utils/formatArticle";
import { nativeShare, shareToFacebook, shareToTwitter, shareToWhatsApp } from "../utils/share";
import { shareLabels } from "../../../i18n/siteCopy";
import { lazyLoadImagesInHtml } from "../../../lib/imageLoading";

const MarketWidget = dynamic(() => import("../../../components/MarketWidget"));
const ArticleRecommendationStrip = dynamic(
  () => import("./RelatedArticles").then((mod) => mod.ArticleRecommendationStrip),
  { ssr: false }
);

function sanitizeArticleHtml(html: string): string {
  /* Initial server data is sanitized before crossing the RSC boundary. */
  if (typeof window === "undefined") return lazyLoadImagesInHtml(html);
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li",
      "h2", "h3", "blockquote", "span", "div", "img", "figure", "figcaption",
    ],
    ALLOWED_ATTR: ["href", "rel", "target", "class", "src", "alt", "width", "height", "loading", "decoding"],
  });
  return lazyLoadImagesInHtml(clean);
}

type TFn = (hi: string, en: string) => string;

export default function ArticleContent({
  article,
  lang,
  t,
  color,
  title,
  summary,
  category,
  tags,
  bodyHtml,
  paragraphs,
  imageSrc,
  imgErr,
  onImgError,
  stripItems,
  mobileRelated,
  mobileMostRead,
  bookmarked,
  upvoted,
  upvoteCount,
  onBookmark,
  onUpvote,
  copied,
  onCopyLink,
  pageUrl,
  showMarket = false,
}: {
  article: NewsItem;
  lang: "hi" | "en";
  t: TFn;
  color: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  bodyHtml: string;
  paragraphs: string[];
  imageSrc: string;
  imgErr: boolean;
  onImgError: () => void;
  stripItems: NewsItem[];
  mobileRelated: NewsItem[];
  mobileMostRead: NewsItem[];
  bookmarked: boolean;
  upvoted: boolean;
  upvoteCount: number;
  onBookmark: () => void;
  onUpvote: () => void;
  copied: boolean;
  onCopyLink: () => void;
  pageUrl: string;
  showMarket?: boolean;
}) {
  const navigate = useNavigate();
  const sl = shareLabels(t);
  const slugList =
    article.categorySlugs?.length ? article.categorySlugs : [article.categorySlug];
  const time = lang === "hi" ? article.time : article.timeEn;
  const author = lang === "hi" ? article.author : article.authorEn;
  const youtubeEmbeds = useMemo(
    () => article.youtubeEmbeds ?? [],
    [article.youtubeEmbeds]
  );

  const bodyBlocks = useMemo(() => {
    const html = String(bodyHtml || "").trim();
    if (!html) return [];
    // Always keep full article HTML; YouTube clips render only where inserted in the body.
    return splitBodyWithYoutubeSlots(html, youtubeEmbeds);
  }, [bodyHtml, youtubeEmbeds]);

  return (
    <main className="article-main-col">
      <div className="article-breadcrumb">
        <button type="button" className="article-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> {t("वापस", "Back")}
        </button>
        {slugList.map((slug, i) => {
          const cat = categories.find((c) => c.slug === slug);
          if (!cat) return null;
          const catColor = categoryColors[slug] || color;
          return (
            <span key={slug} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} style={{ opacity: 0.35 }} />}
              <Link
                to={`/category/${slug}`}
                style={{ color: catColor, fontWeight: 600, fontSize: 13 }}
              >
                {lang === "hi" ? cat.name : cat.nameEn}
              </Link>
            </span>
          );
        })}
      </div>
      <div className="article-meta-top">
        {article.isBreaking && <span className="article-breaking-badge">⚡ {t("ब्रेकिंग", "Breaking")}</span>}
        {slugList.map((slug) => {
          const cat = categories.find((c) => c.slug === slug);
          const label = cat ? (lang === "hi" ? cat.name : cat.nameEn) : category;
          const catColor = categoryColors[slug] || color;
          return (
            <Link
              key={slug}
              to={`/category/${slug}`}
              className="article-cat-badge"
              style={{ color: catColor, borderColor: catColor + "40" }}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <motion.h1 className="article-headline" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }}>
        {title}
      </motion.h1>
      <p className="article-deck">{summary}</p>
      {showMarket ? <MarketWidget variant="inline" accentColor={color} /> : null}
      <div className="article-byline">
        <ArticleAuthor
          authorInitial={author.charAt(0)}
          authorName={author}
          authorAvatarUrl={article.authorAvatarUrl}
          time={time}
          readTime={article.readTime}
          color={color}
          t={t}
        />
        <div className="article-share-row article-byline-share">
          <button
            type="button"
            className="article-bookmark-btn"
            style={bookmarked ? { borderColor: color, color, background: color + "12" } : {}}
            onClick={() => void onBookmark()}
            title={t("बुकमार्क", "Bookmark")}
            aria-label={t("बुकमार्क", "Bookmark")}
            aria-pressed={bookmarked}
          >
            <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="article-bookmark-btn"
            style={upvoted ? { borderColor: color, color, background: color + "12" } : {}}
            onClick={() => void onUpvote()}
            title={t("अपवोट", "Upvote")}
            aria-label={t("अपवोट", "Upvote")}
            aria-pressed={upvoted}
          >
            <ThumbsUp size={15} fill={upvoted ? "currentColor" : "none"} />
          </button>
          <span className="article-upvote-count" title={t("कुल अपवोट", "Total upvotes")}>
            {upvoteCount} {t("अपवोट", "upvotes")}
          </span>
          <button type="button" className="article-share-btn art-share-wa" onClick={() => shareToWhatsApp(title, pageUrl)}>
            <IconWhatsApp size={14} aria-hidden className="article-share-brand-icon" /> {sl.whatsapp}
          </button>
          <button
            type="button"
            className="article-share-btn art-share-tw"
            onClick={() => shareToTwitter(title, pageUrl)}
            title={sl.twitter}
            aria-label={sl.twitter}
          >
            <IconXLogo size={14} aria-hidden className="article-share-brand-icon" />
          </button>
          <button type="button" className="article-share-btn" onClick={onCopyLink}>
            <Link2 size={13} aria-hidden strokeWidth={2} />
            {copied ? t("कॉपी!", "Copied!") : t("लिंक", "Link")}
          </button>
        </div>
      </div>
      <ArticleHero
        imageSrc={imageSrc}
        imageAlt={title}
        imageWidth={article.imageWidth}
        imageHeight={article.imageHeight}
        heroImage={article.heroImage}
        imgErr={imgErr}
        onImgError={onImgError}
      />
      <motion.div className="article-body" initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }}>
        {bodyBlocks.length > 0 ? (
          <>
            {bodyBlocks.map((block, i) => {
              if (block.type === "youtube") {
                const item = youtubeEmbeds[block.index];
                if (!item || !youtubeVideoIdFromUrl(item.youtubeUrl)) return null;
                return <ArticleYoutubeClip key={`yt-${block.index}-${i}`} item={item} t={t} />;
              }
              const chunk = block.html.trim();
              if (!chunk) return null;
              return (
                <div
                  key={`html-${i}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(chunk) }}
                />
              );
            })}
            {paragraphs.length > 0 && (
              <blockquote className="article-pull-quote" style={{ borderLeftColor: color }}>
                {`"${paragraphs[Math.min(1, paragraphs.length - 1)].replace(/<[^>]+>/g, "").slice(0, 140)}…"`}
              </blockquote>
            )}
          </>
        ) : paragraphs.length > 0 ? (
          <>
            {paragraphs.map((para, i) =>
              isHtmlParagraph(para) ? (
                <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(para) }} />
              ) : (
                <p key={i}>{para}</p>
              )
            )}
            <blockquote className="article-pull-quote" style={{ borderLeftColor: color }}>
              {`"${paragraphs[Math.min(1, paragraphs.length - 1)].replace(/<[^>]+>/g, "").slice(0, 140)}…"`}
            </blockquote>
          </>
        ) : (
          <p className="article-subtle">{t("विस्तृत सामग्री उपलब्ध नहीं है।", "Detailed content is unavailable.")}</p>
        )}
      </motion.div>
      {tags.length > 0 && (
        <div className="article-tags-section">
          <p className="article-tags-label">{t("टैग्स", "Tags")}</p>
          <div className="article-tags">
            {tags.map((tag) => {
              const label = formatDisplayTag(tag);
              if (!label) return null;
              return (
                <button key={label} type="button" className="article-tag">
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="article-share-section article-share-section--desktop-only">
        <p className="article-share-section-label">{t("इस खबर को शेयर करें", "Share this story")}</p>
        <div className="article-share-full-row">
          <button type="button" className="art-share-btn-full art-share-wa" onClick={() => shareToWhatsApp(title, pageUrl)}>
            <IconWhatsApp size={18} aria-hidden className="article-share-brand-icon" /> {sl.whatsapp}
          </button>
          <button type="button" className="art-share-btn-full art-share-tw" onClick={() => shareToTwitter(title, pageUrl)}>
            <IconXLogo size={18} aria-hidden className="article-share-brand-icon" /> {sl.twitter}
          </button>
          <button type="button" className="art-share-btn-full art-share-fb" onClick={() => shareToFacebook(pageUrl)}>
            <IconFacebook size={18} aria-hidden className="article-share-brand-icon" /> {sl.facebook}
          </button>
          <button type="button" className="art-share-btn-full" onClick={onCopyLink}>
            <Link2 size={18} aria-hidden strokeWidth={2} />
            {copied ? sl.copied : sl.copyLink}
          </button>
          {"share" in navigator && (
            <button type="button" className="art-share-btn-full art-share-native" onClick={() => nativeShare(title, pageUrl)}>
              <Share2 size={18} aria-hidden strokeWidth={2} /> {t("अन्य", "More")}
            </button>
          )}
        </div>
      </div>
      {(mobileRelated.length > 0 || mobileMostRead.length > 0) && (
        <section className="article-related-mobile" aria-labelledby="article-mobile-related-heading">
          {mobileRelated.length > 0 && (
            <>
              <h2 id="article-mobile-related-heading" className="article-related-mobile-title">
                {t("संबंधित खबरें", "Related picks")}
              </h2>
              <div className="article-related-mobile-list">
                {mobileRelated.map((item) => (
                  <RelatedCard key={String(item.id)} item={item} lang={lang} />
                ))}
              </div>
            </>
          )}
          {mobileMostRead.length > 0 && (
            <>
              <h2 className="article-related-mobile-title article-related-mobile-title--spaced">
                {t("सबसे ज़्यादा पढ़ी गई", "Most read")}
              </h2>
              <div className="article-related-mobile-list">
                {mobileMostRead.map((item) => (
                  <RelatedCard key={String(item.id)} item={item} lang={lang} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
      <ArticleRecommendationStrip items={stripItems} lang={lang} t={t} />
    </main>
  );
}
