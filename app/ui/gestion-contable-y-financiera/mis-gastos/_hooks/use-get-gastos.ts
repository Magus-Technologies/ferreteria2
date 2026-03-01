import { useQuery } from '@tanstack/react-query'
import { getGastosExtras, getResumenGastosExtras } from '~/lib/api/gasto-extra'

export const useGetGastos = (
  filtros: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['gastos-extras', filtros],
    queryFn: () => getGastosExtras(),
    enabled: enabled && !!filtros,
    staleTime: 0,
  })
}

export const useGetResumenGastos = (
  filtros: any,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['gastos-extras-resumen', filtros],
    queryFn: () => getResumenGastosExtras(),
    enabled: enabled && !!filtros,
    staleTime: 0,
  })
}