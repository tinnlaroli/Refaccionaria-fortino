---
name: refaccionaria-git-workflow
description: >-
  Git branch conventions and scope boundaries for Refaccionaria Fortino monorepo.
  Use when creating branches, opening PRs, or deciding which app/package to modify.
---

# Refaccionaria — Git Workflow

## Rama principal

- `main` — estable; solo merges vía PR revisados.

## Ramas de feature (prefijo `feat/`)

| Rama | Scope | Directorio |
|------|-------|------------|
| `feat/bd` | Esquema PostgreSQL, migraciones Drizzle, seeds, índices | `packages/db/` |
| `feat/api` | API Node.js: auth JWT, RBAC, sync, ventas, caja, auditoría | `apps/api/` |
| `feat/ux` | PWA POS: Dexie, Service Worker, UI mostrador/inventario/caja | `apps/pos/` |
| `feat/landing` | Sitio público / marketing | `apps/landing/` |

## Reglas

1. Una rama = un dominio. No mezclar cambios de API y UX en el mismo PR.
2. Cambios compartidos (tipos, contratos API) van en `packages/` y se coordinan entre ramas.
3. Commits: prefijo convencional (`feat:`, `fix:`, `chore:`, `docs:`).
4. PR hacia `main` requiere descripción de módulo afectado y plan de prueba.
5. No force-push a `main`.

## Orden de dependencias sugerido

```
feat/bd  →  feat/api  →  feat/ux
                ↘
              feat/landing (paralelo, depende mínimo de API pública)
```

## Setup local por rama

```bash
git checkout feat/api    # trabajo backend
git checkout feat/ux     # trabajo frontend POS
git checkout feat/bd     # trabajo base de datos
git checkout feat/landing
```

## Archivos compartidos (cualquier rama)

- `README.md`, `plan.md` — documentación raíz
- `.agents/skills/` — agent skills del proyecto
- `docker-compose.yml` — infra local
- `package.json` raíz — workspaces

Coordinar cambios en raíz en PRs pequeños o desde `main` directamente.
