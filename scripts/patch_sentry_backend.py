#!/usr/bin/env python3
"""Sentry en el backend de Plane (API + workers + beat + migrator).

Se ejecuta DURANTE el build de la imagen. Plane no trae Sentry de
serie. Todos los procesos (api, worker, beat, migrator) cargan
`plane.settings.production` (default de manage.py), asi que basta con
anadir la inicializacion ahi para cubrir el backend entero.

Solo se activa si existe la env var SENTRY_DSN en tiempo de ejecucion
(Railway) — el DSN NO va hardcodeado aqui.

Verifica la sustitucion: si Plane cambia el fichero, el build FALLA en
vez de desplegarse a medias.
"""
import sys

RUTA = "/app/backend/plane/settings/production.py"

BLOQUE_SENTRY = '''

# --- Sentry (Grupo Romboc / Catar BI overlay) ---------------------------
# Solo se activa si SENTRY_DSN esta en el entorno (Railway). El DSN no
# vive en el repo.
SENTRY_DSN = os.environ.get("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration(), RedisIntegration()],
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", 0.1)),
        send_default_pii=False,
    )
'''

MARCADOR_FINAL = '''        "plane.migrations": {
            "level": "DEBUG" if DEBUG else "INFO",
            "handlers": ["console"],
            "propagate": False,
        },
    },
}
'''

try:
    contenido = open(RUTA, encoding="utf-8").read()
except FileNotFoundError:
    print(f"ERROR: no existe {RUTA}")
    sys.exit(1)

if "Grupo Romboc / Catar BI overlay" in contenido:
    print("OK  production.py: Sentry ya aplicado (idempotente)")
    sys.exit(0)

if MARCADOR_FINAL not in contenido:
    print(f"ERROR: no encuentro el final esperado de LOGGING en {RUTA}")
    sys.exit(1)

contenido = contenido.replace(MARCADOR_FINAL, MARCADOR_FINAL + BLOQUE_SENTRY, 1)
open(RUTA, "w", encoding="utf-8").write(contenido)
print("OK  production.py: Sentry anadido (activo solo si SENTRY_DSN esta en el entorno)")
