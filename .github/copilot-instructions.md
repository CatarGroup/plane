# Instrucciones para Copilot

Este repositorio es un overlay de Plane, no una fork del proyecto base.

## Objetivo
Mantener un despliegue de Plane en español con un tema visual propio, sin duplicar el código fuente de Plane.

## Convenciones
- `Dockerfile` debe seguir aplicando cambios sobre la imagen base `makeplane/plane-aio-community`.
- Las plantillas de email viven en `templates/` y deben seguir la estructura por tipo de email.
- El tema visual pertenece en `theme/theme.css` y se concatena al CSS final generado por Plane.
- Los asuntos de correo se gestionan con `scripts/traducir_subjects.py` y deben mantenerse congruentes con los textos esperados.
- Cuando se actualiza Plane, ajustar `ARG PLANE_VERSION` en el `Dockerfile` y validar el build.

## No hacer
- No reescribir el backend ni el frontend de Plane.
- No añadir cambios a archivos de la imagen base que no formen parte del overlay.
- No introducir secretos ni credenciales reales en el repositorio.

## Validación
La verificación principal es la construcción de la imagen:

```bash
docker build .
```

Si se cambia texto relacionado con asuntos de email o el tema visual, revisar también que el build no falle por comprobaciones de `sed`/CSS.
