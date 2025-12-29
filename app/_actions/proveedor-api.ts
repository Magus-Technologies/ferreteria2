'use server'

import { withAuth } from '~/auth/middleware-server-actions'
import { permissions } from '~/lib/permissions'
import can from '~/utils/server-validate-permission'
import {
  proveedorApi,
  type Proveedor,
  type CreateProveedorRequest,
  type ProveedorFilters
} from '~/lib/api/proveedor'

/**
 * Buscar proveedores (Server Action)
 * Oculta las peticiones al backend de Laravel del cliente
 */
async function SearchProveedorApiWA(filters?: ProveedorFilters) {
  const puede = await can(permissions.PROVEEDOR_BASE)
  if (!puede) throw new Error('No tienes permiso para ver Proveedores')

  const result = await proveedorApi.getAll(filters)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { data: result.data?.data || [] }
}
export const SearchProveedorApi = withAuth(SearchProveedorApiWA)

/**
 * Obtener proveedor por ID (Server Action)
 */
async function GetProveedorByIdApiWA({ id }: { id: number }) {
  const puede = await can(permissions.PROVEEDOR_BASE)
  if (!puede) throw new Error('No tienes permiso para ver Proveedores')

  const result = await proveedorApi.getById(id)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { data: result.data?.data }
}
export const GetProveedorByIdApi = withAuth(GetProveedorByIdApiWA)

/**
 * Crear proveedor (Server Action)
 */
async function CreateProveedorApiWA({ data }: { data: CreateProveedorRequest }) {
  const puede = await can(permissions.PROVEEDOR_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear Proveedores')

  const result = await proveedorApi.create(data)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { data: result.data?.data }
}
export const CreateProveedorApi = withAuth(CreateProveedorApiWA)

/**
 * Actualizar proveedor (Server Action)
 */
async function UpdateProveedorApiWA({
  id,
  data
}: {
  id: number
  data: CreateProveedorRequest
}) {
  const puede = await can(permissions.PROVEEDOR_UPDATE)
  if (!puede) throw new Error('No tienes permiso para editar Proveedores')

  const result = await proveedorApi.update(id, data)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { data: result.data?.data }
}
export const UpdateProveedorApi = withAuth(UpdateProveedorApiWA)

/**
 * Eliminar proveedor (Server Action)
 */
async function DeleteProveedorApiWA({ id }: { id: number }) {
  const puede = await can(permissions.PROVEEDOR_DELETE)
  if (!puede) throw new Error('No tienes permiso para eliminar Proveedores')

  const result = await proveedorApi.delete(id)

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { data: 'ok' }
}
export const DeleteProveedorApi = withAuth(DeleteProveedorApiWA)
