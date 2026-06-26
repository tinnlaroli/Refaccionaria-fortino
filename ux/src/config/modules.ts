import type { IconName } from "../components/dashboard/NavIcon.js";

export type AdminModule = {
  path: string;
  label: string;
  description: string;
  icon: IconName;
  permission?: string | string[];
};

export type NavGroup = {
  id: string;
  label: string;
  tone: "blue" | "teal" | "amber" | "violet" | "rose";
  items: AdminModule[];
};

export const ADMIN_MODULES: AdminModule[] = [
  {
    path: "/app",
    label: "Panel",
    description: "Resumen del negocio",
    icon: "home",
  },
  {
    path: "/app/productos",
    label: "Productos",
    description: "Catálogo de refacciones",
    icon: "box",
    permission: "products.view",
  },
  {
    path: "/app/categorias",
    label: "Categorías",
    description: "Clasificación del catálogo",
    icon: "grid",
    permission: "products.view",
  },
  {
    path: "/app/marcas",
    label: "Marcas",
    description: "Fabricantes y líneas de producto",
    icon: "tag",
    permission: "brands.view",
  },
  {
    path: "/app/proveedores",
    label: "Proveedores",
    description: "Quién surte tu inventario",
    icon: "truck",
    permission: "suppliers.view",
  },
  {
    path: "/app/compras",
    label: "Compras",
    description: "Entradas de mercancía por proveedor",
    icon: "inbox",
    permission: "purchases.view",
  },
  {
    path: "/app/imagenes",
    label: "Imágenes",
    description: "Biblioteca visual del catálogo",
    icon: "image",
    permission: "media.view",
  },
  {
    path: "/app/inventario",
    label: "Inventario",
    description: "Existencias y movimientos",
    icon: "layers",
    permission: "products.view",
  },
  {
    path: "/app/movimientos",
    label: "Movimientos",
    description: "Historial de operaciones",
    icon: "history",
    permission: "products.view",
  },
  {
    path: "/app/ventas",
    label: "Ventas",
    description: "Historial de operaciones",
    icon: "receipt",
    permission: "sales.view_all",
  },
  {
    path: "/app/empleados",
    label: "Empleados",
    description: "Personal y accesos",
    icon: "users",
    permission: "users.manage",
  },
];

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Inicio",
    tone: "blue",
    items: ADMIN_MODULES.filter((m) => m.path === "/app"),
  },
  {
    id: "catalog",
    label: "Catálogo",
    tone: "teal",
    items: ADMIN_MODULES.filter((m) =>
      ["/app/productos", "/app/categorias", "/app/marcas", "/app/proveedores", "/app/compras", "/app/imagenes"].includes(m.path),
    ),
  },
  {
    id: "inventory",
    label: "Existencias",
    tone: "amber",
    items: ADMIN_MODULES.filter((m) =>
      ["/app/inventario", "/app/movimientos"].includes(m.path),
    ),
  },
  {
    id: "sales",
    label: "Operación",
    tone: "violet",
    items: ADMIN_MODULES.filter((m) => m.path === "/app/ventas"),
  },
  {
    id: "team",
    label: "Equipo",
    tone: "rose",
    items: ADMIN_MODULES.filter((m) => m.path === "/app/empleados"),
  },
];

export const QUICK_ACTIONS = [
  {
    label: "Nuevo producto",
    description: "Agregar pieza al catálogo",
    path: "/app/productos?nuevo=1",
    permission: "products.create",
    icon: "plus" as IconName,
  },
  {
    label: "Ajustar inventario",
    description: "Entradas, salidas o conteo",
    path: "/app/inventario",
    permission: "products.edit",
    icon: "layers" as IconName,
  },
  {
    label: "Ver ventas",
    description: "Historial del día",
    path: "/app/ventas",
    permission: "sales.view_all",
    icon: "receipt" as IconName,
  },
  {
    label: "Ir al mostrador",
    description: "Cobrar en caja",
    path: "/",
    icon: "pos" as IconName,
  },
] as const;
