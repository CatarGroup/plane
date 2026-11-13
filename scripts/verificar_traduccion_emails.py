#!/usr/bin/env python3
"""Comprueba la traducción al español de los emails de Plane SIN desplegar.

1) Simula en un árbol temporal las sustituciones de scripts/traducir_subjects.py
   (asuntos que viven en el código) y verifica que cada una se aplica.
2) Recorre todas las plantillas de templates/emails/**/*.html y marca las que
   aún tengan texto en inglés (excluyendo el bloque <style>, atributos y el
   asunto/asunto-plantilla que llega por contexto).

Salida: lista de problemas y código de salida 1 si hay alguno.
"""
import os
import re
import sys

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BG = os.path.join(REPO, "apps", "api", "plane", "bgtasks")
PLANTILLAS = os.path.join(REPO, "templates", "emails")

# Palabras que delatan inglés en el texto visible de una plantilla.
INGLES = re.compile(
    r"\b(the|your|you|this|that|with|from|have|been|will|would|please|"
    r"click|here|below|email|message|account|password|project|issue|task|"
    r"invite|invited|join|team|workspace|updates|changes|settings|"
    r"successfully|updated|welcome|regards|thanks|thank|should|could|"
    r"requested|received|verify|browser|ignore|safely)\b",
    re.IGNORECASE,
)

# Términos aceptados en español (préstamos ya asentados).
PERMITIDOS = {"email", "workspace", "webhook", "login"}


def texto_visible(html: str) -> str:
    html = re.sub(r"<style.*?</style>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<title>.*?</title>", " ", html, flags=re.S | re.I)
    html = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"\{[%{].*?[%}]\}", " ", html, flags=re.S)
    return html


def main() -> int:
    problemas = []

    # 1) Asuntos
    ruta_script = os.path.join(REPO, "scripts", "traducir_subjects.py")
    if not os.path.exists(ruta_script):
        return _fallo("no existe scripts/traducir_subjects.py")
    try:
        # Carga el módulo sin ejecutar su bucle: reimplementamos el bucle aquí.
        src = open(ruta_script, encoding="utf-8").read()
        m = re.search(r"SUSTITUCIONES = \[(.*?)\n\]", src, re.S)
        if not m:
            return _fallo("no se encontró SUSTITUCIONES en traducir_subjects.py")
        ns: dict = {}
        exec("SUSTITUCIONES = [" + m.group(1) + "\n]", ns)  # noqa: S102
        sustituciones = ns["SUSTITUCIONES"]

        for fichero, original, traducido in sustituciones:
            ruta = os.path.join(BG, fichero)
            if not os.path.exists(ruta):
                problemas.append(f"ASUNTO {fichero}: el fichero no existe")
                continue
            contenido = open(ruta, encoding="utf-8").read()
            if traducido in contenido:
                continue
            if original not in contenido:
                problemas.append(
                    f"ASUNTO {fichero}: no está ni el original ni la traducción ({original!r})"
                )
    except OSError as e:
        problemas.append(f"ASUNTO: error leyendo ficheros: {e}")

    # 2) Plantillas
    for raiz, _, ficheros in os.walk(PLANTILLAS):
        for f in sorted(ficheros):
            if not f.endswith(".html"):
                continue
            ruta = os.path.join(raiz, f)
            rel = os.path.relpath(ruta, REPO)
            html = open(ruta, encoding="utf-8").read()
            visible = texto_visible(html)
            palabras = [p for p in INGLES.findall(visible) if p.lower() not in PERMITIDOS]
            if palabras:
                muestra = sorted({p.lower() for p in palabras})[:8]
                detalle = []
                for mm in INGLES.finditer(visible):
                    if mm.group(0).lower() in PERMITIDOS:
                        continue
                    frag = re.sub(r"\s+", " ", visible[max(0, mm.start() - 40) : mm.end() + 20]).strip()
                    if frag and frag not in detalle:
                        detalle.append(frag)
                    if len(detalle) >= 3:
                        break
                problemas.append(f"PLANTILLA {rel}: restos en inglés {muestra} | {detalle}")

    if problemas:
        print("PROBLEMAS DE TRADUCCIÓN:\n")
        for p in problemas:
            print("  -", p)
        return 1
    print("OK: asuntos y plantillas de email sin restos en inglés.")
    return 0


def _fallo(msg: str) -> int:
    print(msg)
    return 1


if __name__ == "__main__":
    sys.exit(main())
