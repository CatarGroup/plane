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

# ---------------------------------------------------------------
# 4) "Tema personalizado" -> "Tema Catar Bi" en el selector de Ajustes.
#    El texto vive en JSON (packages/i18n) pero Next.js lo compila
#    DENTRO del JS del build (import dinamico, no queda como fichero
#    plano), asi que se sustituye tal cual en los assets ya construidos.
#    Se verifica: si el texto no aparece, el build FALLA.
# ---------------------------------------------------------------
RUN set -eux; \
    FICHEROS=$(grep -rl 'Tema personalizado' /app/web/ || true); \
    test -n "$FICHEROS" || { echo "ERROR: no encuentro 'Tema personalizado' en /app/web."; exit 1; }; \
    echo "$FICHEROS" | xargs sed -i 's/Tema personalizado/Tema Catar Bi/g'; \
    grep -rq 'Tema Catar Bi' /app/web/ \
      || { echo "ERROR: no se ha renombrado el tema."; exit 1; }

# ---------------------------------------------------------------
# 5) Tema Catar Bi como default para perfiles NUEVOS (backend).
#    Parche puntual sobre Profile.theme, verificado en el build.
# ---------------------------------------------------------------
COPY scripts/patch_profile_theme_default.py /tmp/patch_profile_theme_default.py
RUN python3 /tmp/patch_profile_theme_default.py

# ---------------------------------------------------------------
# 6) Backfill: fuerza Tema Catar Bi en los perfiles YA EXISTENTES.
#    Migracion de Django nueva (no toca ninguna existente), corre
#    sola: la imagen AIO ya arranca "migrator" (manage.py migrate)
#    en cada boot (ver supervisor.conf de la imagen base).
# ---------------------------------------------------------------
COPY migrations/0123_set_theme_catarbi_default.py /app/backend/plane/db/migrations/0123_set_theme_catarbi_default.py

# ---------------------------------------------------------------
# 7) Sentry en el backend (API + workers + beat + migrator).
#    Solo se activa si SENTRY_DSN esta en las env vars de Railway;
#    el DSN no vive en el repo. Parche verificado en el build.
# ---------------------------------------------------------------
RUN pip install --no-cache-dir sentry-sdk
COPY scripts/patch_sentry_backend.py /tmp/patch_sentry_backend.py
RUN python3 /tmp/patch_sentry_backend.py

# ---------------------------------------------------------------
# 8) "Search commands..." -> "Buscar comandos..." en la caja de
#    busqueda de arriba. Mismo mecanismo que el paso 4 (texto
#    compilado dentro del JS, no fichero de traduccion aparte).
#    Frase larga y unica, sin riesgo de tocar nombres de variables
#    del codigo (a diferencia de palabras sueltas como "State" o
#    "Priority", que SI coinciden con identificadores del JS
#    minificado y no se pueden sustituir asi a ciegas).
# ---------------------------------------------------------------
RUN set -eux; \
    FICHEROS=$(grep -rl 'Search commands\.\.\.' /app/web/ || true); \
    test -n "$FICHEROS" || { echo "ERROR: no encuentro 'Search commands...' en /app/web."; exit 1; }; \
    echo "$FICHEROS" | xargs sed -i 's/Search commands\.\.\./Buscar comandos.../g'; \
    grep -rq 'Buscar comandos' /app/web/ \
      || { echo "ERROR: no se ha traducido la caja de busqueda."; exit 1; }

# La imagen base trae su propio entrypoint (supervisord + start.sh)
