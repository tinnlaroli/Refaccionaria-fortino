---
name: refaccionaria-ui-system
description: >-
  UI/UX design system for Refaccionaria Fortino POS. Use when building interfaces,
  themes, typography, layouts, modals, or when the user mentions Montserrat, Inter,
  dark mode, glassmorphism, or mostrador/inventario screens.
---

# Refaccionaria — UI/UX System

## Estilo visual

- Minimalista y cinemático.
- Inputs sin bordes pesados; usar **focus rings**.
- Alta densidad de datos sin fatiga visual.

## Tipografía dual

| Uso | Fuente |
|-----|--------|
| Títulos, encabezados, branding | **Montserrat** |
| Tablas, SKUs, datos financieros | **Inter** |

Cargar vía Google Fonts o self-host en PWA.

## Tematización obligatoria

### Dark Mode
- Grises oscuros (no negros puros `#000`).
- Contraste suficiente para lectura prolongada en mostrador.

### Light Mode
- Blancos humo, sombras suaves.
- Misma jerarquía visual que dark.

Implementar con CSS variables + `prefers-color-scheme` + toggle manual persistente.

## Glassmorfismo táctico

Usar desenfoque y fondos translúcidos **solo** en:
- Modales de cobro
- Alertas de pérdida/retorno de conexión

No aplicar glassmorphism en tablas ni listas de productos (legibilidad > estética).

## Layouts

### Mostrador (POS)
- Pantalla dividida: **70%** lista de compra / **30%** panel totalizador de cobro.
- Input de búsqueda/escaneo siempre visible y con foco por defecto.
- Atajos de teclado para cobro y limpiar carrito.

### Inventario
- Tablas de alta densidad con miniaturas sutiles.
- Lazy loading de imágenes (`loading="lazy"`, placeholders).
- Priorizar renderizado de texto/SKU antes que imágenes.

## Componentes clave

- `ConnectionBanner` — estado online/offline/sincronizando
- `CartPanel` — líneas, subtotal, total, acciones de cobro
- `ProductSearch` — barcode + búsqueda predictiva
- `CashShiftModal` — apertura/cierre de turno
- `StockAlertBadge` — umbral mínimo

## Accesibilidad

- Focus visible en todos los controles interactivos.
- Contraste WCAG AA mínimo en tablas financieras.
- No depender solo de color para estados (usar iconos/texto).

## Referencia de colores (CSS variables sugeridas)

```css
:root {
  --bg-primary: #f5f5f4;
  --bg-surface: #ffffff;
  --text-primary: #1c1917;
  --accent: #2563eb;
  --danger: #dc2626;
  --success: #16a34a;
}

[data-theme="dark"] {
  --bg-primary: #1c1917;
  --bg-surface: #292524;
  --text-primary: #fafaf9;
}
```

Ajustar en implementación; mantener consistencia entre módulos POS e inventario.
