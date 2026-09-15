#!/usr/bin/env python3
"""Traduce al español los ASUNTOS de los emails de Plane (están en el código).

Se ejecuta DURANTE el build de la imagen. Sustituye textos exactos y VERIFICA
que cada sustitución se ha aplicado: si Plane cambia algún fichero, el build
FALLA en vez de desplegarse a medias.
"""
import sys

BASE = "/app/backend/plane/bgtasks/"

SUSTITUCIONES = [
    ("forgot_password_task.py",
     'A new password to your Plane account has been requested',
     'Se ha solicitado una nueva contraseña para tu cuenta de Plane'),
    ("magic_link_code_task.py",
     'Your unique Plane login code is {token}',
     'Tu código de acceso único de Plane es {token}'),
    ("project_invitation_task.py",
     'invited you to join {project.name} on Plane',
     'te ha invitado a unirte a {project.name} en Plane'),
    ("project_add_user_email_task.py",
     'You have been invited to a Plane project',
     'Te han invitado a un proyecto de Plane'),
    ("user_activation_email_task.py",
     'has been activated on Plane',
     'se ha activado en Plane'),
    ("user_deactivation_email_task.py",
     'has been deactivated on Plane',
     'se ha desactivado en Plane'),
    ("user_email_update_task.py",
     'Verify your new email address',
     'Verifica tu nueva dirección de correo'),
    ("user_email_update_task.py",
     'Plane email address successfully updated',
     'Direccion de correo de Plane actualizada correctamente'),
    ("workspace_invitation_task.py",
     'has invited you to join them in',
     'te invita a unirte al workspace'),
    ("workspace_invitation_task.py",
     ' on Plane"',
     ' en Plane"'),
]

fallos = []
for fichero, original, traducido in SUSTITUCIONES:
    ruta = BASE + fichero
    try:
        contenido = open(ruta, encoding="utf-8").read()
    except FileNotFoundError:
        fallos.append(f"{fichero}: NO EXISTE")
        continue
    if traducido in contenido:
        continue  # ya traducido (idempotente)
    if original not in contenido:
        fallos.append(f"{fichero}: no encontrado el texto {original!r}")
        continue
    open(ruta, "w", encoding="utf-8").write(contenido.replace(original, traducido))
    print(f"OK  {fichero}: {original!r} -> {traducido!r}")

if fallos:
    print("\nFALLOS AL TRADUCIR ASUNTOS:")
    for f in fallos:
        print("  -", f)
    sys.exit(1)
print("\nTodos los asuntos traducidos correctamente.")
