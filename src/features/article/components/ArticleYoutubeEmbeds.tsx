"use client";

import { Play } from "lucide-react";
import YoutubeThumbImg from "../../../components/YoutubeThumbImg";
import { youtubeVideoIdFromUrl } from "../../../utils/youtube";

export type ArticleYoutubeEmbedItem = {
  youtubeUrl: string;
  caption?: string;
};

type TFn = (hi: string, en: string) => string;

function watchUrlFromStored(url: string): string {
  const id = youtubeVideoIdFromUrl(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}

function clipTitle(item: ArticleYoutubeEmbedItem, t: TFn): string {
  const cap = item.caption?.trim();
  return cap || t("यूट्यूब वीडियो", "YouTube video");
}

/** Single in-body YouTube clip (blue link, thumbnail on hover, opens YouTube on click). */
export function ArticleYoutubeClip({
  item,
  t,
}: {
  item: ArticleYoutubeEmbedItem;
  t: TFn;
}) {
  if (!youtubeVideoIdFromUrl(item.youtubeUrl)) return null;

  const href = watchUrlFromStored(item.youtubeUrl);
  const title = clipTitle(item, t);

  return (
    <p className="read-also article-youtube-embed-item">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="article-youtube-link"
        aria-label={t(`यूट्यूब पर देखें: ${title}`, `Watch on YouTube: ${title}`)}
      >
        <span className="article-youtube-link-text">{title}</span>
        <span className="article-youtube-thumb-hover" aria-hidden>
          <YoutubeThumbImg
            youtubeUrl={item.youtubeUrl}
            alt=""
            className="article-youtube-thumb-img"
            sizes="300px"
          />
          <span className="article-youtube-thumb-overlay">
            <span className="article-youtube-play-badge">
              <Play size={20} fill="white" color="white" strokeWidth={0} />
            </span>
          </span>
        </span>
      </a>
    </p>
  );
}

/** Legacy: render all embeds in a block (used only if nothing is placed in body). */
export default function ArticleYoutubeEmbeds({
  items,
  t,
}: {
  items: ArticleYoutubeEmbedItem[];
  t: TFn;
}) {
  const valid = items.filter((item) => youtubeVideoIdFromUrl(item.youtubeUrl));
  if (!valid.length) return null;

  return (
    <div className="article-youtube-embeds" role="region" aria-label={t("वीडियो", "Video")}>
      {valid.map((item, i) => (
        <ArticleYoutubeClip key={`${youtubeVideoIdFromUrl(item.youtubeUrl)}-${i}`} item={item} t={t} />
      ))}
    </div>
  );
}
