import type { Metadata } from "next";
import ArticlePageClient from "../../../features/article/client/ArticlePageClient";
import { buildArticleMetadata } from "../../../features/article/seo/metadata";
import { buildNewsArticleJsonLd } from "../../../features/article/seo/schema";
import { getArticle } from "../../../features/article/server/getArticle";
import { adaptArticle } from "../../../services/articleAdapter";
import { sanitizeServerArticle } from "../../../features/article/server/sanitizeArticle";

/** Cache the server-rendered article briefly while keeping editorial updates timely. */
export const revalidate = 60;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  return buildArticleMetadata(id);
}

export default async function ArticleRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [rawArticle, jsonLd] = await Promise.all([
    getArticle(id),
    buildNewsArticleJsonLd(id),
  ]);
  const initialArticle = rawArticle
    ? adaptArticle(sanitizeServerArticle(rawArticle))
    : null;

  return <ArticlePageClient articleId={id} initialArticle={initialArticle} jsonLd={jsonLd} />;
}
