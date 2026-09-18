# Plane Grupo Romboc — overlay en español + TEMA GRUPO ROMBOC

Repositorio para personalizar **Plane** (self-hosted) **sin tocar su código**:

- 🇪🇸 **Emails en español** (invitaciones, contraseñas, notificaciones…)
- 🎨 **Tema propio** (colores del tablero tipo Trello)

Se aplica como **overlay sobre la imagen oficial**: no copiamos el código de Plane, solo
añadimos encima nuestras plantillas, un parche puntual del asunto y nuestro CSS.
Así, **actualizar Plane = cambiar el tag de la imagen base** y nada de lo nuestro se pierde.

## Contenido

```
├── Dockerfile                     # overlay sobre makeplane/plane-aio-community
├── templates/emails/              # plantillas de email traducidas al español
│   ├── auth/                      # recuperar contraseña, magic link
│   ├── invitations/               # invitación a workspace / a proyecto
│   ├── notifications/             # novedades de tareas, webhooks
│   ├── user/                      # activación, desactivación, cambio de email
│   ├── exports/                   # export de analíticas
│   └── test_email.html
└── theme/
    └── theme.css                  # tema del tablero (colores tipo Trello)
```

## Cómo se despliega (Railway)

En el servicio **Plane** del proyecto de Railway:

1. **Settings → Source** → cambiar de *Docker Image* a **GitHub Repo** → `CatarGroup/plane`
2. Railway detecta el `Dockerfile` de la raíz y construye la imagen (tarda unos minutos)
3. Variables de entorno: las mismas que ya tenía (no cambia nada)

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
- El parche del **asunto** de la invitación se aplica con `sed` sobre
  `/app/backend/plane/bgtasks/workspace_invitation_task.py` y se **verifica en el build**:
  si Plane cambia esa línea, la construcción falla con un error claro (no se despliega a medias).
- Las plantillas van a `/app/backend/templates/` (el backend de la imagen AIO vive en `/app/backend`).
- El tema se inyecta en `/app/web/` (frontend servido por nginx dentro de la misma imagen).
- Las credenciales reales (SMTP, tokens) **no** viven aquí: van en las variables de entorno de Railway.
