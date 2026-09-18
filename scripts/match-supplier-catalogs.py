import argparse
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path


STOP_WORDS = {
    "aquaphor",
    "cintropur",
    "everpure",
    "filter",
    "filtrirni",
    "filtrirna",
    "filtriranje",
    "voda",
    "vodni",
    "vodnega",
    "za",
    "in",
    "s",
    "z",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(character for character in value if not unicodedata.combining(character))
    return " ".join(re.findall(r"[a-z0-9]+", value))


def significant_tokens(value: str) -> set[str]:
    return {
        token
        for token in normalize(value).split()
        if len(token) > 1 and token not in STOP_WORDS
    }


def match_score(source_name: str, supplier_name: str) -> float:
    source_normalized = normalize(source_name)
    supplier_normalized = normalize(supplier_name)
    source_tokens = significant_tokens(source_name)
    supplier_tokens = significant_tokens(supplier_name)
    token_score = (
        len(source_tokens & supplier_tokens) / len(source_tokens | supplier_tokens)
        if source_tokens | supplier_tokens
        else 0
    )
    sequence_score = SequenceMatcher(None, source_normalized, supplier_normalized).ratio()
    containment_bonus = 0.15 if source_normalized in supplier_normalized or supplier_normalized in source_normalized else 0
    return min(1, (token_score * 0.65) + (sequence_score * 0.35) + containment_bonus)


def load_products(paths: list[Path]) -> list[dict]:
    products: list[dict] = []
    for path in paths:
        products.extend(json.loads(path.read_text(encoding="utf-8-sig")))
    return products


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    parser = argparse.ArgumentParser()
    parser.add_argument("catalog", type=Path)
    parser.add_argument("supplier_files", nargs="+", type=Path)
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    supplier_products = load_products(args.supplier_files)

    for product in catalog:
        candidates = sorted(
            supplier_products,
            key=lambda candidate: match_score(product["name"], candidate["name"]),
            reverse=True,
        )[:3]
        print(f"{product['id']}\t{product['name']}")
        for candidate in candidates:
            score = match_score(product["name"], candidate["name"])
            price = candidate.get("prices", {}).get("price", "")
            minor_unit = candidate.get("prices", {}).get("currency_minor_unit", 2)
            formatted_price = f"{int(price) / (10 ** minor_unit):.2f}" if price else "-"
            print(
                f"  {score:.3f}\t{formatted_price}\t{candidate['name']}\t{candidate['permalink']}"
            )


if __name__ == "__main__":
    main()
