import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function seedPermissionsCotizacion() {
  console.log("🌱 Seeding permissions for Cotizaciones...");

  const permissions = [
    {
      name: "cotizacion.listado",
      descripcion: "Ver Listado de Cotizaciones",
    },
    {
      name: "cotizacion.create",
      descripcion: "Crear Cotizacion",
    },
    {
      name: "cotizacion.update",
      descripcion: "Actualizar Cotizacion",
    },
    {
      name: "cotizacion.delete",
      descripcion: "Eliminar Cotizacion",
    },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  console.log("✅ Permissions for Cotizaciones seeded successfully");
}
