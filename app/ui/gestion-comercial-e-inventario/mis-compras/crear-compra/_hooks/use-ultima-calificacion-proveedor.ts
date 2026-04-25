'use client'

import { useQuery } from '@tanstack/react-query'
import { proveedorCalificacionApi } from '~/lib/api/proveedor-calificacion'

export function useUltimaCalificacionProveedor(proveedorId: number | undefined) {
  return useQuery({
    queryKey: ['ultima-calificacion-proveedor', proveedorId],
    queryFn: () => proveedorCalificacionApi.getUltima(proveedorId!),
    enabled: !!proveedorId,
  })
}
