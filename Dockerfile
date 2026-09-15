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
# 3) TEMA GRUPO ROMBOC — se CONCATENA al final del CSS de Plane.
#    (inyectar un <link> en el HTML rompe la hidratacion de React:
#     el navegador acaba descartandolo y el tema no se ve)
# ---------------------------------------------------------------
COPY theme/theme.css /tmp/theme.css
RUN set -eux; \
    GLOBALS=$(ls /app/web/assets/globals-*.css | head -1); \
    test -n "$GLOBALS" || { echo "ERROR: no encuentro el CSS global del frontend."; exit 1; }; \
    cat /tmp/theme.css >> "$GLOBALS"; \
    grep -q 'TEMA GRUPO ROMBOC' "$GLOBALS" \
      || { echo "ERROR: el tema no se ha anadido al CSS."; exit 1; }

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
