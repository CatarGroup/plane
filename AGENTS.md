# AGENTS.md

## Este repo tiene dos partes

1. **El código completo de Plane** (`apps/`, `packages/`, etc.) — vendorizado desde
   `makeplane/plane` (fork real, historial de git completo, remote `upstream`). Se edita como
   cualquier monorepo de Plane normal, ver sección "Plane monorepo" más abajo.
2. **Nuestro overlay** (`templates/`, `theme/`, `scripts/`, `migrations/`, `Dockerfile`) — capa
   de personalización de Grupo Romboc / Catar BI: emails en español, tema visual, parches
   puntuales de build (verificados, fallan el build si Plane cambia algo). Ver detalle en
   `README.md`.

El `Dockerfile` de la raíz sigue las dos vías según la feature: cosas que caben en un parche
puntual (verificado, `grep`+`sed`) siguen así; features que necesitan componentes/páginas
NUEVAS de verdad (ej. el time tracker) se construyen desde el código fuente de este mismo repo.

## Reglas de trabajo (overlay)

1. Si se actualiza la versión base sin tocar código fuente, cambiar `ARG PLANE_VERSION` en el
   `Dockerfile`.
2. Los cambios de idioma deben conservar el estilo del producto original y respetar los textos
   ya existentes.
3. El tema se inyecta concatenado al CSS final generado por la app, no como un `<link>` separado
   (romper esto rompe la hidratación de React — ya pasó una vez, ver commit `5b1e283`).
4. Cualquier parche que toque código fuente de Plane (`scripts/patch_*.py`) debe ser idempotente
   y fallar el build con un error claro si el texto/línea que busca ya no existe.
5. Para traer actualizaciones de Plane: `git fetch upstream && git merge upstream/<tag>` (no
   reescribir su historial).

## Validación recomendada (overlay)

- `docker build .`
- comprobar que los scripts de parche no fallen por cambios de Plane
- confirmar que el CSS del tema queda aplicado en la salida final

## Contexto de despliegue

Imagen Docker autocontenida — corre en Railway o cualquier VPS con Docker. Las credenciales y
secretos reales no viven en este repositorio, van como variables de entorno del host.

---

## Plane monorepo (código fuente vendorizado)

### Commands

- `pnpm dev` - Start all dev servers (web:3000, admin:3001)
- `pnpm build` - Build all packages and apps
- `pnpm check` - Run all checks (format, lint, types)
- `pnpm check:lint` - OxLint across all packages
- `pnpm check:types` - TypeScript type checking
- `pnpm fix` - Auto-fix format and lint issues
- `pnpm turbo run <command> --filter=<package>` - Target specific package/app
- `pnpm --filter=@plane/ui storybook` - Start Storybook on port 6006

### Code Style

- **Imports**: Use `workspace:*` for internal packages, `catalog:` for external deps
- **TypeScript**: Strict mode enabled, all files must be typed
- **Formatting**: oxfmt, run `pnpm fix:format`
- **Linting**: OxLint with shared `.oxlintrc.json` config
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Use try-catch with proper error types, log errors appropriately
- **State Management**: MobX stores in `packages/shared-state`, reactive patterns
- **Testing**: All features require unit tests, use existing test framework per package
- **Components**: Build in `@plane/ui` with Storybook for isolated development

### Backend tests (Docker)

The Django/pytest suite for `apps/api` runs in an isolated stack defined by `docker-compose-test.yml` at the repo root.

Prereq (once): `./setup.sh` — generates `apps/api/.env` from `.env.example`.

- Full suite: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`
- Subset: `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`
- Teardown: `docker compose -f docker-compose-test.yml down -v`

See `apps/api/tests/RUNNING_TESTS.md` for the full walkthrough and troubleshooting; see `apps/api/tests/TESTING_GUIDE.md` for test conventions and fixtures.
