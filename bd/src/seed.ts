import bcrypt from "bcryptjs";
import { createDb } from "./client.js";
import {
  permissions,
  rolePermissions,
  roles,
  users,
} from "./schema.js";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://refaccionaria:refaccionaria_dev@localhost:5432/refaccionaria";

const PERMISSION_KEYS = [
  "products.view",
  "products.create",
  "products.edit",
  "products.view_costs",
  "suppliers.view",
  "suppliers.manage",
  "brands.view",
  "brands.manage",
  "purchases.view",
  "purchases.create",
  "media.view",
  "media.upload",
  "sales.create",
  "sales.cancel",
  "sales.view_all",
  "cash.open_shift",
  "cash.close_shift",
  "cash.register_movement",
  "reports.export",
  "users.manage",
  "roles.manage",
] as const;

const CASHIER_PERMISSIONS = new Set([
  "products.view",
  "sales.create",
  "cash.open_shift",
  "cash.close_shift",
  "cash.register_movement",
] as const);

async function seed() {
  const { db, client } = createDb(connectionString);

  console.log("[seed] Starting...");

  // Roles base del sistema
  for (const role of [
    { name: "admin", description: "Acceso total al sistema" },
    { name: "cashier", description: "Mostrador, caja y ventas" },
    { name: "viewer", description: "Solo consulta, sin editar" },
  ]) {
    await db.insert(roles).values(role).onConflictDoNothing({ target: roles.name });
  }

  const allRoles = await db.select().from(roles);
  const admin = allRoles.find((r) => r.name === "admin")!;
  const cashier = allRoles.find((r) => r.name === "cashier")!;

  // Permisos individuales
  for (const key of PERMISSION_KEYS) {
    await db
      .insert(permissions)
      .values({ key, description: key })
      .onConflictDoNothing({ target: permissions.key });
  }

  const allPerms = await db.select().from(permissions);

  // Admin obtiene todos los permisos
  for (const perm of allPerms) {
    await db
      .insert(rolePermissions)
      .values({ roleId: admin.id, permissionId: perm.id })
      .onConflictDoNothing();
  }

  // Cajero obtiene permisos de mostrador
  for (const perm of allPerms.filter((p) =>
    CASHIER_PERMISSIONS.has(p.key as typeof p.key),
  )) {
    await db
      .insert(rolePermissions)
      .values({ roleId: cashier.id, permissionId: perm.id })
      .onConflictDoNothing();
  }

  // Único usuario precargado: administrador
  const passwordHash = await bcrypt.hash("admin123", 10);
  await db
    .insert(users)
    .values({
      email: "admin@fortino.local",
      passwordHash,
      fullName: "Administrador",
      roleId: admin.id,
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  console.log("[seed] Done.");
  console.log("[seed] Admin: admin@fortino.local / admin123");
  console.log("[seed]");
  console.log("[seed] El sistema está listo para configurar:");
  console.log("[seed]   - Agrega categorías, marcas y proveedores");
  console.log("[seed]   - Crea productos con sus precios y stock");
  console.log("[seed]   - Registra empleados (cajeros) con sus roles");

  await client.end();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
