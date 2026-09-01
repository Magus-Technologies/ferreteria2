import { useEffect } from 'react'
import { message } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { cajaApi } from '~/lib/api/caja'
import { cierreCajaApi } from '~/lib/api/cierre-caja'
import { QueryKeys } from '~/app/_lib/queryKeys'

export function useCierreCaja(cierreId?: string, options?: { optional?: boolean }) {
  const esEdicion = Boolean(cierreId)

  // Bajo la clave CAJA_ACTIVA para que las acciones que cambian la caja
  // (registrar un traslado a bóveda, cerrar, etc.) refresquen esta vista con
  // una invalidación de react-query. Antes era useState/useEffect manual y el
  // usuario tenía que recargar la página (F5) para ver el traslado reflejado.
  const {
    data: cajaActiva = null,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: [QueryKeys.CAJA_ACTIVA, 'cierre-view', cierreId ?? 'activa'],
    queryFn: async () => {
      // Si hay cierreId, cargar ese cierre específico para edición
      if (cierreId) {
        const response = await cajaApi.obtenerCierre(cierreId)
        if (response.data?.data) {
          return response.data.data
        }
        throw new Error('No se encontró el cierre')
      }

      // Cargar caja activa usando el endpoint refactorizado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await cierreCajaApi.obtenerCajaActiva()
      if (response.success && response.data) {
        return response.data
      }
      throw new Error(
        response.error?.message || response.message || 'No tienes una caja abierta o hubo un problema al consultarla'
      )
    },
    refetchOnWindowFocus: false,
    retry: false,
  })

  const error = queryError ? (queryError as Error).message : null

  useEffect(() => {
    if (error && !options?.optional) {
      message.warning(error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error])

  return {
    loading,
    cajaActiva,
    error,
    esEdicion,
    recargar: refetch,
  }
}
