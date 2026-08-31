import Image from "next/image";
import type { CSSProperties, SyntheticEvent } from "react";

const FALLBACK_WIDTH = 1200;
const FALLBACK_HEIGHT = 675;

export type ArticleImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  width?: number | null;
  height?: number | null;
  fill?: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  quality?: number;
  style?: CSSProperties;
  onLoad?: (event: SyntheticEvent<HTMLImageElement>) => void;
  onError?: () => void;
};

function imageSize(value: number | null | undefined, fallback: number): number {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : fallback;
}

export default function ArticleImage({
  src,
  alt,
  className,
  sizes,
  width,
  height,
  fill = true,
  loading = "lazy",
  fetchPriority = "auto",
  quality = 65,
  style,
  onLoad,
  onError,
}: ArticleImageProps) {
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill
        sizes={sizes}
        loading={loading}
        fetchPriority={fetchPriority}
        quality={quality}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={imageSize(width, FALLBACK_WIDTH)}
      height={imageSize(height, FALLBACK_HEIGHT)}
      className={className}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      quality={quality}
      decoding="async"
      style={{ width: "100%", height: "auto", ...style }}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
