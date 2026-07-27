"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ContentArticle } from "../services/contentTypes";
import { categoryDek, categoryHeadline } from "../features/category/server/categoryFeed";
import { dek as homeDek, headline as homeHeadline } from "../features/home/server/homeFeed";
import { adaptArticles } from "../services/articleAdapter";
import { fetchPublishedArticlesPage } from "../services/newsApi";
import ArticleImage from "./ArticleImage";
import { publicArticleRouteSegment } from "../features/article/utils/formatArticle";
import styles from "../app/newsroom.module.css";

const PAGE_SIZE = 24;
const MAX_SKIP_PAGES = 60;

function computeLoadable(total: number, seenSize: number, hasListContent: boolean): boolean {
  if (!hasListContent && total === 0) return false;
  if (total > 0) return seenSize < total;
  return hasListContent;
}

type FeedSource = "home" | "category";

/** Serializable props only — never add functions (RSC → client boundary). */
export type InfinitePublicArticleListProps = {
  locale: "hi" | "en";
  excludeIds: string[];
  total: number;
  initialItems?: ContentArticle[];
  startPage?: number;
  category?: string;
  latestDays?: number;
  feedSource?: FeedSource;
  sectionTitle?: string;
};

function itemHeadline(item: ContentArticle, locale: "hi" | "en", source: FeedSource): string {
  return source === "category" ? categoryHeadline(item, locale) : homeHeadline(item, locale);
}

function itemDek(item: ContentArticle, locale: "hi" | "en", source: FeedSource): string {
  return source === "category" ? categoryDek(item, locale) : homeDek(item, locale);
}

function ArticleCard({
  item,
  locale,
  feedSource,
}: {
  item: ContentArticle;
  locale: "hi" | "en";
  feedSource: FeedSource;
}) {
  const routeSegment = publicArticleRouteSegment(item);
  const headline = itemHeadline(item, locale, feedSource);
  const dek = itemDek(item, locale, feedSource);
  const category = locale === "hi" ? item.category : item.categoryEn;

  return (
    <article className="card card-default">
      <Link href={`/article/${routeSegment}`} className="card-link-reset card-default-link">
        <div className="card-img-wrap">
          {item.isBreaking && (
            <span className="card-breaking-tag">
              {locale === "hi" ? "ब्रेकिंग" : "Breaking"}
            </span>
          )}
          <ArticleImage
            src={item.image}
            alt={headline}
            width={item.imageWidth}
            height={item.imageHeight}
            className="card-img"
            sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw"
            loading="lazy"
          />
        </div>
        <div className="card-body">
          <span className="card-cat-label">{category}</span>
          <h3 className="card-title">{headline}</h3>
          {dek ? <p className="card-summary">{dek}</p> : null}
        </div>
      </Link>
    </article>
  );
}

export default function InfinitePublicArticleList({
  locale,
  excludeIds,
  total,
  initialItems = [],
  startPage = 1,
  category,
  latestDays,
  feedSource = "home",
  sectionTitle,
}: InfinitePublicArticleListProps) {
  const excludeKey = excludeIds.join(",");
  const initialKey = initialItems.map((a) => a.id).join(",");

  const bootstrapSeen = useMemo(() => {
    const s = new Set(excludeIds);
    for (const a of initialItems) s.add(a.id);
    return s;
  }, [excludeKey, initialKey]);

  const seen = useRef(new Set(bootstrapSeen));
  const [extra, setExtra] = useState<ContentArticle[]>([]);
  const hasListContent = initialItems.length > 0;
  const loadable = computeLoadable(total, bootstrapSeen.size, hasListContent);
  const [done, setDone] = useState(!loadable);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const nextPageRef = useRef(startPage);
  const doneRef = useRef(!loadable);
  const inFlightRef = useRef(false);

  useEffect(() => {
    seen.current = new Set(bootstrapSeen);
    setExtra([]);
    nextPageRef.current = startPage;
    const nextLoadable = computeLoadable(total, bootstrapSeen.size, hasListContent);
    const initialDone = !nextLoadable;
    setDone(initialDone);
    doneRef.current = initialDone;
    setErr("");
  }, [excludeKey, initialKey, total, startPage, bootstrapSeen, hasListContent]);

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || doneRef.current) return;
    if (total > 0 && seen.current.size >= total) {
      setDone(true);
      doneRef.current = true;
      return;
    }

    inFlightRef.current = true;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErr("");

    try {
      let p = nextPageRef.current;
      let guard = 0;

      while (guard < MAX_SKIP_PAGES) {
        guard += 1;
        const { articles, total: resTotal, page: resPage } = await fetchPublishedArticlesPage({
          category,
          latestDays,
          limit: PAGE_SIZE,
          page: p,
          locale,
          signal: ac.signal,
        });

        if (!articles.length) {
          setDone(true);
          doneRef.current = true;
          break;
        }

        const adapted = adaptArticles(articles, locale);
        const fresh = adapted.filter((a) => !seen.current.has(a.id));
        fresh.forEach((a) => seen.current.add(a.id));

        const atEnd =
          resTotal > 0
            ? resPage * PAGE_SIZE >= resTotal
            : articles.length < PAGE_SIZE;
        if (atEnd) {
          if (fresh.length) setExtra((prev) => [...prev, ...fresh]);
          setDone(true);
          doneRef.current = true;
          nextPageRef.current = p + 1;
          break;
        }

        if (fresh.length) {
          setExtra((prev) => [...prev, ...fresh]);
          nextPageRef.current = p + 1;
          break;
        }

        p += 1;
        nextPageRef.current = p;
      }

      if (guard >= MAX_SKIP_PAGES) {
        setDone(true);
        doneRef.current = true;
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setErr(locale === "hi" ? "और खबरें लोड नहीं हो सकीं।" : "Could not load more stories.");
    } finally {
      inFlightRef.current = false;
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [category, latestDays, locale, total]);

  const seenEstimate = bootstrapSeen.size + extra.length;
  const canLoadMore = !done && computeLoadable(total, seenEstimate, hasListContent || extra.length > 0);

  useEffect(() => {
    if (done || !canLoadMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [done, loadMore, canLoadMore]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const allItems = [...initialItems, ...extra];
  const showSection = total > 0 || allItems.length > 0;

  if (!showSection) return null;

  return (
    <section
      id="kn-more-stories"
      className={styles.sectionBlock}
      aria-busy={loading}
    >
      {sectionTitle ? (
        <div className={styles.sectionHead}>
          <h2 className="section-title">{sectionTitle}</h2>
        </div>
      ) : null}

      {feedSource === "home" ? (
        <p className={styles.moreStoriesIntro}>
          {locale === "hi" ? (
            <>
              नीचे <strong>सभी ताज़ा खबरें</strong> नवीनतम से पुरानी क्रम में हैं। स्क्रॉल करते रहें।
            </>
          ) : (
            <>
              Below are <strong>all latest stories</strong>, newest first. Keep scrolling for more.
            </>
          )}
        </p>
      ) : null}

      {feedSource === "category" && !loadable && allItems.length === 0 ? (
        <p className={styles.moreCategoryNote}>
          {locale === "hi"
            ? "इस सूची के लिए अभी और खबरें नहीं हैं।"
            : "No further stories for this listing right now."}
        </p>
      ) : null}

      {allItems.length > 0 ? (
        <div className={styles.homeMixedGrid}>
          {allItems.map((item) => (
            <ArticleCard key={String(item.id)} item={item} locale={locale} feedSource={feedSource} />
          ))}
        </div>
      ) : feedSource === "home" && !loading ? (
        <p className={styles.moreStoriesMeta}>
          {locale === "hi"
            ? "अतिरिक्त खबरें अभी उपलब्ध नहीं हैं।"
            : "No additional stories to show right now."}
        </p>
      ) : null}

      {loading ? (
        <p className={styles.moreStoriesMeta}>
          {locale === "hi" ? "लोड हो रहा है…" : "Loading…"}
        </p>
      ) : null}
      {err ? (
        <p className={styles.moreStoriesMeta} role="alert">
          {err}
        </p>
      ) : null}
      {loadable && done && allItems.length > 0 ? (
        <p className={styles.moreStoriesMeta} style={{ opacity: 0.88 }}>
          {locale === "hi" ? "और खबरें यहीं समाप्त।" : "You are caught up."}
        </p>
      ) : null}

      {loadable && !done ? <div ref={sentinelRef} style={{ height: 1, width: "100%" }} aria-hidden /> : null}
    </section>
  );
}
