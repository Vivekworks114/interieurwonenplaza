/**
 * Typed media helpers for Astro components.
 * Implementation lives in media-url.mjs so Node sync scripts can share it.
 */
export {
  DEFAULT_BLOG_IMAGE,
  DEFAULT_OG_IMAGE,
  DEFAULT_TENANT_SLUG,
  extractMediaPath,
  getBlogImages,
  getPayloadPublicBase,
  getTenantSlug,
  repairTenantR2Url,
  resolveMediaUrl,
  toAbsoluteUrl,
} from './media-url.mjs';

import {
  getBlogImages as getBlogImagesBase,
  resolveMediaUrl as resolveMediaUrlBase,
} from './media-url.mjs';

type EnvBag = Record<string, string | undefined>;

function readEnv(): EnvMap {
  const viteEnv =
    typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as unknown as EnvMap)
      : undefined;
  const nodeEnv = typeof process !== 'undefined' ? (process.env as EnvMap) : undefined;
  return { ...nodeEnv, ...viteEnv };
}

export function resolveSiteMediaUrl(input: unknown, fallback?: string | null): string {
  return resolveMediaUrlBase(input, {
    env: readEnv(),
    fallback: fallback === undefined ? undefined : fallback,
  });
}

export function getEntryBlogImages(data: {
  heroImage?: string | null;
  featuredImage?: string | null;
  image?: string | null;
}) {
  return getBlogImagesBase(data, { env: readEnv() });
}
