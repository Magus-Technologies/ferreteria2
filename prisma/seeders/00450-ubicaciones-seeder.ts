import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function ubicacionSeeder() {
  console.log('🚀 Ejecutando ubicacion-seeder...')

  // Obtener el almacén principal
  const almacen = await prisma.almacen.findFirst()
  
  if (!almacen) {
    console.warn('❌ No se encontró almacén. Ejecuta primero el almacen-seeder.')
    return
  }

  const ubicaciones: Prisma.UbicacionCreateInput[] = [
    {
      name: 'Estante A1',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Estante A2', 
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Estante B1',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Estante B2',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Almacén Principal',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Depósito',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Zona Fría',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
    {
      name: 'Sin Ubicar',
      almacen: { connect: { id: almacen.id } },
      estado: true,
    },
  ]

  for (const ubicacion of ubicaciones) {
    await prisma.ubicacion.upsert({
      where: {
        almacen_id_name: {
          almacen_id: almacen.id,
          name: ubicacion.name,
        },
      },
      update: {},
      create: ubicacion,
    })
  }

  console.log('✅ Ubicaciones creadas correctamente')
}