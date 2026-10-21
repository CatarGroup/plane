#!/usr/bin/env python3
"""Inyecta la funcionalidad de tiempos (estilo Toggl) en el backend de Plane.

El backend NO se compila desde este repo: la imagen base ya trae /app/backend.
Por eso copiamos los ficheros y parcheamos los __init__.py y urls.

Se ejecuta en el build. Si algo no cuadra, FALLA el build (no se sirve una
imagen a medias).
"""

import pathlib
import sys

BACKEND = pathlib.Path("/app/backend/plane")
TMP = pathlib.Path("/tmp")

FICHEROS = [
    (TMP / "time_log_model.py", BACKEND / "db/models/time_log.py"),
    (TMP / "time_log_serializer.py", BACKEND / "app/serializers/time_log.py"),
    (TMP / "time_log_viewset.py", BACKEND / "app/views/issue/time_log.py"),
]


def anade_import(ruta: pathlib.Path, linea: str, marca: str) -> None:
    """Añade un import al final del bloque de imports si no está ya."""
    texto = ruta.read_text()
    if marca in texto:
        print(f"  ya presente en {ruta.name}: {marca}")
        return
    ruta.write_text(texto.rstrip() + "\n" + linea + "\n")
    print(f"  import añadido a {ruta}: {linea.strip()}")


def main() -> int:
    print("[time-tracking] copiando ficheros al backend...")
    for origen, destino in FICHEROS:
        if not origen.exists():
            print(f"ERROR: falta {origen}")
            return 1
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(origen.read_text())
        print(f"  {destino}")

    print("[time-tracking] registrando modelo y serializer...")
    anade_import(BACKEND / "db/models/__init__.py", "from .time_log import IssueTimeLog", "IssueTimeLog")
    anade_import(
        BACKEND / "app/serializers/__init__.py",
        "from .time_log import IssueTimeLogSerializer",
        "IssueTimeLogSerializer",
    )
    anade_import(
        BACKEND / "app/views/__init__.py",
        "from .issue.time_log import IssueTimeLogViewSet",
        "IssueTimeLogViewSet",
    )

    print("[time-tracking] añadiendo rutas...")
    urls = BACKEND / "app/urls/issue.py"
    texto = urls.read_text()
    if "issue-time-logs" not in texto:
        # 1) import de la clase
        ancla_import = "    IssueDetailIdentifierEndpoint,\n)"
        if ancla_import not in texto:
            print("ERROR: no encuentro el bloque de imports en urls/issue.py")
            return 1
        texto = texto.replace(
            ancla_import,
            "    IssueDetailIdentifierEndpoint,\n    IssueTimeLogViewSet,\n)",
        )

        # 2) rutas antes del cierre de urlpatterns
        rutas = '''    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/time-logs/",
        IssueTimeLogViewSet.as_view({"get": "list", "post": "create"}),
        name="issue-time-logs",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/time-logs/summary/",
        IssueTimeLogViewSet.as_view({"get": "summary"}),
        name="issue-time-logs-summary",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/time-logs/<uuid:pk>/",
        IssueTimeLogViewSet.as_view({"patch": "partial_update", "delete": "destroy"}),
        name="issue-time-log",
    ),
]'''
        # el ultimo "]" del fichero cierra urlpatterns
        idx = texto.rstrip().rfind("]")
        texto = texto[:idx] + rutas + texto[idx + 1 :]
        urls.write_text(texto)
        print("  rutas añadidas")
    else:
        print("  rutas ya presentes")

    # verificacion final
    comprobaciones = [
        (BACKEND / "db/models/time_log.py", "class IssueTimeLog"),
        (BACKEND / "app/serializers/time_log.py", "class IssueTimeLogSerializer"),
        (BACKEND / "app/views/issue/time_log.py", "class IssueTimeLogViewSet"),
        (BACKEND / "db/models/__init__.py", "IssueTimeLog"),
        (BACKEND / "app/serializers/__init__.py", "IssueTimeLogSerializer"),
        (BACKEND / "app/views/__init__.py", "IssueTimeLogViewSet"),
        (BACKEND / "app/urls/issue.py", "issue-time-logs"),
    ]
    for ruta, marca in comprobaciones:
        if marca not in ruta.read_text():
            print(f"ERROR: falta '{marca}' en {ruta}")
            return 1
    print("[time-tracking] OK: backend inyectado y verificado")
    return 0


if __name__ == "__main__":
    sys.exit(main())
