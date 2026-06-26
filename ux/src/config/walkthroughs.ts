export type WalkthroughStep = {
  title: string;
  body: string;
};

export type ModuleWalkthrough = {
  id: string;
  title: string;
  summary: string;
  steps: WalkthroughStep[];
};

export const MODULE_WALKTHROUGHS: Record<string, ModuleWalkthrough> = {
  "/login": {
    id: "login",
    title: "Iniciar sesión",
    summary: "Accede al mostrador o al panel administrativo según tu rol.",
    steps: [
      {
        title: "Credenciales",
        body: "Usa el correo y contraseña que te asignó el administrador. Si olvidaste la contraseña, pide un restablecimiento.",
      },
      {
        title: "Destino según rol",
        body: "Los cajeros entran al mostrador para cobrar. Los administradores van al panel de control con métricas y catálogo.",
      },
      {
        title: "Tema y accesibilidad",
        body: "Arriba a la derecha puedes cambiar entre tema claro y oscuro. El sistema recuerda tu preferencia.",
      },
    ],
  },
  "/app": {
    id: "dashboard",
    title: "Panel de control",
    summary: "Tu centro de mando diario: métricas, alertas y accesos rápidos.",
    steps: [
      {
        title: "Resumen del día",
        body: "Arriba verás la fecha, tu rol y un acceso directo al mostrador para cobrar ventas.",
      },
      {
        title: "Indicadores clave",
        body: "Las tarjetas muestran ventas del día, productos activos, alertas de stock y turnos abiertos según tus permisos.",
      },
      {
        title: "Accesos rápidos",
        body: "Desde aquí puedes crear productos, ajustar inventario o revisar ventas sin navegar por el menú.",
      },
      {
        title: "Gráficas y alertas",
        body: "Las gráficas resumen la tendencia de ventas y la salud del inventario. Revisa las tablas inferiores para actuar de inmediato.",
      },
    ],
  },
  "/app/productos": {
    id: "productos",
    title: "Catálogo de productos",
    summary: "Administra piezas, precios, SKU y existencias iniciales.",
    steps: [
      {
        title: "Buscar y filtrar",
        body: "Usa el buscador por SKU o nombre. Activa «Solo stock bajo» para ver piezas que necesitan reabastecimiento.",
      },
      {
        title: "Agregar producto",
        body: "Pulsa «Agregar producto» y completa SKU, nombre, categoría, precios y stock mínimo. El SKU no se puede cambiar después.",
      },
      {
        title: "Editar desde la tabla",
        body: "Haz clic en una fila para editar. Al pasar el mouse verás acciones rápidas como ajustar stock.",
      },
      {
        title: "Validaciones",
        body: "Los campos obligatorios se marcan en rojo si faltan datos o el precio de venta es inválido.",
      },
    ],
  },
  "/app/categorias": {
    id: "categorias",
    title: "Categorías",
    summary: "Organiza el catálogo por tipo de refacción.",
    steps: [
      {
        title: "Crear categoría",
        body: "Indica un nombre claro (ej. Frenos, Filtros). El identificador web se genera automáticamente para URLs internas.",
      },
      {
        title: "Identificador web",
        body: "Es la clave en minúsculas con guiones (ej. filtros-aceite). Solo edítala si sabes cómo afecta enlaces guardados.",
      },
      {
        title: "Editar",
        body: "Haz clic en cualquier fila para modificar nombre o identificador.",
      },
    ],
  },
  "/app/inventario": {
    id: "inventario-admin",
    title: "Inventario",
    summary: "Consulta existencias y ajusta stock con trazabilidad.",
    steps: [
      {
        title: "Filtros de stock",
        body: "Cambia entre «Todos», «Stock bajo» y «Sin stock» para priorizar reabastecimiento.",
      },
      {
        title: "Ajustar existencias",
        body: "Haz clic en una fila o usa el icono al pasar el mouse. Puedes registrar entradas, salidas o fijar cantidad exacta.",
      },
      {
        title: "Motivo del movimiento",
        body: "Siempre indica el motivo (entrada, merma, conteo…). Si eliges «Otro», la nota es obligatoria.",
      },
    ],
  },
  "/app/movimientos": {
    id: "movimientos",
    title: "Historial de movimientos",
    summary: "Auditoría de cambios en inventario y ventas.",
    steps: [
      {
        title: "Filtros",
        body: "Filtra por inventario, ventas o todo el historial según lo que necesites revisar.",
      },
      {
        title: "Detalle de eventos",
        body: "Cada fila muestra quién hizo el cambio, cuándo y qué ocurrió (ajuste de stock, venta, cancelación…).",
      },
      {
        title: "Trazabilidad",
        body: "Usa este módulo para resolver diferencias de caja o investigar ajustes inusuales.",
      },
    ],
  },
  "/app/ventas": {
    id: "ventas",
    title: "Ventas",
    summary: "Consulta, filtra y exporta operaciones de caja.",
    steps: [
      {
        title: "Filtros de fecha y estado",
        body: "Limita por hoy, últimos 7 días o todo. Filtra completadas o canceladas según el corte que necesites.",
      },
      {
        title: "Detalle de venta",
        body: "Haz clic en una fila para ver productos, totales y cajero. Desde ahí puedes cancelar si tienes permiso.",
      },
      {
        title: "Exportar",
        body: "Con permiso de reportes, descarga un PDF del periodo filtrado para contabilidad o respaldo.",
      },
    ],
  },
  "/app/empleados": {
    id: "empleados",
    title: "Empleados",
    summary: "Gestiona personal, roles y accesos al sistema.",
    steps: [
      {
        title: "Agregar empleado",
        body: "Registra nombre, correo, contraseña temporal y rol (administrador o cajero).",
      },
      {
        title: "Roles y permisos",
        body: "El cajero ve mostrador e inventario. El administrador accede a todo el panel y configuración.",
      },
      {
        title: "Desactivar",
        body: "Haz clic en un empleado para ver su detalle. Usa el icono de usuario con menos al pasar el mouse para desactivar acceso.",
      },
    ],
  },
  "/app/marcas": {
    id: "marcas",
    title: "Marcas",
    summary: "Catálogo de fabricantes reutilizable en productos.",
    steps: [
      {
        title: "Crear marca",
        body: "Indica el nombre comercial (ej. Brembo, Bosch). El identificador web se genera para uso interno.",
      },
      {
        title: "Asignar en productos",
        body: "En Productos elige la marca desde el listado; evita escribir texto distinto cada vez.",
      },
      {
        title: "Activar o desactivar",
        body: "Las marcas inactivas no aparecen al crear productos, pero se conservan en el historial.",
      },
    ],
  },
  "/app/proveedores": {
    id: "proveedores",
    title: "Proveedores",
    summary: "Quién te surte refacciones y datos de contacto.",
    steps: [
      {
        title: "Registrar proveedor",
        body: "Captura razón social, contacto, teléfono y correo para localizarlo al registrar compras.",
      },
      {
        title: "Compras",
        body: "Cada entrada de mercancía se liga a un proveedor en el módulo Compras.",
      },
      {
        title: "Editar",
        body: "Haz clic en una fila para actualizar datos o marcar inactivo si ya no surte.",
      },
    ],
  },
  "/app/compras": {
    id: "compras",
    title: "Compras a proveedor",
    summary: "Registra entradas de mercancía y actualiza inventario automáticamente.",
    steps: [
      {
        title: "Nueva compra",
        body: "Elige proveedor, fecha y referencia de factura. Agrega líneas con producto, cantidad y costo unitario.",
      },
      {
        title: "Stock y costo",
        body: "Al confirmar, el stock sube y el precio de compra del producto se actualiza con el último costo.",
      },
      {
        title: "Historial",
        body: "La tabla inferior muestra compras recientes con total y estado.",
      },
    ],
  },
  "/app/imagenes": {
    id: "imagenes",
    title: "Biblioteca de imágenes",
    summary: "Sube y busca fotos para asignarlas a productos.",
    steps: [
      {
        title: "Subir imagen",
        body: "Usa «Subir» para agregar JPG, PNG o WebP (máx. 1.5 MB). Pon nombre y etiquetas para encontrarla después.",
      },
      {
        title: "Buscar",
        body: "Filtra por nombre o etiqueta (ej. frenos, aceite) antes de asignar a un producto.",
      },
      {
        title: "Asignar a producto",
        body: "En Productos → editar → «Elegir de biblioteca». También puedes abrir el selector desde aquí.",
      },
    ],
  },
  "/sincronizacion": {
    id: "sincronizacion",
    title: "Cola de sincronización",
    summary: "Ventas guardadas offline hasta que lleguen al servidor.",
    steps: [
      {
        title: "Pendientes",
        body: "Si no hay red, las ventas se encolan aquí. El badge en la barra inferior muestra cuántas faltan.",
      },
      {
        title: "Sincronizar",
        body: "Con conexión, pulsa «Sincronizar todo» o usa el botón del banner superior.",
      },
      {
        title: "Errores",
        body: "Si una venta falla, revisa el mensaje, reintenta o descarta duplicados.",
      },
    ],
  },
  "/": {
    id: "mostrador",
    title: "Mostrador (POS)",
    summary: "Cobra ventas, busca piezas y arma el ticket.",
    steps: [
      {
        title: "Buscar producto",
        body: "Escribe SKU o nombre y presiona Enter. Usa ↑↓ para elegir entre resultados. Atajo F2 enfoca la búsqueda.",
      },
      {
        title: "Carrito",
        body: "Cada línea muestra precio unitario y total. Ajusta cantidades con +/−. Al llegar al stock máximo se bloquea el incremento.",
      },
      {
        title: "Cobrar",
        body: "Presiona F9 o el botón Cobrar. En efectivo usa montos rápidos (Exacto, $50, $100…) y revisa el cambio antes de confirmar.",
      },
      {
        title: "Turno de caja",
        body: "El indicador en la barra muestra si hay turno abierto. Sin turno, ve a Caja para abrirlo antes de vender.",
      },
      {
        title: "Sin conexión",
        body: "Si no hay internet, la venta se guarda localmente y se sincroniza al reconectar.",
      },
    ],
  },
  "/caja": {
    id: "caja",
    title: "Caja",
    summary: "Abre turno, registra movimientos y cierra con arqueo.",
    steps: [
      {
        title: "Abrir turno",
        body: "Indica el efectivo inicial en caja antes de empezar a vender. Requiere conexión.",
      },
      {
        title: "Movimientos",
        body: "Registra ingresos o egresos manuales (pagos a proveedor, retiros…) con monto y nota opcional.",
      },
      {
        title: "Cerrar turno",
        body: "Cuenta el efectivo físico e ingrésalo. El sistema muestra la diferencia contra lo esperado.",
      },
    ],
  },
  "/inventario": {
    id: "inventario-pos",
    title: "Consulta de inventario",
    summary: "Vista rápida de existencias en mostrador (solo lectura).",
    steps: [
      {
        title: "Buscar piezas",
        body: "Filtra por SKU o nombre para confirmar existencia antes de vender.",
      },
      {
        title: "Estados de stock",
        body: "Los colores indican stock bajo o agotado. Para ajustar cantidades usa el panel administrativo.",
      },
    ],
  },
};

/** Guía genérica cuando no hay walkthrough específico del módulo. */
export const DEFAULT_WALKTHROUGH: ModuleWalkthrough = {
  id: "general",
  title: "Ayuda de Refaccionaria Fortino",
  summary: "Resumen rápido de navegación y soporte.",
  steps: [
    {
      title: "Navegación",
      body: "Usa el menú lateral (admin) o la barra inferior (mostrador) para cambiar de módulo.",
    },
    {
      title: "Permisos",
      body: "Solo verás opciones según tu rol. Si falta algo, pide acceso al administrador.",
    },
    {
      title: "Conexión",
      body: "Sin internet el mostrador sigue vendiendo; sincroniza después en la pestaña Sync.",
    },
    {
      title: "Más ayuda",
      body: "Cada pantalla tiene su propia guía paso a paso. Vuelve a pulsar Ayuda cuando cambies de módulo.",
    },
  ],
};

export function resolveWalkthroughKey(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/app") return "/app";
  if (normalized.startsWith("/app/")) {
    const segment = normalized.split("/")[2];
    const key = `/app/${segment}`;
    if (MODULE_WALKTHROUGHS[key]) return key;
  }
  if (MODULE_WALKTHROUGHS[normalized]) return normalized;
  return normalized;
}

export function getWalkthrough(pathname: string): ModuleWalkthrough {
  const key = resolveWalkthroughKey(pathname);
  return MODULE_WALKTHROUGHS[key] ?? DEFAULT_WALKTHROUGH;
}
