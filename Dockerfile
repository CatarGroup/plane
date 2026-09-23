# Plane — emails en espanol + TEMA GRUPO ROMBOC (overlay sobre la imagen oficial)
#
# Parte de la imagen AIO oficial y la parchea: plantillas de email
# traducidas, ASUNTOS traducidos (script que verifica cada sustitucion) y
# tema inyectado. La UNICA pieza que no viene de la imagen oficial es el
# frontend web (/app/web): este mismo repo trae ADEMAS el codigo fuente
# completo de Plane (apps/, packages/...) para poder recompilarlo con
# cambios de estructura, no solo de texto — ver paso 0. Esa imagen
# (ghcr.io/catargroup/plane-web) la publica el job "build-web" del
# workflow, ANTES de este build, usando ese mismo codigo fuente.
#
# PLANE_VERSION esta FIJADO (no "stable"): el frontend fuente (paso 0) y
# el resto de la imagen AIO oficial tienen que ser la MISMA version, o el
# frontend puede dejar de hablar bien con el backend. Al subir de version
# hay que: 1) traer los cambios del nuevo tag de Plane a apps/ y packages/
# (merge/rebase, puede haber conflictos), 2) actualizar esta ARG,
# 3) actualizar el tag de ghcr.io/catargroup/plane-web aqui abajo.
ARG PLANE_VERSION=v1.4.2
FROM ghcr.io/catargroup/plane-web:v1.4.2 AS web-img
FROM makeplane/plane-aio-community:${PLANE_VERSION}

# ---------------------------------------------------------------
# 0) Frontend web recompilado desde fuente (con nuestros cambios de
#    estructura, no solo de texto). Sustituye COMPLETO el frontend que
#    trae la imagen oficial. Tiene que ir ANTES que cualquier parche de
#    texto sobre /app/web (pasos 4, 5, 9, 10 y 11): esos operan sobre los
#    ficheros ya compilados, y los de nuestro build tienen otro hash en
#    el nombre.
#
#    OJO con la RUTA de origen: la imagen oficial de Plane sirve el
#    frontend con Caddy (/usr/share/caddy/html), pero la NUESTRA lo
#    compila con apps/web/Dockerfile.web, que termina en una etapa
#    nginx:alpine y deja el build en /usr/share/nginx/html
#    (ver el COPY final de ese Dockerfile: apps/web/build/client).
#    Copiar de /usr/share/caddy/html aqui hacia que el build fallara
#    con "failed to calculate checksum ... /usr/share/caddy/html: not
#    found" y el despliegue de Railway nunca llegaba a lanzarse.
# ---------------------------------------------------------------
RUN rm -rf /app/web
COPY --from=web-img /usr/share/nginx/html /app/web
RUN test -f /app/web/index.html \
    || { echo "ERROR: el build de ghcr.io/catargroup/plane-web no produjo /app/web/index.html."; exit 1; }
RUN ls /app/web/assets/globals-*.css > /dev/null \
    || { echo "ERROR: el frontend de plane-web no trae /app/web/assets/globals-*.css (el paso 4 del tema lo necesita)."; exit 1; }

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
# 3) Textos del email de novedades de tareas: resumen en espanol,
#    "tarea" en vez de "issue" y asunto SIN el identificador
#    (p.ej. "GRUPO-40") delante del titulo. Mismo criterio que el
#    paso 2: el script verifica cada sustitucion y el build FALLA
#    si Plane cambia el fichero.
# ---------------------------------------------------------------
COPY scripts/traducir_backend_emails.py /tmp/traducir_backend_emails.py
RUN python3 /tmp/traducir_backend_emails.py

# ---------------------------------------------------------------
# 4) TEMA GRUPO ROMBOC — se CONCATENA al final del CSS de Plane.
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
# 5) "Tema personalizado" -> "Tema Catar Bi" en el selector de Ajustes.
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
# 6) Tema Catar Bi como default para perfiles NUEVOS (backend).
#    Parche puntual sobre Profile.theme, verificado en el build.
# ---------------------------------------------------------------
COPY scripts/patch_profile_theme_default.py /tmp/patch_profile_theme_default.py
RUN python3 /tmp/patch_profile_theme_default.py

# ---------------------------------------------------------------
# 7) Backfill: fuerza Tema Catar Bi en los perfiles YA EXISTENTES.
#    Migracion de Django nueva (no toca ninguna existente), corre
#    sola: la imagen AIO ya arranca "migrator" (manage.py migrate)
#    en cada boot (ver supervisor.conf de la imagen base).
# ---------------------------------------------------------------
COPY migrations/0123_set_theme_catarbi_default.py /app/backend/plane/db/migrations/0123_set_theme_catarbi_default.py

# ---------------------------------------------------------------
# 8) Sentry en el backend (API + workers + beat + migrator).
#    Solo se activa si SENTRY_DSN esta en las env vars de Railway;
#    el DSN no vive en el repo. Parche verificado en el build.
# ---------------------------------------------------------------
RUN pip install --no-cache-dir sentry-sdk
COPY scripts/patch_sentry_backend.py /tmp/patch_sentry_backend.py
RUN python3 /tmp/patch_sentry_backend.py

# ---------------------------------------------------------------
# 9) "Search commands..." -> "Buscar" en la caja de busqueda de
#    arriba. Mismo mecanismo que el paso 5 (texto compilado dentro
#    del JS, no fichero de traduccion aparte). Frase larga y unica,
#    sin riesgo de tocar nombres de variables del codigo (a
#    diferencia de palabras sueltas como "State" o "Priority", que
#    SI coinciden con identificadores del JS minificado y no se
#    pueden sustituir asi a ciegas).
# ---------------------------------------------------------------
RUN set -eux; \
    FICHEROS=$(grep -rl 'Search commands\.\.\.' /app/web/ || true); \
    test -n "$FICHEROS" || { echo "ERROR: no encuentro 'Search commands...' en /app/web."; exit 1; }; \
    echo "$FICHEROS" | xargs sed -i 's/Search commands\.\.\./Buscar/g'; \
    echo "$FICHEROS" | xargs grep -q 'Buscar' \
      || { echo "ERROR: no se ha traducido la caja de busqueda."; exit 1; }

# ---------------------------------------------------------------
# 10) Etiquetas del desplegable de filtros (State, Priority...).
#    Viven TODAS con el mismo patron seguro label:`Palabra` (un
#    objeto de configuracion, una entrada por campo). Ese patron no
#    coincide con nombres de variables del JS minificado — a
#    diferencia de las palabras sueltas: "Priority" tambien aparece
#    dentro de "PriorityPropertyIcon" en otro sitio del mismo bundle,
#    y "Label" dentro de "...DefinitionLabel" de una libreria de
#    markdown. Por eso NUNCA se sustituye la palabra suelta, siempre
#    el patron completo label:`Palabra` con las comillas invertidas.
#    Cada entrada se verifica por separado: si Plane renombra o
#    quita alguna, el build FALLA senalando exactamente cual.
# ---------------------------------------------------------------
RUN set -eux; \
    traducir_label() { \
      en="$1"; es="$2"; \
      pat='label:`'"$en"'`'; \
      rep='label:`'"$es"'`'; \
      FICHEROS=$(grep -rlF -- "$pat" /app/web/ || true); \
      test -n "$FICHEROS" || { echo "ERROR: no encuentro $pat en /app/web."; exit 1; }; \
      echo "$FICHEROS" | xargs sed -i "s#$pat#$rep#g"; \
    }; \
    traducir_label 'State Group' 'Grupo de estado'; \
    traducir_label 'State' 'Estado'; \
    traducir_label 'Assignees' 'Asignados'; \
    traducir_label 'Priority' 'Prioridad'; \
    traducir_label 'Mentions' 'Menciones'; \
    traducir_label 'Label' 'Etiqueta'; \
    traducir_label 'Cycle' 'Ciclo'; \
    traducir_label 'Module' 'Modulo'; \
    traducir_label 'Start date' 'Fecha de inicio'; \
    traducir_label 'Target date' 'Fecha de vencimiento'; \
    traducir_label 'Created at' 'Fecha de creacion'; \
    traducir_label 'Updated at' 'Fecha de actualizacion'; \
    traducir_label 'Subscriber' 'Suscriptor'; \
    traducir_label 'Created by' 'Creado por'; \
    traducir_label 'Projects' 'Proyectos'

# ---------------------------------------------------------------
# 11) "Filters" -> "Filtros" (aparecia en varios sitios: Vistas,
#     Modulos, notificaciones...). Cada aparicion vive en un objeto
#     de etiquetas propio con su propio patron unico — NUNCA se
#     sustituye la palabra suelta "Filters" (aparece tambien dentro
#     de identificadores como "appliedFilters" o "handleClearAllFilters"
#     en el mismo bundle, confirmado antes de escribir esto).
# ---------------------------------------------------------------
RUN set -eux; \
    traducir() { \
      pat="$1"; rep="$2"; \
      FICHEROS=$(grep -rlF -- "$pat" /app/web/ || true); \
      test -n "$FICHEROS" || { echo "ERROR: no encuentro $pat en /app/web."; exit 1; }; \
      echo "$FICHEROS" | xargs sed -i "s#$pat#$rep#g"; \
    }; \
    traducir 'filters:`Filters`' 'filters:`Filtros`'; \
    traducir 'filters:`Inbox Filters`' 'filters:`Filtros de la bandeja`'; \
    traducir '?null:`Filters`}' '?null:`Filtros`}'; \
    traducir 'title:`Filters`,placement:`' 'title:`Filtros`,placement:`'

# La imagen base trae su propio entrypoint (supervisord + start.sh)
