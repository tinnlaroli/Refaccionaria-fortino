# API — Refaccionaria Fortino

**Rama:** `feat/api`

Backend Express en **JavaScript**: auth JWT, RBAC, productos, ventas, caja, sync y endpoints públicos.

Incluye una copia local de `@refaccionaria/db` en `db/` (misma fuente que la rama `feat/bd`).

## Setup

```bash
git checkout feat/api
cp .env.example .env
npm install
npm run dev
```

La API escucha en `http://localhost:3000`.

## Base de datos

Necesitas PostgreSQL con el esquema aplicado. Opciones:

1. **Rama `feat/bd`:** levanta Postgres, corre migraciones y seeds allí.
2. **Desde esta rama:** `npm run migrate --prefix db` y `npm run seed --prefix db` (con `DATABASE_URL` en `.env`).

## Credenciales seed

- Admin: `admin@fortino.local` / `admin123`
- Cajero: `cajero@fortino.local` / `cajero123`

## Endpoints principales

| Ruta | Descripción |
|------|-------------|
| `GET /health` | Health check |
| `POST /api/auth/login` | Login |
| `GET /api/products` | Catálogo (auth) |
| `POST /api/sales` | Crear venta |
| `GET /api/public/products` | Catálogo público |

## Docker (standalone)

```bash
docker build -t refaccionaria-api .
docker run -p 3000:3000 --env-file .env refaccionaria-api
```
