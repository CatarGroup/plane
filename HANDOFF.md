# HANDOFF — Time Tracker (contador tipo Toggl)

Nota para otra sesión de Claude retomando este trabajo desde otra instalación
(misma cuenta de GitHub, mismo repo `CatarGroup/plane`).

## Rama

`fork-full-source` — **NO** es `main`. `main`/Railway/producción no se han
tocado en ningún momento de este trabajo.

`fork-full-source` es el código fuente COMPLETO de Plane v1.4.2 (vendorizado
vía `git remote add upstream` + merge), no el overlay de `main` (que solo
parchea la imagen Docker oficial con `sed`). Se eligió mezclar en el mismo
repo, en vez de crear un repo nuevo, para no romper el build/push de Railway
y poder volver atrás cuando se quiera (decisión explícita del usuario).

## Qué hay implementado (contador de tiempo)

Feature completa MVP, commiteada en `fork-full-source`:

- **Backend**: modelo `TimeEntry` (`apps/api/plane/db/models/time_tracking.py`),
  migración `0123_time_entry`, serializers, 5 endpoints REST bajo
  `workspaces/<slug>/time-entries/...` (Start/Stop/Running/List/Detail).
- **Frontend**: store MobX con tick en vivo, círculo Play/Stop en el menú
  horizontal superior (junto al selector de Workspace, como pidió el
  usuario — NO es por proyecto), modal de búsqueda de tarea (workspace-wide),
  vista semanal en `/time-tracking` (lista agrupada por día, NO es el
  calendario pixel-perfect estilo Toggl de la captura — eso queda pendiente
  como mejora futura si se pide).
- Scope explícito confirmado por el usuario: multi-usuario/equipo, Play/Stop
  atado a tarea, vista semanal. Reports/export quedaron FUERA a propósito.

## Bug real encontrado y arreglado en esta sesión (commitear si no está)

**La ruta `/time-tracking` daba 404.** Esta app usa React Router v7 con
rutas declaradas a mano en `apps/web/app/routes/core.ts` (NO son
auto-descubiertas por carpeta al estilo Next.js, aunque los archivos vivan
en `app/(all)/[workspaceSlug]/(projects)/time-tracking/`). Los archivos de
la feature existían pero nunca se registraron en `core.ts`. Fix: añadida la
entrada `layout(...)`/`route(...)` junto a "Active Cycles" en `core.ts`.

**Si ves 404 en cualquier ruta nueva que añadas: revisa `core.ts` primero.**

## Cómo levantar esto en local (Windows + Docker Desktop)

**Requisito: tener Docker Desktop instalado y arrancado.** Sin eso no se
puede levantar nada de lo que sigue.

```
git checkout fork-full-source
./setup.sh                                          # copia .env.example -> .env en cada app + genera SECRET_KEY
docker compose -f docker-compose-local.yml up -d --build   # postgres+redis+rabbitmq+minio+api+worker+beat+migrator
pnpm install
pnpm dev                                            # turbo run dev -> levanta web (3000), admin (3001/god-mode), space (3002), live (3100)
```

Backend en `http://localhost:8000`, web en `http://localhost:3000`.

Es una base de datos NUEVA y vacía (no toca la de producción). Primera vez
pide configurar la instancia en `localhost:3001/god-mode/` antes de poder
usar `localhost:3000`.

## Bugs de entorno encontrados (todos de Windows/Docker/pnpm, no del código)

1. **MinIO ya no existe en Docker Hub** (`minio/minio` → "pull access
   denied"). MinIO cerró ese repo público. Fix aplicado en
   `docker-compose-local.yml`: usar `quay.io/minio/minio`.

2. **`apps/api/.env` trae por defecto `USE_MINIO=0` y
   `AWS_S3_ENDPOINT_URL=http://localhost:9000`** — eso es para correr la
   api DIRECTA en el host (fuera de Docker). Si la api corre CONTENEDORIZADA
   (como en este `docker-compose-local.yml`, servicio `api`), hay que
   cambiar a mano: `USE_MINIO=1` y `AWS_S3_ENDPOINT_URL=http://plane-minio:9000`
   (nombre de red interno de Docker). Si no, la api no puede hacer el check
   de bucket al arrancar.

3. **Subida de imágenes (portada de proyecto, adjuntos, etc.) rota en local
   con MinIO.** La URL firmada (`presigned POST`) que el backend genera para
   que el NAVEGADOR suba el archivo usa `request.get_host()` — en
   producción (Railway/AIO) hay un proxy (Caddy) delante que reenvía esa
   ruta a MinIO en el mismo host/puerto; en este `docker-compose-local.yml`
   NO hay proxy, así que el navegador intenta subir a
   `http://localhost:8000/uploads` (Django), que no tiene esa ruta → 404 →
   "Failed to upload cover image".

   **Fix aplicado** (parche aditivo, no rompe producción):
   `apps/api/plane/settings/storage.py` ahora respeta una variable de
   entorno opcional `LOCAL_DEV_DIRECT_MINIO_URL`. Si está seteada, las URLs
   firmadas apuntan ahí en vez de a `request.get_host()`. Añadir en
   `apps/api/.env`:

   ```
   LOCAL_DEV_DIRECT_MINIO_URL="http://localhost:9000"
   ```

   (el puerto 9000 de MinIO ya está expuesto al host en
   `docker-compose-local.yml`). Si esta var no existe, el comportamiento es
   EXACTAMENTE el de antes — cero riesgo para Railway/producción.

4. **pnpm 11 tiene un chequeo automático "verify deps before run"** que
   dispara un `pnpm install` por cada uno de los ~20 paquetes del monorepo
   cuando corres `pnpm dev` (via turbo, en paralelo). En Windows eso
   provoca carreras reales sobre `node_modules` (`EPERM`, `EEXIST`,
   `EBUSY`) que lo corrompen todo. Un `.npmrc` de PROYECTO con
   `verify-deps-before-run = false` NO sirve (el tipo de config real es
   string boolean, mal parseado ahí). Fix que sí funciona:

   ```
   pnpm config set verify-deps-before-run false --location=global
   ```

   Esto es un ajuste GLOBAL del pnpm de esa máquina (no algo que viva en el
   repo) — si otra persona/máquina lo sufre, tiene que correr ese comando
   una vez.

5. **Si `pnpm dev` se corrompe** (errores raros de módulos faltantes tipo
   `date-fns/isFriday.js` ENOENT): el store global de pnpm
   (`pnpm store path`) quedó con contenido a medias de instalaciones
   interrumpidas. Fix: `rm -rf node_modules` + `pnpm install --force`
   (fuerza reverificar cada paquete contra el store).

6. **El primer load de `pnpm dev` en Windows a veces crashea justo después
   de "optimized dependencies changed. reloading"** (Vite). Si pasa una
   vez, simplemente relanzar `pnpm dev` — no suele repetirse.

7. **Cuidado con Docker Desktop → "Troubleshoot" → "Clean / Purge data" /
   factory reset**: borra TODOS los contenedores, imágenes Y volúmenes
   (incluida la base de datos postgres local de prueba). Si pasa, solo hay
   que rearrancar Docker Desktop y repetir `docker compose up -d --build`
   desde cero — no afecta a nada de producción, pero pierdes los datos de
   prueba (usuarios, proyectos, etc. que hubieras creado en local).

8. **Traducciones muestran claves en crudo** (`auth.common.email.label` en
   vez de texto real) en `pnpm dev`. Es cosmético — el paquete `@plane/i18n`
   carga los JSON de idioma vía `import()` dinámico
   (`packages/i18n/src/core/instance.ts`) y en modo watch de `tsdown` no se
   están sirviendo bien. No bloquea nada funcionalmente. **No investigado a
   fondo** — pendiente si molesta.

## Trabajo en dos sitios a la vez (aviso importante)

Durante esta sesión hubo OTRA sesión de Claude/usuario trabajando en
paralelo sobre el MISMO working directory (`C:\CatarBI\GrupoRomboc\ia\Plane\plane`),
cambiando de rama y commiteando en `main` mientras yo tenía cosas corriendo
en background ahí mismo — causó que archivos desaparecieran a mitad de un
build porque el checkout cambió de rama por debajo. Si vas a levantar el
entorno de pruebas, usa un **git worktree separado** en vez de la carpeta
compartida:

```
git worktree add ../plane-fork-test fork-full-source
```

así no chocas con quien esté trabajando en la carpeta principal.

## Pendiente / no hecho

- Vista semanal pixel-perfect estilo Toggl (calendario con bloques) — se
  entregó una versión funcional más simple (lista agrupada por día).
- Vista Gantt estilo AirTable — el usuario nunca mandó el HTML de
  referencia que prometió, sigue bloqueado por eso.
- Sentry en frontend (Next.js) — descartado por ahora, solo hay Sentry en
  backend.
- Dockerfile de PRODUCCIÓN para `fork-full-source` (build real para
  desplegar esto, no solo `docker-compose-local.yml` de desarrollo) — no
  empezado. Hace falta antes de poder desplegar esta rama a ningún sitio.
- El fix de subida de imágenes (`LOCAL_DEV_DIRECT_MINIO_URL`) solo se
  probó parcialmente — confirmar que la portada de proyecto sube bien tras
  el último cambio.
- Confirmar visualmente que el fix de la ruta `/time-tracking` (registro en
  `core.ts`) realmente resuelve el 404 — se acaba de aplicar, no
  verificado todavía en navegador.
