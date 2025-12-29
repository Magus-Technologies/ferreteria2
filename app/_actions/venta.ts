'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { ventaApi, type VentaFilters, type CreateVentaRequest } from '~/lib/api/venta'

/**
 * Tipo para la respuesta de getVenta (venta completa con relaciones)
 * TODO: Definir interfaz completa basada en la respuesta de Laravel
 */
export type getVentaResponseProps = any

/**
 * Obtener lista de ventas usando Laravel API
 */
async function getVentaWA({ where }: { where?: VentaFilters }) {
  // TEMPORAL: Comentado para permitir ver ventas sin validación de permisos
  // TODO: Descomentar cuando se asignen los permisos correctos en la base de datos
  // const puede = await can(permissions.VENTA_LISTADO)
  // if (!puede) throw new Error('No tienes permiso para ver la lista de ventas')

  const response = await ventaApi.list(where)
  
  if (response.error) {
    throw new Error(response.error.message)
  }

  return { data: response.data?.data || [] }
}

export const getVenta = withAuth(getVentaWA)

/**
 * Crear una nueva venta usando Laravel API
 */
async function createVentaWA(data: CreateVentaRequest) {
  // TEMPORAL: Comentado para permitir crear ventas sin validación de permisos
  // TODO: Descomentar cuando se asignen los permisos correctos en la base de datos
  // const puede = await can(permissions.VENTA_CREATE)
  // if (!puede) throw new Error('No tienes permiso para crear una venta')

  const response = await ventaApi.create(data)

  if (response.error) {
    throw new Error(response.error.message)
  }

  return { data: response.data }
}

export const createVenta = withAuth(createVentaWA)
