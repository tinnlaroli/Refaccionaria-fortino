# Base de datos — Refaccionaria Fortino

**Rama:** `feat/bd`

PostgreSQL + Drizzle: esquema, migraciones, seeds.

## Setup

``bash
git checkout feat/bd
cp .env.example .env
npm install
npm run build
npm run migrate
npm run seed
``

Variable requerida: `DATABASE_URL` (PostgreSQL).

## Credenciales seed

- Admin: `admin@fortino.local` / `admin123`
- Cajero: `cajero@fortino.local` / `cajero123`
