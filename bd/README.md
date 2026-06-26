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

## Biblioteca demo de imágenes

El seed carga **10 fotos genéricas** de [Wikimedia Commons](https://commons.wikimedia.org/) en `media_assets` y las asigna a los productos demo (aceite, filtro, pastillas).

- Archivos: `seed/media/*.jpg`
- Manifiesto y licencias: `seed/media/manifest.json`, `seed/media/ATTRIBUTIONS.md`
- Regenerar binarios: `npm run fetch:stock-media` (requiere red; respeta rate limits de Wikimedia)
