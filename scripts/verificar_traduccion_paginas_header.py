#!/usr/bin/env python3
"""Verifica que el encabezado, la lista y el editor de páginas no tengan
literales en inglés sin traducir (nodos de texto JSX o atributos de texto).

Escanea apps/web/core/components/pages/{header,list/**,editor/title,editor/content-limit-banner}.
Solo avisa; no modifica nada.
Uso: python3 scripts/verificar_traduccion_paginas_header.py
"""

import os
import re
import sys

ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps/web/core/components/pages",
)

TARGET_DIRS = [
    os.path.join(ROOT, "header"),
    os.path.join(ROOT, "list"),
]
TARGET_FILES = [
    os.path.join(ROOT, "editor", "title.tsx"),
    os.path.join(ROOT, "editor", "content-limit-banner.tsx"),
]

PATTERNS = (
    # nodos de texto JSX: >Hola mundo<
    re.compile(r">\s*([A-Z][A-Za-z][A-Za-z ,.'’-]{2,120})\s*<"),
    # atributos con literal entre comillas dobles
    re.compile(r'(?:placeholder|title|label|aria-label|tooltipContent|tooltipHeading)="([^"]{2,120})"'),
    # atributos con literal entre comillas simples o acentos graves dentro de llaves
    re.compile(
        r"(?:placeholder|title|label|aria-label|tooltipContent|tooltipHeading)=\{[\"'`]([^\"'`]{2,120})[\"'`]\}"
    ),
)
SKIP_TOKENS = ("Promise", "Array", "Record", "Partial", "Map", "Set", "TSearch", "TPage")


def iter_files():
    for base in TARGET_DIRS:
        for dirpath, _, names in os.walk(base):
            for name in sorted(names):
                if name.endswith((".tsx", ".ts")):
                    yield os.path.join(dirpath, name)
    for path in TARGET_FILES:
        if os.path.exists(path):
            yield path


def main() -> int:
    found = []
    for path in iter_files():
        for lineno, line in enumerate(open(path, encoding="utf-8"), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*"):
                continue
            for pattern in PATTERNS:
                for match in pattern.finditer(line):
                    text = match.group(1).strip()
                    if any(text.startswith(tok) for tok in SKIP_TOKENS):
                        continue
                    # ignorar literales ya en español (acentos, ¿, ¡, ñ)
                    if any(ch in text for ch in "áéíóúÁÉÍÓÚñÑ¿¡"):
                        continue
                    found.append((os.path.relpath(path, ROOT), lineno, text))

    if found:
        for rel, lineno, text in found:
            print(f"PENDIENTE {rel}:{lineno} -> {text}")
        print(f"\n{len(found)} literal(es) sin traducir.")
        return 1

    print("OK: encabezado/lista/editor de páginas sin literales pendientes de traduccion.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
