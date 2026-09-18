"""Download official product media and create verified Bistrava information panels."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path


SUPPLIER_NAMES = {
    "ggv.si": "GGV d.o.o.",
    "filtri-za-vodo.si": "Tehnofan d.o.o.",
    "konik.si": "Konik d.o.o.",
}

PANEL_TITLES = [
    "Ključne lastnosti",
    "Tehnični podatki",
    "Uporaba in načrtovanje",
    "Preverjen pregled",
]


def clean_name(value: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", value)).replace("&#8211;", "–")


def unwrap_optimole(url: str) -> str:
    matches = list(re.finditer(r"https://", url))
    if len(matches) > 1:
        return url[matches[-1].start() :]
    return url


def extension_for(url: str) -> str:
    suffix = Path(urllib.parse.urlparse(url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp", ".avif"} else ".jpg"


def fetch_bytes(url: str) -> bytes:
    last_error: OSError | None = None
    for attempt in range(4):
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "BistravaCatalogMedia/1.0 (+https://bistrava.com)"},
        )
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except OSError as error:
            last_error = error
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Unable to download {url}: {last_error}")


def wrap_text(value: str, max_characters: int, max_lines: int) -> list[str]:
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if len(candidate) <= max_characters:
            current = candidate
            continue
        if current:
            lines.append(current)
        current = word
        if len(lines) == max_lines - 1:
            break
    if current and len(lines) < max_lines:
        lines.append(current)
    if len(" ".join(lines)) < len(value) and lines:
        lines[-1] = lines[-1].rstrip(".,;:") + "…"
    return lines


def svg_text(lines: list[str], x: int, y: int, size: int, line_height: int, css_class: str) -> str:
    spans = "".join(
        f'<tspan x="{x}" dy="{0 if index == 0 else line_height}">{html.escape(line)}</tspan>'
        for index, line in enumerate(lines)
    )
    return f'<text x="{x}" y="{y}" class="{css_class}" font-size="{size}">{spans}</text>'


def panel_points(content: dict[str, object], panel_index: int) -> list[tuple[str, str]]:
    highlights = [str(item) for item in content.get("highlightsSl", [])]
    specs = [
        (str(item.get("labelSl", "")), str(item.get("valueSl", "")))
        for item in content.get("technicalSpecifications", [])
        if isinstance(item, dict)
    ]
    if panel_index % 3 == 0:
        return [("Prednost", item) for item in highlights[:3]]
    if panel_index % 3 == 1:
        return specs[:3]
    typed = content.get("typed") if isinstance(content.get("typed"), dict) else {}
    planning = [
        ("Montaža", "Strokovna preverba" if typed.get("installationRequired") else "Enostavna uporaba"),
        ("Elektrika", "Potrebna" if typed.get("electricityRequired") else "Ni potrebna"),
        ("Odtok", "Potreben" if typed.get("drainRequired") else "Ni potreben"),
    ]
    return planning


def build_svg(content: dict[str, object], panel_index: int) -> str:
    name = str(content["nameSl"])
    title = PANEL_TITLES[panel_index % len(PANEL_TITLES)]
    name_lines = wrap_text(name, 31, 3)
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200" role="img">',
        "<title>" + html.escape(f"{name} – {title}") + "</title>",
        "<defs><linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#eef9fb\"/><stop offset=\"1\" stop-color=\"#d8f0f4\"/></linearGradient></defs>",
        '<rect width="1200" height="1200" rx="52" fill="url(#bg)"/>',
        '<circle cx="1010" cy="190" r="210" fill="#20a8b8" opacity="0.12"/>',
        '<circle cx="1085" cy="1030" r="280" fill="#0a2c4a" opacity="0.08"/>',
        '<style>.brand{font-family:Arial,sans-serif;font-weight:700;fill:#20a8b8;letter-spacing:4px}.name{font-family:Arial,sans-serif;font-weight:750;fill:#0a2c4a}.title{font-family:Arial,sans-serif;font-weight:700;fill:#0a2c4a}.label{font-family:Arial,sans-serif;font-weight:700;fill:#20a8b8}.value{font-family:Arial,sans-serif;font-weight:600;fill:#27445e}</style>',
        '<text x="86" y="105" class="brand" font-size="30">BISTRAVA</text>',
        svg_text(name_lines, 86, 210, 54, 64, "name"),
        f'<text x="86" y="450" class="title" font-size="38">{html.escape(title)}</text>',
    ]
    y = 545
    for label, value in panel_points(content, panel_index):
        parts.append(f'<circle cx="105" cy="{y - 8}" r="12" fill="#20a8b8"/>')
        parts.append(f'<text x="140" y="{y}" class="label" font-size="27">{html.escape(label.upper())}</text>')
        value_lines = wrap_text(value, 42, 2)
        parts.append(svg_text(value_lines, 140, y + 50, 31, 38, "value"))
        y += 180
    parts.append('<path d="M86 1090 H1114" stroke="#86cbd4" stroke-width="2"/>')
    parts.append('<text x="86" y="1145" class="value" font-size="24">Preverite primernost glede na trdoto, pretok in pogoje uporabe.</text>')
    parts.append("</svg>")
    return "".join(parts)


def build(
    catalog_path: Path,
    content_path: Path,
    supplier_path: Path,
    public_root: Path,
    output_path: Path,
) -> None:
    catalog = {item["id"]: item for item in json.loads(catalog_path.read_text(encoding="utf-8"))}
    content = {item["id"]: item for item in json.loads(content_path.read_text(encoding="utf-8"))}
    suppliers = {item["id"]: item for item in json.loads(supplier_path.read_text(encoding="utf-8"))}
    if set(content) != set(suppliers) or len(content) != 24:
        raise RuntimeError("Expected 24 matching content and supplier records")

    output: list[dict[str, object]] = []
    for product_id, product_content in content.items():
        slug = str(catalog[product_id]["slug"])
        supplier = suppliers[product_id]
        supplier_name = SUPPLIER_NAMES[str(supplier["supplierHost"])]
        folder = public_root / slug
        folder.mkdir(parents=True, exist_ok=True)
        images: list[dict[str, object]] = []
        seen_urls: set[str] = set()
        for source_image in supplier.get("images", []):
            source_url = unwrap_optimole(str(source_image["src"]))
            if source_url in seen_urls:
                continue
            seen_urls.add(source_url)
            image_number = len(images) + 1
            extension = extension_for(source_url)
            filename = f"official-{image_number}{extension}"
            (folder / filename).write_bytes(fetch_bytes(source_url))
            images.append(
                {
                    "url": f"/products/{slug}/{filename}",
                    "altSl": f"{product_content['nameSl']} – uradni prikaz izdelka {image_number}",
                    "width": 1200,
                    "height": 1200,
                    "kind": "official",
                    "sourceName": supplier_name,
                    "sourceUrl": supplier["permalink"],
                }
            )
            if len(images) == 4:
                break

        panel_index = 0
        while len(images) < 4:
            filename = f"bistrava-panel-{panel_index + 1}.svg"
            (folder / filename).write_text(build_svg(product_content, panel_index), encoding="utf-8")
            images.append(
                {
                    "url": f"/products/{slug}/{filename}",
                    "altSl": f"{product_content['nameSl']} – {PANEL_TITLES[panel_index].lower()}",
                    "width": 1200,
                    "height": 1200,
                    "kind": "information",
                    "sourceName": "Bistrava",
                    "sourceUrl": f"/izdelki/{slug}",
                }
            )
            panel_index += 1

        output.append({"id": product_id, "images": images})
        print(f"{product_id}\t{slug}\tofficial={sum(item['kind'] == 'official' for item in images)}\ttotal=4")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote media manifest to {output_path}")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("catalog", type=Path)
    parser.add_argument("content", type=Path)
    parser.add_argument("supplier", type=Path)
    parser.add_argument("public_root", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.catalog, args.content, args.supplier, args.public_root, args.output)


if __name__ == "__main__":
    main()
