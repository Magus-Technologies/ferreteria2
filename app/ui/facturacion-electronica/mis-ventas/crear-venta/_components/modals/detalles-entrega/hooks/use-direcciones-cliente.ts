import { useQuery } from '@tanstack/react-query'
import { clienteApi } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { TipoDespachoUI } from '../types'

/**
 * Direcciones registradas del cliente (D1/D2/D3/D4) — solo se cargan cuando
 * el modal está abierto, hay un clienteId, y el tipo es Domicilio o Parcial
 * (en Recojo en Tienda no aplica la dirección de entrega).
 */
export function useDireccionesCliente({
  open,
  clienteId,
  tipoDespacho,
}: {
  open: boolean
  clienteId: number | undefined
  tipoDespacho: TipoDespachoUI
}) {
  const query = useQuery({
    queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteId],
    queryFn: async () => {
      if (!clienteId) return { data: { data: [] } }
      const response = await clienteApi.listarDirecciones(clienteId)
      return response
    },
    enabled:
      open &&
      !!clienteId &&
      (tipoDespacho === 'Domicilio' || tipoDespacho === 'Parcial'),
  })

  return {
    ...query,
    direcciones: query.data?.data?.data || [],
    cargandoDirecciones: query.isLoading,
  }
}
