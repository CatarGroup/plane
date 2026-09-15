# Plane en espanol + TEMA GRUPO ROMBOC — overlay sobre la imagen oficial
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

# ---------------------------------------------------------------
# 4) ESPAÑOL POR DEFECTO — que cualquier invitado lo vea en español
#    - backend: locale de Django (fechas y números)
#    - frontend: idioma por defecto cuando el usuario no tiene uno guardado
# ---------------------------------------------------------------
RUN set -eux; \
    sed -i 's/LANGUAGE_CODE = "en-us"/LANGUAGE_CODE = "es-es"/' /app/backend/plane/settings/common.py; \
    grep -q 'LANGUAGE_CODE = "es-es"' /app/backend/plane/settings/common.py \
      || { echo "ERROR: no se pudo cambiar LANGUAGE_CODE del backend."; exit 1; }; \
    FICHERO=$(grep -rl 'userLanguage' /app/web/assets/*.js | head -1); \
    test -n "$FICHERO" || { echo "ERROR: no encuentro el chunk i18n del frontend."; exit 1; }; \
    sed -i 's/getItem(`userLanguage`)||`en`/getItem(`userLanguage`)||`es`/g' "$FICHERO"; \
    sed -i 's/fallbackLng:`en`/fallbackLng:`es`/g' "$FICHERO"; \
    grep -q 'userLanguage`)||`es`' "$FICHERO" \
      || { echo "ERROR: no se pudo cambiar el idioma por defecto del frontend."; exit 1; }

# La imagen base trae su propio entrypoint (supervisord + start.sh)
