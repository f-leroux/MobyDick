from __future__ import annotations
import argparse
import html as htmllib
import json
import time
from typing import Dict, Any, List
import sys

import requests
from bs4 import BeautifulSoup

BASE = "http://www.powermobydick.com/Moby{num:03d}.html"
BLOCK_TAGS = ["h1", "h2", "h3", "h4", "p", "blockquote", "pre", "ul", "ol"]

def fetch(url: str, retries: int = 3, backoff: float = 1.5) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; PMD-Scraper/1.0; +https://example.org)"
    }
    last_exc = None
    for attempt in range(retries):
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
            return resp.text
        except Exception as e:
            last_exc = e
            if attempt < retries - 1:
                time.sleep(backoff ** attempt)
    raise last_exc

def extract_page(html: str) -> Dict[str, Any]:
    """
    Return {"main_text": str, "notes": [{"n": int, "note_html": str}, ...]}
    """
    soup = BeautifulSoup(html, "lxml")

    container = soup.find(id="container") or soup

    notes_out: List[Dict[str, Any]] = []
    i = 0
    for span in container.select("span.sidenote"):
        i += 1
        anchor_text = span.get_text(strip=True)

        raw_title = span.get("title") or ""
        note_html_unescaped = htmllib.unescape(raw_title)

        # Replace visible span with anchor_text plus a footnote marker
        span.replace_with(f"{anchor_text}[^{i}]")

        notes_out.append({
            "n": i,
            "note_html": note_html_unescaped,
        })

    # Gather text content while preserving paragraph breaks
    blocks: List[str] = []
    for el in container.find_all(BLOCK_TAGS, recursive=True):
        txt = el.get_text(" ", strip=True)
        if txt:
            blocks.append(txt)
    main_text = "\n\n".join(blocks)

    return {"main_text": main_text, "notes": notes_out}

def scrape_all(start: int, end: int, delay: float, out_prefix: str) -> None:
    for n in range(start, end + 1):
        url = BASE.format(num=n)
        try:
            html = fetch(url)
            data = extract_page(html)
            out_path = f"{out_prefix}{n:03d}.json"  # e.g., Moby001.json
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[ok] {url} -> {out_path} (notes: {len(data['notes'])})")
        except requests.HTTPError as e:
            print(f"[skip] {url} HTTP {e.response.status_code if e.response else 'ERR'}", file=sys.stderr)
        except Exception as e:
            print(f"[err] {url} {e}", file=sys.stderr)
        if delay > 0 and n < end:
            time.sleep(delay)

def main():
    parser = argparse.ArgumentParser(description="Scrape Power Moby-Dick pages into per-page JSON.")
    parser.add_argument("--start", type=int, default=1, help="First page number (default: 1 -> Moby001)")
    parser.add_argument("--end", type=int, default=136, help="Last page number (default: 136 -> Moby136)")
    parser.add_argument("--delay", type=float, default=0.6, help="Seconds to sleep between requests (default: 0.6)")
    parser.add_argument("--out-prefix", default="Moby", help="Output filename prefix (default: 'Moby')")
    args = parser.parse_args()

    scrape_all(args.start, args.end, args.delay, args.out_prefix)

if __name__ == "__main__":
    main()
