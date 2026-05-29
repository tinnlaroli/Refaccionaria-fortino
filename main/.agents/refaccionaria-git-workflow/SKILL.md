---
name: refaccionaria-git-workflow
description: >-
  Git branch conventions for Refaccionaria Fortino. Use when creating branches,
  opening PRs, or deciding which module to modify.
---

# Refaccionaria — Git Workflow

## Rama principal

- `main` — **solo documentación** (README, plan, skills). Sin `apps/`, sin Docker unificado, sin `package.json` en raíz.

## Ramas de feature (prefijo `feat/`)

| Rama | Contenido en la raíz del repo |
|------|------------------------------|
| `feat/bd` | Paquete Drizzle + PostgreSQL |
| `feat/api` | API Express (JavaScript) |
| `feat/ux` | PWA POS (React + Vite) |
| `feat/landing` | Sitio público (React + Vite) |

## Reglas

1. Una rama = un módulo. No mezclar API y POS en el mismo commit.
2. No añadir Docker/orquestación en `main` hasta la fase de integración final.
3. Commits: prefijo convencional (`feat:`, `fix:`, `chore:`, `docs:`).
4. No force-push a `main`.
5. La API en `feat/api` puede incluir carpeta `db/` local (`file:./db`) solo para desarrollo en esa rama.

## Cambiar de módulo

```powershell
powershell -File scripts/checkout-module.ps1 -Module api
```

## Integración (futuro)

Cuando los módulos estén listos, se unificarán en `main` (monorepo + Docker). Hasta entonces, desarrollar y probar cada rama por separado.
