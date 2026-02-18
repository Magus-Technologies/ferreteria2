import { useQuery } from '@tanstack/react-query'
import { getIngresos, getResumenIngresos, type FiltrosIngresos } from '~/lib/api/ingresos'

export const useGetIngresos = (
  filtros: FiltrosIngresos & { per_page?: number; page?: number },
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ingresos', filtros],
    queryFn: () => getIngresos(filtros),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

export const useGetResumenIngresos = (
  filtros: FiltrosIngresos,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['ingresos-resumen', filtros],
    queryFn: () => getResumenIngresos(filtros),
    enabled: enabled && !!filtros,
    staleTime: 1000 * 60 * 2, // 2 minutos
  })
}