import { useMemo, useState } from "react";
import Image from "next/image";
import { youtubeVideoIdFromUrl } from "../utils/youtube";

type Props = {
  youtubeUrl: string;
  alt: string;
  className?: string;
  sizes?: string;
  /** Used when URL has no id or all CDN images fail */
  fallbackSrc?: string;
};

function thumbUrls(videoId: string) {
  return {
    maxres: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

type ThumbUrls = ReturnType<typeof thumbUrls>;

function ResolvedYoutubeThumb({
  primary,
  urls,
  fallbackSrc,
  alt,
  className,
  sizes,
}: {
  primary: string;
  urls: ThumbUrls | null;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  sizes: string;
}) {
  const [src, setSrc] = useState(primary);
  const [quality, setQuality] = useState<"maxres" | "hq" | "fallback">(
    urls ? "maxres" : "fallback"
  );

  if (!src) return null;

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={1280}
      height={720}
      sizes={sizes}
      quality={65}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (quality === "maxres" && urls) {
          setSrc(urls.hq);
          setQuality("hq");
          return;
        }
        if (quality === "hq" && fallbackSrc && src !== fallbackSrc) {
          setSrc(fallbackSrc);
          setQuality("fallback");
        }
      }}
    />
  );
}

/**
 * YouTube poster (maxres → hqdefault) with optional static fallback.
 */
export default function YoutubeThumbImg({
  youtubeUrl,
  alt,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  fallbackSrc,
}: Props) {
  const id = useMemo(() => youtubeVideoIdFromUrl(youtubeUrl), [youtubeUrl]);
  const urls = id ? thumbUrls(id) : null;
  const primary = urls?.maxres ?? fallbackSrc ?? "";

  return (
    <ResolvedYoutubeThumb
      key={`${primary}|${fallbackSrc || ""}`}
      primary={primary}
      urls={urls}
      fallbackSrc={fallbackSrc}
      alt={alt}
      className={className}
      sizes={sizes}
    />
  );
}
