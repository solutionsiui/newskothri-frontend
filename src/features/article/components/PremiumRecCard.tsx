"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import type { NewsItem } from "../types/article";
import { categoryColors, publicArticleRouteSegment } from "../utils/formatArticle";

export default function PremiumRecCard({ item, lang }: { item: NewsItem; lang: string }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  const title = lang === "hi" ? item.title : item.titleEn;
  const time = lang === "hi" ? item.time : item.timeEn;
  const cat = lang === "hi" ? item.category : item.categoryEn;
  const color = categoryColors[item.categorySlug] || "#BB1919";
  const routeSegment = publicArticleRouteSegment(item);
  const go = () => navigate(`/article/${routeSegment}`);

  return (
    <article
      className="article-rec-card"
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      aria-label={title}
    >
      <div className="article-rec-card-media">
        {!err ? (
          <img src={item.image} alt="" className="article-rec-card-img" onError={() => setErr(true)} loading="lazy" />
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
    </article>
  );
}

