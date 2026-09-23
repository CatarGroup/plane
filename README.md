# Plane Grupo Romboc — overlay en español + TEMA GRUPO ROMBOC

Repositorio para personalizar **Plane** (self-hosted) **sin tocar su código**:

- 🇪🇸 **Emails en español** (invitaciones, contraseñas, notificaciones…)
- 🎨 **Tema propio** (colores del tablero tipo Trello)

Se aplica como **overlay sobre la imagen oficial**: no copiamos el código de Plane, solo
añadimos encima nuestras plantillas, un parche puntual del asunto y nuestro CSS.
Así, **actualizar Plane = cambiar el tag de la imagen base** y nada de lo nuestro se pierde.

La única excepción es el **frontend web**, cuando el cambio no es de texto sino de
estructura (p. ej. reagrupar cosas en la pantalla): en ese caso se recompila desde un
fork con el código fuente completo, en la rama `web-frontend-source-v1.4.2` de este
mismo repo. El job `build-web` del workflow lo compila y publica en
`ghcr.io/catargroup/plane-web`, y el `Dockerfile` principal sustituye con eso el
frontend de la imagen oficial (paso 0) antes de aplicar el resto de parches de texto.
Actualizar esa parte cuesta más: hay que traer los cambios de la nueva versión de Plane
a esa rama (merge/rebase) en vez de solo cambiar un tag.

## Contenido

```
├── Dockerfile                     # overlay sobre makeplane/plane-aio-community
│                                   # (sustituye el frontend por el de ghcr.io/catargroup/plane-web)
├── .github/workflows/build.yml    # build-web (frontend desde fuente) + build (overlay)
├── templates/emails/              # plantillas de email traducidas al español
│   ├── auth/                      # recuperar contraseña, magic link
│   ├── invitations/               # invitación a workspace / a proyecto
│   ├── notifications/             # novedades de tareas, webhooks
│   ├── user/                      # activación, desactivación, cambio de email
│   ├── exports/                   # export de analíticas
│   └── test_email.html
├── theme/
│   └── theme.css                  # tema del tablero (colores tipo Trello)
├── scripts/
│   ├── traducir_subjects.py               # asuntos de email al español
│   ├── patch_profile_theme_default.py     # Tema Catar Bi default (altas nuevas)
│   └── patch_sentry_backend.py            # Sentry en el backend (api/worker/beat)
└── migrations/
    └── 0123_set_theme_catarbi_default.py  # Tema Catar Bi en perfiles existentes
```

## Cómo se despliega (Railway)

En el servicio **Plane** del proyecto de Railway:

1. **Settings → Source** → cambiar de *Docker Image* a **GitHub Repo** → `CatarGroup/plane`
2. Railway detecta el `Dockerfile` de la raíz y construye la imagen (tarda unos minutos)
3. Variables de entorno: las mismas que ya tenía + (opcional) `SENTRY_DSN` para activar Sentry
   en el backend — ver nota más abajo

## Cómo actualizar

- **Cambios nuestros** (traducciones, colores): commit + push a `main` → Railway redespliega solo.
- **Actualizar Plane** a una versión nueva: cambiar el tag base en el `Dockerfile`
  (`ARG PLANE_VERSION=stable` → p. ej. `v0.28.0`) y push.

## Notas

- **Auditoría de color del tema (18/09/2026, Playwright sobre producción):** se midió el
  contraste WCAG real de cada elemento. Encontrados y corregidos en `theme/theme.css` (v3):
  el botón **«Nuevo elemento de trabajo»** y **«Community»** del sidebar quedaban con fondo
  claro de Plane + texto forzado a claro → contraste **1.14** y **1.00** (invisibles); y la
  2.ª columna tenía el borde **idéntico** al fondo del tablero (contraste **1.00**). Tras el
  arreglo: 14.1 / 12.35 y ningún elemento del sidebar por debajo de 3:1.
- **Fix de popovers del sidebar (18/09/2026, medido con Playwright sobre producción):** el
  popover de **acciones rápidas** de un proyecto (botón «⋮») se renderiza **dentro del `aside`**
  y **sí usa `role="menu"` / `role="menuitem"`**; Plane lo pinta con **fondo blanco**
  (`DIV.shadow-md … min-w-[12rem]`) mientras la regla del tema v2 le forzaba el texto claro
  `#E9F1F7` → los 4 items (*Publicar proyecto, Copiar enlace, Archivos, Configuración*) quedaban
  con contraste **1.14** (invisibles). Arreglo: se excluyen `[role="menu"]`/`[role="menuitem"]`
  de la regla del sidebar y se les devuelve `--txt-primary` + `--bg-layer-1` → contraste **16.55**,
  cero ilegibles. *(Ojo: el desplegable de la lista de proyectos —«Proyectos ⋮»— es otro
  componente: se pinta en un portal **fuera** del `aside` y **no** tiene `role="menu"`, así que
  las mismas reglas no le afectan y no le hacía falta arreglo.)*
- **Vista Calendario coloreada tipo AirTable (18/09/2026):** Plane ya pinta una barrita fina
  (`span` con `background-color` inline, color de etiqueta/prioridad) a la izquierda de cada
  tarjeta del calendario. Se estira con CSS para que tiña la tarjeta entera — no hace falta
  mapear colores por etiqueta, reutiliza el que Plane ya calcula por ítem.
- **Tema Catar Bi — renombrado + default (18/09/2026):** el selector de Ajustes venía con la
  opción de Plane «Custom theme» / «Tema personalizado» (`packages/i18n` en el código fuente
  de Plane, se compila dentro del JS del build, no queda como fichero plano). Se renombra a
  «Tema Catar Bi» con `grep`+`sed` sobre los assets ya construidos, verificado en el build.
  El look en sí (`theme/theme.css`) **ya se aplicaba a todos independientemente de este
  selector** (CSS con `!important`, no depende de qué tema tenga elegido cada usuario); esto
  solo hace que el desplegable salga marcado igual para todos, en vez de vacío/inconsistente:
  · **Altas nuevas:** `scripts/patch_profile_theme_default.py` cambia el default del campo
    `Profile.theme` (backend, `apps/api/plane/db/models/user.py` en el código de Plane) de
    `{}` a nuestra paleta — verificado en el build igual que el resto de parches.
  · **Perfiles existentes:** `migrations/0123_set_theme_catarbi_default.py` se copia a
    `/app/backend/plane/db/migrations/` y corre sola en cada arranque (la imagen AIO ya
    ejecuta `manage.py migrate` vía el proceso `migrator` de supervisor). Fuerza el tema en
    TODOS los perfiles, pisando lo que cada usuario tuviera elegido — es **irreversible a
    propósito**, no guarda el valor anterior de cada uno.
- **Sentry en el backend (18/09/2026):** Plane no trae Sentry de serie (comprobado en el
  código fuente público, tag v1.4.2: nada en `requirements`, nada en `settings`). Se añade con
  `pip install sentry-sdk` + `scripts/patch_sentry_backend.py`, que inicializa Sentry en
  `plane/settings/production.py` — el único módulo de settings que cargan TODOS los procesos
  (api, worker, beat, migrator), así que cubre el backend entero de una vez. Solo se activa si
  existe la env var **`SENTRY_DSN`** en Railway (el DSN no vive en el repo). Opcionales:
  `SENTRY_ENVIRONMENT` (default `production`), `SENTRY_TRACES_SAMPLE_RATE` (default `0.1`).
  `send_default_pii=False` — no manda datos personales de usuarios a Sentry.
  · **Frontend (Next.js) sin cubrir todavía:** el SDK oficial de Sentry para Next.js necesita
  estar metido en el build (webpack plugin, instrumentation.ts), no se puede overlay sobre la
  imagen ya compilada como el resto de esto. Queda pendiente, se evaluará aparte (probar antes
  en staging — ya hubo un patche de HTML que rompió la hidratación de React, ver commit
  `5b1e283`).
- El parche del **asunto** de la invitación se aplica con `sed` sobre
  `/app/backend/plane/bgtasks/workspace_invitation_task.py` y se **verifica en el build**:
  si Plane cambia esa línea, la construcción falla con un error claro (no se despliega a medias).
- Las plantillas van a `/app/backend/templates/` (el backend de la imagen AIO vive en `/app/backend`).
- El tema se inyecta en `/app/web/` (frontend servido por nginx dentro de la misma imagen).
- Las credenciales reales (SMTP, tokens) **no** viven aquí: van en las variables de entorno de Railway.
