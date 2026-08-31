import "server-only";

import sanitizeHtml from "sanitize-html";
import type { BackendArticle } from "../../../services/newsApi";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "a", "ul", "ol", "li",
  "h2", "h3", "blockquote", "span", "div", "img", "figure", "figcaption",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "rel", "target", "class"],
  img: ["src", "alt", "width", "height", "loading", "decoding", "class"],
  "*": ["class"],
};

export function sanitizeArticleBody(value: unknown): string {
  return sanitizeHtml(String(value || ""), {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName, attribs) => ({
        tagName: "a",
        attribs: {
          ...attribs,
          ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
        },
      }),
    },
  });
}

/** Sanitize CMS-authored HTML before it crosses the server-to-client boundary. */
export function sanitizeServerArticle(article: BackendArticle): BackendArticle {
  return {
    ...article,
    body: sanitizeArticleBody(article.body),
    bodyHi: sanitizeArticleBody(article.bodyHi),
  };
}
