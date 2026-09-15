#!/usr/bin/env python3
"""Traduce textos del frontend que NO usan i18n (hardcodeados en el bundle).

Se ejecuta durante el build. Sustituye cadenas exactas en los chunks JS y
VERIFICA que se han aplicado: si no, el build falla (no despliega a medias).
"""
import glob, sys

ASSETS = "/app/web/assets/*.js"

# (original, traduccion)
CAMBIOS = [
    ("You have been invited to ", "Te han invitado a "),
    ("INVITATION NOT FOUND", "INVITACION NO ENCONTRADA"),
    (
        "Your workspace is where you'll create projects, collaborate on your work items, "
        "and organize different streams of work in your Plane account.",
        "Tu espacio de trabajo es donde crearas proyectos, colaboraras en tus tareas "
        "y organizaras las distintas lineas de trabajo de tu cuenta de Plane.",
    ),
    ("children:`Accept`", "children:`Aceptar`"),
    ("children:`Ignore`", "children:`Ignorar`"),
]

ficheros = glob.glob(ASSETS)
if not ficheros:
    print("ERROR: no encuentro chunks del frontend")
    sys.exit(1)

aplicados = 0
for original, traduccion in CAMBIOS:
    for f in ficheros:
        try:
            s = open(f, encoding="utf-8", errors="ignore").read()
        except Exception:
            continue
        if original in s:
            open(f, "w", encoding="utf-8").write(s.replace(original, traduccion))
            aplicados += 1
            print("  ok:", original[:45], "->", traduccion[:45])

if aplicados == 0:
    print("ERROR: no se aplico ninguna traduccion del frontend")
    sys.exit(1)

comprobado = False
for f in glob.glob(ASSETS):
    s = open(f, encoding="utf-8", errors="ignore").read()
    if "Te han invitado a " in s:
        comprobado = True
        break
if not comprobado:
    print("ERROR: la pagina de invitacion sigue en ingles")
    sys.exit(1)

print("Frontend traducido:", aplicados, "cambios")
