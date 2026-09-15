# Plane CatarGroup — overlay en español + tema propio

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

- El parche del **asunto** de la invitación se aplica con `sed` sobre
  `/app/backend/plane/bgtasks/workspace_invitation_task.py` y se **verifica en el build**:
  si Plane cambia esa línea, la construcción falla con un error claro (no se despliega a medias).
- Las plantillas van a `/app/backend/templates/` (el backend de la imagen AIO vive en `/app/backend`).
- El tema se inyecta en `/app/web/` (frontend servido por nginx dentro de la misma imagen).
- Las credenciales reales (SMTP, tokens) **no** viven aquí: van en las variables de entorno de Railway.
