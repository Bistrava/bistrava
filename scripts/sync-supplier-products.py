"""Fetch exact public WooCommerce product records used by the Bistrava drafts."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path


SOURCES = {
    "BIS-008": ("ggv.si", "Kapljice za merjenje trdote vode"),
    "BIS-016": ("ggv.si", "Cintropur NW25"),
    "BIS-020": ("filtri-za-vodo.si", "Filter vložek predfilter 5 mikron PP"),
    "BIS-029": ("ggv.si", "Prašek za dezinfekcijo ionske smole"),
    "BIS-030": ("ggv.si", "Tabletirana sol 25 kg"),
    "BIS-038": ("ggv.si", "Filter za vodo z regulatorjem tlaka Gevor"),
    "BIS-040": (
        "ggv.si",
        "Avtomatski samočistlni filter za vodo z regulatorjem tlaka Gevor",
    ),
    "BIS-041": ("ggv.si", "Filter za vodo Gevor"),
    "BIS-054": ("ggv.si", "Filter za pralni stroj s fosfati"),
    "BIS-060": ("konik.si", "AQ800"),
    "BIS-061": ("filtri-za-vodo.si", "Core 110 Compact"),
    "BIS-064": ("filtri-za-vodo.si", "VD18"),
    "BIS-066": ("ggv.si", "ELBA 12"),
    "BIS-067": ("filtri-za-vodo.si", "Optimo CS Mini 12L"),
    "BIS-069": ("filtri-za-vodo.si", "VD12"),
    "BIS-071": ("filtri-za-vodo.si", "Core 250 CI"),
    "BIS-074": ("ggv.si", "Wireless Water Guard"),
    "BIS-076": ("ggv.si", "slug:ionska-mehcalna-naprava-midnight-12"),
    "BIS-077": ("ggv.si", "ELBA 30"),
    "BIS-078": ("ggv.si", "slug:ionska-mehcalna-naprava-midnight-30"),
    "BIS-082": ("konik.si", "Adriatica 15L"),
    "BIS-083": ("filtri-za-vodo.si", "AntraciteAzure 250 Clack Compact"),
    "BIS-084": (
        "ggv.si",
        "Dodatni senzor",
    ),
    "BIS-086": (
        "filtri-za-vodo.si",
        "slug:reducirni-ventil-membranski-z-merilno-regulacijo-in-filtrom-800mcr",
    ),
}


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"br", "li", "p", "h1", "h2", "h3", "h4", "tr"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag in {"li", "p", "h1", "h2", "h3", "h4", "tr"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        self.parts.append(data)

    def text(self) -> str:
        value = html.unescape("".join(self.parts)).replace("\xa0", " ")
        value = re.sub(r"[ \t]+", " ", value)
        value = re.sub(r"\n\s*\n+", "\n", value)
        return value.strip()


def plain_text(value: str) -> str:
    parser = TextExtractor()
    parser.feed(value or "")
    return parser.text()


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    return " ".join(
        "".join(character for character in value if not unicodedata.combining(character)).split()
    )


def score(query: str, product: dict[str, object]) -> float:
    name = normalize(str(product.get("name", "")))
    query_normalized = normalize(query)
    query_tokens = set(re.findall(r"[a-z0-9]+", query_normalized))
    name_tokens = set(re.findall(r"[a-z0-9]+", name))
    token_score = len(query_tokens & name_tokens) / max(1, len(query_tokens | name_tokens))
    sequence_score = SequenceMatcher(None, query_normalized, name).ratio()
    containment_bonus = 0.35 if query_normalized in name else 0
    return min(1, token_score * 0.7 + sequence_score * 0.3 + containment_bonus)


def fetch_json(url: str) -> object:
    for attempt in range(4):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "BistravaCatalogResearch/1.0 (+https://bistrava.com)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.load(response)
        except OSError:
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("unreachable")


def compact_product(product: dict[str, object]) -> dict[str, object]:
    images = product.get("images") if isinstance(product.get("images"), list) else []
    return {
        "supplierProductId": product.get("id"),
        "name": product.get("name"),
        "slug": product.get("slug"),
        "permalink": product.get("permalink"),
        "sku": product.get("sku"),
        "shortDescription": plain_text(str(product.get("short_description", ""))),
        "description": plain_text(str(product.get("description", ""))),
        "price": product.get("prices"),
        "images": [
            {
                "src": image.get("src"),
                "name": image.get("name"),
                "alt": image.get("alt"),
            }
            for image in images
            if isinstance(image, dict) and image.get("src")
        ],
        "attributes": product.get("attributes", []),
        "isInStock": product.get("is_in_stock"),
    }


def sync(output_path: Path, refresh_ids: set[str]) -> None:
    output: list[dict[str, object]] = []
    if output_path.exists():
        existing = json.loads(output_path.read_text(encoding="utf-8"))
        if isinstance(existing, list):
            output = [
                item
                for item in existing
                if item.get("id") in SOURCES and item.get("id") not in refresh_ids
            ]
    completed_ids = {str(item["id"]) for item in output}
    for product_id, (host, query) in SOURCES.items():
        if product_id in completed_ids:
            continue
        lookup = (
            {"slug": query.removeprefix("slug:")}
            if query.startswith("slug:")
            else {"search": query, "per_page": 100}
        )
        encoded_query = urllib.parse.urlencode(lookup)
        url = f"https://{host}/wp-json/wc/store/v1/products?{encoded_query}"
        candidates = fetch_json(url)
        if not isinstance(candidates, list) or not candidates:
            raise RuntimeError(f"No supplier result for {product_id}: {query}")
        candidate = max(
            candidates,
            key=lambda product: 1 if query.startswith("slug:") else score(query, product),
        )
        match_score = 1 if query.startswith("slug:") else score(query, candidate)
        if match_score < 0.3:
            raise RuntimeError(
                f"Low-confidence supplier match for {product_id}: {candidate.get('name')}"
            )
        output.append(
            {
                "id": product_id,
                "supplierHost": host,
                "query": query,
                "matchScore": round(match_score, 3),
                **compact_product(candidate),
            }
        )
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(
            json.dumps(output, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(f"Wrote {len(output)} exact supplier records to {output_path}")
    for product in output:
        print(
            f"{product['id']}\t{product['name']}\t"
            f"score={product['matchScore']}\timages={len(product['images'])}"
        )


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    parser.add_argument("--refresh", nargs="*", default=[])
    args = parser.parse_args()
    sync(args.output, set(args.refresh))


if __name__ == "__main__":
    main()
