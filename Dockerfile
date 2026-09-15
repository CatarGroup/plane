# Plane en español (y con nuestro toque) — overlay sobre la imagen oficial
#
# NO copia el código de Plane: solo encima sus plantillas de email traducidas
# y parchea el asunto. Así las actualizaciones de Plane se aplican cambiando
# el tag de abajo (PLANE_VERSION) sin perder nada nuestro.
#
# Base: imagen "all-in-one" community (la que usa el despliegue de Railway).
ARG PLANE_VERSION=stable
FROM makeplane/plane-aio-community:${PLANE_VERSION}

# ---------------------------------------------------------------
# 1) Plantillas de email en español
#    (en la imagen AIO el backend vive en /app/backend)
# ---------------------------------------------------------------
COPY templates/ /app/backend/templates/

# ---------------------------------------------------------------
# 2) Asunto de la invitación al workspace en español
#    Es una sola línea dentro del .py; se parchea con sed y se VERIFICA
#    (si Plane cambia esa línea, el build falla y nos enteramos).
# ---------------------------------------------------------------
RUN set -eux; \
    F=/app/backend/plane/bgtasks/workspace_invitation_task.py; \
    sed -i \
      -e 's/has invited you to join them in/te invita a unirte al workspace/' \
      -e 's/ on Plane"/ en Plane"/' \
      "$F"; \
    grep -q "te invita a unirte al workspace" "$F" \
      || { echo "ERROR: no se pudo parchear el asunto (Plane cambió el fichero). Revisar el sed."; exit 1; }

# ---------------------------------------------------------------
# 3) Tema propio (colores del kanban tipo Trello) — ver theme/
#    Se inyecta el CSS en el frontend y se copia al directorio servido.
# ---------------------------------------------------------------
COPY theme/theme.css /app/web/theme.css
RUN set -eux; \
    sed -i 's|</head>|<link rel="stylesheet" href="/theme.css"></head>|' /app/web/index.html; \
    grep -q 'theme.css' /app/web/index.html \
      || { echo "ERROR: no se pudo inyectar el tema en el frontend."; exit 1; }

# La imagen base trae su propio entrypoint (supervisord + start.sh)
