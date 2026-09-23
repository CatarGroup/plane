#!/usr/bin/env python3
"""Traduce los TEXTOS en espanol que Plane escribe DENTRO del email de
novedades de tareas (issue-updates.html) y quita el identificador de la
tarea (p.ej. "GRUPO-40") del asunto del correo: el resumen, el nombre del
tipo de entidad y el asunto viven en el codigo del backend, no en la
plantilla.

Se ejecuta DURANTE el build de la imagen. Sustituye textos exactos y VERIFICA
que cada sustitucion se ha aplicado: si Plane cambia el fichero, el build
FALLA en vez de desplegarse a medias (mismo criterio que traducir_subjects.py).

Para probarlo en local:
    PLANE_BACKEND=/ruta/falsa python3 scripts/traducir_backend_emails.py
"""
import os
import sys

BASE = os.environ.get("PLANE_BACKEND", "/app/backend")

SUSTITUCIONES = [
    (
        "plane/bgtasks/email_notification_task.py",
        'summary = "Updates were made to the issue by"',
        'summary = "Novedades en la tarea de parte de"',
    ),
    (
        "plane/bgtasks/email_notification_task.py",
        '"entity_type": "issue",',
        '"entity_type": "tarea",',
    ),
    (
        "plane/bgtasks/email_notification_task.py",
        'subject = f"{issue.project.identifier}-{issue.sequence_id} {remove_unwanted_characters(issue.name)}"',
        "subject = remove_unwanted_characters(issue.name)",
    ),
]

fallos = []
for relativo, original, traducido in SUSTITUCIONES:
    ruta = os.path.join(BASE, relativo)
    try:
        contenido = open(ruta, encoding="utf-8").read()
    except FileNotFoundError:
        fallos.append(f"{relativo}: NO EXISTE ({ruta})")
        continue

    if traducido in contenido:
        print(f"OK  {relativo}: ya traducido")
        continue

    veces = contenido.count(original)
    if veces != 1:
        fallos.append(f"{relativo}: esperaba 1 aparicion de {original!r}, hay {veces}")
        continue

    open(ruta, "w", encoding="utf-8").write(contenido.replace(original, traducido))
    print(f"OK  {relativo}: {original!r} -> {traducido!r}")

if fallos:
    print("\nFALLOS AL TRADUCIR LOS TEXTOS DE LAS NOTIFICACIONES:")
    for f in fallos:
        print("  -", f)
    sys.exit(1)
print("\nTextos de las notificaciones traducidos correctamente.")
