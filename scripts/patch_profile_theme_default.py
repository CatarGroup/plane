#!/usr/bin/env python3
"""Tema Catar Bi como default para perfiles nuevos (está en el código).

Se ejecuta DURANTE el build de la imagen. Plane crea el perfil de cada
usuario nuevo con `theme = models.JSONField(default=dict)` (vacío). Le
cambiamos el default a "custom" con nuestra paleta, así el selector de
Ajustes ya sale marcado en "Tema Catar Bi" sin que el usuario tenga que
elegir nada (el look en sí ya se aplica a todos vía theme.css, esto es
solo para que el selector no quede en blanco).

Verifica la sustitución: si Plane cambia el fichero, el build FALLA en
vez de desplegarse a medias.
"""
import sys

RUTA = "/app/backend/plane/db/models/user.py"

MARCADOR_FUNCION = '''def get_default_product_tour():
    return {
        "work_items": False,
        "cycles": False,
        "modules": False,
        "intake": False,
        "pages": False,
    }
'''

NUEVA_FUNCION = MARCADOR_FUNCION + '''

def get_default_theme_catarbi():
    return {
        "theme": "custom",
        "primary": "#3C87C4",
        "background": "#172B4D",
        "darkPalette": False,
    }
'''

CAMPO_ORIGINAL = "theme = models.JSONField(default=dict)"
CAMPO_NUEVO = "theme = models.JSONField(default=get_default_theme_catarbi)"

try:
    contenido = open(RUTA, encoding="utf-8").read()
except FileNotFoundError:
    print(f"ERROR: no existe {RUTA}")
    sys.exit(1)

ya_aplicado = "get_default_theme_catarbi" in contenido
if ya_aplicado:
    print("OK  user.py: parche ya aplicado (idempotente)")
    sys.exit(0)

if MARCADOR_FUNCION not in contenido:
    print(f"ERROR: no encuentro get_default_product_tour tal cual en {RUTA}")
    sys.exit(1)
if CAMPO_ORIGINAL not in contenido:
    print(f"ERROR: no encuentro {CAMPO_ORIGINAL!r} en {RUTA}")
    sys.exit(1)

contenido = contenido.replace(MARCADOR_FUNCION, NUEVA_FUNCION, 1)
contenido = contenido.replace(CAMPO_ORIGINAL, CAMPO_NUEVO, 1)
open(RUTA, "w", encoding="utf-8").write(contenido)
print("OK  user.py: Profile.theme default -> get_default_theme_catarbi")
