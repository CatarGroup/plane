# Plane en espanol + tema propio — overlay sobre la imagen oficial
#
# NO copia el codigo de Plane: solo encima las plantillas de email traducidas,
# traduce los ASUNTOS (script que verifica cada sustitucion) e inyecta el tema.
# Actualizar Plane = cambiar ARG PLANE_VERSION.

ARG PLANE_VERSION=stable
FROM makeplane/plane-aio-community:${PLANE_VERSION}

# ---------------------------------------------------------------
# 1) Plantillas de email en espanol (backend en /app/backend)
# ---------------------------------------------------------------
COPY templates/ /app/backend/templates/

# ---------------------------------------------------------------
# 2) Asuntos de email en espanol. El script verifica CADA sustitucion:
#    si Plane cambia algun fichero, el build FALLA (no despliega a medias).
# ---------------------------------------------------------------
COPY scripts/traducir_subjects.py /tmp/traducir_subjects.py
RUN python3 /tmp/traducir_subjects.py

# ---------------------------------------------------------------
# 3) Tema propio (paleta Trello) inyectado en el frontend
# ---------------------------------------------------------------
COPY theme/theme.css /app/web/theme.css
RUN set -eux; \
    sed -i 's|</head>|<link rel="stylesheet" href="/theme.css"></head>|' /app/web/index.html; \
    grep -q 'theme.css' /app/web/index.html \
      || { echo "ERROR: no se pudo inyectar el tema en el frontend."; exit 1; }

# La imagen base trae su propio entrypoint (supervisord + start.sh)
