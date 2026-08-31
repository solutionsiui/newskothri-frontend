"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { NewsItem } from "../types/article";
import { categoryColors } from "../utils/formatArticle";
import ArticleImage from "../../../components/ArticleImage";

export default function RelatedCard({ item, lang }: { item: NewsItem; lang: string }) {
  const [err, setErr] = useState(false);
  const title = lang === "hi" ? item.title : item.titleEn;
  const time = lang === "hi" ? item.time : item.timeEn;
  const cat = lang === "hi" ? item.category : item.categoryEn;
  const color = categoryColors[item.categorySlug] || "#BB1919";
  return (
    <Link
      href={`/article/${item.id}`}
      className="aside-related-card aside-related-card--premium"
      aria-label={title}
    >
      <div className="aside-related-img">
        {!err ? (
          <ArticleImage
            src={item.image}
            alt=""
            width={item.imageWidth}
            height={item.imageHeight}
            sizes="84px"
            onError={() => setErr(true)}
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: color + "22" }} />
        )}
      </div>
      <div className="aside-related-body">
        <span className="aside-related-cat" style={{ color }}>{cat}</span>
        <h4 className="aside-related-title">{title}</h4>
        <div className="aside-related-meta">
          <Clock size={10} aria-hidden />
          <span>{time}</span>
        </div>
      </div>
    </Link>
  );
}
