#!/usr/bin/env python3
"""Verify internal links and image paths in built Astro site."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
PUBLIC = ROOT / "public"

ASSET_EXT = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".ico",
    ".css", ".js", ".woff", ".woff2", ".ttf", ".eot",
}


def is_page_href(href: str) -> bool:
    if not href.startswith("/"):
        return False
    if href.startswith("/_astro/"):
        return False
    lower = href.lower()
    return not any(lower.endswith(ext) for ext in ASSET_EXT)


def resolve_page(href: str) -> Path:
    href = href.rstrip("/") or "/"
    if href == "/":
        return DIST / "index.html"
    return DIST / href.lstrip("/") / "index.html"


def main() -> int:
    if not DIST.exists():
        print("dist/ not found — run npm run build first")
        return 1

    html_files = list(DIST.rglob("*.html"))
    broken_links: list[str] = []
    broken_images: list[str] = []
    external_images: list[str] = []

    for html_file in html_files:
        text = html_file.read_text(encoding="utf-8", errors="ignore")
        page = html_file.relative_to(DIST)

        for href in re.findall(r'href="(/[^"#?]+/?)"', text):
            if not is_page_href(href):
                continue
            target = resolve_page(href)
            if not target.exists():
                broken_links.append(f"{page}: {href}")

        for src in re.findall(r'(?:src|srcset)="([^"]+)"', text):
            for part in src.split(","):
                url = part.strip().split(" ")[0]
                if url.startswith("data:") or url.startswith("//"):
                    continue
                if url.startswith("http://") or url.startswith("https://"):
                    if "interieurwonenplaza.nl/wp-content" in url:
                        external_images.append(f"{page}: {url}")
                    continue
                if url.startswith("/") and re.search(r"\.(png|jpe?g|webp|gif|svg)(?:\?|$)", url, re.I):
                    img_path = PUBLIC / url.lstrip("/")
                    if not img_path.exists():
                        broken_images.append(f"{page}: {url}")

    print(f"Checked {len(html_files)} HTML files")
    print(f"Broken page links: {len(broken_links)}")
    print(f"Broken images: {len(broken_images)}")
    print(f"External WP images: {len(external_images)}")

    for item in broken_links[:25]:
        print(f"  LINK: {item}")
    for item in broken_images[:25]:
        print(f"  IMG: {item}")
    for item in external_images[:10]:
        print(f"  EXT: {item}")

    if broken_links or broken_images:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
