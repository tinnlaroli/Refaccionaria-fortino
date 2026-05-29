---
name: refaccionaria-offline-sync
description: >-
  Offline-first sync patterns for Refaccionaria Fortino using IndexedDB, Dexie,
  Service Workers, and /sync/pull|push endpoints. Use when implementing offline
  sales, transaction queues, price snapshots, or conflict reconciliation.
---

# Refaccionaria — Offline Sync

## Arquitectura local (Dexie / IndexedDB)

Dos áreas lógicas en IndexedDB:

1. **Catálogo en caché (lectura):** réplica local de productos para búsqueda instantánea con pistola.
2. **Cola de transacciones (escritura):** FIFO de ventas y movimientos de caja cuando no hay red.

## Flujo por estado de red

### Online
1. Buscar producto en caché local (velocidad).
2. Al cobrar, enviar transacción al backend.
3. PostgreSQL procesa snapshot, resta stock, confirma.
4. Actualizar caché local si hubo cambios.

### Offline
1. Service Worker detecta pérdida de conexión → modo local.
2. Ventas se empaquetan en JSON con **precio histórico (snapshot)** y timestamp exacto.
3. Guardar en cola FIFO de IndexedDB.
4. UI no se bloquea; empleado sigue vendiendo.

### Reconciliación (reconexión)
1. Aviso UI: "Sincronizando".
2. **Pull:** `GET /api/sync/pull` — cambios de catálogo/precios del administrador.
3. **Push:** `POST /api/sync/push` — vaciar cola FIFO en orden estricto.
4. **Conflictos:** backend compara timestamps; acepta ventas con snapshot; anomalías insolubles → `logs_auditoria`.

## Patrón Snapshot (integridad financiera)

Cada línea de venta debe persistir:
- `product_id`, `sku`, `unit_price`, `quantity`, `cost_at_sale` (opcional)
- `sold_at` (timestamp del cliente, preservado)
- `cashier_id`, `shift_id`

Nunca recalcular precio retroactivamente desde catálogo actual.

## Endpoints de sincronización

```
GET  /api/sync/pull?since=<cursor>
POST /api/sync/push  { transactions: [...] }
```

Push debe ser idempotente (client-generated UUID por transacción).

## Service Worker

- Cachear assets estáticos (HTML, CSS, JS, fuentes).
- Interceptar peticiones; degradar gracefully offline.
- Disparar sync al evento `online`.

## Reglas de implementación

- Cola FIFO estricta; no reordenar transacciones offline.
- Bloquear edición de catálogo local excepto merge desde pull.
- Mostrar indicador de conexión y contador de pendientes en cola.
- Transacciones ACID en backend al procesar push.
