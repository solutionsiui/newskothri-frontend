"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { NewsItem } from "../types/article";
import { categoryColors, publicArticleRouteSegment } from "../utils/formatArticle";
import ArticleImage from "../../../components/ArticleImage";

export default function PremiumRecCard({ item, lang }: { item: NewsItem; lang: string }) {
  const [err, setErr] = useState(false);
  const title = lang === "hi" ? item.title : item.titleEn;
  const time = lang === "hi" ? item.time : item.timeEn;
  const cat = lang === "hi" ? item.category : item.categoryEn;
  const color = categoryColors[item.categorySlug] || "#BB1919";
  const routeSegment = publicArticleRouteSegment(item);

  return (
    <Link
      href={`/article/${routeSegment}`}
      className="article-rec-card"
      aria-label={title}
    >
      <div className="article-rec-card-media">
        {!err ? (
          <ArticleImage
            src={item.image}
            alt=""
            width={item.imageWidth}
            height={item.imageHeight}
            className="article-rec-card-img"
            sizes="(max-width: 768px) 78vw, 280px"
            onError={() => setErr(true)}
            loading="lazy"
          />
        ) : (
          <div className="article-rec-card-fallback" style={{ background: `linear-gradient(145deg, ${color}33, var(--bg-secondary))` }} />
        )}
        <div className="article-rec-card-shade" aria-hidden />
        {item.isBreaking && <span className="article-rec-card-breaking">{lang === "hi" ? "ब्रेकिंग" : "Breaking"}</span>}
      </div>
      <div className="article-rec-card-body">
        <span className="article-rec-card-cat" style={{ color }}>{cat}</span>
        <h3 className="article-rec-card-title">{title}</h3>
        <div className="article-rec-card-meta">
          <Clock size={11} strokeWidth={2} aria-hidden />
          <span>{time}</span>
        </div>
      </div>
    </Link>
  );
}
