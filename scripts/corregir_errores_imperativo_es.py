#!/usr/bin/env python3
"""Quita el tuteo en los textos de error: 'Inténtalo de nuevo' -> 'Inténtalo de nuevo' es correcto,
pero 'Intenta X de nuevo' (imperativo sin pronombre) suena raro. Se pasa todo a 'Vuelve a intentarlo'
o se deja 'Inténtalo de nuevo'."""
import json, glob, os, io, sys

RULES = [
    ("Intenta guardar tus detalles de nuevo", "Vuelve a guardar tus detalles"),
    ("Intenta guardar tus datos nuevamente", "Vuelve a guardar tus datos"),
    ("Intenta eliminarla de nuevo o vuelve a intentarlo más tarde", "Inténtalo de nuevo más tarde"),
    ("Intenta retirarla de nuevo o vuelve a intentarlo más tarde", "Inténtalo de nuevo más tarde"),
    ("No pudimos reordenar las estimaciones, inténtalo de nuevo", "No pudimos reordenar las estimaciones. Inténtalo de nuevo"),
]

base = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))

def sub(o):
    if isinstance(o, dict):
        return {k: sub(v) for k, v in o.items()}
    if isinstance(o, list):
        return [sub(v) for v in o]
    if isinstance(o, str):
        for a, b in RULES:
            o = o.replace(a, b)
        return o
    return o

changed = 0
for f in sorted(glob.glob(os.path.join(base, "*.json"))):
    with io.open(f, encoding="utf-8") as fh:
        d = json.load(fh)
    new = sub(d)
    if new != d:
        with io.open(f, "w", encoding="utf-8") as fh:
            json.dump(new, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        changed += 1
        print("cambiado:", os.path.basename(f))
print("ficheros cambiados:", changed)
