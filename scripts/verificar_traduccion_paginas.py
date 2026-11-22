#!/usr/bin/env python3
"""Verifica que los modales de páginas no tengan literales en inglés sin traducir.

Escanea los ficheros TSX de apps/web/core/components/pages/ y falla si encuentra
texto plano en JSX (nodos de texto o atributos placeholder/label/title) en inglés.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = [
    ROOT / "apps/web/core/components/pages/modals/page-form.tsx",
    ROOT / "apps/web/core/components/pages/modals/delete-page-modal.tsx",
]

ATTRS = ("placeholder", "label", "title", "aria-label")
# nodo de texto JSX entre etiquetas: >Texto<  (no expresiones, no genéricos TS)
TEXT_NODE = re.compile(r">\s*((?!Promise|Array|Record|Partial|Map|Set)[A-Z][A-Za-z][A-Za-z ,.'’-]{2,})\s*<")
ATTR_LITERAL = re.compile(r"\b(" + "|".join(re.escape(a) for a in ATTRS) + r')\s*=\s*"([^"]+)"')


def main() -> int:
    found = []
    for path in TARGETS:
        if not path.exists():
            continue
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*"):
                continue
            for match in TEXT_NODE.finditer(line):
                found.append((path, lineno, match.group(1).strip()))
            for match in ATTR_LITERAL.finditer(line):
                found.append((path, lineno, f'{match.group(1)}="{match.group(2)}"'))

    if found:
        for path, lineno, text in found:
            rel = path.relative_to(ROOT)
            print(f"PENDIENTE {rel}:{lineno} -> {text}")
        print(f"\n{len(found)} literal(es) sin traducir.")
        return 1

    print("OK: modales de páginas sin literales pendientes de traduccion.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
