#!/usr/bin/env python3
"""Elimina el 'por favor' redundante en mensajes de ERROR de la i18n ES de Plane.

Solo toca strings cuyo texto contiene 'por favor' Y que están en una rama de error
(error / errors / error_message / error_toast / invalid_* / unable_*), o que empiezan
por 'No se pudo' / 'No pudimos' / 'Error al'. El resto (peticiones legítimas al usuario,
empty states, invitaciones) se deja intacto. No normaliza nada más: solo quita el
'por favor' y arregla la puntuación resultante.
"""
import json
import re
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[1] / "packages/i18n/src/locales/es"

ERROR_BRANCH = re.compile(r"(?i)(errors?|error_message|error_toast|invalid_|unable_)")
ERROR_TEXT = re.compile(r"(?i)^(no se pudo|no pudimos|no podemos|error al|algo salió mal)")

# (regex, sustitución) aplicadas en orden sobre el texto original.
RULES = [
    (re.compile(r"(?i)\s*,\s*por favor,?\s*"), ". "),
    (re.compile(r"(?i)\.\s*por favor,?\s*"), ". "),
    (re.compile(r"(?i)^por favor,?\s*"), ""),
    (re.compile(r"(?i)por favor,?\s*"), ""),
]


def clean(text: str) -> str:
    if "por favor" not in text.lower():
        return text
    out = text
    for rx, rep in RULES:
        out = rx.sub(rep, out)
    out = re.sub(r"\s{2,}", " ", out)
    out = re.sub(r"\s+([.,:])", r"\1", out)
    out = out.strip()
    # Recompone con mayúscula tras el punto final de la frase anterior.
    out = re.sub(
        r"(?<=[.!?])\s+([a-záéíóúñ])",
        lambda m: m.group(0)[:-1] + m.group(1).upper(),
        out,
    )
    if out and text and text[0].isupper() and out[0].islower():
        out = out[0].upper() + out[1:]
    return out


def main() -> int:
    changed_total = 0
    for f in sorted(BASE.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        changed = 0

        def walk(obj, branch=""):
            nonlocal changed
            if isinstance(obj, dict):
                for k, v in obj.items():
                    sub = f"{branch}/{k}"
                    if isinstance(v, dict):
                        walk(v, sub)
                    elif isinstance(v, str):
                        if not (ERROR_BRANCH.search(sub) or ERROR_TEXT.search(v)):
                            continue
                        new = clean(v)
                        if new != v:
                            obj[k] = new
                            changed += 1
                            print(f"{f.name} {sub}\n  - {v!r}\n  + {new!r}")

        walk(data)
        if changed:
            f.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            changed_total += changed
    print(f"\nTotal cadenas cambiadas: {changed_total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
