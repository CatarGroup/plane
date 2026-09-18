# AGENTS.md

## Propósito del repositorio
Este repositorio no modifica el código de Plane. Es un overlay para la imagen oficial `makeplane/plane-aio-community` que añade:

- plantillas de email en español
- traducciones de los asuntos de email
- un tema visual para el tablero
- un Dockerfile que aplica los cambios sobre la imagen base sin tocar su código fuente

## Estructura principal
- `Dockerfile`: construye la imagen overlay sobre la base de Plane
- `templates/`: plantillas HTML de emails, organizadas por tipo
- `theme/theme.css`: CSS adicional del tema propio
- `scripts/traducir_subjects.py`: script de validación para las traducciones de asunto
- `.github/workflows/build.yml`: publica la imagen en GHCR y dispara redeploy en Railway

## Reglas de trabajo
1. Mantener la arquitectura de overlay: no copiar ni reescribir el código de Plane.
2. Si se actualiza la versión base, cambiar `ARG PLANE_VERSION` en el `Dockerfile`.
3. Los cambios de idioma deben conservar el estilo del producto original y respetar los textos ya existentes.
4. Los asuntos de email deben mantenerse sincronizados con las traducciones de `scripts/traducir_subjects.py`.
5. El tema debe seguir inyectándose al CSS final generado por la app, no como un `<link>` separado.
6. Cualquier cambio que altere el flujo de build debe seguir verificando que la imagen construye correctamente.

## Validación recomendada
Antes de cerrar cambios relevantes, validar al menos:

- `docker build .`
- comprobar que el script de asuntos no falle por cambios de Plane
- confirmar que el CSS del tema queda aplicado en la salida final

## Contexto de despliegue
Este repo está pensado para desplegarse como imagen Docker sobre Railway o cualquier entorno que use la imagen base de Plane. Las credenciales y secretos reales no deben añadirse a este repositorio.
