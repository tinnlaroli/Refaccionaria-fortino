---
name: refaccionaria-git-workflow
description: >-
  Git branch conventions and scope boundaries for Refaccionaria Fortino monorepo.
  Use when creating branches, opening PRs, or deciding which app/package to modify.
---

# Refaccionaria — Git Workflow

## Rama principal

- `main` — integración: Docker, gateway, docs. Ejecutar `npm run docker:up` solo desde main.

## Ramas de feature (prefijo `feat/`)

| Rama | Carpeta | Scope |
|------|---------|-------|
| `feat/bd` | `packages/db/` | Esquema PostgreSQL, migraciones Drizzle, seeds |
| `feat/api` | `apps/api/` | Auth JWT, RBAC, sync, ventas, caja, auditoría |
| `feat/ux` | `apps/pos/` | PWA POS: Dexie, Service Worker, UI |
| `feat/landing` | `apps/landing/` | Sitio público / marketing |

## Reglas

1. Una rama = un dominio. No mezclar API y UX en el mismo PR.
2. Cambios en `docker-compose.yml` o `docker/` → PR a `main`.
3. Tras merge a `main`, ejecutar `npm run sync:branches`.
4. Commits: prefijo convencional (`feat:`, `fix:`, `chore:`, `docs:`).
5. No force-push a `main`.

## Cambiar de módulo

```powershell
powershell -File scripts/checkout-module.ps1 -Module api
powershell -File scripts/checkout-module.ps1 -Module pos
powershell -File scripts/checkout-module.ps1 -Module landing
powershell -File scripts/checkout-module.ps1 -Module bd
```

## Worktrees paralelos (opcional)

```powershell
powershell -File scripts/setup-worktrees.ps1
```

## Docker

Solo la raíz (`main`) orquesta el stack: `npm run docker:up` → http://localhost:8080
