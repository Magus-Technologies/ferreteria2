'use client'

import { useQuery } from '@tanstack/react-query'
import { clienteCalificacionApi } from '~/lib/api/cliente-calificacion'

export function useUltimaCalificacionCliente(clienteId: number | undefined) {
  return useQuery({
    queryKey: ['ultima-calificacion', clienteId],
    queryFn: () => clienteCalificacionApi.getUltima(clienteId!),
    enabled: !!clienteId,
  })
}
