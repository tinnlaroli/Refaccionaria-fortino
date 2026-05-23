# Refaccionaria Fortino

Sistema POS + inventario offline-first para refaccionaria (Veracruz).

## Cómo trabajamos

**Una rama = un módulo.** No hay código de aplicación en `main`, solo documentación y guías.

| Rama | Módulo | Qué contiene |
|------|--------|----------------|
| `feat/bd` | Base de datos | PostgreSQL, Drizzle, migraciones, seeds |
| `feat/api` | Backend | Express (JavaScript), auth, CRUD, sync |
| `feat/ux` | POS | React PWA, Dexie, mostrador |
| `feat/landing` | Sitio público | React, catálogo y contacto |

La integración (Docker unificado, gateway, monorepo) se hará **al final**, cuando cada módulo esté estable.

## Cambiar de módulo

```powershell
git checkout feat/api      # solo backend
git checkout feat/ux       # solo POS
git checkout feat/landing  # solo landing
git checkout feat/bd       # solo base de datos
git checkout main          # solo docs
```

O con el script:

```powershell
powershell -File scripts/checkout-module.ps1 -Module api
```

## Orden sugerido

1. `feat/bd` — esquema y seeds
2. `feat/api` — API contra esa BD
3. `feat/ux` — POS contra la API
4. `feat/landing` — sitio público
5. Integración en `main` (más adelante)

## Documentación

- [plan.md](plan.md) — fases y criterios de aceptación
- [.agents/skills/](.agents/skills/) — skills para el agente (UI, sync, Drizzle, etc.)

## Repositorio

https://github.com/tinnlaroli/Refaccionaria-fortino
