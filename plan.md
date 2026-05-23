# Plan de implementación — Refaccionaria Fortino

Documento maestro de implementación técnica derivado del Product Blueprint. Define fases, módulos, decisiones arquitectónicas y criterios de aceptación.

---

## 1. Visión y objetivos

Desarrollar un sistema POS + inventario **escalable** y **offline-first** para una refaccionaria en Veracruz. El sistema debe:

- Gestionar catálogo de piezas (repuestos, aceites, etc.) con SKU, precios y stock.
- Procesar ventas ágilmente vía pistola lectora de códigos de barras.
- Administrar flujo de caja con apertura/cierre de turnos.
- Operar **sin interrupciones** cuando falle internet, sincronizando al reconectar.

**Usuarios objetivo:** empleados de mostrador (operación diaria) y administrador (configuración, reportes, empleados).

---

## 2. Decisiones arquitectónicas

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Backend | **Node.js + Express + TypeScript** | Ecosistema unificado con frontend; tipado compartido |
| ORM | **Drizzle** | Type-safe, migraciones ligeras, buen fit con PostgreSQL |
| Offline | **IndexedDB + Dexie.js** | API Promise-based, índices para búsqueda por SKU |
| Sync | **Pull/Push REST** | Simplicidad; cola FIFO en cliente |
| Precios | **Patrón Snapshot** | Integridad de caja si precios cambian offline |
| Auth | **JWT** con caché local | Login tolerante a fallos de red |
| Deploy | **Docker Compose** | PostgreSQL + API + PWA estática en VPS |

---

## 3. Módulos y mapeo a ramas

```mermaid
flowchart TB
    subgraph branches [Ramas feat]
        bd[feat/bd]
        api[feat/api]
        ux[feat/ux]
        landing[feat/landing]
    end
    subgraph packages [Monorepo]
        dbPkg[packages/db]
        apiApp[apps/api]
        posApp[apps/pos]
        landApp[apps/landing]
    end
    bd --> dbPkg
    api --> apiApp
    ux --> posApp
    landing --> landApp
    dbPkg --> apiApp
    apiApp --> posApp
    apiApp --> landApp
```

| Módulo | Rama | Entregables principales |
|--------|------|-------------------------|
| Base de datos | `feat/bd` | Esquema, migraciones, seeds, índices |
| API backend | `feat/api` | Auth, RBAC, sync, ventas, caja, auditoría |
| PWA POS | `feat/ux` | Dexie, SW, UI mostrador/inventario/caja |
| Landing | `feat/landing` | Sitio público / marketing |

---

## 4. Fases de desarrollo

### Fase 0 — Setup (completada)

- [x] Repositorio clonado y conectado a GitHub
- [x] README, plan.md, agent skills (`.agents/skills/`)
- [x] Stubs de detección de stack (`package.json`, `tsconfig.json`, etc.)
- [x] Ramas `feat/*` creadas
- [x] `docker-compose.yml` con PostgreSQL 16

### Fase 1 — Base de datos (`feat/bd`)

**Objetivo:** esquema relacional completo en PostgreSQL.

Entregables:
- [ ] Proyecto Drizzle en `packages/db/`
- [ ] Tablas: `users`, `roles`, `permissions`, `role_permissions`, `products`, `categories`, `product_images`, `sales`, `sale_items`, `cash_shifts`, `cash_movements`, `audit_logs`, `sync_cursors`
- [ ] Migraciones versionadas
- [ ] Seeds: admin inicial, categorías base, productos de prueba
- [ ] Índices: `products.sku`, `sales.sold_at`, `audit_logs.created_at`

Criterios de aceptación:
- `docker compose up -d && npm run db:migrate` crea esquema sin errores
- Seeds insertan datos reproducibles

### Fase 2 — API backend (`feat/api`)

**Objetivo:** API REST stateless con auth, RBAC y sincronización.

Entregables:
- [ ] Proyecto Express + TypeScript en `apps/api/`
- [ ] Auth: login, refresh, logout; JWT con claims de rol/permisos
- [ ] RBAC middleware granular
- [ ] CRUD productos, categorías, usuarios (solo admin)
- [ ] Endpoints ventas con snapshot de precios
- [ ] Endpoints caja: turnos, movimientos, corte
- [ ] `GET /api/sync/pull` y `POST /api/sync/push`
- [ ] Tabla `audit_logs` inmutable
- [ ] OpenAPI / Swagger docs

Criterios de aceptación:
- Venta online resta stock en transacción ACID
- Push offline procesa cola FIFO idempotente
- Permisos bloquean acciones no autorizadas (403)

### Fase 3 — PWA POS (`feat/ux`)

**Objetivo:** interfaz de mostrador offline-first.

Entregables:
- [ ] Proyecto React + Vite PWA en `apps/pos/`
- [ ] Service Worker: cache estático + detección offline
- [ ] Dexie: stores `products`, `transactionQueue`, `authCache`
- [ ] Pantalla mostrador (70/30 layout)
- [ ] Escaneo barcode + búsqueda predictiva
- [ ] Modal de cobro (glassmorphism)
- [ ] Pantalla inventario (tabla alta densidad)
- [ ] Pantalla caja (turnos, ingresos/egresos)
- [ ] Banner conexión + sincronización
- [ ] Dark/Light mode (Montserrat + Inter)

Criterios de aceptación:
- Venta completa funciona con DevTools offline
- Cola se vacía al reconectar sin pérdida de datos
- Snapshot preserva precio original tras sync

### Fase 4 — Landing (`feat/landing`)

**Objetivo:** presencia web pública de la refaccionaria.

Entregables:
- [ ] Proyecto React/Vite en `apps/landing/`
- [ ] Páginas: inicio, catálogo público (opcional), contacto/ubicación
- [ ] SEO básico, responsive, accesible
- [ ] Mismo design system (tipografías, temas)

Criterios de aceptación:
- Lighthouse Performance > 90 en mobile
- Información de contacto y ubicación visibles

### Fase 5 — Integración y producción

**Objetivo:** sistema desplegable en VPS.

Entregables:
- [ ] Dockerfile multi-stage para API
- [ ] Docker Compose producción (API + PostgreSQL + nginx para PWA)
- [ ] Variables de entorno documentadas (`.env.example`)
- [ ] Reportes PDF/Excel (caja e inventario)
- [ ] CI básico: lint + typecheck + tests

Criterios de aceptación:
- `docker compose -f docker-compose.prod.yml up` levanta stack completo
- Reporte de corte de caja exportable

---

## 5. Modelo de datos (borrador conceptual)

```mermaid
erDiagram
    users ||--o{ sales : creates
    users ||--o{ cash_shifts : opens
    roles ||--o{ users : assigns
    roles ||--o{ role_permissions : has
    permissions ||--o{ role_permissions : grants
    categories ||--o{ products : contains
    products ||--o{ product_images : has
    products ||--o{ sale_items : sold_in
    sales ||--|{ sale_items : contains
    cash_shifts ||--o{ cash_movements : records
    users ||--o{ audit_logs : triggers

    products {
        uuid id PK
        string sku UK
        string name
        decimal purchase_price
        decimal sale_price
        int stock
        int min_stock
        uuid category_id FK
        timestamp updated_at
    }

    sales {
        uuid id PK
        uuid client_uuid UK
        uuid cashier_id FK
        uuid shift_id FK
        decimal total
        timestamp sold_at
        string sync_status
    }

    sale_items {
        uuid id PK
        uuid sale_id FK
        uuid product_id FK
        string sku
        decimal unit_price
        int quantity
    }
```

**Notas:**
- `sales.client_uuid` — UUID generado en cliente para idempotencia de push.
- `sale_items.unit_price` — snapshot; nunca recalcular desde catálogo.
- `audit_logs` — append-only; sin UPDATE/DELETE.

---

## 6. Protocolo de sincronización

```mermaid
sequenceDiagram
    participant POS as PWA_POS
    participant IDB as IndexedDB_Dexie
    participant SW as ServiceWorker
    participant API as Node_API
    participant PG as PostgreSQL

    Note over POS,PG: Modo offline
    POS->>IDB: Venta con snapshot precio
    POS->>IDB: Encolar en transactionQueue FIFO

    Note over POS,PG: Reconexión
    SW->>POS: Evento online
    POS->>POS: UI Sincronizando
    POS->>API: GET /api/sync/pull?since=cursor
    API->>PG: Cambios desde cursor
    PG-->>API: Productos/precios actualizados
    API-->>POS: Delta catálogo
    POS->>IDB: Merge catálogo local
    POS->>API: POST /api/sync/push transactions
    API->>PG: Transacción ACID por lote
    PG-->>API: Confirmación + conflictos
    API-->>POS: Resultados por client_uuid
    POS->>IDB: Marcar sincronizados / reintentar fallidos
```

### Resolución de conflictos

| Escenario | Resolución |
|-----------|------------|
| Venta offline con snapshot | Aceptar; precio del snapshot prevalece |
| Stock insuficiente al push | Registrar en `audit_logs`; marcar venta como `conflict` |
| Producto eliminado/desactivado | Venta aceptada si existía al `sold_at` |
| Duplicado (mismo `client_uuid`) | Ignorar (idempotente) |

---

## 7. RBAC y permisos granulares

### Roles base (seed)

| Rol | Descripción |
|-----|-------------|
| `admin` | Acceso total; gestión de empleados y roles |
| `cashier` | POS, caja, consulta inventario |
| `viewer` | Solo lectura de inventario y reportes |

### Permisos granulares (ejemplos)

- `products.view`, `products.create`, `products.edit`, `products.view_costs`
- `sales.create`, `sales.cancel`, `sales.view_all`
- `cash.open_shift`, `cash.close_shift`, `cash.register_movement`
- `reports.export`, `users.manage`, `roles.manage`

El administrador crea roles custom seleccionando permisos casilla por casilla.

---

## 8. UI/UX system

| Elemento | Especificación |
|----------|----------------|
| Títulos / branding | Montserrat |
| Tablas / SKUs / finanzas | Inter |
| Temas | Dark (grises oscuros) + Light (blancos humo) obligatorios |
| Glassmorphism | Solo modales de cobro y alertas de conexión |
| Layout mostrador | 70% carrito / 30% totalizador |
| Layout inventario | Tabla alta densidad + miniaturas lazy |

Ver skill `.agents/skills/refaccionaria-ui-system/SKILL.md` para detalle.

---

## 9. Criterios de aceptación globales

- [ ] Sistema opera 8+ horas offline sin pérdida de ventas
- [ ] Reconciliación completa en < 30s para 100 transacciones pendientes
- [ ] Corte de caja cuadra ventas del sistema vs efectivo declarado
- [ ] Cambio de precio online no altera ventas ya cobradas offline
- [ ] Toda acción crítica genera entrada en `audit_logs`
- [ ] Empleado desactivado no puede iniciar sesión (online ni offline cache expirado)

---

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Conflictos de stock offline | Ventas que exceden inventario real | Snapshot + audit log + revisión manual |
| Corrupción de cola IndexedDB | Pérdida de ventas | Backup periódico local; UUID idempotente |
| Token JWT expirado offline | Bloqueo de operación | Refresh token en caché; grace period |
| Cambio masivo de precios durante offline | Descuadre aparente | Snapshot por línea; reporte post-sync |
| Saturación RAM por imágenes | Lentitud en mostrador | Lazy loading; thumbnails; priorizar texto |

---

## Referencias

- [README.md](README.md) — overview y setup
- [.agents/skills/](.agents/skills/) — agent skills del proyecto
- [Repositorio GitHub](https://github.com/tinnlaroli/Refaccionaria-fortino)
