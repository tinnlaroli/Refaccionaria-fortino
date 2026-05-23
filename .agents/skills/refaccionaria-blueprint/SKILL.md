---
name: refaccionaria-blueprint
description: >-
  Domain rules for Refaccionaria Fortino POS and inventory system in Veracruz.
  Use when implementing business logic, modules, RBAC, catalog, sales, cash flow,
  or when the user references the Product Blueprint or refaccionaria requirements.
---

# Refaccionaria Fortino — Product Blueprint

## Objetivo

Sistema POS + inventario **offline-first** para refaccionaria (repuestos, aceites, etc.). Control interno: catálogo, ventas con código de barras, flujo de caja. Continuidad operativa total sin internet; sincronización automática al reconectar.

## Stack confirmado

| Capa | Tecnología |
|------|------------|
| Frontend POS | React + Vite (PWA) |
| Offline local | IndexedDB vía Dexie.js |
| Backend | Node.js (Express + TypeScript) |
| BD | PostgreSQL |
| Deploy | Docker |

## Módulos funcionales

### Autenticación y RBAC
- Login tolerante a fallos (tokens en caché para abrir turno offline).
- Solo Administrador da de alta o **desactiva** empleados (nunca eliminar).
- Roles personalizados con permisos granulares casilla por casilla.

### Punto de venta
- Búsqueda ultra rápida: pistola lectora (SKU) + búsqueda manual predictiva.
- Cobro ágil con totales/subtotales; tickets físicos **no** obligatorios.

### Inventario y catálogo
- CRUD: SKU, precios compra/venta, categoría, stock.
- Imágenes de piezas para identificación visual.
- Alertas cuando stock cruza umbral mínimo.

### Finanzas y caja
- Ingresos extra y egresos diarios (gastos operativos) manuales.
- Apertura/cierre de turnos; contraste ventas vs efectivo declarado.
- Reportes PDF/Excel para administrador.

## Reglas no funcionales críticas

1. **Offline-first:** cola FIFO en IndexedDB; push al reconectar.
2. **Snapshot de precios:** cada venta guarda precio exacto al cobro.
3. **Auditoría inmutable:** log de acciones críticas (cambio de precio, desactivación, etc.).
4. **Lazy loading** de imágenes; priorizar velocidad de texto/SKU.
5. **Modularidad** para crecer (ej. IA predictiva futura).

## Monorepo planificado

```
apps/pos/       → feat/ux
apps/landing/   → feat/landing
apps/api/       → feat/api
packages/db/    → feat/bd
```

## Fuente de verdad

PostgreSQL es la única fuente de verdad central. IndexedDB es réplica local + cola de escritura.
