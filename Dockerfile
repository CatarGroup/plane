# Plane — emails en espanol + TEMA GRUPO ROMBOC (overlay sobre la imagen oficial)
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

# La imagen base trae su propio entrypoint (supervisord + start.sh)
