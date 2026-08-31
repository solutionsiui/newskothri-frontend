"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Clock, Link2 } from "lucide-react";
import { IconFacebook, IconWhatsApp, IconXLogo } from "../../../components/icons/ShareBrandIcons";
import type { NewsItem } from "../types/article";
import { categoryColors } from "../utils/formatArticle";
import { shareToFacebook, shareToTwitter, shareToWhatsApp } from "../utils/share";
import { shareLabels } from "../../../i18n/siteCopy";

const MarketWidget = dynamic(() => import("../../../components/MarketWidget"));

type TFn = (hi: string, en: string) => string;

function mergeSidebarArticles(related: NewsItem[], mostRead: NewsItem[], max = 8): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of [...related, ...mostRead]) {
    const id = String(item.id);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
    if (out.length >= max) break;
  }
  return out;
}

export default function ArticleSidebar({
  sideRelated,
  mostReadSidebar,
  color,
  lang,
  t,
  title,
  pageUrl,
  copied,
  onCopyLink,
  showMarket = false,
}: {
  sideRelated: NewsItem[];
  mostReadSidebar: NewsItem[];
  color: string;
  lang: "hi" | "en";
  t: TFn;
  title: string;
  pageUrl: string;
  copied: boolean;
  onCopyLink: () => void;
  showMarket?: boolean;
}) {
  const sl = shareLabels(t);
  const moreArticles = useMemo(
    () => mergeSidebarArticles(sideRelated, mostReadSidebar, 8),
    [sideRelated, mostReadSidebar]
  );

  return (
    <aside className="article-sidebar">
      {showMarket ? <MarketWidget variant="sidebar" accentColor={color} /> : null}
      {moreArticles.length > 0 && (
        <div className="aside-block">
          <div className="aside-block-header" style={{ borderLeftColor: color }}>
            <span>{t("और खबरें", "More articles")}</span>
          </div>
          <ol className="aside-mostread-list aside-more-articles-list">
            {moreArticles.map((item, i) => {
              const mTitle = lang === "hi" ? item.title : item.titleEn;
              const mTime = lang === "hi" ? item.time : item.timeEn;
              const mCat = lang === "hi" ? item.category : item.categoryEn;
              const mColor = categoryColors[item.categorySlug] || "#BB1919";
              return (
                <li key={String(item.id)}>
                  <Link href={`/article/${item.id}`} className="aside-mostread-item">
                    <span className="aside-mostread-num">{String(i + 1).padStart(2, "0")}</span>
                    <div className="aside-mostread-body">
                      <span className="aside-mostread-cat" style={{ color: mColor }}>{mCat}</span>
                      <h4 className="aside-mostread-title">{mTitle}</h4>
                      <div className="aside-mostread-meta">
                        <Clock size={10} aria-hidden />
                        <span>{mTime}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <div className="aside-block aside-share-widget">
        <div className="aside-block-header" style={{ borderLeftColor: color }}>
          <span>{t("शेयर करें", "Share Story")}</span>
        </div>
        <div className="aside-share-grid">
          <button
            type="button"
            className="aside-share-btn aside-wa"
            onClick={() => shareToWhatsApp(title, pageUrl)}
          >
            <IconWhatsApp size={18} aria-hidden className="article-share-brand-icon" />
            <span>{sl.whatsapp}</span>
          </button>
          <button
            type="button"
            className="aside-share-btn aside-tw"
            onClick={() => shareToTwitter(title, pageUrl)}
          >
            <IconXLogo size={18} aria-hidden className="article-share-brand-icon" />
            <span>{sl.twitter}</span>
          </button>
          <button
            type="button"
            className="aside-share-btn aside-fb"
            onClick={() => shareToFacebook(pageUrl)}
          >
            <IconFacebook size={18} aria-hidden className="article-share-brand-icon" />
            <span>{sl.facebook}</span>
          </button>
          <button type="button" className="aside-share-btn" onClick={onCopyLink}>
            <Link2 size={18} aria-hidden strokeWidth={2} />
            <span>{copied ? sl.copied : sl.copyLink}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
