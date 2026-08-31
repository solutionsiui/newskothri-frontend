/* eslint-disable react-hooks/set-state-in-effect -- article route resets loading/sidebar when id or fetched article changes (same pattern as legacy client) */
import { useState, useEffect } from "react";
import type { NewsItem } from "../types/article";
import { adaptArticle, adaptArticles } from "../../../services/articleAdapter";
import { getArticleById, getPublishedArticlesPage, getRecommendedForArticle } from "../services/articleApi";
import { articleLookupId, isArticleRefId, publicArticleSegmentsMatch } from "../utils/formatArticle";

export function useArticle(articleId: string, initialArticle: NewsItem | null = null) {
  const [article, setArticle] = useState<NewsItem | null>(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const [imgErr, setImgErr] = useState(false);
  const [recommendedArticles, setRecommendedArticles] = useState<NewsItem[]>([]);
  const [mostReadSidebar, setMostReadSidebar] = useState<NewsItem[]>([]);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    setLoading(true);
    setImgErr(false);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    if (!articleId) {
      setLoading(false);
      return;
    }
    if (!isArticleRefId(articleId)) {
      setArticle(null);
      setLoading(false);
      return;
    }
    if (initialArticle && publicArticleSegmentsMatch(articleId, initialArticle)) {
      setArticle(initialArticle);
      setLoading(false);
      return;
    }
    const lookupId = articleLookupId(articleId);
    let cancelled = false;
    getArticleById(lookupId).then((raw) => {
      if (cancelled) return;
      if (!raw) {
        setArticle(null);
        setLoading(false);
        return;
      }
      const next = adaptArticle(raw);
      setArticle(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, initialArticle]);

  useEffect(() => {
    if (!articleId || !article || !publicArticleSegmentsMatch(articleId, article)) {
      setRecommendedArticles([]);
      setMostReadSidebar([]);
      return;
    }
    let cancelled = false;
    const articleLocale = article.primaryLocale;
    const lookupId = articleLookupId(articleId);
    Promise.all([
      getRecommendedForArticle(lookupId, { limit: 14, locale: articleLocale }),
      getPublishedArticlesPage({ limit: 24, page: 2, locale: articleLocale }),
    ]).then(([recRaw, moreRaw]) => {
      if (cancelled) return;
      const recItems = adaptArticles(recRaw, articleLocale).filter((n) => String(n.id) !== String(article.id));
      setRecommendedArticles(recItems);
      const recIds = new Set(recItems.map((r) => String(r.id)));
      const more = adaptArticles(moreRaw, articleLocale)
        .filter((n) => String(n.id) !== String(article.id) && !recIds.has(String(n.id)))
        .slice(0, 5);
      setMostReadSidebar(more);
    });
    return () => {
      cancelled = true;
    };
  }, [articleId, article]);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return {
    article,
    loading,
    imgErr,
    setImgErr,
    recommendedArticles,
    mostReadSidebar,
    showBackTop,
  };
}

/** Clipboard + optional Web Share — depends on window location at call time */
export function useArticleClipboard() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const handleUnifiedMobileShare = async (title: string, summary: string) => {
    if (typeof navigator !== "undefined" && "share" in navigator && navigator.share) {
      const pageUrl = window.location.href;
      try {
        await navigator.share({
          title,
          text: (summary && summary.length > 0 ? summary : title).slice(0, 500),
          url: pageUrl,
        });
      } catch (e: unknown) {
        const n = e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
        if (n === "AbortError") return;
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return { copied, handleCopyLink, handleUnifiedMobileShare };
}
