"""Verifica la i18n de las vistas de tareas (issue-layouts) del front.

Reporta literales en ingles que se renderizan sin pasar por t() y atributos
con texto escrito a mano en lugar de t("...").
Solo avisa; no modifica nada. Uso: python3 scripts/verificar_traduccion_vistas.py
"""

import os
import re
import sys
import unicodedata

ROOT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "apps/web/core/components/issues/issue-layouts",
)

PATTERNS = (
    # nodos de texto JSX: >Hola mundo<
    re.compile(r">\s*([A-Za-z][a-zA-Z][^<>{}\n]{2,45})\s*<"),
    # atributos con literal entre comillas dobles
    re.compile(r'(?:placeholder|title|label|aria-label)="([^"]{2,45})"'),
    # atributos con literal entre comillas simples o acentos graves dentro de llaves
    re.compile(r"(?:placeholder|title|label|aria-label)=\{[\"'`]([^\"'`]{2,45})[\"'`]\}"),
)
SKIP_TOKENS = ("Promise", "use client")


def is_spanish(text):
    for char in text:
        name = unicodedata.name(char, "")
        if name.startswith("LATIN ") and ("ACUTE" in name or "TILDE" in name):
            return True
    return "\u00bf" in text or "\u00a1" in text


problems = []
for base, _, files in os.walk(ROOT):
    for name in sorted(files):
        if not name.endswith(".tsx"):
            continue
        path = os.path.join(base, name)
        rel = os.path.relpath(path, ROOT)
        for lineno, line in enumerate(open(path, encoding="utf-8"), 1):
            stripped = line.strip()
            if stripped.startswith("//") or stripped.startswith("*"):
                continue
            candidates = []
            for pattern in PATTERNS:
                candidates += [m.group(1) for m in pattern.finditer(line)]
            for text in candidates:
                if any(token in text for token in SKIP_TOKENS):
                    continue
                if is_spanish(text) or "{" in text or "(" in text:
                    continue
                problems.append(f"{rel}:{lineno}: {text}")

if problems:
    print(f"AVISO: {len(problems)} literales sin pasar por t() en las vistas de tareas:")
    for item in problems:
        print("  " + item)
    sys.exit(1)

print("OK: vistas de tareas sin literales pendientes de traduccion.")
