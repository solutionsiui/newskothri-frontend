import Image from "next/image";

export const BRAND_LOGO_SRC = "/brand-logo.png";

type BrandLogoProps = {
  className?: string;
  /** CSS px height; width matches (square asset). */
  height?: number;
  /** Use when parent already exposes an accessible name (e.g. home link with aria-label). */
  decorative?: boolean;
};

export default function BrandLogo({ className = "", height = 44, decorative = false }: BrandLogoProps) {
  /** Same visual mark for HI/EN — alt stays language-neutral for accessibility. */
  const alt = decorative ? "" : "News Kothri";

  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt={alt}
      width={height}
      height={height}
      sizes={`${height}px`}
      className={`brand-logo-img ${className}`.trim()}
      loading="eager"
      decoding="async"
      draggable={false}
      {...(decorative ? { "aria-hidden": true } : {})}
    />
  );
}
