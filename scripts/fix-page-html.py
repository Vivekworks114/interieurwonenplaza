#!/usr/bin/env python3
"""Fix migrated page-html: rewrite broken links and download missing images."""

from __future__ import annotations

import html as html_lib
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML_DIR = ROOT / "src/data/page-html"
PUBLIC = ROOT / "public"
BASE = "https://interieurwonenplaza.nl"


BASE = "https://interieurwonenplaza.nl"


def build_toc_html(content: str) -> str:
    headings = re.findall(
        r'<h([2-4])[^>]*(?:id="([^"]*)")?[^>]*>(.*?)</h\1>',
        content,
        re.S,
    )
    if not headings:
        return ""

    items: list[str] = []
    for level, anchor, raw_title in headings:
        title = re.sub(r"<[^>]+>", "", raw_title).strip()
        if not title or title.lower() == "inhoudsopgave":
            continue
        slug = anchor or re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
        indent = "  " * (int(level) - 2)
        items.append(
            f'{indent}<li class="elementor-toc__item"><a class="elementor-toc__link" href="#{slug}">{html_lib.escape(title)}</a></li>'
        )

    if not items:
        return ""

    return (
        '<div class="elementor-toc__body elementor-toc__body--static">'
        '<ul class="elementor-toc__list">'
        + "".join(items)
        + "</ul></div>"
    )


def inject_toc(content: str) -> str:
    toc = build_toc_html(content)
    if not toc:
        return content
    pattern = (
        r'(<div[^>]*class="elementor-toc__body"[^>]*>)\s*'
        r'<div class="elementor-toc__spinner-container">[\s\S]*?</div>\s*(</div>)'
    )
    return re.sub(pattern, rf"\1{toc}\2", content, count=1)


def fix_content(content: str) -> str:
    content = re.sub(
        r'href="(/(?:19|20)\d{2}/(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/?)"',
        r'href="/blogs/"',
        content,
    )
    content = content.replace("/interieuwwonenplazanl/", "/")
    content = content.replace(
        "/electrowarmer-gebruiken-tips-voor-veilig-slim-en-energiezuinig-verwar.../",
        "/elektrowarmer-gebruiken-handige-tips-voor-veilig-en-efficient-verwarmen/",
    )
    content = re.sub(
        r'href="/electrowarmer-gebruiken-tips-voor-veilig-slim-en-energiezuinig-verwar\.\.\."',
        'href="/elektrowarmer-gebruiken-handige-tips-voor-veilig-en-efficient-verwarmen/"',
        content,
    )
    content = content.replace(
        "/electrowarmer-gebruiken-tips-voor-veilig-slim-en-energiezuinig-verwarmen/",
        "/elektrowarmer-gebruiken-handige-tips-voor-veilig-en-efficient-verwarmen/",
    )
    content = re.sub(
        r"https?://(?:www\.)?interieurwonenplaza\.nl/wp-content/uploads/([^\s\"'<>]+)",
        r"/images/\1",
        content,
    )
    def _rewrite_site_url(match: re.Match[str]) -> str:
        path = match.group("path")
        return path if path else "/"

    content = re.sub(
        rf"https?://(?:www\.)?interieurwonenplaza\.nl(?P<path>/[a-z0-9\-_/]*)",
        _rewrite_site_url,
        content,
    )
    # Promote lazy-load attributes so built pages reference real src paths
    content = re.sub(
        r'\ssrc="data:image/svg\+xml[^"]*"\s+([^>]*?)data-lazy-src="([^"]+)"',
        lambda m: f' src="{m.group(2)}" {m.group(1)}',
        content,
    )
    content = inject_toc(content)
    return content


def collect_image_paths(content: str) -> set[str]:
    paths: set[str] = set()
    for m in re.findall(
        r'(?:src|srcset|data-lazy-src|data-lazy-srcset)="([^"]+)"', content
    ):
        for part in m.split(","):
            url = part.strip().split()[0]
            if url.startswith("/images/"):
                paths.add(url.split("?")[0])
    return paths


def download_image(local_path: str) -> tuple[str, bool]:
    rel = local_path.lstrip("/")
    dest = PUBLIC / rel
    if dest.exists():
        return local_path, True
    dest.parent.mkdir(parents=True, exist_ok=True)
    remote = f"{BASE}/wp-content/uploads/{rel.removeprefix('images/')}"
    result = subprocess.run(
        ["curl", "-sfL", remote, "-o", str(dest)],
        capture_output=True,
        timeout=60,
    )
    return local_path, result.returncode == 0 and dest.exists()


def main() -> int:
    if not HTML_DIR.exists():
        print("No page-html directory found")
        return 1

    all_paths: set[str] = set()
    files = list(HTML_DIR.glob("*.html"))
    for html_file in files:
        content = fix_content(html_file.read_text(encoding="utf-8"))
        all_paths |= collect_image_paths(content)
        html_file.write_text(content, encoding="utf-8")

    missing = sorted(p for p in all_paths if not (PUBLIC / p.lstrip("/")).exists())
    print(f"Fixed {len(files)} HTML files")
    print(f"Downloading {len(missing)} missing images...")

    ok = fail = 0
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = {pool.submit(download_image, p): p for p in missing}
        for future in as_completed(futures):
            path, success = future.result()
            if success:
                ok += 1
            else:
                fail += 1
                print(f"  FAIL: {path}", file=sys.stderr)

    still_missing = [p for p in missing if not (PUBLIC / p.lstrip("/")).exists()]
    print(f"Downloaded {ok}/{len(missing)} images ({fail} failed)")
    print(f"Still missing: {len(still_missing)}")
    if still_missing[:10]:
        for p in still_missing[:10]:
            print(f"  {p}")
    return 1 if still_missing else 0


if __name__ == "__main__":
    sys.exit(main())
