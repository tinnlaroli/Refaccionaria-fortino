import bcrypt from "bcryptjs";
import { createDb } from "./client.js";
import {
  categories,
  permissions,
  products,
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

async function seed() {
  const { db, client } = createDb(connectionString);

  console.log("[seed] Starting...");

  for (const role of [
    { name: "admin", description: "Acceso total" },
    { name: "cashier", description: "Mostrador y caja" },
    { name: "viewer", description: "Solo lectura" },
  ]) {
    await db.insert(roles).values(role).onConflictDoNothing({ target: roles.name });
  }

  const allRoles = await db.select().from(roles);
  const admin = allRoles.find((r) => r.name === "admin")!;
  const cashier = allRoles.find((r) => r.name === "cashier")!;

  for (const key of PERMISSION_KEYS) {
    await db
      .insert(permissions)
      .values({ key, description: key })
      .onConflictDoNothing({ target: permissions.key });
  }

  const allPerms = await db.select().from(permissions);

  for (const perm of allPerms) {
    await db
      .insert(rolePermissions)
      .values({ roleId: admin.id, permissionId: perm.id })
      .onConflictDoNothing();
  }

  const cashierPermKeys = [
    "products.view",
    "sales.create",
    "cash.open_shift",
    "cash.close_shift",
    "cash.register_movement",
  ];
  for (const perm of allPerms.filter((p) =>
    cashierPermKeys.includes(p.key as (typeof PERMISSION_KEYS)[number]),
  )) {
    await db
      .insert(rolePermissions)
      .values({ roleId: cashier.id, permissionId: perm.id })
      .onConflictDoNothing();
  }

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

  const cashierHash = await bcrypt.hash("cajero123", 10);
  await db
    .insert(users)
    .values({
      email: "cajero@fortino.local",
      passwordHash: cashierHash,
      fullName: "Cajero Demo",
      roleId: cashier.id,
      isActive: true,
    })
    .onConflictDoNothing({ target: users.email });

  for (const cat of [
    { name: "Aceites", slug: "aceites" },
    { name: "Filtros", slug: "filtros" },
    { name: "Frenos", slug: "frenos" },
  ]) {
    await db.insert(categories).values(cat).onConflictDoNothing({ target: categories.slug });
  }

  const cats = await db.select().from(categories);
  const aceites = cats.find((c) => c.slug === "aceites")!;
  const filtros = cats.find((c) => c.slug === "filtros")!;

  await db
    .insert(products)
    .values([
      {
        sku: "ACE-5W30-1L",
        name: "Aceite 5W30 1L",
        categoryId: aceites.id,
        purchasePrice: "85.00",
        salePrice: "120.00",
        stock: 50,
        minStock: 10,
      },
      {
        sku: "FLT-001",
        name: "Filtro de aceite universal",
        categoryId: filtros.id,
        purchasePrice: "45.00",
        salePrice: "75.00",
        stock: 30,
        minStock: 5,
      },
      {
        sku: "FRE-PAST-01",
        name: "Pastillas de freno delanteras",
        categoryId: cats.find((c) => c.slug === "frenos")!.id,
        purchasePrice: "180.00",
        salePrice: "280.00",
        stock: 15,
        minStock: 3,
      },
    ])
    .onConflictDoNothing({ target: products.sku });

  console.log("[seed] Done.");
  console.log("[seed] Admin: admin@fortino.local / admin123");
  console.log("[seed] Cajero: cajero@fortino.local / cajero123");

  await client.end();
}

seed().catch((err) => {
  console.error("[seed] Failed:", err);
  process.exit(1);
});
