# Refaccionaria Fortino

Sistema de **Punto de Venta (POS)** y **Gestión de Inventario** offline-first para una refaccionaria en Veracruz, México.

> **Estado actual:** Fase 0 — monorepo con Docker unificado. Scaffolds mínimos en cada módulo; desarrollo funcional pendiente (Fase 1+).

## Levantar todo con un solo comando

Desde la **raíz** (rama `main`):

```bash
npm run docker:up
```

Esto construye y levanta **todos** los servicios:

| Servicio | Contenedor | Descripción |
|----------|------------|-------------|
| **Gateway** | `refaccionaria-gateway` | Punto de entrada único en **http://localhost:8080** |
| **Landing** | `refaccionaria-landing` | Sitio público → `/` |
| **POS** | `refaccionaria-pos` | Punto de venta → `/pos/` |
| **API** | `refaccionaria-api` | Backend → `/api/*` y `/health` |
| **PostgreSQL** | `refaccionaria-postgres` | Base de datos (solo red interna) |

### URLs de prueba

| URL | Qué verás |
|-----|-----------|
| http://localhost:8080/ | Landing (feat/landing) |
| http://localhost:8080/pos/ | POS scaffold (feat/ux) |
| http://localhost:8080/api/info | Info de la API |
| http://localhost:8080/api/status | Estado API + conexión BD |
| http://localhost:8080/health | Health check API |

```bash
npm run docker:logs    # ver logs
npm run docker:down    # detener todo
```

## Estructura del monorepo

```
Refaccionaria/                 ← rama main (Docker + orquestación)
├── docker-compose.yml         ← levanta TODO
├── docker/
│   ├── nginx/nginx.conf       ← gateway :8080
│   └── postgres/init.sql      ← init BD
├── apps/
│   ├── api/                   ← rama feat/api
│   ├── pos/                   ← rama feat/ux
│   └── landing/               ← rama feat/landing
├── packages/
│   └── db/                    ← rama feat/bd
├── scripts/
│   ├── checkout-module.ps1    ← cambiar a rama de un módulo
│   ├── setup-worktrees.ps1    ← worktrees paralelos (opcional)
│   └── sync-branches.ps1      ← merge main → feat/*
└── .agents/skills/
```

Cada carpeta de módulo incluye un `BRANCH.md` con su rama asignada.

## Ramas y carpetas

| Carpeta | Rama | Responsabilidad |
|---------|------|-----------------|
| `apps/api/` | `feat/api` | API Node.js (Express + TypeScript) |
| `apps/pos/` | `feat/ux` | PWA POS offline-first |
| `apps/landing/` | `feat/landing` | Sitio público |
| `packages/db/` | `feat/bd` | PostgreSQL, Drizzle, migraciones |
| **Raíz** | `main` | Docker, docs, orquestación, integración |

### Trabajar en un módulo

```powershell
# Cambiar a la rama del módulo que vas a editar
powershell -File scripts/checkout-module.ps1 -Module api
# Edita solo apps/api/

powershell -File scripts/checkout-module.ps1 -Module pos
# Edita apps/pos/ en feat/ux
```

Cuando termines, merge a `main` y sincroniza ramas:

```bash
git checkout main
git merge feat/api
npm run sync:branches
```

### Desarrollo paralelo (opcional)

Para tener **varias ramas abiertas a la vez** dentro del repo:

```powershell
powershell -File scripts/setup-worktrees.ps1
```

Crea `worktrees/api`, `worktrees/pos`, etc. — cada uno en su rama. Docker siempre se ejecuta desde la **raíz en main**.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend POS | React + Vite (PWA) |
| Offline local | IndexedDB (Dexie.js) — Fase 3 |
| Backend | Node.js (Express + TypeScript) |
| BD | PostgreSQL 16 + Drizzle ORM |
| Deploy | Docker Compose |

## Requisitos

- **Docker Desktop** (o Docker Engine + Compose)
- **Node.js** >= 22 (desarrollo local sin Docker)
- **Git**

## Desarrollo local (sin Docker)

```bash
# Terminal 1 — BD
docker compose up postgres -d

# Terminal 2 — API
cd apps/api && npm install && npm run dev

# Terminal 3 — POS
cd apps/pos && npm install && npm run dev
```

## Agent skills

Skills en [`.agents/skills/`](.agents/skills/) para Cursor. Instalar/actualizar:

```bash
npx autoskills -a cursor -y
```

## Documentación

- [plan.md](plan.md) — roadmap por fases
- [GitHub](https://github.com/tinnlaroli/Refaccionaria-fortino)
