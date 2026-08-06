/**
 * Shared media URL helpers for Astro (browser/build) and Node sync scripts.
 * Keeps Payload /media paths valid on localhost and Cloudflare Pages.
 *
 * R2 objects are stored under tenants/<slug>/<filename>. Payload sometimes
 * returns a bare bucket-root URL (…r2.dev/file.jpg) which 404s — repair that.
 */

export const DEFAULT_BLOG_IMAGE = '/images/2026/04/featured.jpg';
export const DEFAULT_OG_IMAGE = '/images/2023/01/cropped-Group-79-180x180.png';
/** Matches astropayload.config.json tenantSlug for this site. */
export const DEFAULT_TENANT_SLUG = 'interieurwonenplaza';

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {string}
 */
export function getPayloadPublicBase(env = typeof process !== 'undefined' ? process.env : undefined) {
  const raw =
    env?.PUBLIC_PAYLOAD_URL ||
    env?.R2_PUBLIC_URL ||
    env?.PUBLIC_R2_URL ||
    env?.PUBLIC_PAYLOAD_MEDIA_URL ||
    env?.PAYLOAD_URL ||
    env?.PUBLIC_MEDIA_URL ||
    env?.MEDIA_BASE_URL ||
    '';
  return String(raw).replace(/\/+$/, '');
}

/**
 * @param {Record<string, string | undefined> | undefined} env
 * @returns {string}
 */
export function getTenantSlug(env = typeof process !== 'undefined' ? process.env : undefined) {
  const raw =
    env?.PUBLIC_TENANT_SLUG ||
    env?.TENANT_SLUG ||
    env?.PAYLOAD_TENANT_SLUG ||
    env?.TENANT ||
    DEFAULT_TENANT_SLUG;
  return String(raw || DEFAULT_TENANT_SLUG)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
}

/**
 * Rewrite bare R2 root URLs to tenants/<slug>/<filename> when the object key
 * is missing the tenant prefix (common Payload storage-s3 bug).
 *
 * @param {string} url
 * @param {{ env?: Record<string, string | undefined> }} [options]
 * @returns {string}
 */
export function repairTenantR2Url(url, options = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!/^https?:\/\//i.test(url)) return url;

  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const isR2 =
      host.includes('r2.dev') ||
      host.includes('r2.cloudflarestorage.com') ||
      host.endsWith('.cloudflarestorage.com');
    if (!isR2) return url;

    const segments = u.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return url;

    // Already tenant-prefixed
    if (segments[0] === 'tenants' && segments.length >= 3) return url;

    // Bare object at bucket root: /filename.ext
    if (segments.length === 1 && /\.[a-z0-9]{2,8}$/i.test(segments[0])) {
      const slug = getTenantSlug(options.env);
      u.pathname = `/tenants/${slug}/${segments[0]}`;
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Extract a raw URL string from Payload upload fields (string | media object | nested value).
 * Prefers prefix+filename when `url` omitted the tenant path.
 * @param {unknown} input
 * @returns {string | null}
 */
export function extractMediaPath(input) {
  if (!input) return null;

  if (typeof input === 'string') {
    const trimmed = input.trim();
    return trimmed || null;
  }

  if (typeof input !== 'object') return null;

  const obj = /** @type {Record<string, unknown>} */ (input);

  const filename =
    typeof obj.filename === 'string' && obj.filename.trim() ? obj.filename.trim() : '';
  const prefix =
    typeof obj.prefix === 'string' ? obj.prefix.trim().replace(/^\/+|\/+$/g, '') : '';
  const rawUrl = typeof obj.url === 'string' && obj.url.trim() ? obj.url.trim() : '';

  // Rebuild from prefix + filename when stored URL is missing tenants/<slug>/
  if (filename && prefix) {
    if (rawUrl && /^https?:\/\//i.test(rawUrl) && !rawUrl.includes(`/${prefix}/`)) {
      try {
        const u = new URL(rawUrl);
        u.pathname = `/${prefix}/${filename}`;
        return u.toString();
      } catch {
        /* fall through */
      }
    }
    if (rawUrl && rawUrl.includes(`/${prefix}/`)) return rawUrl;
    if (!rawUrl) return `/${prefix}/${filename}`;
  }

  if (rawUrl) return rawUrl;
  if (typeof obj.src === 'string' && obj.src.trim()) return obj.src.trim();
  if (filename) return `/media/${filename}`;

  if (obj.value && typeof obj.value === 'object') {
    return extractMediaPath(obj.value);
  }

  if (obj.sizes && typeof obj.sizes === 'object') {
    const sizes = /** @type {Record<string, unknown>} */ (obj.sizes);
    for (const key of ['hero', 'featured', 'og', 'large', 'medium', 'thumbnail']) {
      const sizeUrl = extractMediaPath(sizes[key]);
      if (sizeUrl) return sizeUrl;
    }
  }

  return null;
}

/**
 * Convert Payload-relative media paths into absolute, production-safe URLs.
 * Leaves local site paths (/images/...) and absolute http(s) URLs intact.
 *
 * @param {unknown} input
 * @param {{
 *   env?: Record<string, string | undefined>;
 *   fallback?: string | null;
 *   siteOrigin?: string;
 * }} [options]
 * @returns {string}
 */
export function resolveMediaUrl(input, options = {}) {
  const { env, fallback = DEFAULT_BLOG_IMAGE, siteOrigin } = options;
  const raw = extractMediaPath(input);

  if (!raw) {
    return fallback ?? DEFAULT_BLOG_IMAGE;
  }

  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) {
    return /^https?:\/\//i.test(raw) ? repairTenantR2Url(raw, { env }) : raw;
  }

  // Protocol-relative
  if (raw.startsWith('//')) {
    return repairTenantR2Url(`https:${raw}`, { env });
  }

  const path = raw.startsWith('/') ? raw : `/${raw}`;

  // Local Astro static assets — keep root-relative for same-origin serving
  if (
    path.startsWith('/images/') ||
    path.startsWith('/assets/') ||
    path.startsWith('/_astro/') ||
    path.startsWith('/favicon')
  ) {
    return path;
  }

  // Payload /media (and similar) must be absolute against the CMS/media host
  const payloadBase = getPayloadPublicBase(env);
  if (payloadBase && (path.startsWith('/media/') || path.startsWith('/api/media/'))) {
    return repairTenantR2Url(`${payloadBase}${path}`, { env });
  }

  // Unknown relative CMS path with a configured media host
  if (payloadBase && !path.startsWith('/images/')) {
    return repairTenantR2Url(`${payloadBase}${path}`, { env });
  }

  // Last resort: site-origin absolute (useful for OG tags)
  if (siteOrigin) {
    return new URL(path, siteOrigin.replace(/\/+$/, '/')).href;
  }

  return path;
}

/**
 * Resolve hero, featured, and OG images for a blog post with safe fallbacks.
 *
 * @param {{
 *   heroImage?: unknown;
 *   featuredImage?: unknown;
 *   image?: unknown;
 *   ogImage?: unknown;
 *   meta?: { image?: unknown };
 * }} data
 * @param {{
 *   env?: Record<string, string | undefined>;
 *   siteOrigin?: string;
 * }} [options]
 */
export function getBlogImages(data, options = {}) {
  const hero = resolveMediaUrl(data.heroImage ?? data.featuredImage ?? data.image, {
    ...options,
    fallback: DEFAULT_BLOG_IMAGE,
  });

  const featured = resolveMediaUrl(data.featuredImage ?? data.heroImage ?? data.image, {
    ...options,
    fallback: DEFAULT_BLOG_IMAGE,
  });

  const og = resolveMediaUrl(
    data.ogImage ?? data.meta?.image ?? data.featuredImage ?? data.heroImage ?? data.image,
    {
      ...options,
      fallback: DEFAULT_OG_IMAGE,
    },
  );

  return { hero, featured, og };
}

/**
 * Make any image URL absolute for Open Graph / social cards.
 *
 * @param {string} url
 * @param {string} siteOrigin
 */
export function toAbsoluteUrl(url, siteOrigin) {
  if (!url) return toAbsoluteUrl(DEFAULT_OG_IMAGE, siteOrigin);
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  return new URL(url, siteOrigin.replace(/\/+$/, '/')).href;
}
