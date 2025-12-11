'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { prisma } from '~/db/db'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import { Prisma, TipoDocumento } from '@prisma/client'

// Obtener series de documentos
async function getSeriesDocumentoWA({
  where,
}: {
  where?: Prisma.SerieDocumentoWhereInput
}) {
  const puede = await can(permissions.VENTA_LISTADO)
  if (!puede)
    throw new Error('No tienes permiso para ver las series de documentos')

  const items = await prisma.serieDocumento.findMany({
    where,
    include: {
      almacen: true,
    },
    orderBy: [{ tipo_documento: 'asc' }, { serie: 'asc' }],
  })

  return { data: items }
}
export const getSeriesDocumento = withAuth(getSeriesDocumentoWA)

// Crear serie de documento
async function createSerieDocumentoWA(
  data: Prisma.SerieDocumentoCreateInput
) {
  const puede = await can(permissions.VENTA_CREATE)
  if (!puede)
    throw new Error('No tienes permiso para crear series de documentos')

  const serie = await prisma.serieDocumento.create({
    data,
  })

  return { data: serie }
}
export const createSerieDocumento = withAuth(createSerieDocumentoWA)

// Obtener siguiente número de serie
async function getNextNumeroSerieWA({
  tipo_documento,
  almacen_id,
}: {
  tipo_documento: TipoDocumento
  almacen_id: number
}) {
  const puede = await can(permissions.VENTA_CREATE)
  if (!puede)
    throw new Error('No tienes permiso para generar números de serie')

  // Buscar la serie activa para este tipo de documento y almacén
  const serieDoc = await prisma.serieDocumento.findFirst({
    where: {
      tipo_documento,
      almacen_id,
      activo: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  })

  if (!serieDoc) {
    return { data: null }
  }

  // Incrementar el correlativo y actualizar
  const nuevoCorrelativo = serieDoc.correlativo + 1

  await prisma.serieDocumento.update({
    where: { id: serieDoc.id },
    data: { correlativo: nuevoCorrelativo },
  })

  return {
    data: {
      serie: serieDoc.serie,
      numero: nuevoCorrelativo,
    },
  }
}
export const getNextNumeroSerie = withAuth(getNextNumeroSerieWA)
