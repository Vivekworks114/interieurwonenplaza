#!/usr/bin/env python3
"""Fetch WordPress content and download images for interieurwonenplaza.nl."""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
DATA = ROOT / "src" / "data"
BASE = "https://interieurwonenplaza.nl"

HOMEPAGE_IMAGES = [
    "/wp-content/uploads/2023/01/Frame-582.svg",
    "/wp-content/uploads/2023/01/Frame1.svg",
    "/wp-content/uploads/2023/01/Frame2.svg",
    "/wp-content/uploads/2023/01/Frame3.svg",
    "/wp-content/uploads/2023/01/Frame4.svg",
    "/wp-content/uploads/2023/01/Frame6.svg",
    "/wp-content/uploads/2023/01/Frame7.svg",
    "/wp-content/uploads/2023/01/Mask-group.svg",
    "/wp-content/uploads/2023/01/Group-81.svg",
    "/wp-content/uploads/2023/01/Group-80121.jpg",
    "/wp-content/uploads/2023/01/Ellipse-141.png",
    "/wp-content/uploads/2023/01/shower-g976959ace_1920-1024x685.jpg",
    "/wp-content/uploads/2023/01/robot-vacuum-cleaner-g834ac9020_1920-1024x683.jpg",
    "/wp-content/uploads/2023/01/hd-wallpaper-g32e4eb954_1280-1024x682.jpg",
    "/wp-content/uploads/2023/01/lantern-g62a86f209_1920-1024x682.jpg",
    "/wp-content/uploads/2023/01/washing-machine-g31f28230a_1920-1024x683.jpg",
    "/wp-content/uploads/2023/01/colors-g84ec9d7be_1920-1024x683.jpg",
    "/wp-content/uploads/2023/01/cropped-Group-79-32x32.png",
    "/wp-content/uploads/2023/01/cropped-Group-79-180x180.png",
    "/wp-content/uploads/2023/01/cropped-Group-79-192x192.png",
    "/wp-content/uploads/2023/01/kitchen-living-room-gddb814170_1920.jpg",
]

FALLBACK_PRODUCT = "/images/2023/01/kitchen-living-room-gddb814170_1920.jpg"
FALLBACK_BLOG = "/images/2023/01/hd-wallpaper-g32e4eb954_1280-1024x682.jpg"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read()


def fetch_json(url: str):
    return json.loads(fetch(url).decode("utf-8"))


def wp_path(url: str) -> str:
    if not url:
        return ""
    m = re.search(r"/wp-content/uploads/(.+)$", url)
    return f"/images/{m.group(1)}" if m else ""


def download(path: str) -> str:
    local = PUBLIC / path.lstrip("/")
    local.parent.mkdir(parents=True, exist_ok=True)
    if not local.exists() or local.stat().st_size == 0:
        try:
            local.write_bytes(fetch(BASE + path.replace("/images/", "/wp-content/uploads/")))
        except Exception as e:
            print(f"  skip {path}: {e}")
    return path


def collect_sitemap_urls() -> list[str]:
    xml = fetch(f"{BASE}/sitemap_index.xml" if False else f"{BASE}/sitemap.xml").decode()
    # index
    locs = re.findall(r"<loc>(https://interieurwonenplaza\.nl/[^<]+)</loc>", xml)
    urls: list[str] = []
    for loc in locs:
        if loc.endswith(".xml") or "sitemap" in loc.split("/")[-1]:
            sub = fetch(loc).decode()
            urls.extend(re.findall(r"<loc>(https://interieurwonenplaza\.nl/[^<]+)</loc>", sub))
        else:
            urls.append(loc)
    return list(dict.fromkeys(urls))


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    print("Downloading homepage assets...")
    for p in HOMEPAGE_IMAGES:
        download("/images/" + p.split("/wp-content/uploads/")[1])

    print("Fetching posts...")
    posts: list[dict] = []
    page_num = 1
    while page_num <= 3:
        batch = fetch_json(
            f"{BASE}/wp-json/wp/v2/posts?per_page=100&page={page_num}&_embed"
        )
        if not batch:
            break
        posts.extend(batch)
        page_num += 1

    blog_posts = []
    image_urls: set[str] = set(HOMEPAGE_IMAGES)

    for p in posts:
        slug = p["slug"]
        title = p["title"]["rendered"]
        excerpt = re.sub(r"<[^>]+>", "", p.get("excerpt", {}).get("rendered", "")).strip()
        content = p.get("content", {}).get("rendered", "")
        date = p["date"][:10]
        author = "Cindy"
        if p.get("_embedded", {}).get("author"):
            author = p["_embedded"]["author"][0].get("name", author)

        feat = p.get("jetpack_featured_media_url", "")
        if not feat and p.get("_embedded", {}).get("wp:featuredmedia"):
            media = p["_embedded"]["wp:featuredmedia"]
            if media and media[0]:
                feat = media[0].get("source_url", "")

        local_feat = wp_path(feat) or FALLBACK_BLOG
        if feat:
            image_urls.add(feat.replace(BASE, ""))

        # inline images in content
        for m in re.findall(r'src="(https://interieurwonenplaza\.nl/wp-content/uploads/[^"]+)"', content):
            image_urls.add(m.replace(BASE, ""))

        blog_posts.append(
            {
                "slug": slug,
                "title": title,
                "excerpt": excerpt[:300],
                "content": content,
                "date": date,
                "author": author,
                "featuredImage": local_feat,
                "type": "blog",
            }
        )

    print("Fetching product slugs...")
    zb_xml = fetch(f"{BASE}/zb_mp-sitemap.xml").decode()
    product_urls = re.findall(r"<loc>(https://interieurwonenplaza\.nl/[^<]+)</loc>", zb_xml)
    product_slugs = [u.rstrip("/").split("/")[-1] for u in product_urls]

    products = []
    for slug in product_slugs:
        products.append(
            {
                "slug": slug,
                "title": slug.replace("beste-", "Beste ").replace("-", " ").title(),
                "featuredImage": FALLBACK_PRODUCT,
                "type": "product",
            }
        )

    print(f"Downloading {len(image_urls)} images...")
    for path in sorted(image_urls):
        if path.startswith("/wp-content/"):
            download("/images/" + path.split("/wp-content/uploads/")[1])

    slugs = ["", "over-ons", "contact", "blogs", "sitemap"]
    slugs.extend(p["slug"] for p in blog_posts)
    slugs.extend(product_slugs)

    (DATA / "blog-posts.json").write_text(
        json.dumps(blog_posts, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "products.json").write_text(
        json.dumps(products, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "slugs.json").write_text(
        json.dumps(sorted(set(slugs)), ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Done: {len(blog_posts)} posts, {len(products)} products")


if __name__ == "__main__":
    main()
