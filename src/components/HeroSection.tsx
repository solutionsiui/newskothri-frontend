"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Clock, ArrowUpRight, Zap, Eye } from "lucide-react";
import type { ContentArticle } from "../services/contentTypes";
import { useLang } from "../context/LangContext";
import { fetchPublishedArticles } from "../services/newsApi";
import { adaptArticles } from "../services/articleAdapter";
import { displayDek, displayHeadline } from "../services/articleDisplay";
import styles from "../app/newsroom.module.css";
import { formatDisplayTag } from "../lib/formatDisplayTag";
import { publicArticleRouteSegment } from "../features/article/utils/formatArticle";

const ROTATION_INTERVAL = 5000;
const EMPTY_STORIES: ContentArticle[] = [];

type HeroSectionProps = {
  initialStories?: ContentArticle[];
  initialLocale?: "hi" | "en";
};

function storyFields(s: ContentArticle, lang: "hi" | "en") {
  return {
    title: displayHeadline(s, lang),
    summary: displayDek(s, lang),
    category: lang === "hi" ? s.category : s.categoryEn,
    time: lang === "hi" ? s.time : s.timeEn,
    author: lang === "hi" ? s.author : s.authorEn,
  };
}

export default function HeroSection({
  initialStories = EMPTY_STORIES,
  initialLocale = "hi",
}: HeroSectionProps) {
  const serverStories = useMemo(() => initialStories.slice(0, 4), [initialStories]);
  const [clientStories, setClientStories] = useState<ContentArticle[]>([]);
  const [heroLoading, setHeroLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [imgErr, setImgErr] = useState<Record<string | number, boolean>>({});
  const [heroAspect, setHeroAspect] = useState<Record<string | number, number>>({});
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (lang === initialLocale) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setHeroLoading(true);
    });
    fetchPublishedArticles({ limit: 4, locale: lang })
      .then((articles) => {
        if (cancelled) return;
        setClientStories(adaptArticles(articles, lang).slice(0, 4));
        setActiveIdx(0);
        setProgress(0);
      })
      .finally(() => {
        if (!cancelled) setHeroLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang, initialLocale]);

  const stories = lang === initialLocale ? serverStories : clientStories;
  const isHeroLoading = lang !== initialLocale && heroLoading;

  const goTo = useCallback((idx: number) => {
    const len = stories.length;
    const clamped = len === 0 ? 0 : Math.min(Math.max(0, idx), len - 1);
    setActiveIdx(clamped);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [stories.length]);

  const handleHeroImgLoad = useCallback(
    (storyId: string | number, e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (naturalWidth > 0 && naturalHeight > 0) {
        setHeroAspect((prev) => ({ ...prev, [storyId]: naturalWidth / naturalHeight }));
      }
    },
    []
  );

  useEffect(() => {
    if (stories.length <= 1 || reduceMotion) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i + 1) % stories.length);
    }, ROTATION_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stories.length, reduceMotion]);

  useEffect(() => {
    if (stories.length <= 1 || reduceMotion) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    setProgress(0);

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min((elapsed / ROTATION_INTERVAL) * 100, 100);
      setProgress(p);
      if (p < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stories.length, reduceMotion, activeIdx]);

  const displayIdx =
    stories.length === 0 ? 0 : Math.min(activeIdx, stories.length - 1);
  const fillProgress = reduceMotion ? 0 : progress;

  if (!isHeroLoading && stories.length === 0) {
    return (
      <section className={`hero-cinematic-wrap ${styles.breakingSection}`} aria-live="polite">
        <div className="hero-breaking-formal-head section-inner">
          <h2 className="hero-breaking-formal-title">{t("ताज़ा खबर", "Breaking news")}</h2>
        </div>
        <div className="hero-cinematic-inner" style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 16, color: "var(--ink-600)", maxWidth: 480, margin: "0 auto" }}>
            {t(
              "अभी कोई प्रकाशित खबर नहीं है। CMS से लेख प्रकाशित करने के बाद वे यहाँ दिखेंगी।",
              "No published stories yet. Publish articles from the CMS to see them here."
            )}
          </p>
        </div>
      </section>
    );
  }

  const story = stories[displayIdx] ?? stories[0];
  if (!story) {
    return (
      <section className={`hero-cinematic-wrap ${styles.breakingSection}`}>
        <div className="hero-cinematic-inner" style={{ padding: 80, display: "flex", justifyContent: "center" }}>
          <span style={{ color: "var(--ink-400)" }}>…</span>
        </div>
      </section>
    );
  }

  const { title, summary, category } = storyFields(story, lang);
  const articleSegment = publicArticleRouteSegment(story);
  const articleUrl = `/article/${articleSegment}`;
  const rawTags = (lang === "hi" ? story.tags : story.tagsEn) ?? [];
  const tags = rawTags.slice(0, 8).map((tag) => formatDisplayTag(tag)).filter(Boolean);

  const progressWidth = (i: number) =>
    i < displayIdx ? "100%" : i === displayIdx ? `${fillProgress}%` : "0%";

  return (
    <section
      className={`hero-cinematic-wrap ${styles.breakingSection}`}
      aria-live="polite"
    >
      <div className="hero-breaking-formal-head section-inner">
        <h2 className="hero-breaking-formal-title">{t("ताज़ा खबर", "Breaking news")}</h2>
        <p className="hero-breaking-formal-sub">
          {t("लाइव अपडेट", "Live updates")}
        </p>
      </div>

      <div className="hero-cinematic-inner">
        <div className="hero-cinematic-main">
          <div className="hero-cin-lead-block">
            <div className="hero-cin-badges">
              <div className="hero-cin-badge-group">
                {story.isBreaking && (
                  <span className="hero-cin-breaking">
                    <span className="hero-cin-dot" />
                    {t("ब्रेकिंग", "Breaking")}
                  </span>
                )}
                <span className="hero-cin-cat">{category}</span>
              </div>
              <button
                type="button"
                className="hero-cin-read-btn-inline"
                onClick={() => navigate(articleUrl)}
              >
                {t("पूरी खबर", "Read Story")}
                <ArrowUpRight size={13} aria-hidden />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={String(story.id) + lang + "-title"}
                className="hero-cin-text"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <h1
                  className="hero-cin-headline"
                  onClick={() => navigate(articleUrl)}
                  style={{ cursor: "pointer" }}
                >
                  {title}
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          <div
            className="hero-cin-media-band"
            style={{
              ...(heroAspect[story.id]
                ? { aspectRatio: String(heroAspect[story.id]) }
                : undefined),
              cursor: "pointer",
            }}
            onClick={() => navigate(articleUrl)}
            role="link"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(articleUrl);
              }
            }}
            aria-label={title}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={String(story.id)}
                className="hero-cin-img-frame"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {!imgErr[story.id] ? (
                  <img
                    src={story.image}
                    alt={title}
                    className="hero-cin-img"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onLoad={(e) => handleHeroImgLoad(story.id, e)}
                    onError={() => setImgErr((e) => ({ ...e, [story.id]: true }))}
                  />
                ) : (
                  <div className="hero-cin-fallback" />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="hero-cin-gradient" aria-hidden />
          </div>

          <div className="hero-cin-body-block">
            <AnimatePresence mode="wait">
              <motion.div
                key={String(story.id) + lang + "-summary"}
                className="hero-cin-text"
                initial={false}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                transition={reduceMotion ? { duration: 0 } : { delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="hero-cin-summary">{summary}</p>
              </motion.div>
            </AnimatePresence>

            <div className="hero-cin-progress-row" role="tablist" aria-label={t("टॉप खबरें", "Top stories")}>
              {stories.map((s, i) => (
                <button
                  key={String(s.id)}
                  type="button"
                  className="hero-cin-progress-bar"
                  onClick={() => goTo(i)}
                  aria-label={`${t("खबर", "Story")} ${i + 1}`}
                  aria-selected={i === displayIdx}
                >
                  <span
                    className="hero-cin-progress-fill"
                    style={{ width: progressWidth(i) }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="hero-cin-side">
          <div className="hero-cin-side-header">
            <Zap size={13} fill="currentColor" style={{ color: "var(--brand-red)" }} aria-hidden />
            <span>{t("टॉप स्टोरीज़", "Top Stories")}</span>
          </div>
          <div
            className={`hero-cin-side-list${stories.length <= 4 ? " hero-cin-side-list--count-4" : ""}`}
          >
            {stories.map((s, i) => {
              const f = storyFields(s, lang);
              return (
                <motion.article
                  key={String(s.id)}
                  className={`hero-cin-side-item${displayIdx === i ? " active" : ""}`}
                  initial={reduceMotion ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.1 + i * 0.08, duration: 0.4 }}
                  onClick={() => goTo(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goTo(i);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-current={displayIdx === i ? "true" : undefined}
                >
                  <span className="hero-cin-side-num">{String(i + 1).padStart(2, "0")}</span>
                  <div className="hero-cin-side-thumb-wrap">
                    {!imgErr[s.id] ? (
                      <img
                        src={s.image}
                        alt=""
                        className="hero-cin-side-thumb"
                        loading="lazy"
                        decoding="async"
                        onError={() => setImgErr((e) => ({ ...e, [s.id]: true }))}
                      />
                    ) : (
                      <div className="hero-cin-side-thumb-fallback" aria-hidden />
                    )}
                  </div>
                  <div className="hero-cin-side-body">
                    <span className="hero-cin-side-cat">{f.category}</span>
                    <h3 className="hero-cin-side-title">{f.title}</h3>
                    <div className="hero-cin-side-meta">
                      <Clock size={10} aria-hidden />
                      <span>{f.time}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {tags.length > 0 && (
            <div className="hero-cin-tags-section">
              <p className="hero-cin-tags-label">
                <Eye size={11} aria-hidden />
                {t("ट्रेंडिंग", "Trending")}
              </p>
              <div className="hero-cin-tags-row">
                {tags.map((tag) => (
                  <button key={tag} type="button" className="hero-cin-tag">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
