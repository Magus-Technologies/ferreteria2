import { useQuery } from '@tanstack/react-query'
import { getGastos, getResumenGastos, type FiltrosGastos } from '~/lib/api/gastos'

export const useGetGastos = (
  filtros: FiltrosGastos & { per_page?: number; page?: number },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['gastos', filtros],
    queryFn: () => getGastos(filtros),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useGetResumenGastos = (
  filtros: FiltrosGastos,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['gastos-resumen', filtros],
    queryFn: () => getResumenGastos(filtros),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}