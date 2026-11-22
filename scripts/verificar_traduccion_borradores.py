#!/usr/bin/env python3
"""Verifica que los borradores de tarea (workspace-draft) no tengan literales
en inglés sin traducir (nodos de texto JSX o atributos de texto).

Escanea apps/web/core/components/issues/workspace-draft.
Solo avisa; no modifica nada.
Uso: python3 scripts/verificar_traduccion_borradores.py
"""

import os
import re
import sys

ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps/web/core/components/issues/workspace-draft",
)

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
SKIP_TOKENS = ("Promise", "Array", "Record", "Partial", "Map", "Set", "TSearch", "TWorkspaceDraftIssue")


def iter_files():
    for dirpath, _, names in os.walk(ROOT):
        for name in sorted(names):
            if name.endswith((".tsx", ".ts")):
                yield os.path.join(dirpath, name)


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
                    if any(token in text for token in SKIP_TOKENS):
                        continue
                    rel = os.path.relpath(path, os.path.dirname(os.path.dirname(ROOT)))
                    found.append(f"{rel}:{lineno}: {text}")
    if not found:
        print("OK: borradores de tarea sin literales pendientes de traduccion.")
        return 0
    print(f"{len(found)} literales pendientes:")
    for item in found:
        print(" -", item)
    return 1


if __name__ == "__main__":
    sys.exit(main())
